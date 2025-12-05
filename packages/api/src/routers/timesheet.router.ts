import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Timesheet router
 * Time entry and approval workflow (Use Cases 3.1-3.4)
 */
export const timesheetRouter = router({
  /**
   * List time entries for current user or all users
   */
  list: staffProcedure
    .input(
      z.object({
        employeeId: z.string().optional(),
        weekOf: z.string().optional(), // ISO date string for week start
        status: z.enum(['all', 'draft', 'submitted', 'approved']).default('all'),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock timesheet data - will be replaced with Go backend integration
      const allEntries = [
        {
          id: '1',
          employeeId: ctx.user.id,
          employeeName: 'Current User',
          date: '2024-12-02',
          hours: 8,
          projectCode: 'CASE-001',
          caseId: 'C-2024-123',
          notes: 'Funeral service coordination',
          status: 'approved' as const,
        },
        {
          id: '2',
          employeeId: ctx.user.id,
          employeeName: 'Current User',
          date: '2024-12-03',
          hours: 7.5,
          projectCode: 'CASE-002',
          caseId: 'C-2024-124',
          notes: 'Family consultation',
          status: 'approved' as const,
        },
        {
          id: '3',
          employeeId: ctx.user.id,
          employeeName: 'Current User',
          date: '2024-12-04',
          hours: 8,
          projectCode: 'CASE-003',
          caseId: 'C-2024-125',
          notes: 'Service preparation',
          status: 'submitted' as const,
        },
      ];

      let filtered = allEntries;

      // Filter by employee
      if (input.employeeId) {
        filtered = filtered.filter((e) => e.employeeId === input.employeeId);
      }

      // Filter by status
      if (input.status !== 'all') {
        filtered = filtered.filter((e) => e.status === input.status);
      }

      return filtered;
    }),

  /**
   * Create a new time entry
   */
  create: staffProcedure
    .input(
      z.object({
        date: z.string(),
        hours: z.number().min(0).max(24),
        projectCode: z.string().optional(),
        caseId: z.string().optional(),
        notes: z.string().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `entry-${Date.now()}`,
        employeeId: ctx.user.id,
        employeeName: ctx.user.name || 'Unknown',
        ...input,
        status: 'draft' as const,
        createdAt: new Date(),
      };
    }),

  /**
   * Submit timesheet for approval
   */
  submit: staffProcedure
    .input(
      z.object({
        entryIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        entryIds: input.entryIds,
        status: 'submitted' as const,
        submittedAt: new Date(),
      };
    }),

  /**
   * Approve timesheet entries (manager/supervisor only)
   */
  approve: staffProcedure
    .input(
      z.object({
        entryIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        entryIds: input.entryIds,
        status: 'approved' as const,
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
      };
    }),

  /**
   * Reject timesheet entries (manager/supervisor only)
   */
  reject: staffProcedure
    .input(
      z.object({
        entryIds: z.array(z.string()),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        entryIds: input.entryIds,
        status: 'draft' as const,
        rejectedBy: ctx.user.id,
        rejectedAt: new Date(),
        reason: input.reason,
      };
    }),

  /**
   * Get summary for current week
   */
  getWeekSummary: staffProcedure
    .input(
      z.object({
        employeeId: z.string().optional(),
        weekOf: z.string(), // ISO date string for week start
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      const employeeId = input.employeeId || ctx.user.id;
      return {
        employeeId,
        weekOf: input.weekOf,
        totalHours: 23.5,
        approvedHours: 15.5,
        pendingHours: 8,
        overtimeHours: 0,
        regularHours: 23.5,
      };
    }),

  /**
   * Request PTO
   */
  requestPTO: staffProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        hours: z.number(),
        ptoType: z.enum(['vacation', 'sick', 'personal']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `pto-${Date.now()}`,
        employeeId: ctx.user.id,
        ...input,
        status: 'pending' as const,
        requestedAt: new Date(),
      };
    }),
});
