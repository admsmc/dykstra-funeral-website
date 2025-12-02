/**
 * Use Case: Override Preparation Room Conflict
 * Manager override for urgent cases despite conflicts
 */

import { Effect } from 'effect';
import type { PrepRoomId, ReservationId } from '@dykstra/domain';
import { createPrepRoomReservation, type ReservationPriority } from '@dykstra/domain';
import { PrepRoomRepositoryPort, type PrepRoomRepositoryService } from '../../ports/prep-room-repository';

/**
 * Override Conflict
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

export interface OverrideConflictCommand {
  readonly prepRoomId: PrepRoomId;
  readonly embalmerId: string;
  readonly caseId: string;
  readonly familyId: string;
  readonly reservedFrom: Date;
  readonly durationMinutes: number;
  readonly priority: ReservationPriority;
  readonly managerApprovalId: string;
  readonly overrideReason: string;
}

export interface OverrideConflictResult {
  readonly success: true;
  readonly reservationId: ReservationId;
  readonly message: string;
}

export const overrideConflict = (
  command: OverrideConflictCommand
): Effect.Effect<OverrideConflictResult, Error, PrepRoomRepositoryService> =>
  Effect.gen(function* () {
    const repo = yield* PrepRoomRepositoryPort;

    // Verify manager approval
    if (!command.managerApprovalId || command.managerApprovalId.trim() === '') {
      throw new Error('Manager approval required for conflict override');
    }

    // Get prep room
    const room = yield* repo
      .getPrepRoomById(command.prepRoomId)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    if (room.status !== 'available') {
      throw new Error(`Cannot override: room is ${room.status}`);
    }

    // Create reservation with override flag
    const reservation = createPrepRoomReservation(
      command.prepRoomId,
      command.embalmerId,
      command.caseId,
      command.familyId,
      command.reservedFrom,
      command.durationMinutes,
      command.priority,
      command.managerApprovalId,
      `OVERRIDE: ${command.overrideReason}`
    );

    const saved = yield* repo
      .createReservation(reservation)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    return {
      success: true,
      reservationId: saved.id,
      message: `Reservation created with manager override by ${command.managerApprovalId}`,
    };
  });
