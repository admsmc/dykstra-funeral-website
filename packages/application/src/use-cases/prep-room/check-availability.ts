/**
 * Use Case: Check Preparation Room Availability
 * Find 10 available slots for a specified time window with urgent prioritization
 */

import { Effect } from 'effect';
import { PrepRoomRepositoryPort, type PrepRoomRepositoryService, type AvailableSlot } from '../../ports/prep-room-repository';

/**
 * Check Availability
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

export interface CheckAvailabilityQuery {
  readonly funeralHomeId: string;
  readonly reservedFrom: Date;
  readonly reservedTo: Date;
  readonly durationMinutes: number;
  readonly isUrgent: boolean;
}

export interface CheckAvailabilityResult {
  readonly availableSlots: AvailableSlot[];
  readonly urgentSlots: AvailableSlot[];
  readonly message: string;
}

export const checkAvailability = (
  query: CheckAvailabilityQuery
): Effect.Effect<CheckAvailabilityResult, Error, PrepRoomRepositoryService> =>
  Effect.gen(function* () {
    const repo = yield* PrepRoomRepositoryPort;

    // Find 10 available slots
    const availableSlots = yield* repo
      .findAvailableSlots({
        funeralHomeId: query.funeralHomeId,
        reservedFrom: query.reservedFrom,
        reservedTo: new Date(query.reservedFrom.getTime() + query.durationMinutes * 60 * 1000),
        durationMinutes: query.durationMinutes,
        capacity: 1,
        limit: 10,
      })
      .pipe(Effect.mapError((err) => new Error(err.message)));

    // Prioritize urgent slots (next 2 hours)
    const now = new Date();
    const urgentWindow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const urgentSlots = availableSlots.filter(
      (slot) => slot.startTime <= urgentWindow && slot.startTime >= now
    );

    return {
      availableSlots,
      urgentSlots,
      message: `Found ${availableSlots.length} available slots${
        urgentSlots.length > 0 ? `, ${urgentSlots.length} within 2 hours` : ''
      }`,
    };
  });
