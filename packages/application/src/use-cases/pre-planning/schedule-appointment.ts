import { Effect } from 'effect';
import {
  PrePlanningAppointment,
  type AppointmentError,
  AppointmentConflictError,
  AppointmentCapacityError,
  BusinessHoursError,
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
 * Schedule Pre-Planning Appointment Use Case
 *
 * Business Rules:
 * - Only directors can conduct pre-planning (enforced at API layer)
 * - Appointments only 8am-5pm Mon-Fri
 * - Minimum 1 hour duration
 * - Maximum 4 appointments per director per day
 * - No double-booking (overlapping appointments)
 * - Lunch break 12-1pm automatically blocks availability
 */

/**
 * Schedule Appointment
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

export class ScheduleAppointmentError extends Error {
  readonly _tag = 'ScheduleAppointmentError' as const;
  constructor(
    message: string,
    override readonly cause?: unknown
  ) {
    super(message);
  }
}

export interface ScheduleAppointmentCommand {
  readonly directorId: string;
  readonly directorName: string;
  readonly familyName: string;
  readonly familyEmail: string;
  readonly familyPhone: string;
  readonly appointmentDate: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly notes?: string;
  readonly createdBy: string;
}

export interface ScheduleAppointmentResult {
  readonly appointmentId: string;
  readonly businessKey: string;
  readonly confirmationEmailSent: boolean;
  readonly directorNotificationSent: boolean;
}

/**
 * Schedule a new pre-planning appointment
 *
 * Validates all business rules:
 * 1. Appointment date/time is on a business day (Mon-Fri)
 * 2. Time is within business hours (8am-5pm)
 * 3. Duration is at least 1 hour
 * 4. No overlap with existing appointments
 * 5. No overlap with lunch (12-1pm)
 * 6. Director has capacity (max 4 per day)
 * 7. Sends confirmation email to family
 * 8. Sends notification to director
 */
export const scheduleAppointment = (
  command: ScheduleAppointmentCommand
): Effect.Effect<
  ScheduleAppointmentResult,
  | ScheduleAppointmentError
  | AppointmentError
  | AppointmentConflictError
  | AppointmentCapacityError
  | BusinessHoursError
  | RepositoryError
  | AppointmentNotFoundError
  | EmailServiceError,
  PrePlanningAppointmentRepository | EmailService
> =>
  Effect.gen(function* () {
    const repository = yield* PrePlanningAppointmentRepositoryTag;
    const emailService = yield* EmailServiceTag;

    // Create the appointment entity
    const appointment = PrePlanningAppointment.create({
      directorId: command.directorId,
      directorName: command.directorName,
      familyName: command.familyName,
      familyEmail: command.familyEmail,
      familyPhone: command.familyPhone,
      appointmentDate: command.appointmentDate,
      startTime: command.startTime,
      endTime: command.endTime,
      notes: command.notes,
      createdBy: command.createdBy,
    });

    // Validate business day (Mon-Fri)
    if (!appointment.isOnBusinessDay()) {
      return yield* Effect.fail(
        new BusinessHoursError(
          'Appointments can only be scheduled on weekdays (Monday-Friday)'
        )
      );
    }

    // Validate business hours (8am-5pm)
    if (!appointment.isWithinBusinessHours()) {
      return yield* Effect.fail(
        new BusinessHoursError(
          'Appointments must be within business hours (8am-5pm) and at least 1 hour duration'
        )
      );
    }

    // Validate no lunch overlap
    if (appointment.overlapsWithLunch()) {
      return yield* Effect.fail(
        new BusinessHoursError(
          'Appointments cannot overlap with lunch break (12pm-1pm)'
        )
      );
    }

    // Get all appointments for this director on this date
    const existingAppointments = yield* repository.findByDirectorAndDate(
      command.directorId,
      command.appointmentDate
    );

    // Check capacity (max 4 per day)
    if (existingAppointments.length >= 4) {
      return yield* Effect.fail(
        new AppointmentCapacityError(
          'Director has reached maximum capacity (4 appointments) for this day'
        )
      );
    }

    // Check for overlaps with existing appointments
    const conflictingAppointment = existingAppointments.find((existing) =>
      existing.status !== 'cancelled' && existing.overlaps(appointment)
    );

    if (conflictingAppointment) {
      return yield* Effect.fail(
        new AppointmentConflictError(
          'This time slot conflicts with an existing appointment',
          conflictingAppointment.id
        )
      );
    }

    // Save the appointment
    yield* repository.save(appointment);

    // Send confirmation email to family
    let confirmationEmailSent = false;
    try {
      const confirmationResult = yield* emailService.sendAppointmentConfirmation({
        familyEmail: command.familyEmail,
        familyName: command.familyName,
        directorName: command.directorName,
        appointmentDate: command.appointmentDate,
        appointmentTime: `${command.startTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${command.endTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        funeralHomeName: 'Dykstra Funeral Home',
        funeralHomePhone: '(555) 123-4567',
        funeralHomeAddress: '123 Main Street, Anytown, MI 12345',
      });
      confirmationEmailSent = confirmationResult.status === 'sent' || confirmationResult.status === 'queued';
    } catch (error) {
      // Log but don't fail the appointment creation if email fails
      console.error('Failed to send confirmation email:', error);
    }

    // Send director notification
    let directorNotificationSent = false;
    try {
      const directorResult = yield* emailService.sendDirectorNotification({
        directorEmail: 'director@example.com', // This should come from director lookup
        directorName: command.directorName,
        familyName: command.familyName,
        familyPhone: command.familyPhone,
        familyEmail: command.familyEmail,
        appointmentDate: command.appointmentDate,
        appointmentTime: `${command.startTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${command.endTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        notificationType: 'new',
        additionalNotes: command.notes,
      });
      directorNotificationSent = directorResult.status === 'sent' || directorResult.status === 'queued';
    } catch (error) {
      // Log but don't fail if notification fails
      console.error('Failed to send director notification:', error);
    }

    return {
      appointmentId: appointment.id,
      businessKey: appointment.businessKey,
      confirmationEmailSent,
      directorNotificationSent,
    };
  });
