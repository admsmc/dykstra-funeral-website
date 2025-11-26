import { Effect } from 'effect';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';

/**
 * Payment statistics query
 */
export interface GetPaymentStatsQuery {
  readonly funeralHomeId: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}

/**
 * Payment statistics result
 */
export interface PaymentStatsResult {
  readonly totalCollected: number;
  readonly totalPending: number;
  readonly totalFailed: number;
  readonly totalRefunded: number;
  readonly paymentCount: {
    succeeded: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  readonly byMethod: Record<string, number>;
}

/**
 * Get payment statistics use case
 * Aggregates payment data for dashboard KPIs
 * 
 * Clean Architecture:
 * - Read-only operation
 * - Depends only on PaymentRepository port
 * - Returns Effect for composition
 */
export const getPaymentStats = (
  query: GetPaymentStatsQuery
): Effect.Effect<PaymentStatsResult, PersistenceError, PaymentRepository> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    
    // Get all payments (in production, this would use a read model or aggregation query)
    // For MVP, we'll fetch and aggregate in memory
    const allPayments = yield* _(paymentRepo.findByCase('all'));
    
    // Filter by date range if provided
    const payments = allPayments.filter((p) => {
      if (query.dateFrom && p.createdAt < query.dateFrom) return false;
      if (query.dateTo && p.createdAt > query.dateTo) return false;
      return true;
    });
    
    // Calculate totals
    let totalCollected = 0;
    let totalPending = 0;
    let totalFailed = 0;
    let totalRefunded = 0;
    
    const paymentCount = {
      succeeded: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
    };
    
    const byMethod: Record<string, number> = {};
    
    for (const payment of payments) {
      const amount = payment.amount.amount;
      
      switch (payment.status) {
        case 'succeeded':
          totalCollected += amount;
          paymentCount.succeeded++;
          break;
        case 'pending':
        case 'processing':
          totalPending += amount;
          paymentCount.pending++;
          break;
        case 'failed':
          totalFailed += amount;
          paymentCount.failed++;
          break;
        case 'refunded':
          totalRefunded += amount;
          paymentCount.refunded++;
          break;
      }
      
      // Aggregate by method
      byMethod[payment.method] = (byMethod[payment.method] ?? 0) + amount;
    }
    
    return {
      totalCollected,
      totalPending,
      totalFailed,
      totalRefunded,
      paymentCount,
      byMethod,
    };
  });
