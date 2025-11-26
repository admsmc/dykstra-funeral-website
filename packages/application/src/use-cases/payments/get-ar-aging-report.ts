import { Effect } from 'effect';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';
import { CaseRepository } from '../../ports/case-repository';
import { ContractRepository } from '../../ports/contract-repository';

/**
 * AR aging report query
 */
export interface GetArAgingReportQuery {
  readonly funeralHomeId: string;
  readonly asOfDate?: Date;
}

/**
 * Aging bucket for AR report
 */
export interface AgingBucket {
  readonly label: string;
  readonly minDays: number;
  readonly maxDays: number | null;
  readonly totalAmount: number;
  readonly accountCount: number;
}

/**
 * AR aging report result
 */
export interface ArAgingReportResult {
  readonly asOfDate: Date;
  readonly buckets: readonly AgingBucket[];
  readonly totalOutstanding: number;
  readonly totalAccounts: number;
}

/**
 * Get AR aging report use case
 * Shows accounts receivable aging by time buckets
 * 
 * Aging buckets:
 * - Current (0-30 days)
 * - 31-60 days
 * - 61-90 days
 * - 90+ days
 * 
 * Clean Architecture:
 * - Read-only operation
 * - Depends on repository ports
 * - Returns Effect for composition
 * 
 * Note: This is a simplified implementation
 * Production would need:
 * - Dedicated read model for performance
 * - Account-level tracking (not just payments)
 * - Integration with contract balance calculations
 */
export const getArAgingReport = (
  query: GetArAgingReportQuery
): Effect.Effect<
  ArAgingReportResult,
  PersistenceError,
  PaymentRepository | CaseRepository | ContractRepository
> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    // Note: caseRepo and contractRepo will be needed in future iteration
    // For MVP, calculating from payment data only
    
    const asOfDate = query.asOfDate ?? new Date();
    
    // Get all cases with contracts
    // In production, this would be a dedicated AR read model
    // For MVP, we'll do basic calculation
    
    // Initialize buckets
    let buckets: AgingBucket[] = [
      { label: 'Current (0-30 days)', minDays: 0, maxDays: 30, totalAmount: 0, accountCount: 0 },
      { label: '31-60 days', minDays: 31, maxDays: 60, totalAmount: 0, accountCount: 0 },
      { label: '61-90 days', minDays: 61, maxDays: 90, totalAmount: 0, accountCount: 0 },
      { label: '90+ days', minDays: 91, maxDays: null, totalAmount: 0, accountCount: 0 },
    ];
    
    // Get all payments
    const allPayments = yield* _(paymentRepo.findByCase('all'));
    
    // Group payments by case and calculate outstanding balances
    const caseBalances = new Map<string, {caseId: string, balance: number, oldestDate: Date}>();
    
    for (const payment of allPayments) {
      if (payment.status === 'succeeded' || payment.status === 'refunded') {
        const existing = caseBalances.get(payment.caseId) ?? {
          caseId: payment.caseId,
          balance: 0,
          oldestDate: payment.createdAt,
        };
        
        // Subtract payments (refunded are already marked as such)
        const amount = payment.status === 'refunded' ? 0 : payment.amount.amount;
        existing.balance -= amount;
        
        // Track oldest payment date
        if (payment.createdAt < existing.oldestDate) {
          existing.oldestDate = payment.createdAt;
        }
        
        caseBalances.set(payment.caseId, existing);
      }
    }
    
    // Calculate aging for each case with outstanding balance
    let totalOutstanding = 0;
    let totalAccounts = 0;
    
    for (const [, data] of caseBalances) {
      // If balance is positive, there's outstanding AR
      if (data.balance > 0) {
        const daysPast = Math.floor(
          (asOfDate.getTime() - data.oldestDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Find appropriate bucket
        const bucketIndex = buckets.findIndex((b) => 
          daysPast >= b.minDays && (b.maxDays === null || daysPast <= b.maxDays)
        );
        
        if (bucketIndex >= 0 && buckets[bucketIndex]) {
          const bucket = buckets[bucketIndex];
          buckets[bucketIndex] = {
            label: bucket!.label,
            minDays: bucket!.minDays,
            maxDays: bucket!.maxDays,
            totalAmount: bucket!.totalAmount + data.balance,
            accountCount: bucket!.accountCount + 1,
          };
        }
        
        totalOutstanding += data.balance;
        totalAccounts++;
      }
    }
    
    return {
      asOfDate,
      buckets,
      totalOutstanding,
      totalAccounts,
    };
  });
