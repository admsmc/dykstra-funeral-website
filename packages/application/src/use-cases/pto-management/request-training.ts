/**
 * Request Training Use Case
 * Allows employees to request training courses
 * Validates against funeral home policy, budget, and certifications
 */

import { Effect } from 'effect';
import {
  createTrainingRecord,
  isMultiDayTraining,
  type TrainingRecord,
  type TrainingType,
} from '@dykstra/domain';
import { TrainingManagementPort, type TrainingManagementPortService } from '../../ports/training-management-port';

/**
 * Input command for requesting training
 */
/**
 * Request Training
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

export interface RequestTrainingCommand {
  readonly funeralHomeId: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly employeeRole: string;
  readonly trainingType: TrainingType;
  readonly trainingName: string;
  readonly scheduledDate?: Date;
  readonly hours: number;
  readonly cost: number;
  readonly requiredForRole: boolean;
  readonly requestedBy: string;
}

/**
 * Result of requesting training
 */
export interface RequestTrainingResult {
  readonly success: boolean;
  readonly trainingRecord?: TrainingRecord;
  readonly requiresApproval: boolean;
  readonly requiresBackfill: boolean;
  readonly validationErrors: string[];
  readonly warnings: string[];
}

/**
 * Request training workflow
 */
export const requestTraining = (
  command: RequestTrainingCommand
): Effect.Effect<RequestTrainingResult, Error, TrainingManagementPortService> =>
  Effect.gen(function* () {
    const repo = yield* TrainingManagementPort;
    const errors: string[] = [];
    const warnings: string[] = [];
    let requiresApproval = false;
    let requiresBackfill = false;

    // Get training policy
    const policy = yield* repo.getTrainingPolicyForFuneralHome(command.funeralHomeId);
    if (!policy) {
      errors.push('No training policy found for funeral home');
      return {
        success: false,
        validationErrors: errors,
        warnings,
        requiresApproval,
        requiresBackfill,
      };
    }

    // Check if training requires approval
    requiresApproval = policy.settings.approvalRequiredAboveCost > 0
      ? command.cost > policy.settings.approvalRequiredAboveCost
      : false;

    // Create training record
    const record = createTrainingRecord(
      command.funeralHomeId,
      command.employeeId,
      command.employeeName,
      command.trainingType,
      command.trainingName,
      command.hours,
      command.cost,
      command.requestedBy,
      command.scheduledDate,
      command.requiredForRole
    );

    // Check if training is multi-day (requires backfill)
    requiresBackfill = command.scheduledDate
      ? isMultiDayTraining({ ...record, startDate: command.scheduledDate, endDate: command.scheduledDate })
      : false;

    // Get employee training summary
    const summary = yield* repo.getEmployeeTrainingSummary(command.funeralHomeId, command.employeeId);

    // Check budget and hour limits
    const canTake = policy.settings.roleRequirements.get(command.employeeRole);
    if (canTake) {
      const hoursRemaining = canTake.annualTrainingHoursBudget - summary.totalHoursUsedThisYear;
      if (command.hours > hoursRemaining) {
        errors.push(
          `Insufficient training hours. Available: ${hoursRemaining}, Requested: ${command.hours}`
        );
      }

      const budgetRemaining = canTake.annualTrainingBudget - summary.totalBudgetUsedThisYear;
      if (command.cost > budgetRemaining) {
        errors.push(
          `Insufficient training budget. Available: $${budgetRemaining}, Requested: $${command.cost}`
        );
      }
    }

    // Return early if errors
    if (errors.length > 0) {
      return {
        success: false,
        validationErrors: errors,
        warnings,
        requiresApproval,
        requiresBackfill,
      };
    }

    // Save training record
    const savedRecord = yield* repo.createTrainingRecord(record, command.requestedBy);

    return {
      success: true,
      trainingRecord: savedRecord,
      validationErrors: errors,
      warnings,
      requiresApproval,
      requiresBackfill,
    };
  });
