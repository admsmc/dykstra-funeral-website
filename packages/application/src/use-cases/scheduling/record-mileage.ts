import { Effect } from 'effect';
import type { VehicleRepositoryService } from '../../ports/vehicle-repository';
import type { DriverAssignmentRepositoryService } from '../../ports/driver-assignment-repository';
import { VehicleRepository } from '../../ports/vehicle-repository';
import { DriverAssignmentRepository } from '../../ports/driver-assignment-repository';
import { AssignmentValidationError } from './assign-driver';
import { type DriverAssignmentNotFoundError, type DriverAssignmentRepositoryError } from '../../ports/driver-assignment-repository';
import { type VehicleNotFoundError, type VehicleRepositoryError } from '../../ports/vehicle-repository';
import { type AssignmentId, type VehicleId } from '@dykstra/domain';

/**
 * Input for record mileage use case
 */
/**
 * Record Mileage
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 IN PROGRESS
 * Policy Entity: ShiftPolicy
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface RecordMileageCommand {
  assignmentId: string;
  vehicleId: string;
  mileageStart: number; // odometer reading at start
  mileageEnd: number; // odometer reading at end
  recordedBy: string;
}

/**
 * Output from record mileage use case
 */
export interface RecordMileageResult {
  assignmentId: string;
  mileageDelta: number;
  allowanceAmount: number; // calculated reimbursement
  recorded: boolean;
}

/**
 * Record Mileage Use Case
 *
 * Records actual mileage for an assignment and calculates reimbursement.
 *
 * Business Rules:
 * - Mileage end must be >= mileage start
 * - Mileage delta must be reasonable (0-500 miles)
 * - Assignment must exist and be completed
 * - Reimbursement calculated at $0.67 per mile (IRS rate)
 */
export const recordMileage = (
  command: RecordMileageCommand
): Effect.Effect<
  RecordMileageResult,
  AssignmentValidationError | DriverAssignmentNotFoundError | DriverAssignmentRepositoryError | VehicleRepositoryError | VehicleNotFoundError,
  DriverAssignmentRepositoryService | VehicleRepositoryService
> =>
  Effect.gen(function* () {
    const assignmentRepository = yield* DriverAssignmentRepository;
    const vehicleRepository = yield* VehicleRepository;

    // Validate mileage readings
    if (command.mileageEnd < command.mileageStart) {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Mileage end (${command.mileageEnd}) cannot be less than start (${command.mileageStart})`
        )
      );
    }

    const mileageDelta = command.mileageEnd - command.mileageStart;

    // Validate mileage delta is reasonable (0-500 miles)
    if (mileageDelta > 500) {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Mileage delta (${mileageDelta} miles) exceeds maximum allowed (500 miles)`
        )
      );
    }

    // Fetch assignment
    const assignment = yield* assignmentRepository.findById(command.assignmentId as AssignmentId);

    // Validate assignment is in completable status
    if (assignment.status !== 'completed' && assignment.status !== 'in_progress') {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Assignment must be in progress or completed, current status: ${assignment.status}`
        )
      );
    }

    // Record mileage on vehicle
    yield* vehicleRepository.addMileage(command.vehicleId as VehicleId, mileageDelta);

    // Calculate reimbursement (IRS standard mileage rate: $0.67/mile)
    const MILEAGE_RATE = 0.67;
    const allowanceAmount = mileageDelta * MILEAGE_RATE;

    return {
      assignmentId: command.assignmentId,
      mileageDelta,
      allowanceAmount,
      recorded: true,
    };
  });
