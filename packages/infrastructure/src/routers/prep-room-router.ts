/**
 * Preparation Room tRPC Router
 * Exposes all 7 prep room use cases as tRPC procedures
 *
 * Endpoints:
 * - POST /prep-room.reserve: Reserve a preparation room
 * - GET /prep-room.checkAvailability: Find available slots
 * - POST /prep-room.checkIn: Check in to a reservation
 * - POST /prep-room.checkOut: Check out from a reservation
 * - POST /prep-room.autoRelease: Trigger auto-release job
 * - GET /prep-room.listSchedule: Get utilization schedule
 * - POST /prep-room.overrideConflict: Manager override
 */

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { Effect, Context } from 'effect';
import type { PrepRoomId, ReservationId } from '@dykstra/domain';
import {
  createPrepRoomId,
  createReservationId,
} from '@dykstra/domain';
import {
  reserveRoom,
  checkAvailability,
  checkIn,
  checkOut,
  autoReleaseReservations,
  listSchedule,
  overrideConflict,
  type ReserveRoomCommand,
  type CheckAvailabilityQuery,
  type CheckInCommand,
  type CheckOutCommand,
  type ListScheduleQuery,
  type OverrideConflictCommand,
} from '@dykstra/application';
import {
  PrepRoomRepositoryPort,
  type PrepRoomRepositoryService,
} from '@dykstra/application';
import { PrepRoomAdapter } from '../adapters/prep-room/prep-room-adapter';

/**
 * Input Schemas for Validation
 */
const PrepRoomIdSchema = z.string().min(1, 'Prep room ID required');
const ReservationIdSchema = z.string().min(1, 'Reservation ID required');
const EmbalmerId = z.string().min(1, 'Embalmer ID required');
const CaseId = z.string().min(1, 'Case ID required');
const FamilyId = z.string().min(1, 'Family ID required');
const DurationMinutes = z.number().int().min(120).max(480).describe('Duration in minutes, must be 2-8 hours');
const ManagerId = z.string().min(1, 'Manager ID required');

/**
 * Reserve Room Procedure
 */
const reserveRoomInput = z.object({
  prepRoomId: PrepRoomIdSchema,
  embalmerId: EmbalmerId,
  caseId: CaseId,
  familyId: FamilyId,
  reservedFrom: z.date().describe('Scheduled start time'),
  durationMinutes: DurationMinutes,
  priority: z.enum(['normal', 'urgent']),
  notes: z.string().optional().describe('Optional prep notes'),
});

export type ReserveRoomInput = z.infer<typeof reserveRoomInput>;

const reserveRoomProcedure = publicProcedure
  .input(reserveRoomInput)
  .mutation(async ({ input }) => {
    const command: ReserveRoomCommand = {
      prepRoomId: createPrepRoomId(input.prepRoomId),
      embalmerId: input.embalmerId,
      caseId: input.caseId,
      familyId: input.familyId,
      reservedFrom: input.reservedFrom,
      durationMinutes: input.durationMinutes,
      priority: input.priority,
      notes: input.notes,
    };

    return await Effect.runPromise(
      reserveRoom(command).pipe(
        Effect.provide(Context.make(PrepRoomRepositoryPort, PrepRoomAdapter))
      )
    );
  });

/**
 * Check Availability Procedure
 */
const checkAvailabilityInput = z.object({
  funeralHomeId: z.string().min(1),
  reservedFrom: z.date(),
  durationMinutes: DurationMinutes,
  isUrgent: z.boolean().default(false),
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilityInput>;

const checkAvailabilityProcedure = publicProcedure
  .input(checkAvailabilityInput)
  .query(async ({ input }) => {
    const reservedTo = new Date(
      input.reservedFrom.getTime() + input.durationMinutes * 60 * 1000
    );

    const query: CheckAvailabilityQuery = {
      funeralHomeId: input.funeralHomeId,
      reservedFrom: input.reservedFrom,
      reservedTo,
      durationMinutes: input.durationMinutes,
      isUrgent: input.isUrgent,
    };

    return await Effect.runPromise(
      checkAvailability(query).pipe(
        Effect.provide(Context.make(PrepRoomRepositoryPort, PrepRoomAdapter))
      )
    );
  });

/**
 * Check-In Procedure
 */
const checkInInput = z.object({
  reservationId: ReservationIdSchema,
  embalmerId: EmbalmerId,
});

export type CheckInInput = z.infer<typeof checkInInput>;

const checkInProcedure = publicProcedure
  .input(checkInInput)
  .mutation(async ({ input }) => {
    const command: CheckInCommand = {
      reservationId: createReservationId(input.reservationId),
      embalmerId: input.embalmerId,
    };

    return await Effect.runPromise(
      checkIn(command).pipe(
        Effect.provide(Context.make(PrepRoomRepositoryPort, PrepRoomAdapter))
      )
    );
  });

/**
 * Check-Out Procedure
 */
const checkOutInput = z.object({
  reservationId: ReservationIdSchema,
  embalmerId: EmbalmerId,
});

export type CheckOutInput = z.infer<typeof checkOutInput>;

const checkOutProcedure = publicProcedure
  .input(checkOutInput)
  .mutation(async ({ input }) => {
    const command: CheckOutCommand = {
      reservationId: createReservationId(input.reservationId),
      embalmerId: input.embalmerId,
    };

    return await Effect.runPromise(
      checkOut(command).pipe(
        Effect.provide(Context.make(PrepRoomRepositoryPort, PrepRoomAdapter))
      )
    );
  });

/**
 * Auto-Release Procedure
 * Background job that processes timed-out reservations
 */
const autoReleaseProcedure = publicProcedure.mutation(async () => {
  return await Effect.runPromise(
    autoReleaseReservations().pipe(
      Effect.provide(Context.make(PrepRoomRepositoryPort, PrepRoomAdapter))
    )
  );
});

/**
 * List Schedule Procedure
 */
const listScheduleInput = z.object({
  funeralHomeId: z.string().min(1),
  dateFrom: z.date().describe('Schedule start date'),
  dateTo: z.date().describe('Schedule end date'),
});

export type ListScheduleInput = z.infer<typeof listScheduleInput>;

const listScheduleProcedure = publicProcedure
  .input(listScheduleInput)
  .query(async ({ input }) => {
    const query: ListScheduleQuery = {
      funeralHomeId: input.funeralHomeId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    };

    return await Effect.runPromise(
      listSchedule(query).pipe(
        Effect.provide(Context.make(PrepRoomRepositoryPort, PrepRoomAdapter))
      )
    );
  });

/**
 * Override Conflict Procedure
 * Manager override for urgent cases
 */
const overrideConflictInput = z.object({
  prepRoomId: PrepRoomIdSchema,
  embalmerId: EmbalmerId,
  caseId: CaseId,
  familyId: FamilyId,
  reservedFrom: z.date(),
  durationMinutes: DurationMinutes,
  priority: z.enum(['normal', 'urgent']),
  managerApprovalId: ManagerId,
  overrideReason: z.string().min(5).describe('Reason for override'),
});

export type OverrideConflictInput = z.infer<typeof overrideConflictInput>;

const overrideConflictProcedure = publicProcedure
  .input(overrideConflictInput)
  .mutation(async ({ input }) => {
    const command: OverrideConflictCommand = {
      prepRoomId: createPrepRoomId(input.prepRoomId),
      embalmerId: input.embalmerId,
      caseId: input.caseId,
      familyId: input.familyId,
      reservedFrom: input.reservedFrom,
      durationMinutes: input.durationMinutes,
      priority: input.priority,
      managerApprovalId: input.managerApprovalId,
      overrideReason: input.overrideReason,
    };

    return await Effect.runPromise(
      overrideConflict(command).pipe(
        Effect.provide(Context.make(PrepRoomRepositoryPort, PrepRoomAdapter))
      )
    );
  });

/**
 * Prep Room Router
 * Combines all 7 procedures into a single router
 */
export const prepRoomRouter = router({
  /**
   * Reserve a preparation room
   * @param prepRoomId - ID of the prep room to reserve
   * @param embalmerId - Staff ID of the embalmer
   * @param caseId - Case ID for the decedent
   * @param familyId - Family ID for tracking
   * @param reservedFrom - Scheduled start time
   * @param durationMinutes - Reservation duration (120-480 minutes)
   * @param priority - 'normal' or 'urgent'
   * @param notes - Optional preparation notes
   * @returns Reservation details or conflict information with alternatives
   */
  reserve: reserveRoomProcedure,

  /**
   * Check availability for a time window
   * @param funeralHomeId - Funeral home identifier
   * @param reservedFrom - Desired start time
   * @param durationMinutes - Desired duration
   * @param isUrgent - Whether this is an urgent check
   * @returns Available slots with urgent slots prioritized (within 2 hours)
   */
  checkAvailability: checkAvailabilityProcedure,

  /**
   * Check in to a confirmed reservation
   * @param reservationId - ID of the reservation
   * @param embalmerId - Staff ID of the embalmer (must match reservation)
   * @returns Updated reservation in 'in_progress' status with check-in time
   */
  checkIn: checkInProcedure,

  /**
   * Check out from a reservation (complete preparation)
   * @param reservationId - ID of the reservation
   * @param embalmerId - Staff ID of the embalmer (must match reservation)
   * @returns Completed reservation with actual duration calculated
   */
  checkOut: checkOutProcedure,

  /**
   * Trigger auto-release background job
   * Releases all reservations exceeding 30-minute timeout without check-in
   * Typically called every 5 minutes by scheduler
   * @returns Count of released reservations
   */
  autoRelease: autoReleaseProcedure,

  /**
   * Get prep room schedule and utilization
   * @param funeralHomeId - Funeral home identifier
   * @param dateFrom - Schedule start date
   * @param dateTo - Schedule end date
   * @returns Utilization metrics for all prep rooms in date range
   */
  listSchedule: listScheduleProcedure,

  /**
   * Manager override for conflicted reservations
   * Allows urgent cases to bypass normal conflict checks with approval
   * @param prepRoomId - Target prep room
   * @param embalmerId - Embalmer ID
   * @param caseId - Case ID
   * @param familyId - Family ID
   * @param reservedFrom - Desired start time
   * @param durationMinutes - Duration
   * @param priority - 'urgent' for override cases
   * @param managerApprovalId - Manager staff ID approving override
   * @param overrideReason - Business reason for override (e.g., "Death call", "Family request")
   * @returns Reservation created with override flag in notes
   */
  overrideConflict: overrideConflictProcedure,
});

/**
 * Export type helper for client-side usage
 * Allows type-safe RPC calls from frontend
 */
export type PrepRoomRouter = typeof prepRoomRouter;
