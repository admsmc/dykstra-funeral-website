/**
 * Use Case: Reserve Preparation Room
 * Reserve a preparation room with conflict detection and alternative suggestions
 */

import { Effect } from 'effect';
import type { PrepRoomId, PrepRoom } from '@dykstra/domain';
import { createPrepRoomReservation, type ReservationPriority } from '@dykstra/domain';
import { PrepRoomRepositoryPort, type PrepRoomRepositoryService, type FindAvailableSlotsQuery, type AvailableSlot } from '../../ports/prep-room-repository';

/**
 * Reserve Room
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

export interface ReserveRoomCommand {
  readonly prepRoomId: PrepRoomId;
  readonly embalmerId: string;
  readonly caseId: string;
  readonly familyId: string;
  readonly reservedFrom: Date;
  readonly durationMinutes: number;
  readonly priority: ReservationPriority;
  readonly notes?: string;
}

export interface ReserveRoomResult {
  readonly success: true;
  readonly reservationId: string;
  readonly room: PrepRoom;
  readonly message: string;
}

export interface ConflictResult {
  readonly success: false;
  readonly conflictType: 'overlap' | 'capacity' | 'buffer';
  readonly conflictingReservationId: string;
  readonly suggestedAlternatives: AvailableSlot[];
  readonly message: string;
}

export type ReserveRoomResponse = ReserveRoomResult | ConflictResult;

export const reserveRoom = (
  command: ReserveRoomCommand
): Effect.Effect<ReserveRoomResponse, Error, PrepRoomRepositoryService> =>
  Effect.gen(function* () {
    const repo = yield* PrepRoomRepositoryPort;

    // Validate duration
    if (command.durationMinutes < 120 || command.durationMinutes > 480) {
      return {
        success: false,
        conflictType: 'buffer' as const,
        conflictingReservationId: '',
        suggestedAlternatives: [],
        message: 'Reservation duration must be between 2 and 8 hours',
      };
    }

    // Calculate reservedTo
    const reservedTo = new Date(
      command.reservedFrom.getTime() + command.durationMinutes * 60 * 1000
    );

    // Get prep room - map specific errors to generic Error
    const room = yield* repo
      .getPrepRoomById(command.prepRoomId)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    // Check capacity
    if (room.status !== 'available') {
      return {
        success: false,
        conflictType: 'capacity' as const,
        conflictingReservationId: '',
        suggestedAlternatives: [],
        message: `Preparation room is currently ${room.status}`,
      };
    }

    // Check for conflicts
    const conflicts = yield* repo
      .checkConflicts(
        command.prepRoomId,
        command.reservedFrom,
        reservedTo,
        command.priority as 'normal' | 'urgent'
      )
      .pipe(Effect.mapError((err) => new Error(err.message)));

    if (conflicts.length > 0) {
      // Find alternative slots
      const query: FindAvailableSlotsQuery = {
        funeralHomeId: room.funeralHomeId,
        reservedFrom: command.reservedFrom,
        reservedTo,
        durationMinutes: command.durationMinutes,
        capacity: 1,
        limit: 3,
      };

      const alternatives = yield* repo
        .findAvailableSlots(query)
        .pipe(Effect.mapError((err) => new Error(err.message)));

      return {
        success: false,
        conflictType: conflicts[0]!.type as 'overlap' | 'capacity' | 'buffer',
        conflictingReservationId: conflicts[0]!.reservationId,
        suggestedAlternatives: alternatives,
        message: `Conflict detected with reservation ${conflicts[0]!.reservationId}. Suggested alternatives available.`,
      };
    }

    // Create reservation
    const reservation = createPrepRoomReservation(
      command.prepRoomId,
      command.embalmerId,
      command.caseId,
      command.familyId,
      command.reservedFrom,
      command.durationMinutes,
      command.priority,
      'system',
      command.notes
    );

    const savedReservation = yield* repo
      .createReservation(reservation)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    return {
      success: true,
      reservationId: savedReservation.id,
      room,
      message: `Reservation created successfully in ${room.roomNumber}`,
    };
  });
