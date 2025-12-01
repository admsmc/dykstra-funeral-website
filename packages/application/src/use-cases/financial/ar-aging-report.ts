import { Effect } from 'effect';
import { GoFinancialPort, type GoFinancialPortService, NetworkError } from '../../ports/go-financial-port';

/**
 * Use Case 1.7: AR Aging Report Generation
 * 
 * **Workflow**:
 * 1. Get AR aging report from Go backend (0-30, 31-60, 61-90, 90+ buckets)
 * 2. Calculate collection priority scores
 * 3. Generate actionable report with follow-up recommendations
 * 
 * **Business Rules**:
 * - Aging buckets: Current (0-30), 31-60, 61-90, 90+ days
 * - Priority scoring: higher priority for older balances and larger amounts
 * - Generates recommendations for collection actions
 * 
 * **Error Cases**:
 * - NetworkError: Go backend communication failure
 * 
 * @see docs/Implement 35 Critical Use Cases with Verified Go Backend Ports.md - Phase 4, Use Case 1.7
 */

/**
 * Ar Aging Report
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface ARAgingReportCommand {
  readonly asOfDate: Date;
}

export interface ARAgingReportResult {
  readonly asOfDate: Date;
  readonly totalOutstanding: number;
  readonly overdueCount: number;
  readonly customers: ReadonlyArray<{
    readonly customerId: string;
    readonly customerName: string;
    readonly current: number;
    readonly days1to30: number;
    readonly days31to60: number;
    readonly days61to90: number;
    readonly days90Plus: number;
    readonly totalOutstanding: number;
    readonly priorityScore: number;
    readonly recommendedAction: string;
  }>;
  readonly agingBuckets: {
    readonly current: { invoiceCount: number; totalAmount: number };
    readonly days1to30: { invoiceCount: number; totalAmount: number };
    readonly days31to60: { invoiceCount: number; totalAmount: number };
    readonly days61to90: { invoiceCount: number; totalAmount: number };
    readonly days90Plus: { invoiceCount: number; totalAmount: number };
  };
}

export const generateARAgingReport = (
  command: ARAgingReportCommand
) =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // Get AR aging report from Go backend
    const agingReport = yield* financialPort.getARAgingReport(command.asOfDate);

    // Calculate priority scores and recommendations for each customer
    const customersWithPriority = agingReport.customers.map(customer => {
      // Priority scoring algorithm:
      // - Days 90+: 10 points per $1000
      // - Days 61-90: 5 points per $1000
      // - Days 31-60: 2 points per $1000
      // - Days 1-30: 1 point per $1000
      const priorityScore = 
        (customer.days90Plus / 1000) * 10 +
        (customer.days61to90 / 1000) * 5 +
        (customer.days31to60 / 1000) * 2 +
        (customer.days1to30 / 1000) * 1;

      // Determine recommended action based on priority score and aging
      let recommendedAction: string;
      if (customer.days90Plus > 0) {
        if (customer.days90Plus > 5000) {
          recommendedAction = 'URGENT: Send to collections agency';
        } else {
          recommendedAction = 'Call customer immediately - payment plan required';
        }
      } else if (customer.days61to90 > 0) {
        recommendedAction = 'Call customer - final notice before collections';
      } else if (customer.days31to60 > 0) {
        recommendedAction = 'Send past due notice via email and mail';
      } else if (customer.days1to30 > 0) {
        recommendedAction = 'Send courtesy reminder email';
      } else {
        recommendedAction = 'Monitor - payment not yet due';
      }

      return {
        customerId: customer.customerId,
        customerName: customer.customerName,
        current: customer.current,
        days1to30: customer.days1to30,
        days31to60: customer.days31to60,
        days61to90: customer.days61to90,
        days90Plus: customer.days90Plus,
        totalOutstanding: customer.totalOutstanding,
        priorityScore: Math.round(priorityScore),
        recommendedAction,
      };
    });

    // Sort customers by priority score (highest first)
    const sortedCustomers = [...customersWithPriority].sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    // Count overdue customers (any balance in 1-30, 31-60, 61-90, or 90+ buckets)
    const overdueCount = agingReport.customers.filter(
      c => c.days1to30 > 0 || c.days31to60 > 0 || c.days61to90 > 0 || c.days90Plus > 0
    ).length;

    // Map aging buckets from Go backend format to our result format
    const agingBuckets = {
      current: agingReport.buckets.find(b => b.category === 'current') || { invoiceCount: 0, totalAmount: 0 },
      days1to30: agingReport.buckets.find(b => b.category === '1-30') || { invoiceCount: 0, totalAmount: 0 },
      days31to60: agingReport.buckets.find(b => b.category === '31-60') || { invoiceCount: 0, totalAmount: 0 },
      days61to90: agingReport.buckets.find(b => b.category === '61-90') || { invoiceCount: 0, totalAmount: 0 },
      days90Plus: agingReport.buckets.find(b => b.category === '90+') || { invoiceCount: 0, totalAmount: 0 },
    };

    return {
      asOfDate: agingReport.asOfDate,
      totalOutstanding: agingReport.totalOutstanding,
      overdueCount,
      customers: sortedCustomers,
      agingBuckets,
    };
  }).pipe(
    Effect.withSpan('generateARAgingReport', {
      attributes: {
        asOfDate: command.asOfDate.toISOString(),
      },
    })
  );

/**
 * Type helper for the Effect return
 */
export type ARAgingReportEffect = Effect.Effect<
  ARAgingReportResult,
  NetworkError,
  GoFinancialPortService
>;
