import { Effect, type Context } from 'effect';
import { GoBudgetPort, type GoBudgetVarianceReport } from '../../ports/go-budget-port';
import { NetworkError } from '../../ports/go-contract-port';

/**
 * Get Budget Variance Report
 * 
 * Compares actual financial performance to budgeted amounts.
 * Calculates dollar and percentage variances for analysis.
 */
export const getBudgetVariance = (params: {
  period: Date;
  funeralHomeId: string;
}): Effect.Effect<GoBudgetVarianceReport, NetworkError, Context.Tag.Identifier<typeof GoBudgetPort>> =>
  Effect.gen(function* () {
    const goBudget = yield* GoBudgetPort;
    
    // Delegate to Go backend which:
    // 1. Fetches budget for period
    // 2. Fetches actual GL balances
    // 3. Calculates variances ($ and %)
    const report = yield* goBudget.getBudgetVarianceReport(params.period);
    
    return report;
  });
