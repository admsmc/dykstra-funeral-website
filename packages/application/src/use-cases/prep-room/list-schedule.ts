/**
 * Use Case: List Preparation Room Schedule
 * Display calendar/utilization view for a day or week
 */

import { Effect } from 'effect';
import { PrepRoomRepositoryPort, type RoomUtilization } from '../../ports/prep-room-repository';

/**
 * List Schedule
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

export interface ListScheduleQuery {
  readonly funeralHomeId: string;
  readonly dateFrom: Date;
  readonly dateTo: Date;
}

export interface ListScheduleResult {
  readonly rooms: RoomUtilization[];
  readonly totalCapacity: number;
  readonly utilizationPercentage: number;
  readonly message: string;
}

export const listSchedule = (
  query: ListScheduleQuery
): Effect.Effect<ListScheduleResult, Error, typeof PrepRoomRepositoryPort> =>
  Effect.gen(function* () {
    const repo = yield* PrepRoomRepositoryPort;

    // Get room utilization
    const rooms = yield* repo
      .getRoomUtilization(query.funeralHomeId, query.dateFrom, query.dateTo)
      .pipe(Effect.mapError((err) => new Error(err.message)));

    // Calculate metrics
    const totalCapacity = rooms.reduce((sum, room) => sum + room.maxCapacity, 0);
    const totalReservations = rooms.reduce((sum, room) => sum + room.reservedCount, 0);
    const utilizationPercentage = totalCapacity > 0 ? (totalReservations / totalCapacity) * 100 : 0;

    return {
      rooms,
      totalCapacity,
      utilizationPercentage: Math.round(utilizationPercentage),
      message: `${rooms.length} rooms, ${utilizationPercentage.toFixed(1)}% utilization`,
    };
  });
