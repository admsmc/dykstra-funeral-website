/**
 * Preparation Room Repository Port
 * Defines interface for persisting and querying prep room and reservation data
 *
 * Architecture:
 * - Port defined in application layer
 * - Implemented in infrastructure layer (Prisma adapter)
 * - Injected via Effect Context for dependency injection
 */

import { type Effect, Context } from 'effect';
import type { PrepRoom, PrepRoomId } from '@dykstra/domain';
import type { PrepRoomReservation, ReservationId, ReservationStatus } from '@dykstra/domain';

/**
 * Repository error - general persistence failure
 */
export class PrepRoomRepositoryError extends Error {
  readonly _tag = 'PrepRoomRepositoryError' as const;

  constructor(
    override readonly message: string,
    override readonly cause?: unknown
  ) {
    super(message);
  }
}

/**
 * Not found error - entity doesn't exist
 */
export class PrepRoomNotFoundError extends Error {
  readonly _tag = 'PrepRoomNotFoundError' as const;

  constructor(
    override readonly message: string,
    public readonly roomId?: PrepRoomId
  ) {
    super(message);
  }
}

/**
 * Reservation not found error
 */
export class ReservationNotFoundError extends Error {
  readonly _tag = 'ReservationNotFoundError' as const;

  constructor(
    override readonly message: string,
    public readonly reservationId?: ReservationId
  ) {
    super(message);
  }
}

/**
 * Available time slot result
 */
export interface AvailableSlot {
  readonly startTime: Date;
  readonly endTime: Date;
  readonly durationMinutes: number;
  readonly prepRoomId: PrepRoomId;
}

/**
 * Conflict information for a proposed reservation
 */
export interface ConflictInfo {
  readonly type: 'overlap' | 'capacity' | 'buffer';
  readonly reservationId: string;
  readonly message: string;
}

/**
 * Query for finding available slots
 */
export interface FindAvailableSlotsQuery {
  readonly funeralHomeId: string;
  readonly reservedFrom: Date;
  readonly reservedTo: Date;
  readonly durationMinutes: number;
  readonly capacity: 1 | 2;
  readonly limit: number;
}

/**
 * Room utilization metrics
 */
export interface RoomUtilization {
  readonly prepRoomId: PrepRoomId;
  readonly roomNumber: string;
  readonly maxCapacity: number;
  readonly reservedCount: number;
  readonly availableSlots: number;
}

/**
 * PrepRoomRepository Service Interface
 *
 * Provides persistence operations for prep room and reservation management.
 * Uses temporal tracking (SCD2) for complete audit history.
 * All methods return Effect for proper error handling and dependency injection.
 */
export interface PrepRoomRepositoryService {
  // Prep Room Operations

  /**
   * Get prep room by ID
   */
  getPrepRoomById(
    id: PrepRoomId
  ): Effect.Effect<PrepRoom, PrepRoomNotFoundError | PrepRoomRepositoryError, never>;

  /**
   * Find all prep rooms for a funeral home
   */
  getPrepRoomsByFuneralHome(
    funeralHomeId: string
  ): Effect.Effect<PrepRoom[], PrepRoomRepositoryError, never>;

  /**
   * Find available prep rooms (status = 'available')
   */
  getAvailablePrepRooms(
    funeralHomeId: string
  ): Effect.Effect<PrepRoom[], PrepRoomRepositoryError, never>;

  // Reservation Operations

  /**
   * Create new reservation
   */
  createReservation(
    reservation: PrepRoomReservation
  ): Effect.Effect<PrepRoomReservation, PrepRoomRepositoryError, never>;

  /**
   * Get reservation by ID
   */
  getReservationById(
    id: ReservationId
  ): Effect.Effect<PrepRoomReservation, ReservationNotFoundError | PrepRoomRepositoryError, never>;

  /**
   * Find all reservations for a case
   */
  getReservationsByCase(
    caseId: string
  ): Effect.Effect<PrepRoomReservation[], PrepRoomRepositoryError, never>;

  /**
   * Find reservations for a prep room in time range
   */
  getReservationsByRoomAndDateRange(
    prepRoomId: PrepRoomId,
    startDate: Date,
    endDate: Date
  ): Effect.Effect<PrepRoomReservation[], PrepRoomRepositoryError, never>;

  /**
   * Find reservations by status
   */
  findReservationsByStatus(
    status: ReservationStatus
  ): Effect.Effect<PrepRoomReservation[], PrepRoomRepositoryError, never>;

  /**
   * Find available slots for a time window
   */
  findAvailableSlots(
    query: FindAvailableSlotsQuery
  ): Effect.Effect<AvailableSlot[], PrepRoomRepositoryError, never>;

  /**
   * Check for conflicts in proposed time slot
   */
  checkConflicts(
    prepRoomId: PrepRoomId,
    startTime: Date,
    endTime: Date,
    priority: 'normal' | 'urgent'
  ): Effect.Effect<ConflictInfo[], PrepRoomRepositoryError, never>;

  /**
   * Update reservation
   */
  updateReservation(
    reservation: PrepRoomReservation
  ): Effect.Effect<PrepRoomReservation, ReservationNotFoundError | PrepRoomRepositoryError, never>;

  /**
   * Get utilization metrics for prep rooms
   */
  getRoomUtilization(
    funeralHomeId: string,
    startDate: Date,
    endDate: Date
  ): Effect.Effect<RoomUtilization[], PrepRoomRepositoryError, never>;
}

/**
 * Context tag for dependency injection
 */
export const PrepRoomRepositoryPort = Context.GenericTag<PrepRoomRepositoryService>(
  '@dykstra/PrepRoomRepository'
);
