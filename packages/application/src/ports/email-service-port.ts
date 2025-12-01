import { Effect, Context } from 'effect';

/**
 * Email Service Port
 * 
 * Handles sending emails for appointment confirmations, reminders, and cancellations.
 * Provides abstraction from specific email provider implementation.
 */

export interface EmailService {
  /**
   * Send appointment confirmation email to family
   */
  readonly sendAppointmentConfirmation: (
    params: AppointmentConfirmationEmailParams
  ) => Effect.Effect<EmailSendResult, EmailServiceError>;

  /**
   * Send appointment reminder email (24 hours before)
   */
  readonly sendAppointmentReminder: (
    params: AppointmentReminderEmailParams
  ) => Effect.Effect<EmailSendResult, EmailServiceError>;

  /**
   * Send appointment cancellation email
   */
  readonly sendAppointmentCancellation: (
    params: AppointmentCancellationEmailParams
  ) => Effect.Effect<EmailSendResult, EmailServiceError>;

  /**
   * Send director confirmation email
   */
  readonly sendDirectorNotification: (
    params: DirectorNotificationEmailParams
  ) => Effect.Effect<EmailSendResult, EmailServiceError>;
}

/**
 * Appointment confirmation email parameters
 */
export interface AppointmentConfirmationEmailParams {
  readonly familyEmail: string;
  readonly familyName: string;
  readonly directorName: string;
  readonly appointmentDate: Date;
  readonly appointmentTime: string;  // e.g., "2:00 PM - 3:00 PM"
  readonly funeralHomeName: string;
  readonly funeralHomePhone: string;
  readonly funeralHomeAddress: string;
  readonly confirmationUrl?: string;  // Link to confirm appointment
}

/**
 * Appointment reminder email parameters
 */
export interface AppointmentReminderEmailParams {
  readonly familyEmail: string;
  readonly familyName: string;
  readonly directorName: string;
  readonly appointmentDate: Date;
  readonly appointmentTime: string;
  readonly hoursUntilAppointment: number;
  readonly funeralHomeName: string;
  readonly funeralHomePhone: string;
  readonly funeralHomeAddress: string;
  readonly rescheduleUrl?: string;  // Link to reschedule
}

/**
 * Appointment cancellation email parameters
 */
export interface AppointmentCancellationEmailParams {
  readonly familyEmail: string;
  readonly familyName: string;
  readonly directorName: string;
  readonly appointmentDate: Date;
  readonly appointmentTime: string;
  readonly cancelReason?: string;
  readonly rebookUrl?: string;  // Link to schedule new appointment
  readonly funeralHomeName: string;
  readonly funeralHomePhone: string;
}

/**
 * Director notification email parameters
 */
export interface DirectorNotificationEmailParams {
  readonly directorEmail: string;
  readonly directorName: string;
  readonly familyName: string;
  readonly familyPhone: string;
  readonly familyEmail?: string;
  readonly appointmentDate: Date;
  readonly appointmentTime: string;
  readonly notificationType: 'new' | 'reminder' | 'cancellation' | 'no-show';
  readonly additionalNotes?: string;
}

/**
 * Email send result
 */
export interface EmailSendResult {
  readonly messageId: string;
  readonly recipient: string;
  readonly sentAt: Date;
  readonly status: 'sent' | 'queued' | 'failed';
}

/**
 * Email service error
 */
export class EmailServiceError extends Error {
  readonly _tag = 'EmailServiceError' as const;
  constructor(
    message: string,
    override readonly cause?: unknown,
    readonly recipient?: string
  ) {
    super(message);
  }
}

/**
 * Context tag for dependency injection
 */
export const EmailServiceTag = Context.GenericTag<EmailService>(
  '@dykstra/EmailService'
);
