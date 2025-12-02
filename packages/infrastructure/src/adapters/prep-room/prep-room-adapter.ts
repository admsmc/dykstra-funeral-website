/**
 * Preparation Room Repository Adapter
 * Implements PrepRoomRepositoryPort using Prisma ORM
 * 
 * Handles:
 * - Prep room CRUD operations with SCD2 temporal tracking
 * - Reservation management with full status lifecycle
 * - Conflict detection for overlapping reservations
 * - Availability slot finding with capacity constraints
 * - Room utilization metrics
 */

import { Effect } from 'effect';
import { prisma } from '../../database/prisma-client';
import type {
  PrepRoom,
  PrepRoomId,
  PrepRoomReservation,
  ReservationId,
  ReservationStatus,
} from '@dykstra/domain';
import {
  createPrepRoomId,
  createReservationId,
} from '@dykstra/domain';
import {
  type PrepRoomRepositoryService,
  PrepRoomRepositoryError,
  PrepRoomNotFoundError,
  ReservationNotFoundError,
  type AvailableSlot,
  type ConflictInfo,
  type FindAvailableSlotsQuery,
  type RoomUtilization,
} from '@dykstra/application';

/**
 * Map Prisma PrepRoom to domain PrepRoom
 */
function mapPrismaToPrepRoom(
  prismaPrepRoom: any
): PrepRoom {
  return {
    id: createPrepRoomId(prismaPrepRoom.id),
    businessKey: prismaPrepRoom.businessKey,
    funeralHomeId: prismaPrepRoom.funeralHomeId,
    roomNumber: prismaPrepRoom.roomNumber,
    capacity: prismaPrepRoom.capacity as 1 | 2,
    status: prismaPrepRoom.status.toLowerCase() as any,
    createdAt: prismaPrepRoom.createdAt,
    updatedAt: prismaPrepRoom.updatedAt,
    createdBy: prismaPrepRoom.createdBy,
  };
}

/**
 * Map Prisma PrepRoomReservation to domain PrepRoomReservation
 */
function mapPrismaToReservation(
  prismaReservation: any
): PrepRoomReservation {
  return {
    id: createReservationId(prismaReservation.id),
    prepRoomId: createPrepRoomId(prismaReservation.prepRoomId),
    embalmerId: prismaReservation.embalmerId,
    caseId: prismaReservation.caseId,
    familyId: prismaReservation.familyId,
    status: prismaReservation.status.toLowerCase() as ReservationStatus,
    priority: prismaReservation.priority.toLowerCase() as 'normal' | 'urgent',
    reservedFrom: prismaReservation.reservedFrom,
    reservedTo: prismaReservation.reservedTo,
    checkedInAt: prismaReservation.checkedInAt ?? undefined,
    checkedOutAt: prismaReservation.checkedOutAt ?? undefined,
    actualDuration: prismaReservation.actualDuration ?? undefined,
    notes: prismaReservation.notes ?? undefined,
    createdAt: prismaReservation.createdAt,
    updatedAt: prismaReservation.updatedAt,
    createdBy: prismaReservation.createdBy,
  };
}

/**
 * Prep Room Repository Implementation
 */
export const PrepRoomAdapter: PrepRoomRepositoryService = {
  /**
   * Get prep room by ID (current version only)
   */
  getPrepRoomById: (id: PrepRoomId) =>
    Effect.tryPromise({
      try: async () => {
        const room = await prisma.prepRoom.findFirst({
          where: {
            id: id as string,
            isCurrent: true,
          },
        });

        if (!room) {
          throw new PrepRoomNotFoundError(`Prep room ${id} not found`, id);
        }

        return mapPrismaToPrepRoom(room);
      },
      catch: (error) => {
        if (error instanceof PrepRoomNotFoundError) return error;
        return new PrepRoomRepositoryError(
          `Failed to get prep room: ${error instanceof Error ? error.message : String(error)}`
        );
      },
    }),

  /**
   * Find all prep rooms for a funeral home
   */
  getPrepRoomsByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const rooms = await prisma.prepRoom.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
          },
          orderBy: { roomNumber: 'asc' },
        });

        return rooms.map(mapPrismaToPrepRoom);
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to get prep rooms: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Find available prep rooms (status = 'available')
   */
  getAvailablePrepRooms: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const rooms = await prisma.prepRoom.findMany({
          where: {
            funeralHomeId,
            status: 'AVAILABLE',
            isCurrent: true,
          },
          orderBy: { roomNumber: 'asc' },
        });

        return rooms.map(mapPrismaToPrepRoom);
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to get available prep rooms: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Create new reservation
   */
  createReservation: (reservation: PrepRoomReservation) =>
    Effect.tryPromise({
      try: async () => {
        const created = await prisma.prepRoomReservation.create({
          data: {
            id: reservation.id,
            businessKey: `${reservation.prepRoomId}:${reservation.caseId}:${reservation.embalmerId}`,
            prepRoomId: reservation.prepRoomId as string,
            embalmerId: reservation.embalmerId,
            caseId: reservation.caseId,
            familyId: reservation.familyId,
            status: reservation.status.toUpperCase() as any,
            priority: reservation.priority.toUpperCase() as any,
            reservedFrom: reservation.reservedFrom,
            reservedTo: reservation.reservedTo,
            notes: reservation.notes,
            createdBy: reservation.createdBy,
          },
        });

        return mapPrismaToReservation(created);
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to create reservation: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Get reservation by ID (current version only)
   */
  getReservationById: (id: ReservationId) =>
    Effect.tryPromise({
      try: async () => {
        const reservation = await prisma.prepRoomReservation.findFirst({
          where: {
            id: id as string,
            isCurrent: true,
          },
        });

        if (!reservation) {
          throw new ReservationNotFoundError(
            `Reservation ${id} not found`,
            id
          );
        }

        return mapPrismaToReservation(reservation);
      },
      catch: (error) => {
        if (error instanceof ReservationNotFoundError) return error;
        return new PrepRoomRepositoryError(
          `Failed to get reservation: ${error instanceof Error ? error.message : String(error)}`
        );
      },
    }),

  /**
   * Find all reservations for a case
   */
  getReservationsByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const reservations = await prisma.prepRoomReservation.findMany({
          where: {
            caseId,
            isCurrent: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return reservations.map(mapPrismaToReservation);
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to get reservations for case: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Find reservations for a prep room in time range
   */
  getReservationsByRoomAndDateRange: (
    prepRoomId: PrepRoomId,
    startDate: Date,
    endDate: Date
  ) =>
    Effect.tryPromise({
      try: async () => {
        const reservations = await prisma.prepRoomReservation.findMany({
          where: {
            prepRoomId: prepRoomId as string,
            isCurrent: true,
            reservedFrom: {
              gte: startDate,
            },
            reservedTo: {
              lte: endDate,
            },
          },
          orderBy: { reservedFrom: 'asc' },
        });

        return reservations.map(mapPrismaToReservation);
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to get reservations by room and date: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Find reservations by status
   */
  findReservationsByStatus: (status: ReservationStatus) =>
    Effect.tryPromise({
      try: async () => {
        const reservations = await prisma.prepRoomReservation.findMany({
          where: {
            status: status.toUpperCase() as any,
            isCurrent: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        return reservations.map(mapPrismaToReservation);
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to find reservations by status: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Find available slots for a time window
   * Considers capacity, existing reservations, and buffers
   */
  findAvailableSlots: (query: FindAvailableSlotsQuery) =>
    Effect.tryPromise({
      try: async () => {
        // Find all available prep rooms for funeral home
        const rooms = await prisma.prepRoom.findMany({
          where: {
            funeralHomeId: query.funeralHomeId,
            capacity: {
              gte: query.capacity,
            },
            status: 'AVAILABLE',
            isCurrent: true,
          },
          take: 10,
        });

        // For each room, check for available slots
        const slots: AvailableSlot[] = [];

        for (const room of rooms) {
          // Find all conflicting reservations (including buffers)
          const conflicting = await prisma.prepRoomReservation.findMany({
            where: {
              prepRoomId: room.id,
              isCurrent: true,
              reservedFrom: {
                lt: new Date(query.reservedTo.getTime() + 30 * 60 * 1000), // Add buffer
              },
              reservedTo: {
                gt: new Date(query.reservedFrom.getTime() - 30 * 60 * 1000), // Add buffer
              },
            },
          });

          // If no conflicts, this is an available slot
          if (conflicting.length === 0) {
            slots.push({
              startTime: query.reservedFrom,
              endTime: query.reservedTo,
              durationMinutes: query.durationMinutes,
              prepRoomId: createPrepRoomId(room.id),
            });
          }
        }

        // Sort by start time and return up to limit
        return slots
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
          .slice(0, query.limit);
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to find available slots: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Check for conflicts in proposed time slot
   */
  checkConflicts: (
    prepRoomId: PrepRoomId,
    startTime: Date,
    endTime: Date,
    _priority: 'normal' | 'urgent'
  ) =>
    Effect.tryPromise({
      try: async () => {
        // Find conflicting reservations (non-terminal states)
        const conflicts = await prisma.prepRoomReservation.findMany({
          where: {
            prepRoomId: prepRoomId as string,
            isCurrent: true,
            status: {
              notIn: ['COMPLETED', 'AUTO_RELEASED', 'CANCELLED'],
            },
            AND: [
              {
                reservedFrom: {
                  lt: new Date(endTime.getTime() + 30 * 60 * 1000), // Include 30-min buffer
                },
              },
              {
                reservedTo: {
                  gt: new Date(startTime.getTime() - 30 * 60 * 1000), // Include 30-min buffer
                },
              },
            ],
          },
        });

        // Map to ConflictInfo
        const conflictInfos: ConflictInfo[] = conflicts.map((conflict) => ({
          type: 'overlap' as const,
          reservationId: conflict.id,
          message: `Reservation ${conflict.id} overlaps with proposed time`,
        }));

        return conflictInfos;
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to check conflicts: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Update reservation (creates new version in SCD2 pattern)
   */
  updateReservation: (reservation: PrepRoomReservation) =>
    Effect.tryPromise({
      try: async () => {
        // Mark previous version as obsolete
        await prisma.prepRoomReservation.updateMany({
          where: {
            businessKey: `${reservation.prepRoomId}:${reservation.caseId}:${reservation.embalmerId}`,
            isCurrent: true,
          },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        // Create new version
        const updated = await prisma.prepRoomReservation.create({
          data: {
            id: `${reservation.id}-v${Date.now()}`,
            businessKey: `${reservation.prepRoomId}:${reservation.caseId}:${reservation.embalmerId}`,
            prepRoomId: reservation.prepRoomId as string,
            embalmerId: reservation.embalmerId,
            caseId: reservation.caseId,
            familyId: reservation.familyId,
            status: reservation.status.toUpperCase() as any,
            priority: reservation.priority.toUpperCase() as any,
            reservedFrom: reservation.reservedFrom,
            reservedTo: reservation.reservedTo,
            checkedInAt: reservation.checkedInAt,
            checkedOutAt: reservation.checkedOutAt,
            actualDuration: reservation.actualDuration,
            notes: reservation.notes,
            createdBy: reservation.createdBy,
            isCurrent: true,
          },
        });

        return mapPrismaToReservation(updated);
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to update reservation: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),

  /**
   * Get utilization metrics for prep rooms
   */
  getRoomUtilization: (
    funeralHomeId: string,
    startDate: Date,
    endDate: Date
  ) =>
    Effect.tryPromise({
      try: async () => {
        // Get all prep rooms
        const rooms = await prisma.prepRoom.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
          },
        });

        // For each room, calculate utilization
        const utilization: RoomUtilization[] = [];

        for (const room of rooms) {
          const reservations = await prisma.prepRoomReservation.findMany({
            where: {
              prepRoomId: room.id,
              isCurrent: true,
              reservedFrom: {
                gte: startDate,
              },
              reservedTo: {
                lte: endDate,
              },
            },
          });

          utilization.push({
            prepRoomId: createPrepRoomId(room.id),
            roomNumber: room.roomNumber,
            maxCapacity: room.capacity,
            reservedCount: reservations.length,
            availableSlots: 10 - reservations.length,
          });
        }

        return utilization;
      },
      catch: (error) =>
        new PrepRoomRepositoryError(
          `Failed to get room utilization: ${error instanceof Error ? error.message : String(error)}`
        ),
    }),
};
