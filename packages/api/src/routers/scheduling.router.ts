import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Scheduling router
 * Staff shift management and on-call rotation (Use Cases 7.1-7.4)
 */
export const schedulingRouter = router({
  /**
   * List shifts for a given date range
   */
  list: staffProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        employeeId: z.string().optional(),
        shiftType: z.enum(['all', 'regular', 'on-call', 'service']).default('all'),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock schedule data - will be replaced with Go backend integration
      const allShifts = [
        {
          id: '1',
          staffName: 'Sarah M.',
          staffId: 'emp-001',
          role: 'Director',
          dayOfWeek: 'Monday',
          date: '2024-12-02',
          startTime: '8:00 AM',
          endTime: '5:00 PM',
          type: 'regular' as const,
          location: 'Main Chapel',
        },
        {
          id: '2',
          staffName: 'John D.',
          staffId: 'emp-002',
          role: 'Embalmer',
          dayOfWeek: 'Monday',
          date: '2024-12-02',
          startTime: '9:00 AM',
          endTime: '6:00 PM',
          type: 'regular' as const,
          location: 'Main Chapel',
        },
        {
          id: '3',
          staffName: 'Sarah M.',
          staffId: 'emp-001',
          role: 'Director',
          dayOfWeek: 'Monday',
          date: '2024-12-02',
          startTime: '5:00 PM',
          endTime: '8:00 AM',
          type: 'on-call' as const,
          location: null,
        },
        {
          id: '4',
          staffName: 'Sarah M.',
          staffId: 'emp-001',
          role: 'Director',
          dayOfWeek: 'Tuesday',
          date: '2024-12-03',
          startTime: '8:00 AM',
          endTime: '5:00 PM',
          type: 'regular' as const,
          location: 'Main Chapel',
        },
        {
          id: '5',
          staffName: 'Michael R.',
          staffId: 'emp-003',
          role: 'Staff',
          dayOfWeek: 'Tuesday',
          date: '2024-12-03',
          startTime: '10:00 AM',
          endTime: '2:00 PM',
          type: 'service' as const,
          location: 'Chapel A',
        },
        {
          id: '6',
          staffName: 'John D.',
          staffId: 'emp-002',
          role: 'Embalmer',
          dayOfWeek: 'Wednesday',
          date: '2024-12-04',
          startTime: '7:00 AM',
          endTime: '4:00 PM',
          type: 'regular' as const,
          location: 'Main Chapel',
        },
        {
          id: '7',
          staffName: 'Sarah M.',
          staffId: 'emp-001',
          role: 'Director',
          dayOfWeek: 'Friday',
          date: '2024-12-06',
          startTime: '8:00 AM',
          endTime: '5:00 PM',
          type: 'regular' as const,
          location: 'Main Chapel',
        },
        {
          id: '8',
          staffName: 'Michael R.',
          staffId: 'emp-003',
          role: 'Staff',
          dayOfWeek: 'Saturday',
          date: '2024-12-07',
          startTime: '9:00 AM',
          endTime: '1:00 PM',
          type: 'service' as const,
          location: 'Graveside',
        },
      ];

      let filtered = allShifts;

      // Filter by employee
      if (input.employeeId) {
        filtered = filtered.filter((s) => s.staffId === input.employeeId);
      }

      // Filter by shift type
      if (input.shiftType !== 'all') {
        filtered = filtered.filter((s) => s.type === input.shiftType);
      }

      return filtered;
    }),

  /**
   * Create a new shift
   */
  createShift: staffProcedure
    .input(
      z.object({
        staffId: z.string(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        type: z.enum(['regular', 'on-call', 'service']),
        location: z.string().optional(),
        notes: z.string().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `shift-${Date.now()}`,
        ...input,
        staffName: 'Staff Member',
        role: 'Director',
        createdAt: new Date(),
      };
    }),

  /**
   * Update an existing shift
   */
  updateShift: staffProcedure
    .input(
      z.object({
        shiftId: z.string(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        type: z.enum(['regular', 'on-call', 'service']).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        shiftId: input.shiftId,
        updatedAt: new Date(),
      };
    }),

  /**
   * Delete a shift
   */
  deleteShift: staffProcedure
    .input(
      z.object({
        shiftId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        shiftId: input.shiftId,
        deletedAt: new Date(),
      };
    }),

  /**
   * Request shift swap (Use Case 7.4)
   */
  requestShiftSwap: staffProcedure
    .input(
      z.object({
        fromShiftId: z.string(),
        toEmployeeId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `swap-${Date.now()}`,
        fromShiftId: input.fromShiftId,
        fromEmployeeId: ctx.user.id,
        toEmployeeId: input.toEmployeeId,
        reason: input.reason,
        status: 'pending' as const,
        requestedAt: new Date(),
      };
    }),

  /**
   * Approve/reject shift swap (manager only)
   */
  reviewShiftSwap: staffProcedure
    .input(
      z.object({
        swapId: z.string(),
        approved: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        swapId: input.swapId,
        status: input.approved ? ('approved' as const) : ('rejected' as const),
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
        notes: input.notes,
      };
    }),

  /**
   * Get on-call rotation schedule (Use Case 7.1)
   */
  getOnCallRotation: staffProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input: _input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        schedule: [
          {
            date: '2024-12-02',
            staffId: 'emp-001',
            staffName: 'Sarah M.',
            startTime: '5:00 PM',
            endTime: '8:00 AM',
          },
          {
            date: '2024-12-03',
            staffId: 'emp-002',
            staffName: 'John D.',
            startTime: '5:00 PM',
            endTime: '8:00 AM',
          },
        ],
      };
    }),
});
