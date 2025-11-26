import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import {
  getDashboardStats,
  getAnalytics,
  getTaskDashboard,
} from '@dykstra/application';

/**
 * Staff router
 * Provides staff-only endpoints for dashboard, analytics, and management
 */
export const staffRouter = router({
  /**
   * Get dashboard overview with KPIs
   */
  getDashboardStats: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const result = await runEffect(
        getDashboardStats({ funeralHomeId })
      );

      return {
        kpis: result.kpis,
        recentActivity: {
          cases: result.recentActivity.cases,
          payments: result.recentActivity.payments.map((p) => ({
            id: p.id,
            businessKey: p.businessKey,
            amount: p.amount,
            method: p.method,
            status: p.status,
            createdAt: p.createdAt,
            case: {
              decedentName: p.caseDecedentName,
            },
          })),
        },
      };
    }),

  /**
   * Get analytics data
   */
  getAnalytics: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      const dateFrom = input.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
      const dateTo = input.dateTo ?? new Date();

      return await runEffect(
        getAnalytics({
          funeralHomeId,
          dateFrom,
          dateTo,
        })
      );
    }),

  /**
   * Get task dashboard
   */
  getTaskDashboard: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
          assignedToMe: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      const assignedToMe = input?.assignedToMe ?? false;

      return await runEffect(
        getTaskDashboard({
          funeralHomeId,
          assignedToUserId: assignedToMe ? ctx.user.id : undefined,
        })
      );
    }),
});
