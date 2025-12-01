import { Effect } from 'effect';
import type { PrePlanningAppointmentRepository } from '../../ports/pre-planning-appointment-repository';
import {
  PrePlanningAppointmentRepositoryTag,
  RepositoryError,
} from '../../ports/pre-planning-appointment-repository';
import type { EmailService } from '../../ports/email-service-port';
import { EmailServiceTag, EmailServiceError } from '../../ports/email-service-port';

/**
 * Send Appointment Reminders Use Case
 *
 * Automated background task that:
 * - Finds all appointments needing reminders (1-36 hours before)
 * - Sends email reminders to families
 * - Sends SMS reminders (optional)
 * - Records that reminders were sent
 * - Runs periodically (typically hourly or every 6 hours)
 *
 * Business Rules:
 * - Only send reminders for scheduled/confirmed appointments
 * - Only send each reminder once per appointment
 * - Window: 1-36 hours before appointment
 * - 24-hour reminder: "Your appointment is tomorrow at..."
 * - 1-hour reminder: "Your appointment is in 1 hour at..."
 */

/**
 * Send Appointment Reminders
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

export class SendRemindersError extends Error {
  readonly _tag = 'SendRemindersError' as const;
  constructor(
    message: string,
    override readonly cause?: unknown
  ) {
    super(message);
  }
}

export interface SendRemindersCommand {
  readonly dryRun?: boolean;  // Don't send, just report what would be sent
  readonly onlyEmail?: boolean;  // Skip SMS reminders
}

export interface ReminderResult {
  readonly appointmentId: string;
  readonly familyEmail: string;
  readonly emailSent: boolean;
  readonly smsSent: boolean;
  readonly hoursUntilAppointment: number;
}

export interface SendRemindersResult {
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly results: readonly ReminderResult[];
}

/**
 * Send reminders for upcoming appointments
 *
 * Processes:
 * 1. Gets all appointments needing reminders
 * 2. Calculates hours until appointment
 * 3. Sends appropriate reminder message
 * 4. Records reminder sent in appointment
 * 5. Continues on individual failures (doesn't stop batch)
 */
export const sendAppointmentReminders = (
  command: SendRemindersCommand = {}
): Effect.Effect<
  SendRemindersResult,
  SendRemindersError | RepositoryError | EmailServiceError,
  PrePlanningAppointmentRepository | EmailService
> =>
  Effect.gen(function* () {
    const repository = yield* PrePlanningAppointmentRepositoryTag;
    const emailService = yield* EmailServiceTag;

    // Get all appointments needing reminders
    const appointmentsNeedingReminders = yield* repository.findAppointmentsNeedingReminders();

    const results: ReminderResult[] = [];
    let succeeded = 0;
    let failed = 0;

    // Process each appointment
    for (const appointment of appointmentsNeedingReminders) {
      try {
        const now = new Date();
        const hoursUntil = (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        let emailSent = false;
        let smsSent = false;

        // Don't actually send in dry-run mode
        if (!command.dryRun) {
          // Send email reminder
          try {
            const emailResult = yield* emailService.sendAppointmentReminder({
              familyEmail: appointment.familyEmail,
              familyName: appointment.familyName,
              directorName: appointment.directorName,
              appointmentDate: appointment.appointmentDate,
              appointmentTime: `${appointment.startTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} - ${appointment.endTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`,
              hoursUntilAppointment: Math.round(hoursUntil),
              funeralHomeName: 'Dykstra Funeral Home',
              funeralHomePhone: '(555) 123-4567',
              funeralHomeAddress: '123 Main Street, Anytown, MI 12345',
            });
            emailSent = emailResult.status === 'sent' || emailResult.status === 'queued';
          } catch (error) {
            console.error(`Failed to send reminder email for appointment ${appointment.id}:`, error);
            failed++;
          }

          // Record that reminder was sent (if email succeeded)
          if (emailSent) {
            try {
              const reminderSentAppointment = appointment.recordEmailReminderSent();
              yield* repository.update(reminderSentAppointment);
              succeeded++;
            } catch (error) {
              console.error(`Failed to record reminder for appointment ${appointment.id}:`, error);
              failed++;
            }
          }
        } else {
          // Dry-run: just mark as would send
          emailSent = true;
          succeeded++;
        }

        results.push({
          appointmentId: appointment.id,
          familyEmail: appointment.familyEmail,
          emailSent,
          smsSent,
          hoursUntilAppointment: Math.round(hoursUntil),
        });
      } catch (error) {
        console.error(`Unexpected error processing appointment ${appointment.id}:`, error);
        failed++;
      }
    }

    return {
      total: appointmentsNeedingReminders.length,
      succeeded,
      failed,
      results,
    };
  });
