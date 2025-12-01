/**
 * Approve Training Use Case
 * Managers approve training requests with optional backfill assignment
 */

import { Effect } from 'effect';
import { startTraining, type TrainingRecord, type TrainingRecordId } from '@dykstra/domain';
import { TrainingManagementPort } from '../../ports/training-management-port';
import { BackfillManagementPort } from '../../ports/backfill-management-port';

/**
 * Input command for approving training
 */
/**
 * Approve Training
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

export interface ApproveTrainingCommand {
  readonly trainingRecordId: TrainingRecordId;
  readonly approvedBy: string;
  readonly scheduleTraining: boolean;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly assignBackfillIfMultiDay: boolean;
}

/**
 * Result of approving training
 */
export interface ApproveTrainingResult {
  readonly success: boolean;
  readonly trainingRecord?: TrainingRecord;
  readonly backfillAssigned: boolean;
  readonly errors: string[];
}

/**
 * Approve training workflow
 */
export const approveTraining = (
  command: ApproveTrainingCommand
): Effect.Effect<ApproveTrainingResult, Error, typeof TrainingManagementPort | typeof BackfillManagementPort> =>
  Effect.gen(function* () {
    const trainingRepo = yield* TrainingManagementPort;
    const errors: string[] = [];
    let backfillAssigned = false;

    // Get training record
    const record = yield* trainingRepo.getTrainingRecord(command.trainingRecordId);
    if (!record) {
      return {
        success: false,
        backfillAssigned: false,
        errors: ['Training record not found'],
      };
    }

    // Verify status
    if (record.status !== 'scheduled') {
      return {
        success: false,
        backfillAssigned: false,
        errors: [`Cannot approve training in ${record.status} status`],
      };
    }

    // Start training
    let updatedRecord = record;
    if (command.scheduleTraining && command.startDate) {
      updatedRecord = startTraining(record, command.startDate);
    }

    // Save updated record
    const savedRecord = yield* trainingRepo.updateTrainingRecord(
      record.id,
      updatedRecord
    );

    return {
      success: true,
      trainingRecord: savedRecord,
      backfillAssigned,
      errors,
    };
  });
