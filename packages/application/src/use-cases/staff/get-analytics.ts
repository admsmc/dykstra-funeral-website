import { Effect } from 'effect';
import { CaseRepository, type PersistenceError } from '../../ports/case-repository';
import { PaymentRepository } from '../../ports/payment-repository';

/**
 * Get Analytics
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface GetAnalyticsQuery {
  funeralHomeId: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface GetAnalyticsResult {
  period: {
    from: Date;
    to: Date;
  };
  caseMetrics: {
    byType: Array<{
      type: string;
      count: number;
    }>;
    byStatus: Array<{
      status: string;
      count: number;
    }>;
  };
  paymentMetrics: {
    byMethod: Array<{
      method: string;
      count: number;
      total: string;
    }>;
    totalRevenue: string;
  };
}

/**
 * Get analytics data for a given period
 * Aggregates cases and payments by various dimensions
 */
export const getAnalytics = (
  query: GetAnalyticsQuery
): Effect.Effect<
  GetAnalyticsResult,
  PersistenceError,
  CaseRepository | PaymentRepository
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;
    const paymentRepo = yield* PaymentRepository;

    // Get all current cases for the funeral home
    const allCases = yield* caseRepo.findByFuneralHome(query.funeralHomeId);

    // Filter cases by date range
    const casesInPeriod = allCases.filter(
      (c) => c.createdAt >= query.dateFrom && c.createdAt <= query.dateTo
    );

    // Group cases by type
    const casesByType = casesInPeriod.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group cases by status
    const casesByStatus = casesInPeriod.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get all payments for the funeral home's cases
    const allPaymentsEffects = allCases.map((c) => paymentRepo.findByCase(c.id));
    const allPaymentsArrays = yield* Effect.all(allPaymentsEffects);
    const allPayments = allPaymentsArrays.flat();

    // Filter payments by date range and success status
    const paymentsInPeriod = allPayments.filter(
      (p) =>
        p.status === 'succeeded' &&
        p.createdAt >= query.dateFrom &&
        p.createdAt <= query.dateTo
    );

    // Group payments by method
    const paymentsByMethod = paymentsInPeriod.reduce((acc, p) => {
      if (!acc[p.method]) {
        acc[p.method] = { count: 0, total: 0 };
      }
      acc[p.method]!.count++;
      acc[p.method]!.total += Number(p.amount);
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Calculate total revenue
    const totalRevenue = paymentsInPeriod.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    return {
      period: {
        from: query.dateFrom,
        to: query.dateTo,
      },
      caseMetrics: {
        byType: Object.entries(casesByType).map(([type, count]) => ({
          type,
          count,
        })),
        byStatus: Object.entries(casesByStatus).map(([status, count]) => ({
          status,
          count,
        })),
      },
      paymentMetrics: {
        byMethod: Object.entries(paymentsByMethod).map(([method, data]) => ({
          method,
          count: data.count,
          total: data.total.toString(),
        })),
        totalRevenue: totalRevenue.toString(),
      },
    };
  });
