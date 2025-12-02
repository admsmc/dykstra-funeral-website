/**
 * Use Case: Check-In to Preparation Room
 * Mark arrival and begin tracking actual duration
 */

import { Effect } from 'effect';
import type { ReservationId, PrepRoomReservation } from '@dykstra/domain';
import { checkInReservation } from '@dykstra/domain';
import { PrepRoomRepositoryPort, type PrepRoomRepositoryService } from '../../ports/prep-room-repository';

/**
 * Check In Reservation
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

export interface CheckInCommand {
  readonly reservationId: ReservationId;
  readonly embalmerId: string;
}

export interface CheckInResult {
  readonly success: true;
  readonly reservation: PrepRoomReservation;
  readonly message: string;
}

export const checkIn = (
  command: CheckInCommand
): Effect.Effect<CheckInResult, Error, PrepRoomRepositoryService> =>
  Effect.gen(function* () {
    const repo = yield* PrepRoomRepositoryPort;

    // Get reservation
    const reservation = yield* repo
      .getReservationById(command.reservationId)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    // Verify permission
    if (reservation.embalmerId !== command.embalmerId) {
      throw new Error('Only assigned embalmer can check in');
    }

    // Verify status
    if (reservation.status !== 'confirmed') {
      throw new Error(`Cannot check in reservation in ${reservation.status} status`);
    }

    // Check-in
    const updatedReservation = checkInReservation(reservation);
    const saved = yield* repo
      .updateReservation(updatedReservation)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    return {
      success: true,
      reservation: saved,
      message: `Checked in to ${saved.prepRoomId}`,
    };
  });
