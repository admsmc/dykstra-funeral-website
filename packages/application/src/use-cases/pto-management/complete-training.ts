/**
 * Complete Training Use Case
 * Marks training complete, records certification, and releases backfill
 */

import { Effect } from 'effect';
import {
  completeTraining as completeTrainingEntity,
  type TrainingRecord,
  type TrainingRecordId,
} from '@dykstra/domain';
import { TrainingManagementPort, type TrainingManagementPortService } from '../../ports/training-management-port';

/**
 * Input command for completing training
 */
/**
 * Complete Training
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

export interface CompleteTrainingCommand {
  readonly trainingRecordId: TrainingRecordId;
  readonly hours: number;
  readonly certificationNumber?: string;
  readonly expiresAt?: Date;
  readonly completedBy: string;
}

/**
 * Result of completing training
 */
export interface CompleteTrainingResult {
  readonly success: boolean;
  readonly trainingRecord?: TrainingRecord;
  readonly backfillsReleased: number;
  readonly errors: string[];
}

/**
 * Complete training workflow
 */
export const completeTraining = (
  command: CompleteTrainingCommand
): Effect.Effect<CompleteTrainingResult, Error, TrainingManagementPortService> =>
  Effect.gen(function* () {
    const trainingRepo = yield* TrainingManagementPort;
    const errors: string[] = [];
    let backfillsReleased = 0;

    // Get training record
    const record = yield* trainingRepo.getTrainingRecord(command.trainingRecordId);
    if (!record) {
      return {
        success: false,
        backfillsReleased: 0,
        errors: ['Training record not found'],
      };
    }

    // Verify status
    if (record.status !== 'in_progress' && record.status !== 'scheduled') {
      return {
        success: false,
        backfillsReleased: 0,
        errors: [`Cannot complete training in ${record.status} status`],
      };
    }

    // Complete training with certification
    const completedRecord = completeTrainingEntity(
      record,
      command.hours,
      command.certificationNumber,
      command.expiresAt
    );

    // Save updated record
    const savedRecord = yield* trainingRepo.updateTrainingRecord(
      record.id,
      completedRecord
    );

    // Release associated backfill assignments if training was multi-day
    if (record.startDate && record.endDate) {
      // TODO: Connect to backfill repository when getMultiDayTrainingsScheduled method is available
      // For now, backfillsReleased remains 0
      backfillsReleased = 0;
    }

    return {
      success: true,
      trainingRecord: savedRecord,
      backfillsReleased,
      errors,
    };
  });
