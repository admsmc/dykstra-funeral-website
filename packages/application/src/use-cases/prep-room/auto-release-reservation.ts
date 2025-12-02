/**
 * Use Case: Auto-Release Preparation Room Reservations
 * Background job that runs every 5 minutes to auto-release 30-minute timeouts
 */

import { Effect } from 'effect';
import { hasAutoReleaseTimeout, autoReleaseReservation } from '@dykstra/domain';
import { PrepRoomRepositoryPort, type PrepRoomRepositoryService } from '../../ports/prep-room-repository';

/**
 * Auto Release Reservation
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

export interface AutoReleaseResult {
  readonly releasedCount: number;
  readonly message: string;
}

export const autoReleaseReservations = (): Effect.Effect<AutoReleaseResult, Error, PrepRoomRepositoryService> =>
  Effect.gen(function* () {
    const repo = yield* PrepRoomRepositoryPort;

    // Find all pending and confirmed reservations
    const pendingReservations = yield* repo
      .findReservationsByStatus('pending')
      .pipe(Effect.mapError((err) => new Error(err.message)));
      
    const confirmedReservations = yield* repo
      .findReservationsByStatus('confirmed')
      .pipe(Effect.mapError((err) => new Error(err.message)));

    const allReservations = [...pendingReservations, ...confirmedReservations];

    // Find those with auto-release timeout
    const now = new Date();
    const toRelease = allReservations.filter((res) =>
      hasAutoReleaseTimeout(res, now)
    );

    // Release them
    let releasedCount = 0;
    for (const reservation of toRelease) {
      const updated = autoReleaseReservation(reservation);
      yield* repo
        .updateReservation(updated)
        .pipe(Effect.mapError((err) => new Error(err.message)));
      releasedCount++;
    }

    return {
      releasedCount,
      message: `Auto-released ${releasedCount} reservations`,
    };
  });
