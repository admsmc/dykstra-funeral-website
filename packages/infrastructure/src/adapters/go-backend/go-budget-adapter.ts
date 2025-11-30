import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoBudgetPortService,
  GoBudget,
  GoBudgetVariance,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Budget Adapter
 * 
 * Implements GoBudgetPortService for budget creation,
 * approval, and variance reporting.
 */

export const GoBudgetAdapter: GoBudgetPortService = {
  createBudget: (fiscalYear: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/budgets', {
          body: {
            fiscal_year: fiscalYear,
          }
        });
        return mapToGoBudget(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create budget', error as Error)
    }),
  
  getBudget: (fiscalYear: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/budgets', {
          params: { query: { fiscal_year: fiscalYear } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Budget not found', entityType: 'Budget', entityId: String(fiscalYear) });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoBudget(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get budget', error as Error);
      }
    }),
  
  updateBudgetAccount: (budgetId: string, accountId: string, periods: readonly any[]) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PATCH('/v1/budgets/{id}/accounts/{accountId}', {
          params: { path: { id: budgetId, accountId } },
          body: { periods }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to update budget account', error as Error)
    }),
  
  approveBudget: (budgetId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/budgets/{id}/approve', {
          params: { path: { id: budgetId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve budget', error as Error)
    }),
  
  getBudgetVarianceReport: (period: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/budgets/variance', {
          params: { query: { period: period.toISOString() } }
        });
        const data = unwrapResponse(res);
        return {
          period: new Date(data.period),
          accounts: (data.accounts || []).map((v: any): GoBudgetVariance => ({
            accountNumber: v.account_number,
            accountName: v.account_name,
            budgetAmount: v.budget_amount,
            actualAmount: v.actual_amount,
            variance: v.variance,
            variancePercent: v.variance_percent,
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to get budget variance report', error as Error)
    }),
};

function mapToGoBudget(data: any): GoBudget {
  return {
    id: data.id,
    fiscalYear: data.fiscal_year,
    version: data.version,
    status: data.status,
    accounts: (data.accounts || []).map((acc: any) => ({
      accountId: acc.account_id,
      accountNumber: acc.account_number,
      accountName: acc.account_name,
      periods: (acc.periods || []).map((p: any) => ({
        period: p.period,
        amount: p.amount,
      })),
      totalBudget: acc.total_budget,
    })),
    totalBudget: data.total_budget,
  };
}
