import { Effect } from 'effect';
import type { DriverAssignmentRepositoryService } from '../../ports/driver-assignment-repository';
import { DriverAssignmentRepository } from '../../ports/driver-assignment-repository';
import { type DriverAssignmentNotFoundError, type DriverAssignmentRepositoryError } from '../../ports/driver-assignment-repository';
import { type AssignmentValidationError } from './assign-driver';

/**
 * Represents a conflict in driver schedule
 */
/**
 * Check Driver Availability
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

export interface ScheduleConflict {
  assignmentId: string;
  conflictTime: Date;
  conflictDuration: number; // minutes
  eventType: string;
}

/**
 * Input for check driver availability use case
 */
export interface CheckDriverAvailabilityCommand {
  driverId: string;
  scheduledTime: Date;
  estimatedDuration: number; // minutes
  bufferTime?: number; // minutes (default 60)
}

/**
 * Output from check driver availability use case
 */
export interface CheckDriverAvailabilityResult {
  driverId: string;
  isAvailable: boolean;
  conflicts: ScheduleConflict[];
  nextAvailableTime?: Date;
  conflictMessage?: string;
}

/**
 * Check Driver Availability Use Case
 *
 * Checks if a driver is available during a requested time window.
 *
 * Business Rules:
 * - Returns detailed conflict information
 * - Includes 1-hour buffer by default
 * - Suggests next available time slot
 * - Detects overlapping assignments
 */
export const checkDriverAvailability = (
  command: CheckDriverAvailabilityCommand
): Effect.Effect<
  CheckDriverAvailabilityResult,
  AssignmentValidationError | DriverAssignmentNotFoundError | DriverAssignmentRepositoryError,
  DriverAssignmentRepositoryService
> =>
  Effect.gen(function* () {
    const repository = yield* DriverAssignmentRepository;
    const bufferTime = command.bufferTime || 60; // 1 hour default

    // Get all assignments for this driver
    const assignments = yield* repository.findByDriverId(command.driverId, command.scheduledTime);

    // Filter to active assignments that might conflict
    const activeAssignments = assignments.filter((a) => a.isActive());

    // Calculate time window with buffer
    const requestStart = new Date(
      command.scheduledTime.getTime() - bufferTime * 60000
    );
    const requestEnd = new Date(
      command.scheduledTime.getTime() + command.estimatedDuration * 60000 + bufferTime * 60000
    );

    const conflicts: ScheduleConflict[] = [];

    for (const assignment of activeAssignments) {
      const assignStart = assignment.scheduledTime;
      const assignEnd = new Date(
        assignment.scheduledTime.getTime() + assignment.estimatedDuration * 60000
      );

      // Check if time windows overlap
      if (requestStart < assignEnd && requestEnd > assignStart) {
        conflicts.push({
          assignmentId: assignment.id,
          conflictTime: assignStart,
          conflictDuration: assignment.estimatedDuration,
          eventType: assignment.eventType,
        });
      }
    }

    // If there are conflicts, find next available time
    let nextAvailableTime: Date | undefined;
    let conflictMessage: string | undefined;

    if (conflicts.length > 0) {
      // Sort conflicts by time and find gap after last conflict
      const sortedConflicts = conflicts.sort(
        (a, b) => a.conflictTime.getTime() - b.conflictTime.getTime()
      );
      const lastConflict = sortedConflicts[sortedConflicts.length - 1];
      if (lastConflict) {
        nextAvailableTime = new Date(
          lastConflict.conflictTime.getTime() + lastConflict.conflictDuration * 60000 + bufferTime * 60000
        );
      }
      conflictMessage = `Driver has ${conflicts.length} conflicting assignment(s)`;
    }

    return {
      driverId: command.driverId,
      isAvailable: conflicts.length === 0,
      conflicts,
      nextAvailableTime,
      conflictMessage,
    };
  });
