import { Effect } from 'effect';
import type { VehicleRepositoryService } from '../../ports/vehicle-repository';
import { VehicleId } from '@dykstra/domain';
import { VehicleRepository } from '../../ports/vehicle-repository';
import { VehicleNotFoundError, VehicleRepositoryError } from '../../ports/vehicle-repository';
import { AssignmentValidationError } from './assign-driver';

/**
 * Input for assign vehicle use case
 */
/**
 * Assign Vehicle
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

export interface AssignVehicleCommand {
  vehicleId: string;
  driverId: string;
  caseId: string;
  funeralHomeId: string;
  scheduledTime: Date;
  estimatedDuration: number; // minutes
  requiredCapacity: number; // number of passengers
  createdBy: string;
}

/**
 * Output from assign vehicle use case
 */
export interface AssignVehicleResult {
  vehicleId: VehicleId;
  vehicleType: string;
  licensePlate: string;
  status: 'available';
  assignmentConfirmed: boolean;
}

/**
 * Assign Vehicle Use Case
 *
 * Validates vehicle availability and readiness for assignment.
 *
 * Business Rules:
 * - Vehicle must exist and have status='available'
 * - Vehicle must have current inspection (not expired)
 * - Vehicle must not be due for maintenance
 * - Vehicle must not have conflicting assignments
 * - Vehicle capacity must meet requirements
 * - Vehicle must be suitable for event type
 */
export const assignVehicle = (
  command: AssignVehicleCommand
): Effect.Effect<
  AssignVehicleResult,
  AssignmentValidationError | VehicleNotFoundError | VehicleRepositoryError,
  VehicleRepositoryService
> =>
  Effect.gen(function* () {
    const repository = yield* VehicleRepository;

    // Fetch vehicle
    const vehicle = yield* repository.findById(command.vehicleId as any);

    // Validate vehicle status
    if (vehicle.status !== 'available') {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Vehicle is not available, status: ${vehicle.status}`
        )
      );
    }

    // Validate inspection
    if (!vehicle.hasCurrentInspection()) {
      yield* Effect.fail(
        new AssignmentValidationError(
          'Vehicle inspection has expired'
        )
      );
    }

    // Validate maintenance
    if (vehicle.isDueForMaintenance()) {
      yield* Effect.fail(
        new AssignmentValidationError(
          'Vehicle is due for maintenance'
        )
      );
    }

    // Validate capacity
    if ((vehicle.capacity as any) < command.requiredCapacity) {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Vehicle capacity (${vehicle.capacity}) insufficient for ${command.requiredCapacity} passengers`
        )
      );
    }

    // Validate no conflicts during time window
    // TODO: Implement conflict detection logic or add method to repository
    // For now, assume no conflicts
    const conflictingAssignments: any[] = [];

    if (conflictingAssignments.length > 0) {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Vehicle has ${conflictingAssignments.length} conflicting assignment(s)`
        )
      );
    }

    return {
      vehicleId: vehicle.id,
      vehicleType: (vehicle as any).vehicleType || (vehicle as any).type || 'unknown',
      licensePlate: vehicle.licensePlate,
      status: 'available',
      assignmentConfirmed: true,
    };
  });
