/**
 * Request PTO Use Case
 * Allows employees to request paid time off
 * Validates against funeral home policy before submission
 */

import { Effect, Context } from 'effect';
import {
  createPtoRequest,
  submitPtoRequest,
  meetsAdvanceNoticeRequirement,
  isWithinBlackoutDates,
  exceedsMaxConsecutiveDays,
  hasScheduleConflict,
  type PtoRequest,
  type PtoType,
} from '@dykstra/domain';
import { PtoManagementPort } from '../../ports/pto-management-port';

/**
 * Input command for requesting PTO
 */
/**
 * Request Pto
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface RequestPtoCommand {
  readonly funeralHomeId: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly ptoType: PtoType;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly reason?: string;
  readonly requestedBy: string;
}

/**
 * Result of requesting PTO
 */
export interface RequestPtoResult {
  readonly success: boolean;
  readonly ptoRequest?: PtoRequest;
  readonly validationErrors: string[];
  readonly warnings: string[];
}

/**
 * Request PTO workflow
 */
export const requestPto = (
  command: RequestPtoCommand
): Effect.Effect<RequestPtoResult, Error, typeof PtoManagementPort> =>
  Effect.gen(function* () {
    const repo = yield* PtoManagementPort;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Create draft request
    const draftRequest = createPtoRequest(
      command.funeralHomeId,
      command.employeeId,
      command.employeeName,
      command.ptoType,
      command.startDate,
      command.endDate,
      command.requestedBy,
      command.reason
    );

    // Get policy for funeral home
    const policy = yield* repo.getPtoPolicyForFuneralHome(command.funeralHomeId);
    if (!policy) {
      errors.push('No PTO policy found for funeral home');
      return {
        success: false,
        validationErrors: errors,
        warnings,
      };
    }

    // Validate advance notice requirement
    const isHolidayPeriod = false; // TODO: Connect to holiday calendar
    if (!meetsAdvanceNoticeRequirement(draftRequest, policy.settings.minAdvanceNoticeDays)) {
      errors.push(
        `PTO request must be submitted at least ${policy.settings.minAdvanceNoticeDays} days in advance`
      );
    }

    // Validate against blackout dates
    if (isWithinBlackoutDates(draftRequest, policy.settings.blackoutDates)) {
      const overlapping = policy.settings.blackoutDates.filter((bd) => {
        const start = draftRequest.startDate.getTime();
        const end = draftRequest.endDate.getTime();
        return start < bd.endDate.getTime() && end > bd.startDate.getTime();
      });
      errors.push(
        `PTO cannot be taken during blackout periods: ${overlapping.map((bd) => bd.name).join(', ')}`
      );
    }

    // Validate max consecutive days
    if (exceedsMaxConsecutiveDays(draftRequest, policy.settings.maxConsecutivePtoDays)) {
      errors.push(
        `PTO request exceeds maximum consecutive days (${policy.settings.maxConsecutivePtoDays})`
      );
    }

    // Check for schedule conflicts
    const existingRequests = yield* repo.getPtoRequestsByEmployee(
      command.funeralHomeId,
      command.employeeId
    );
    if (hasScheduleConflict(draftRequest, existingRequests)) {
      errors.push('PTO request conflicts with existing approved or taken PTO');
    }

    // Check concurrent employees limit
    const concurrentRequests = yield* repo.getConcurrentPtoRequests(
      command.funeralHomeId,
      draftRequest.startDate,
      draftRequest.endDate
    );
    const maxAllowed = policy.settings.maxConcurrentEmployeesOnPto;
    if (concurrentRequests.length >= maxAllowed) {
      warnings.push(
        `Maximum concurrent employees already on PTO during this period (${maxAllowed})`
      );
    }

    // Check employee balance (provisional - actual calculated at approval)
    const balance = yield* repo.getEmployeePtoBalance(command.funeralHomeId, command.employeeId);
    if (balance.daysRemaining < draftRequest.requestedDays) {
      warnings.push(
        `Insufficient PTO balance. Available: ${balance.daysRemaining}, Requested: ${draftRequest.requestedDays}`
      );
    }

    // If validation errors exist, return early
    if (errors.length > 0) {
      return {
        success: false,
        validationErrors: errors,
        warnings,
      };
    }

    // Submit request
    const submittedRequest = submitPtoRequest(draftRequest);
    const savedRequest = yield* repo.createPtoRequest(submittedRequest, command.requestedBy);

    return {
      success: true,
      ptoRequest: savedRequest,
      validationErrors: errors,
      warnings,
    };
  });
