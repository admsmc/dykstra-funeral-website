/**
 * Budget Port
 * 
 * Handles budget creation, approval, and variance reporting
 * for financial planning and control.
 */

import { type Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NotFoundError, NetworkError };

export interface GoBudget {
  readonly id: string;
  readonly fiscalYear: number;
  readonly version: number;
  readonly status: 'draft' | 'approved' | 'active';
  readonly accounts: readonly GoBudgetAccount[];
  readonly totalBudget: number;
}

export interface GoBudgetAccount {
  readonly accountId: string;
  readonly accountNumber: string;
  readonly accountName: string;
  readonly periods: readonly GoBudgetPeriod[];
  readonly totalBudget: number;
}

export interface GoBudgetPeriod {
  readonly period: string;
  readonly amount: number;
}

export interface GoBudgetVarianceReport {
  readonly period: Date;
  readonly accounts: readonly GoBudgetVariance[];
}

export interface GoBudgetVariance {
  readonly accountNumber: string;
  readonly accountName: string;
  readonly budgetAmount: number;
  readonly actualAmount: number;
  readonly variance: number;
  readonly variancePercent: number;
}

export interface GoBudgetPortService {
  readonly createBudget: (fiscalYear: number) => 
    Effect.Effect<GoBudget, NetworkError>;
  readonly getBudget: (fiscalYear: number) => 
    Effect.Effect<GoBudget, NotFoundError | NetworkError>;
  readonly updateBudgetAccount: (budgetId: string, accountId: string, periods: readonly GoBudgetPeriod[]) => 
    Effect.Effect<void, NetworkError>;
  readonly approveBudget: (budgetId: string) => 
    Effect.Effect<void, NetworkError>;
  readonly getBudgetVarianceReport: (period: Date) => 
    Effect.Effect<GoBudgetVarianceReport, NetworkError>;
}

export const GoBudgetPort = Context.GenericTag<GoBudgetPortService>(
  '@dykstra/GoBudgetPort'
);
