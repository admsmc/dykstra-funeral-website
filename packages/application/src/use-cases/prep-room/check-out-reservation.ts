/**
 * Use Case: Check-Out from Preparation Room
 * Record completion and calculate actual duration
 */

import { Effect } from 'effect';
import type { ReservationId, PrepRoomReservation } from '@dykstra/domain';
import { checkOutReservation } from '@dykstra/domain';
import { PrepRoomRepositoryPort, type PrepRoomRepositoryService } from '../../ports/prep-room-repository';

/**
 * Check Out Reservation
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

export interface CheckOutCommand {
  readonly reservationId: ReservationId;
  readonly embalmerId: string;
}

export interface CheckOutResult {
  readonly success: true;
  readonly reservation: PrepRoomReservation;
  readonly actualDurationMinutes: number;
  readonly message: string;
}

export const checkOut = (
  command: CheckOutCommand
): Effect.Effect<CheckOutResult, Error, PrepRoomRepositoryService> =>
  Effect.gen(function* () {
    const repo = yield* PrepRoomRepositoryPort;

    // Get reservation
    const reservation = yield* repo
      .getReservationById(command.reservationId)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    // Verify permission
    if (reservation.embalmerId !== command.embalmerId) {
      throw new Error('Only assigned embalmer can check out');
    }

    // Verify status
    if (reservation.status !== 'in_progress') {
      throw new Error(`Cannot check out reservation in ${reservation.status} status`);
    }

    // Check-out
    const updatedReservation = checkOutReservation(reservation);
    const saved = yield* repo
      .updateReservation(updatedReservation)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    return {
      success: true,
      reservation: saved,
      actualDurationMinutes: saved.actualDuration || 0,
      message: `Checked out after ${saved.actualDuration || 0} minutes`,
    };
  });
