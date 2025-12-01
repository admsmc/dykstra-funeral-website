import { Effect } from 'effect';
import { PrePlanningAppointment, AppointmentId } from '@dykstra/domain';

/**
 * Pre-Planning Appointment Repository Port
 * 
 * Handles persistence of appointment data using SCD2 temporal pattern.
 * All appointments are immutable once created; updates create new versions.
 */

export interface PrePlanningAppointmentRepository {
  /**
   * Find appointment by ID (always returns current version)
   */
  readonly findById: (
    id: AppointmentId
  ) => Effect.Effect<PrePlanningAppointment, AppointmentNotFoundError>;

  /**
   * Find appointment by business key (current version only)
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<PrePlanningAppointment | null, RepositoryError>;

  /**
   * Get full history of an appointment (all versions)
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly PrePlanningAppointment[], AppointmentNotFoundError>;

  /**
   * Find all appointments for a director on a specific date
   */
  readonly findByDirectorAndDate: (
    directorId: string,
    date: Date
  ) => Effect.Effect<readonly PrePlanningAppointment[], RepositoryError>;

  /**
   * Find all appointments for a director in a date range
   */
  readonly findByDirectorInRange: (
    directorId: string,
    startDate: Date,
    endDate: Date
  ) => Effect.Effect<readonly PrePlanningAppointment[], RepositoryError>;

  /**
   * Find appointments by family email
   */
  readonly findByFamilyEmail: (
    email: string
  ) => Effect.Effect<readonly PrePlanningAppointment[], RepositoryError>;

  /**
   * Find all upcoming appointments that need reminders
   * (within 1-36 hours and reminder not yet sent)
   */
  readonly findAppointmentsNeedingReminders: () => Effect.Effect<
    readonly PrePlanningAppointment[],
    RepositoryError
  >;

  /**
   * Find appointments by status
   */
  readonly findByStatus: (
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  ) => Effect.Effect<readonly PrePlanningAppointment[], RepositoryError>;

  /**
   * Save new appointment (creates version 1)
   */
  readonly save: (
    appointment: PrePlanningAppointment
  ) => Effect.Effect<void, RepositoryError>;

  /**
   * Update appointment (creates new version in SCD2 pattern)
   */
  readonly update: (
    appointment: PrePlanningAppointment
  ) => Effect.Effect<void, RepositoryError>;

  /**
   * Delete appointment (marks as deleted via SCD2 validTo)
   */
  readonly delete: (
    businessKey: string
  ) => Effect.Effect<void, AppointmentNotFoundError | RepositoryError>;
}

/**
 * Repository errors
 */
export class RepositoryError extends Error {
  readonly _tag = 'RepositoryError' as const;
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
  }
}

export class AppointmentNotFoundError extends Error {
  readonly _tag = 'AppointmentNotFoundError' as const;
  constructor(
    message: string,
    readonly appointmentId?: string
  ) {
    super(message);
  }
}

/**
 * Context tag for dependency injection
 */
import { Context } from 'effect';

export const PrePlanningAppointmentRepositoryTag = Context.GenericTag<PrePlanningAppointmentRepository>(
  '@dykstra/PrePlanningAppointmentRepository'
);
