import { Effect } from 'effect';
import {
  type AppointmentId,
  AppointmentCancellationError,
  type AppointmentError,
} from '@dykstra/domain';
import type { PrePlanningAppointmentRepository } from '../../ports/pre-planning-appointment-repository';
import {
  PrePlanningAppointmentRepositoryTag,
  type RepositoryError,
  type AppointmentNotFoundError,
} from '../../ports/pre-planning-appointment-repository';
import type { EmailService } from '../../ports/email-service-port';
import { EmailServiceTag, type EmailServiceError } from '../../ports/email-service-port';

/**
 * Cancel Appointment Use Case
 *
 * Business Rules:
 * - Must be cancelled at least 24 hours before appointment
 * - Cannot cancel completed appointments
 * - Cannot cancel already cancelled appointments
 * - Sends cancellation email to family
 * - Sends director notification
 */

/**
 * Cancel Appointment
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

export class CancelAppointmentError extends Error {
  readonly _tag = 'CancelAppointmentError' as const;
  constructor(
    message: string,
    override readonly cause?: unknown
  ) {
    super(message);
  }
}

export interface CancelAppointmentCommand {
  readonly appointmentId: string;
  readonly reason: string;
  readonly cancelledBy: string;
  readonly directorEmail?: string;  // Optional for notification
}

export interface CancelAppointmentResult {
  readonly appointmentId: string;
  readonly status: string;
  readonly cancelledAt: Date;
  readonly cancellationEmailSent: boolean;
}

/**
 * Cancel a pre-planning appointment
 *
 * Validates:
 * 1. Appointment exists
 * 2. At least 24 hours until appointment
 * 3. Appointment is not already completed or cancelled
 * 4. Sends cancellation email to family
 * 5. Notifies director
 */
export const cancelAppointment = (
  command: CancelAppointmentCommand
): Effect.Effect<
  CancelAppointmentResult,
  | CancelAppointmentError
  | AppointmentCancellationError
  | AppointmentError
  | RepositoryError
  | AppointmentNotFoundError
  | EmailServiceError,
  PrePlanningAppointmentRepository | EmailService
> =>
  Effect.gen(function* () {
    const repository = yield* PrePlanningAppointmentRepositoryTag;
    const emailService = yield* EmailServiceTag;

    // Find the appointment
    const appointment = yield* repository.findById(command.appointmentId as AppointmentId);

    // Check if appointment can be cancelled (24-hour rule)
    if (!appointment.canBeCancelled()) {
      const hoursUntil = (appointment.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      return yield* Effect.fail(
        new AppointmentCancellationError(
          `Appointments must be cancelled at least 24 hours in advance. ${Math.ceil(hoursUntil)} hours remaining.`,
          hoursUntil
        )
      );
    }

    // Check if appointment is already completed
    if (appointment.status === 'completed') {
      return yield* Effect.fail(
        new CancelAppointmentError(
          'Cannot cancel a completed appointment'
        )
      );
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return yield* Effect.fail(
        new CancelAppointmentError(
          'Appointment is already cancelled'
        )
      );
    }

    // Cancel the appointment
    const cancelledAppointment = appointment.cancel(command.reason, command.cancelledBy);

    // Save the cancellation
    yield* repository.update(cancelledAppointment);

    // Send cancellation email to family
    let cancellationEmailSent = false;
    try {
      const emailResult = yield* emailService.sendAppointmentCancellation({
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
        cancelReason: command.reason,
        funeralHomeName: 'Dykstra Funeral Home',
        funeralHomePhone: '(555) 123-4567',
      });
      cancellationEmailSent = emailResult.status === 'sent' || emailResult.status === 'queued';
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
    }

    // Send director notification
    if (command.directorEmail) {
      try {
        yield* emailService.sendDirectorNotification({
          directorEmail: command.directorEmail,
          directorName: appointment.directorName,
          familyName: appointment.familyName,
          familyPhone: appointment.familyPhone,
          familyEmail: appointment.familyEmail,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: `${appointment.startTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })} - ${appointment.endTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          notificationType: 'cancellation',
          additionalNotes: command.reason,
        });
      } catch (error) {
        console.error('Failed to send director notification:', error);
      }
    }

    return {
      appointmentId: command.appointmentId,
      status: 'cancelled',
      cancelledAt: cancelledAppointment.cancelledAt!,
      cancellationEmailSent,
    };
  });
