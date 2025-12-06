import { Effect, type Context } from 'effect';
import { GoBudgetPort, type GoBudgetPeriod } from '../../ports/go-budget-port';
import { NetworkError } from '../../ports/go-contract-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Update Budget Account
 * 
 * Updates budget amounts for a specific account across periods.
 * Validates amounts are non-negative.
 */
export const updateBudgetAccount = (params: {
  budgetId: string;
  accountId: string;
  periods: readonly GoBudgetPeriod[];
}): Effect.Effect<{
  budgetId: string;
  accountId: string;
  periodsUpdated: number;
  totalAmount: number;
}, ValidationError | NetworkError, Context.Tag.Identifier<typeof GoBudgetPort>> =>
  Effect.gen(function* () {
    // Validation
    if (params.periods.length === 0) {
      return yield* Effect.fail(
        new ValidationError({ message: 'At least one period must be provided' })
      );
    }
    
    // Validate all amounts are non-negative
    const hasNegative = params.periods.some(p => p.amount < 0);
    if (hasNegative) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Budget amounts must be non-negative' })
      );
    }
    
    const goBudget = yield* GoBudgetPort;
    
    // Delegate to Go backend which:
    // 1. Validates budget exists and is editable (draft/approved status)
    // 2. Updates period amounts
    // 3. Recalculates account total
    // 4. Emits BudgetUpdated event
    yield* goBudget.updateBudgetAccount(
      params.budgetId,
      params.accountId,
      params.periods
    );
    
    const totalAmount = params.periods.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      budgetId: params.budgetId,
      accountId: params.accountId,
      periodsUpdated: params.periods.length,
      totalAmount,
    };
  });
