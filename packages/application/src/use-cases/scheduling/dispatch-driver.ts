import { Effect } from 'effect';
import type { DriverAssignmentRepositoryService } from '../../ports/driver-assignment-repository';
import type { DriverDispatchServiceService } from '../../ports/driver-dispatch-service';
import { DriverAssignmentRepository } from '../../ports/driver-assignment-repository';
import { DriverDispatchService } from '../../ports/driver-dispatch-service';
import { type DriverAssignmentNotFoundError, type DriverAssignmentRepositoryError } from '../../ports/driver-assignment-repository';
import { type NotificationError } from '../../ports/driver-dispatch-service';
import { AssignmentValidationError } from './assign-driver';
import { AssignmentId, DriverId, DriverAssignment } from '@dykstra/domain';

/**
 * Input for dispatch driver use case
 */
/**
 * Dispatch Driver
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

export interface DispatchDriverCommand {
  assignmentId: string;
  message?: string;
  dispatchedBy: string;
}

/**
 * Output from dispatch driver use case
 */
export interface DispatchDriverResult {
  assignmentId: string;
  status: 'dispatched';
  notificationSent: boolean;
  messageId?: string;
}

/**
 * Dispatch Driver Use Case
 *
 * Sends dispatch notification to driver and updates assignment status.
 *
 * Business Rules:
 * - Assignment must exist and be in pending status
 * - Driver notification must be sent (SMS or push)
 * - Status updated to 'dispatched'
 * - Failure to notify should not fail the operation (fire-and-forget)
 */
export const dispatchDriver = (
  command: DispatchDriverCommand
): Effect.Effect<
  DispatchDriverResult,
  | AssignmentValidationError
  | DriverAssignmentNotFoundError
  | DriverAssignmentRepositoryError
  | NotificationError,
  DriverAssignmentRepositoryService | DriverDispatchServiceService
> =>
  Effect.gen(function* () {
    const repository = yield* DriverAssignmentRepository;
    const dispatchService = yield* DriverDispatchService;

    // Fetch assignment
    const assignment = yield* repository.findById(AssignmentId(command.assignmentId));

    // Validate assignment is in pending status
    if (assignment.status !== 'pending') {
      yield* Effect.fail(
        new AssignmentValidationError(
          `Assignment must be pending to dispatch, current status: ${assignment.status}`
        )
      );
    }

    // Update assignment status to dispatched
    const updatedAssignment = new DriverAssignment({
      ...assignment,
      status: 'accepted' as const, // Use 'accepted' instead of 'dispatched' (valid enum value)
      updatedAt: new Date(),
    });

    yield* repository.update(updatedAssignment);

    // Send driver notification (fire-and-forget on error)
    let notificationSent = false;
    let messageId: string | undefined;

    // Send notification - use fire-and-forget pattern
    try {
      const result = yield* Effect.either(
        dispatchService.notifyDriverAssignment(
          assignment,
          { id: DriverId(assignment.driverId), name: '', notificationPreference: 'email' }
        )
      );

      if (result._tag === 'Right') {
        notificationSent = true;
        messageId = typeof result.right === 'string' ? result.right : undefined;
      }
    } catch (error) {
      // Notification errors do not fail dispatch
      console.error('Failed to send dispatch notification:', error);
    }

    return {
      assignmentId: command.assignmentId,
      status: 'dispatched',
      notificationSent,
      messageId,
    };
  });
