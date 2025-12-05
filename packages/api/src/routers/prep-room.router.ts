import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Prep Room router
 * Preparation room scheduling and management
 */
export const prepRoomRouter = router({
  /**
   * List prep room reservations
   */
  list: staffProcedure
    .input(
      z.object({
        date: z.string().optional(),
        room: z.string().optional(),
        status: z.enum(['all', 'scheduled', 'in-progress', 'completed', 'conflict']).default('all'),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock reservation data - will be replaced with Go backend integration
      const allReservations = [
        {
          id: 'R-001',
          room: 'Prep Room 1',
          caseId: 'C-2024-123',
          decedentName: 'Robert Johnson',
          embalmer: 'John D.',
          embalmerId: 'emp-002',
          startTime: '2024-12-05 08:00',
          endTime: '2024-12-05 11:00',
          status: 'in-progress' as const,
          duration: 3,
        },
        {
          id: 'R-002',
          room: 'Prep Room 1',
          caseId: 'C-2024-124',
          decedentName: 'Elizabeth Smith',
          embalmer: 'John D.',
          embalmerId: 'emp-002',
          startTime: '2024-12-05 13:00',
          endTime: '2024-12-05 16:00',
          status: 'scheduled' as const,
          duration: 3,
        },
        {
          id: 'R-003',
          room: 'Prep Room 2',
          caseId: 'C-2024-125',
          decedentName: 'James Williams',
          embalmer: 'Michael R.',
          embalmerId: 'emp-003',
          startTime: '2024-12-05 09:00',
          endTime: '2024-12-05 12:00',
          status: 'scheduled' as const,
          duration: 3,
        },
        {
          id: 'R-004',
          room: 'Prep Room 2',
          caseId: 'C-2024-126',
          decedentName: 'Patricia Brown',
          embalmer: 'Sarah M.',
          embalmerId: 'emp-001',
          startTime: '2024-12-05 14:00',
          endTime: '2024-12-05 16:30',
          status: 'scheduled' as const,
          duration: 2.5,
        },
        {
          id: 'R-005',
          room: 'Prep Room 1',
          caseId: 'C-2024-127',
          decedentName: 'David Davis',
          embalmer: 'John D.',
          embalmerId: 'emp-002',
          startTime: '2024-12-05 16:00',
          endTime: '2024-12-05 18:00',
          status: 'conflict' as const,
          duration: 2,
        },
      ];

      let filtered = allReservations;

      // Filter by date
      if (input.date) {
        filtered = filtered.filter((r) => r.startTime.startsWith(input.date!));
      }

      // Filter by room
      if (input.room) {
        filtered = filtered.filter((r) => r.room === input.room);
      }

      // Filter by status
      if (input.status !== 'all') {
        filtered = filtered.filter((r) => r.status === input.status);
      }

      return filtered;
    }),

  /**
   * Reserve prep room
   */
  reserve: staffProcedure
    .input(
      z.object({
        room: z.string(),
        caseId: z.string(),
        decedentName: z.string(),
        embalmerId: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        duration: z.number(),
        notes: z.string().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `R-${Date.now()}`,
        ...input,
        embalmer: 'Staff Member',
        status: 'scheduled' as const,
        createdAt: new Date(),
      };
    }),

  /**
   * Check in to prep room (start work)
   */
  checkIn: staffProcedure
    .input(
      z.object({
        reservationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        reservationId: input.reservationId,
        status: 'in-progress' as const,
        checkedInBy: ctx.user.id,
        checkedInAt: new Date(),
      };
    }),

  /**
   * Check out of prep room (complete work)
   */
  checkOut: staffProcedure
    .input(
      z.object({
        reservationId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        reservationId: input.reservationId,
        status: 'completed' as const,
        checkedOutBy: ctx.user.id,
        checkedOutAt: new Date(),
        notes: input.notes,
      };
    }),

  /**
   * Get room availability for conflict detection
   */
  getAvailability: staffProcedure
    .input(
      z.object({
        room: z.string(),
        date: z.string(),
      })
    )
    .query(async ({ input: _input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        room: 'Prep Room 1',
        date: '2024-12-05',
        slots: [
          { startTime: '08:00', endTime: '11:00', available: false },
          { startTime: '11:00', endTime: '13:00', available: true },
          { startTime: '13:00', endTime: '16:00', available: false },
          { startTime: '16:00', endTime: '18:00', available: true },
        ],
      };
    }),

  /**
   * Cancel reservation
   */
  cancel: staffProcedure
    .input(
      z.object({
        reservationId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        reservationId: input.reservationId,
        status: 'cancelled' as const,
        cancelledBy: ctx.user.id,
        cancelledAt: new Date(),
        reason: input.reason,
      };
    }),
});
