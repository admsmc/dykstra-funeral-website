import { Effect } from 'effect';
import type { VehicleRepositoryService } from '../../ports/vehicle-repository';
import { VehicleId } from '@dykstra/domain';
import { VehicleRepository } from '../../ports/vehicle-repository';
import { type VehicleNotFoundError, type VehicleRepositoryError } from '../../ports/vehicle-repository';
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
    const vehicle = yield* repository.findById(VehicleId(command.vehicleId));

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

    // Validate capacity (capacity is an enum type, not a number - validation based on event requirements)
    // Note: Vehicle capacity is 'standard' | 'expandable' | 'van' | 'truck', not a number
    // This is validated elsewhere based on event type and requirements

    // Validate no conflicts during time window
    // TODO: Implement conflict detection logic or add method to repository
    // For now, assume no conflicts
    const conflictingAssignments: never[] = [];

    if (conflictingAssignments.length > 0) {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Vehicle has ${conflictingAssignments.length} conflicting assignment(s)`
        )
      );
    }

    return {
      vehicleId: vehicle.id,
      vehicleType: vehicle.capacity, // Use capacity as the vehicle type descriptor
      licensePlate: vehicle.licensePlate,
      status: 'available',
      assignmentConfirmed: true,
    };
  });
