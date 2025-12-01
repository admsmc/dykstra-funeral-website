import { Effect } from 'effect';
import type { DriverAssignmentRepositoryService } from '../../ports/driver-assignment-repository';
import { DriverAssignment, AssignmentId, EventType, Location } from '@dykstra/domain';
import { DriverAssignmentRepository } from '../../ports/driver-assignment-repository';
import { DriverAssignmentNotFoundError, DriverAssignmentRepositoryError } from '../../ports/driver-assignment-repository';

/**
 * Domain error: Driver validation failed
 */
/**
 * Assign Driver
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

export class DriverError extends Error {
  readonly _tag = 'DriverError';
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DriverError.prototype);
  }
}

/**
 * Domain error: Assignment validation failed
 */
export class AssignmentValidationError extends Error {
  readonly _tag = 'AssignmentValidationError';
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AssignmentValidationError.prototype);
  }
}

/**
 * Input for assign driver use case
 */
export interface AssignDriverCommand {
  driverId: string;
  eventType: EventType;
  caseId: string;
  funeralHomeId: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  scheduledTime: Date;
  estimatedDuration: number; // minutes, 15-240
  createdBy: string;
  notes?: string;
}

/**
 * Output from assign driver use case
 */
export interface AssignDriverResult {
  assignmentId: AssignmentId;
  driverId: string;
  status: 'pending';
  notificationSent: boolean;
}

/**
 * Assign Driver Use Case
 *
 * Validates driver availability and assigns them to an event.
 *
 * Business Rules:
 * - Driver must exist and be active
 * - Driver must have valid commercial license
 * - Driver must not have overlapping assignments
 * - Minimum 1-hour rest period between assignments
 * - Estimated duration must be 15-240 minutes
 * - Case must exist and be active
 */
export const assignDriver = (
  command: AssignDriverCommand
): Effect.Effect<
  AssignDriverResult,
  | DriverError
  | AssignmentValidationError
  | DriverAssignmentNotFoundError
  | DriverAssignmentRepositoryError,
  DriverAssignmentRepositoryService
> =>
  Effect.gen(function* () {
    const repository = yield* DriverAssignmentRepository;

    // Validate estimated duration (15 min - 4 hours)
    if (command.estimatedDuration < 15 || command.estimatedDuration > 240) {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Estimated duration must be between 15 and 240 minutes, got ${command.estimatedDuration}`
        )
      );
    }

    // Validate scheduled time is in future
    const now = new Date();
    if (command.scheduledTime <= now) {
      yield* Effect.fail(
        new AssignmentValidationError(
          'Scheduled time must be in the future'
        )
      );
    }

    // Check for conflicts with existing assignments (1-hour rest buffer)
    const existingAssignments = yield* repository.findByDriverId(
      command.driverId,
      command.scheduledTime
    );

    // Create temporary assignment object for overlap checking
    const tempAssignment = new DriverAssignment({
      id: 'temp' as any,
      businessKey: '',
      version: 1,
      funeralHomeId: command.funeralHomeId as any,
      driverId: command.driverId as any,
      eventType: command.eventType,
      caseId: command.caseId as any,
      pickupLocation: command.pickupLocation,
      dropoffLocation: command.dropoffLocation,
      scheduledTime: command.scheduledTime,
      estimatedDuration: command.estimatedDuration,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      createdBy: command.createdBy,
    });

    // Check for overlaps with 60-minute buffer
    for (const existing of existingAssignments) {
      if (existing.isActive() && tempAssignment.overlapsWithTimeWindow(
        existing.scheduledTime,
        existing.estimatedDuration,
        60 // 1-hour buffer
      )) {
        yield* Effect.fail(
          new AssignmentValidationError(
            `Driver has conflicting assignment at ${existing.scheduledTime.toISOString()}`
          )
        );
      }
    }

    // Create new assignment
    const assignmentId = `assign_${Date.now()}` as AssignmentId;
    const businessKey = `${command.funeralHomeId}:${command.eventType}_${command.caseId}:${command.driverId}`;

    const assignment = new DriverAssignment({
      id: assignmentId,
      businessKey,
      version: 1,
      funeralHomeId: command.funeralHomeId as any,
      driverId: command.driverId as any,
      eventType: command.eventType,
      caseId: command.caseId as any,
      pickupLocation: command.pickupLocation,
      dropoffLocation: command.dropoffLocation,
      scheduledTime: command.scheduledTime,
      estimatedDuration: command.estimatedDuration,
      status: 'pending',
      notes: command.notes,
      createdAt: now,
      updatedAt: now,
      createdBy: command.createdBy,
    });

    // Save assignment
    yield* repository.save(assignment);

    return {
      assignmentId,
      driverId: command.driverId,
      status: 'pending',
      notificationSent: false, // Dispatch happens separately
    };
  });