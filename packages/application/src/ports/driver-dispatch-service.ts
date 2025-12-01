import { Effect, Context } from 'effect';
import { DriverAssignment, AssignmentId } from '@dykstra/domain';

/**
 * Notification error - failure to send notification
 */
export class NotificationError extends Error {
  readonly _tag = 'NotificationError';
  constructor(
    message: string,
    public readonly reason?: 'email' | 'sms' | 'push' | 'unknown'
  ) {
    super(message);
    Object.setPrototypeOf(this, NotificationError.prototype);
  }
}

/**
 * Driver entity from context
 */
export interface Driver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notificationPreference: 'email' | 'sms' | 'both';
}

/**
 * DriverDispatchService Interface
 *
 * Provides notification services for driver assignments.
 * Handles:
 * - Initial dispatch notifications when assignments are created
 * - Reminder notifications 30 minutes before pickup
 * - Completion confirmations after assignment completes
 *
 * All methods return Effect for proper error handling and dependency injection.
 */
export interface DriverDispatchServiceService {
  /**
   * Notify driver of new assignment
   *
   * Sends assignment details including:
   * - Event type (removal, transfer, procession)
   * - Pickup location and time
   * - Drop-off location
   * - Estimated duration
   * - Vehicle assigned (if available)
   * - Contact information
   *
   * @param assignment The assignment to notify about
   * @param driver The driver to notify
   * @returns Effect that succeeds on successful notification
   */
  notifyDriverAssignment(
    assignment: DriverAssignment,
    driver: Driver
  ): Effect.Effect<void, NotificationError, never>;

  /**
   * Send reminder notification to driver
   *
   * Sent approximately 30 minutes before scheduled pickup.
   * Includes:
   * - Pickup location and time (exact time remaining)
   * - Vehicle assignment
   * - Traffic/route conditions if available
   *
   * @param assignmentId The assignment to remind about
   * @param driver The driver to remind
   * @returns Effect that succeeds on successful notification
   */
  sendReminder(
    assignmentId: AssignmentId,
    driver: Driver
  ): Effect.Effect<void, NotificationError, never>;

  /**
   * Send completion confirmation to driver
   *
   * Sent after assignment is marked complete. Includes:
   * - Confirmation of successful completion
   * - Mileage recorded
   * - Payment/reimbursement information
   * - Optional feedback request
   *
   * @param assignment The completed assignment
   * @param driver The driver to notify
   * @returns Effect that succeeds on successful notification
   */
  sendCompletionConfirmation(
    assignment: DriverAssignment,
    driver: Driver
  ): Effect.Effect<void, NotificationError, never>;

  /**
   * Send cancellation notice to driver
   *
   * Sent when assignment is cancelled. Includes:
   * - Cancellation reason
   * - Updated schedule
   * - Any rescheduling information
   *
   * @param assignmentId The cancelled assignment
   * @param driver The driver to notify
   * @param reason Why the assignment was cancelled
   * @returns Effect that succeeds on successful notification
   */
  sendCancellationNotice(
    assignmentId: AssignmentId,
    driver: Driver,
    reason: string
  ): Effect.Effect<void, NotificationError, never>;

  /**
   * Batch send reminders for assignments starting within next hour
   *
   * Useful for scheduled job that runs every 30 minutes.
   * Retrieves drivers separately and sends reminders.
   *
   * @param assignments Assignments to send reminders for
   * @param drivers Map of driver ID to driver details
   * @returns Effect with count of successful reminders sent
   */
  sendBatchReminders(
    assignments: DriverAssignment[],
    drivers: Map<string, Driver>
  ): Effect.Effect<{ successful: number; failed: number }, NotificationError, never>;
}

/**
 * Context tag for dependency injection
 */
export const DriverDispatchService =
  Context.GenericTag<DriverDispatchServiceService>(
    '@dykstra/DriverDispatchService'
  );