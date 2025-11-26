import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

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
      const { prisma } = ctx;

      // Get counts for KPIs
      const [
        activeCasesCount,
        inquiriesCount,
        upcomingServicesCount,
        pendingTasksCount,
        recentCases,
        recentPayments,
      ] = await Promise.all([
        // Active cases
        prisma.case.count({
          where: {
            funeralHomeId,
            isCurrent: true,
            status: 'ACTIVE',
          },
        }),
        // Inquiries
        prisma.case.count({
          where: {
            funeralHomeId,
            isCurrent: true,
            status: 'INQUIRY',
          },
        }),
        // Upcoming services (next 7 days)
        prisma.case.count({
          where: {
            funeralHomeId,
            isCurrent: true,
            status: 'ACTIVE',
            serviceDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        // Pending tasks
        prisma.task.count({
          where: {
            case: {
              funeralHomeId,
              isCurrent: true,
            },
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        }),
        // Recent cases (last 10)
        prisma.case.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          select: {
            id: true,
            businessKey: true,
            decedentName: true,
            type: true,
            status: true,
            serviceDate: true,
            createdAt: true,
          },
        }),
        // Recent payments (last 10)
        prisma.payment.findMany({
          where: {
            case: {
              funeralHomeId,
              isCurrent: true,
            },
            isCurrent: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          select: {
            id: true,
            businessKey: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
            case: {
              select: {
                decedentName: true,
              },
            },
          },
        }),
      ]);

      return {
        kpis: {
          activeCases: activeCasesCount,
          inquiries: inquiriesCount,
          upcomingServices: upcomingServicesCount,
          pendingTasks: pendingTasksCount,
        },
        recentActivity: {
          cases: recentCases,
          payments: recentPayments,
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

      const { prisma } = ctx;

      // Get metrics for the period
      const [casesByType, casesByStatus, paymentsByMethod, revenueTotal] = await Promise.all([
        // Cases by type
        prisma.case.groupBy({
          by: ['type'],
          where: {
            funeralHomeId,
            isCurrent: true,
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          _count: true,
        }),
        // Cases by status
        prisma.case.groupBy({
          by: ['status'],
          where: {
            funeralHomeId,
            isCurrent: true,
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          _count: true,
        }),
        // Payments by method
        prisma.payment.groupBy({
          by: ['method'],
          where: {
            case: {
              funeralHomeId,
            },
            isCurrent: true,
            status: 'SUCCEEDED',
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          _count: true,
          _sum: {
            amount: true,
          },
        }),
        // Total revenue
        prisma.payment.aggregate({
          where: {
            case: {
              funeralHomeId,
            },
            isCurrent: true,
            status: 'SUCCEEDED',
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        period: {
          from: dateFrom,
          to: dateTo,
        },
        caseMetrics: {
          byType: casesByType.map((row: any) => ({
            type: row.type,
            count: row._count,
          })),
          byStatus: casesByStatus.map((row: any) => ({
            status: row.status,
            count: row._count,
          })),
        },
        paymentMetrics: {
          byMethod: paymentsByMethod.map((row: any) => ({
            method: row.method,
            count: row._count,
            total: row._sum.amount?.toString() ?? '0',
          })),
          totalRevenue: revenueTotal._sum.amount?.toString() ?? '0',
        },
      };
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

      const { prisma } = ctx;

      const where = {
        case: {
          funeralHomeId,
          isCurrent: true,
        },
        ...(assignedToMe ? { assignedTo: ctx.user.id } : {}),
      };

      const [pendingTasks, inProgressTasks, overdueTasks] = await Promise.all([
        prisma.task.findMany({
          where: {
            ...where,
            status: 'PENDING',
          },
          orderBy: {
            dueDate: 'asc',
          },
          include: {
            case: {
              select: {
                decedentName: true,
              },
            },
            assignee: {
              select: {
                name: true,
              },
            },
          },
        }),
        prisma.task.findMany({
          where: {
            ...where,
            status: 'IN_PROGRESS',
          },
          orderBy: {
            dueDate: 'asc',
          },
          include: {
            case: {
              select: {
                decedentName: true,
              },
            },
            assignee: {
              select: {
                name: true,
              },
            },
          },
        }),
        prisma.task.findMany({
          where: {
            ...where,
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
            dueDate: {
              lt: new Date(),
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
          include: {
            case: {
              select: {
                decedentName: true,
              },
            },
            assignee: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]);

      return {
        pending: pendingTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
      };
    }),
});
