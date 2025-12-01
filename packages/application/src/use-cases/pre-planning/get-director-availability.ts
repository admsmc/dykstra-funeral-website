import { Effect } from 'effect';
import {
  AvailabilitySlot,
} from '@dykstra/domain';
import type { PrePlanningAppointmentRepository } from '../../ports/pre-planning-appointment-repository';
import {
  PrePlanningAppointmentRepositoryTag,
  RepositoryError,
} from '../../ports/pre-planning-appointment-repository';

/**
 * Get Director Availability Use Case
 *
 * Returns available 1-hour appointment slots for a director
 * in a given date range, excluding:
 * - Weekends (Saturday-Sunday)
 * - Outside business hours (before 8am, after 5pm)
 * - Existing appointments
 * - Lunch break (12-1pm)
 * - Days when director has 4 appointments
 */

/**
 * Get Director Availability
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

export interface GetDirectorAvailabilityQuery {
  readonly directorId: string;
  readonly fromDate: Date;
  readonly toDate: Date;
  readonly durationMinutes?: number;  // Default: 60
}

export interface DirectorAvailabilityResult {
  readonly directorId: string;
  readonly availableSlots: readonly AvailabilitySlot[];
  readonly totalSlots: number;
  readonly busySlots: number;
}

/**
 * Get available appointment slots for a director
 *
 * Returns 1-hour slots throughout the date range
 * Business rules:
 * - Only Mon-Fri between 8am-5pm
 * - Lunch break (12-1pm) is blocked
 * - Existing appointments block slots
 * - Max 4 appointments per day
 */
export const getDirectorAvailability = (
  query: GetDirectorAvailabilityQuery
): Effect.Effect<
  DirectorAvailabilityResult,
  RepositoryError,
  PrePlanningAppointmentRepository
> =>
  Effect.gen(function* () {
    const repository = yield* PrePlanningAppointmentRepositoryTag;
    const duration = query.durationMinutes ?? 60;

    // Get all appointments for this director in the date range
    const appointments = yield* repository.findByDirectorInRange(
      query.directorId,
      query.fromDate,
      query.toDate
    );

    // Filter to only active appointments (not cancelled or no-show)
    const activeAppointments = appointments.filter(
      (apt) => apt.status !== 'cancelled' && apt.status !== 'no-show'
    );

    const availableSlots: AvailabilitySlot[] = [];
    let busySlots = 0;

    // Iterate through each day in the range
    const currentDate = new Date(query.fromDate);
    while (currentDate <= query.toDate) {
      const dayOfWeek = currentDate.getDay();

      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Count appointments on this day
        const appointmentsOnDay = activeAppointments.filter(
          (apt) =>
            apt.appointmentDate.toDateString() === currentDate.toDateString()
        );

        // Check if director is at capacity (4 appointments per day)
        const isAtCapacity = appointmentsOnDay.length >= 4;

        // Try each hour from 8am to 4pm (allowing time for 1-hour appointment)
        for (let hour = 8; hour < 17; hour++) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + duration);

          // Check if slot overlaps lunch (12-1pm)
          const overlapsLunch =
            slotStart.getHours() < 13 &&
            slotEnd.getHours() > 12;

          // Check for conflicts with existing appointments
          const hasConflict = activeAppointments.some(
            (apt) =>
              apt.appointmentDate.toDateString() ===
                currentDate.toDateString() &&
              apt.startTime < slotEnd &&
              apt.endTime > slotStart
          );

          let available = true;
          let reason: string | undefined;

          if (isAtCapacity) {
            available = false;
            reason = 'Director at capacity (4 appointments per day)';
          } else if (overlapsLunch) {
            available = false;
            reason = 'Overlaps with lunch break (12pm-1pm)';
          } else if (hasConflict) {
            available = false;
            reason = 'Time slot conflicts with existing appointment';
          } else if (slotEnd.getHours() > 17) {
            available = false;
            reason = 'Outside business hours (after 5pm)';
          }

          availableSlots.push({
            date: new Date(currentDate),
            startTime: new Date(slotStart),
            endTime: new Date(slotEnd),
            available,
            reason,
          });

          if (!available) {
            busySlots++;
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      directorId: query.directorId,
      availableSlots,
      totalSlots: availableSlots.length,
      busySlots,
    };
  });
