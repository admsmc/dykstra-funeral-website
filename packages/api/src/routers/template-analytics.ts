import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '@dykstra/infrastructure';

/**
 * Template Analytics tRPC Router
 * 
 * Provides metrics and insights on template usage:
 * - Most used templates
 * - Generation counts by category
 * - Average generation time
 * - Error rates and trends
 */

export const templateAnalyticsRouter = router({
  /**
   * Get Overall Statistics
   * Total generations, success rate, avg duration
   */
  getOverallStats: publicProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const where: any = {};
        
        if (input.startDate || input.endDate) {
          where.createdAt = {};
          if (input.startDate) where.createdAt.gte = input.startDate;
          if (input.endDate) where.createdAt.lte = input.endDate;
        }
        
        if (input.funeralHomeId) {
          where.funeralHomeId = input.funeralHomeId;
        }

        const [total, successful, failed, avgDuration, avgSize] = await Promise.all([
        prisma.templateGenerationLog.count({ where }),
        prisma.templateGenerationLog.count({ where: { ...where, status: 'success' } }),
        prisma.templateGenerationLog.count({ where: { ...where, status: 'error' } }),
        prisma.templateGenerationLog.aggregate({
          where: { ...where, status: 'success' },
          _avg: { durationMs: true },
        }),
        prisma.templateGenerationLog.aggregate({
          where: { ...where, status: 'success', pdfSizeBytes: { not: null } },
          _avg: { pdfSizeBytes: true },
        }),
      ]);

        return {
          totalGenerations: total,
          successfulGenerations: successful,
          failedGenerations: failed,
          successRate: total > 0 ? (successful / total) * 100 : 0,
          errorRate: total > 0 ? (failed / total) * 100 : 0,
          avgDurationMs: avgDuration._avg.durationMs || 0,
          avgPdfSizeBytes: avgSize._avg.pdfSizeBytes || 0,
        };
      } catch (_error) {
        // Return empty stats if no data or error
        return {
          totalGenerations: 0,
          successfulGenerations: 0,
          failedGenerations: 0,
          successRate: 0,
          errorRate: 0,
          avgDurationMs: 0,
          avgPdfSizeBytes: 0,
        };
      }
    }),

  /**
   * Get Most Used Templates
   * Top templates by generation count
   */
  getMostUsedTemplates: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
      const where: any = {};
      
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) where.createdAt.gte = input.startDate;
        if (input.endDate) where.createdAt.lte = input.endDate;
      }

      const results = await prisma.templateGenerationLog.groupBy({
        by: ['templateBusinessKey', 'templateName', 'templateCategory'],
        where,
        _count: { id: true },
        _avg: { durationMs: true },
        orderBy: { _count: { id: 'desc' } },
        take: input.limit,
      });

        return results.map((r) => ({
          businessKey: r.templateBusinessKey,
          name: r.templateName,
          category: r.templateCategory,
          usageCount: r._count.id,
          avgDurationMs: r._avg.durationMs || 0,
        }));
      } catch (_error) {
        return [];
      }
    }),

  /**
   * Get Usage by Category
   * Generation counts grouped by template category
   */
  getUsageByCategory: publicProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
      const where: any = {};
      
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) where.createdAt.gte = input.startDate;
        if (input.endDate) where.createdAt.lte = input.endDate;
      }

      const results = await prisma.templateGenerationLog.groupBy({
        by: ['templateCategory'],
        where,
        _count: { id: true },
        _avg: { durationMs: true },
      });

        return results.map((r) => ({
          category: r.templateCategory,
          count: r._count.id,
          avgDurationMs: r._avg.durationMs || 0,
        }));
      } catch (_error) {
        return [];
      }
    }),

  /**
   * Get Generation Trend
   * Time series data for usage over time
   */
  getGenerationTrend: publicProcedure
    .input(
      z.object({
        days: z.number().default(30),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const where: any = {
        createdAt: { gte: startDate },
      };
      
      if (input.category) {
        where.templateCategory = input.category;
      }

      // Group by date
      const results = await prisma.$queryRaw<
        Array<{ date: Date; count: bigint; successful: bigint; failed: bigint }>
      >`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::bigint as count,
          COUNT(CASE WHEN status = 'success' THEN 1 END)::bigint as successful,
          COUNT(CASE WHEN status = 'error' THEN 1 END)::bigint as failed
        FROM template_generation_log
        WHERE created_at >= ${startDate}
          ${input.category ? Prisma.sql`AND template_category = ${input.category}` : Prisma.empty}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `;

      return results.map((r) => ({
        date: r.date,
        total: Number(r.count),
        successful: Number(r.successful),
        failed: Number(r.failed),
      }));
    }),

  /**
   * Get Recent Errors
   * Latest generation failures with error details
   */
  getRecentErrors: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const errors = await prisma.templateGenerationLog.findMany({
        where: { status: 'error' },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: {
          id: true,
          templateName: true,
          templateCategory: true,
          errorMessage: true,
          createdAt: true,
          durationMs: true,
        },
      });

      return errors;
    }),

  /**
   * Get Performance Metrics
   * P50, P95, P99 generation times
   */
  getPerformanceMetrics: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = { status: 'success' };
      
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) where.createdAt.gte = input.startDate;
        if (input.endDate) where.createdAt.lte = input.endDate;
      }
      
      if (input.category) {
        where.templateCategory = input.category;
      }

      // Get all durations for percentile calculation
      const durations = await prisma.templateGenerationLog.findMany({
        where,
        select: { durationMs: true },
        orderBy: { durationMs: 'asc' },
      });

      const sorted = durations.map((d) => d.durationMs).sort((a, b) => a - b);
      const count = sorted.length;

      if (count === 0) {
        return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, count: 0 };
      }

      const percentile = (p: number) => {
        const index = Math.ceil((p / 100) * count) - 1;
        return sorted[Math.max(0, index)];
      };

      return {
        p50: percentile(50),
        p95: percentile(95),
        p99: percentile(99),
        min: sorted[0],
        max: sorted[count - 1],
        count,
      };
    }),
});

// Import Prisma for raw queries
import { Prisma } from '@prisma/client';
