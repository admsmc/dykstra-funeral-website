import { Effect } from 'effect';
import type { VehicleRepositoryService } from '../../ports/vehicle-repository';
import { VehicleRepository } from '../../ports/vehicle-repository';
import { VehicleNotFoundError, VehicleRepositoryError } from '../../ports/vehicle-repository';
import { AssignmentValidationError } from './assign-driver';

/**
 * Input for check vehicle availability use case
 */
/**
 * Check Vehicle Availability
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

export interface CheckVehicleAvailabilityCommand {
  vehicleId: string;
  scheduledTime: Date;
  estimatedDuration: number; // minutes
  requiredCapacity?: number;
  bufferTime?: number; // minutes (default 60)
}

/**
 * Output from check vehicle availability use case
 */
export interface CheckVehicleAvailabilityResult {
  vehicleId: string;
  isAvailable: boolean;
  status: string;
  hasMaintenance: boolean;
  hasExpiredInspection: boolean;
  capacityAdequate: boolean;
  nextAvailableTime?: Date;
  readinessMessage: string;
}

/**
 * Check Vehicle Availability Use Case
 *
 * Comprehensive vehicle status check including maintenance, inspection, and scheduling conflicts.
 *
 * Business Rules:
 * - Vehicle must have current inspection
 * - Vehicle must not be due for maintenance
 * - Vehicle must have no conflicting assignments
 * - Vehicle capacity must meet requirements (if specified)
 * - Returns detailed readiness information
 */
export const checkVehicleAvailability = (
  command: CheckVehicleAvailabilityCommand
): Effect.Effect<
  CheckVehicleAvailabilityResult,
  AssignmentValidationError | VehicleNotFoundError | VehicleRepositoryError,
  VehicleRepositoryService
> =>
  Effect.gen(function* () {
    const repository = yield* VehicleRepository;
    const bufferTime = command.bufferTime || 60; // 1 hour default

    // Fetch vehicle
    const vehicle = yield* repository.findById(command.vehicleId as any);

    // Check maintenance status
    const hasMaintenance = vehicle.isDueForMaintenance();

    // Check inspection status
    const hasExpiredInspection = !vehicle.hasCurrentInspection();

    // Check capacity
    const capacityAdequate =
      command.requiredCapacity === undefined ||
      (vehicle.capacity as any) >= command.requiredCapacity;

    // Check for schedule conflicts
    // TODO: Implement conflict detection logic or add method to repository
    // For now, assume no conflicts
    const conflictingAssignments: any[] = [];
    const hasConflicts = conflictingAssignments.length > 0;

    // Determine overall availability
    const isAvailable =
      vehicle.status === 'available' &&
      !hasMaintenance &&
      !hasExpiredInspection &&
      capacityAdequate &&
      !hasConflicts;

    // Build readiness message
    const issues: string[] = [];
    if (vehicle.status !== 'available') {
      issues.push(`Status is ${vehicle.status}`);
    }
    if (hasMaintenance) {
      issues.push('Due for maintenance');
    }
    if (hasExpiredInspection) {
      issues.push('Inspection expired');
    }
    if (!capacityAdequate) {
      issues.push(
        `Insufficient capacity: ${vehicle.capacity} < ${command.requiredCapacity}`
      );
    }
    if (hasConflicts) {
      issues.push(`${conflictingAssignments.length} scheduling conflict(s)`);
    }

    const readinessMessage = isAvailable
      ? 'Vehicle is ready for assignment'
      : `Vehicle unavailable: ${issues.join('; ')}`;

    return {
      vehicleId: vehicle.id,
      isAvailable,
      status: vehicle.status,
      hasMaintenance,
      hasExpiredInspection,
      capacityAdequate,
      nextAvailableTime: hasConflicts
        ? new Date(
            conflictingAssignments[conflictingAssignments.length - 1].getTime() +
              bufferTime * 60000
          )
        : undefined,
      readinessMessage,
    };
  });
