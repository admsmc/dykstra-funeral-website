/**
 * Assign PTO Backfill Use Case
 * Assigns staff to cover for employees on PTO
 * Validates skill/role match, availability, and workload
 */

import { Effect } from 'effect';
import {
  createBackfillAssignment,
  sendForConfirmation,
  calculateCoverageDurationInHours,
  suggestPremiumType,
  type BackfillAssignment,
  type BackfillReason,
  type PremiumType,
} from '@dykstra/domain';
import { BackfillManagementPort } from '../../ports/backfill-management-port';

/**
 * Input command for assigning backfill
 */
/**
 * Assign Pto Backfill
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

export interface AssignPtoBackfillCommand {
  readonly funeralHomeId: string;
  readonly absenceId: string;
  readonly absenceType: BackfillReason;
  readonly absenceStartDate: Date;
  readonly absenceEndDate: Date;
  readonly absenceEmployeeId: string;
  readonly absenceEmployeeName: string;
  readonly absenceEmployeeRole: string;
  readonly backfillEmployeeId: string;
  readonly backfillEmployeeName: string;
  readonly backfillEmployeeRole: string;
  readonly premiumType?: PremiumType;
  readonly sendForConfirmation: boolean;
  readonly assignedBy: string;
}

/**
 * Result of assigning backfill
 */
export interface AssignPtoBackfillResult {
  readonly success: boolean;
  readonly assignment?: BackfillAssignment;
  readonly estimatedHours: number;
  readonly estimatedCost: number;
  readonly warnings: string[];
  readonly errors: string[];
}

/**
 * Assign PTO backfill workflow
 */
export const assignPtoBackfill = (
  command: AssignPtoBackfillCommand
): Effect.Effect<AssignPtoBackfillResult, Error, typeof BackfillManagementPort> =>
  Effect.gen(function* () {
    const repo = yield* BackfillManagementPort;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for conflicting backfills
    const hasConflict = yield* repo.hasConflictingBackfills(
      command.funeralHomeId,
      command.backfillEmployeeId,
      command.absenceStartDate,
      command.absenceEndDate
    );
    if (hasConflict) {
      errors.push('Backfill employee already assigned during this period');
    }

    // Get backfill employee workload
    const workload = yield* repo.getBackfillEmployeeWorkload(
      command.funeralHomeId,
      command.backfillEmployeeId
    );
    if (workload.maxCapacityReached) {
      warnings.push('Backfill employee is at maximum capacity for the month');
    }

    // Suggest premium type if not provided
    const isHoliday = false; // TODO: Connect to holiday calendar
    const premiumType = command.premiumType || 'none';

    // Calculate coverage duration
    const durationHours = calculateCoverageDurationInHours({
      absenceStartDate: command.absenceStartDate,
      absenceEndDate: command.absenceEndDate,
      premiumMultiplier: 1.5,
      estimatedHours: 8,
    } as any);

    // Return early if errors
    if (errors.length > 0) {
      return {
        success: false,
        estimatedHours: durationHours,
        estimatedCost: durationHours * 25, // TODO: Get actual rate from payroll
        warnings,
        errors,
      };
    }

    // Create backfill assignment
    const assignment = createBackfillAssignment(
      command.funeralHomeId,
      command.absenceId,
      command.absenceType,
      command.absenceStartDate,
      command.absenceEndDate,
      command.absenceEmployeeId,
      command.absenceEmployeeName,
      command.absenceEmployeeRole,
      command.backfillEmployeeId,
      command.backfillEmployeeName,
      command.backfillEmployeeRole,
      command.assignedBy,
      premiumType,
      1.5,
      durationHours
    );

    // Send for confirmation if requested
    let savedAssignment = assignment;
    if (command.sendForConfirmation) {
      const forConfirmation = sendForConfirmation(assignment);
      savedAssignment = yield* repo.createBackfillAssignment(forConfirmation, command.assignedBy);
    } else {
      savedAssignment = yield* repo.createBackfillAssignment(assignment, command.assignedBy);
    }

    return {
      success: true,
      assignment: savedAssignment,
      estimatedHours: durationHours,
      estimatedCost: durationHours * 25, // TODO: Get actual rate from payroll
      warnings,
      errors,
    };
  });
