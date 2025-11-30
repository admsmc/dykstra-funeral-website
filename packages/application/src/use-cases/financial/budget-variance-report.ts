import { Effect } from 'effect';
import { GoBudgetPort, type GoBudgetPortService, NetworkError } from '../../ports/go-budget-port';

/**
 * Use Case 1.11: Budget vs. Actual Variance Report
 * 
 * **Workflow**:
 * 1. Get budget variance report from Go backend for specified period
 * 2. Calculate variance percentages and categorize (favorable/unfavorable)
 * 3. Identify accounts with significant variances (>10%)
 * 4. Generate management report with recommendations
 * 
 * **Business Rules**:
 * - Variance = Actual - Budget
 * - Revenue accounts: Positive variance is favorable (more revenue than budgeted)
 * - Expense accounts: Negative variance is favorable (less expense than budgeted)
 * - Significant variance threshold: > 10% deviation from budget
 * 
 * **Error Cases**:
 * - NetworkError: Go backend communication failure
 * 
 * @see docs/Implement 35 Critical Use Cases with Verified Go Backend Ports.md - Phase 4, Use Case 1.11
 */

export interface BudgetVarianceReportCommand {
  readonly period: Date; // Usually month-end date (e.g., 2025-01-31)
}

export interface BudgetVarianceReportResult {
  readonly period: Date;
  readonly totalBudget: number;
  readonly totalActual: number;
  readonly totalVariance: number;
  readonly totalVariancePercent: number;
  readonly accounts: ReadonlyArray<{
    readonly accountNumber: string;
    readonly accountName: string;
    readonly budgetAmount: number;
    readonly actualAmount: number;
    readonly variance: number;
    readonly variancePercent: number;
    readonly category: 'revenue' | 'expense' | 'other';
    readonly isFavorable: boolean;
    readonly isSignificant: boolean;
    readonly recommendation: string;
  }>;
  readonly summary: {
    readonly significantVarianceCount: number;
    readonly favorableVarianceCount: number;
    readonly unfavorableVarianceCount: number;
    readonly largestFavorableVariance: { accountName: string; amount: number };
    readonly largestUnfavorableVariance: { accountName: string; amount: number };
  };
}

export const generateBudgetVarianceReport = (
  command: BudgetVarianceReportCommand
) =>
  Effect.gen(function* () {
    const budgetPort = yield* GoBudgetPort;

    // Get budget variance report from Go backend
    const varianceReport = yield* budgetPort.getBudgetVarianceReport(command.period);

    // Process each account variance with categorization and recommendations
    const processedAccounts = varianceReport.accounts.map(account => {
      // Determine account category from account number (first digit)
      const firstDigit = account.accountNumber.charAt(0);
      let category: 'revenue' | 'expense' | 'other';
      if (firstDigit === '4') {
        category = 'revenue';
      } else if (firstDigit === '5') {
        category = 'expense';
      } else {
        category = 'other';
      }

      // Determine if variance is favorable
      // Revenue: Positive variance is favorable (more revenue)
      // Expense: Negative variance is favorable (less expense)
      let isFavorable: boolean;
      if (category === 'revenue') {
        isFavorable = account.variance > 0;
      } else if (category === 'expense') {
        isFavorable = account.variance < 0;
      } else {
        // For balance sheet accounts, positive variance is generally favorable
        isFavorable = account.variance >= 0;
      }

      // Check if variance is significant (>10%)
      const isSignificant = Math.abs(account.variancePercent) > 10;

      // Generate recommendations based on variance
      let recommendation: string;
      if (!isSignificant) {
        recommendation = 'Variance within acceptable range - no action required';
      } else if (isFavorable) {
        if (category === 'revenue') {
          recommendation = 'Positive variance - investigate revenue drivers for replication';
        } else if (category === 'expense') {
          recommendation = 'Under budget - review for cost savings opportunities';
        } else {
          recommendation = 'Monitor trend - favorable variance';
        }
      } else {
        // Unfavorable variance
        if (category === 'revenue') {
          recommendation = 'Revenue shortfall - implement corrective action plan immediately';
        } else if (category === 'expense') {
          recommendation = 'Over budget - require expense justification and cost control measures';
        } else {
          recommendation = 'Monitor trend - unfavorable variance';
        }
      }

      return {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        budgetAmount: account.budgetAmount,
        actualAmount: account.actualAmount,
        variance: account.variance,
        variancePercent: account.variancePercent,
        category,
        isFavorable,
        isSignificant,
        recommendation,
      };
    });

    // Calculate totals
    const totalBudget = processedAccounts.reduce((sum, acc) => sum + acc.budgetAmount, 0);
    const totalActual = processedAccounts.reduce((sum, acc) => sum + acc.actualAmount, 0);
    const totalVariance = totalActual - totalBudget;
    const totalVariancePercent = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;

    // Generate summary statistics
    const significantVarianceCount = processedAccounts.filter(a => a.isSignificant).length;
    const favorableVarianceCount = processedAccounts.filter(a => a.isFavorable && a.isSignificant).length;
    const unfavorableVarianceCount = processedAccounts.filter(a => !a.isFavorable && a.isSignificant).length;

    // Find largest variances
    const favorableVariances = processedAccounts.filter(a => a.isFavorable).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    const unfavorableVariances = processedAccounts.filter(a => !a.isFavorable).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    const largestFavorableVariance = favorableVariances.length > 0 && favorableVariances[0]
      ? { accountName: favorableVariances[0].accountName, amount: favorableVariances[0].variance }
      : { accountName: 'None', amount: 0 };

    const largestUnfavorableVariance = unfavorableVariances.length > 0 && unfavorableVariances[0]
      ? { accountName: unfavorableVariances[0].accountName, amount: unfavorableVariances[0].variance }
      : { accountName: 'None', amount: 0 };

    return {
      period: varianceReport.period,
      totalBudget,
      totalActual,
      totalVariance,
      totalVariancePercent: Math.round(totalVariancePercent * 100) / 100,
      accounts: processedAccounts,
      summary: {
        significantVarianceCount,
        favorableVarianceCount,
        unfavorableVarianceCount,
        largestFavorableVariance,
        largestUnfavorableVariance,
      },
    };
  }).pipe(
    Effect.withSpan('generateBudgetVarianceReport', {
      attributes: {
        period: command.period.toISOString(),
      },
    })
  );

/**
 * Type helper for the Effect return
 */
export type BudgetVarianceReportEffect = Effect.Effect<
  BudgetVarianceReportResult,
  NetworkError,
  GoBudgetPortService
>;
