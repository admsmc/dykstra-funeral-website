import { Effect } from 'effect';
import { AppointmentStatus, PrePlanningAppointment } from '@dykstra/domain';
import type { PrePlanningAppointmentRepository } from '../../ports/pre-planning-appointment-repository';
import {
  PrePlanningAppointmentRepositoryTag,
  RepositoryError,
} from '../../ports/pre-planning-appointment-repository';

/**
 * List Appointments Use Case
 *
 * Retrieves appointments with optional filtering by:
 * - Director ID
 * - Date range
 * - Status
 * - Family email
 */

/**
 * List Appointments
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

export interface ListAppointmentsQuery {
  readonly directorId?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly status?: AppointmentStatus;
  readonly familyEmail?: string;
}

export interface AppointmentSummary {
  readonly id: string;
  readonly directorId: string;
  readonly directorName: string;
  readonly familyName: string;
  readonly familyEmail: string;
  readonly familyPhone: string;
  readonly appointmentDate: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly status: AppointmentStatus;
  readonly notes?: string;
}

export interface ListAppointmentsResult {
  readonly appointments: readonly AppointmentSummary[];
  readonly total: number;
}

/**
 * List appointments with optional filters
 */
export const listAppointments = (
  query: ListAppointmentsQuery
): Effect.Effect<
  ListAppointmentsResult,
  RepositoryError,
  PrePlanningAppointmentRepository
> =>
  Effect.gen(function* () {
    const repository = yield* PrePlanningAppointmentRepositoryTag;

    let appointments: readonly PrePlanningAppointment[] | undefined;

    // Determine which repository method to use based on filters
    if (query.directorId && query.startDate && query.endDate) {
      // Filter by director and date range
      appointments = yield* repository.findByDirectorInRange(
        query.directorId,
        query.startDate,
        query.endDate
      );
    } else if (query.directorId) {
      // Filter by director only - use current date onward
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      appointments = yield* repository.findByDirectorInRange(
        query.directorId,
        today,
        thirtyDaysFromNow
      );
    } else if (query.familyEmail) {
      // Filter by family email
      appointments = yield* repository.findByFamilyEmail(
        query.familyEmail
      );
    } else if (query.status) {
      // Filter by status
      appointments = yield* repository.findByStatus(
        query.status
      );
    } else {
      // No filters - return appointments needing reminders
      appointments = yield* repository.findAppointmentsNeedingReminders();
    }

    // Apply additional filters
    let filtered = appointments || [];

    if (query.status) {
      filtered = filtered.filter((apt) => apt.status === query.status);
    }

    if (query.startDate && query.endDate && !query.directorId) {
      filtered = filtered.filter(
        (apt) =>
          apt.appointmentDate >= query.startDate! &&
          apt.appointmentDate <= query.endDate!
      );
    }

    if (query.familyEmail && !query.directorId) {
      filtered = filtered.filter((apt) => apt.familyEmail === query.familyEmail);
    }

    // Sort by appointment date
    const sorted = [...filtered].sort(
      (a: any, b: any) => a.startTime.getTime() - b.startTime.getTime()
    );

    // Convert to summaries
    const summaries: AppointmentSummary[] = sorted.map((apt) => ({
      id: apt.id,
      directorId: apt.directorId,
      directorName: apt.directorName,
      familyName: apt.familyName,
      familyEmail: apt.familyEmail,
      familyPhone: apt.familyPhone,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      notes: apt.notes,
    }));

    return {
      appointments: summaries,
      total: summaries.length,
    };
  });
