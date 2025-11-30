/**
 * Reconciliations Port
 * 
 * Handles GL account reconciliation workflow including line item clearing,
 * completion, and ability to undo completed reconciliations.
 */

import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NotFoundError, NetworkError };

export interface GoReconciliation {
  readonly id: string;
  readonly accountId: string;
  readonly accountNumber: string;
  readonly accountName: string;
  readonly period: Date;
  readonly status: 'open' | 'in_progress' | 'completed';
  readonly glBalance: number;
  readonly statementBalance: number;
  readonly difference: number;
  readonly reconciledBy?: string;
  readonly reconciledAt?: Date;
}

export interface GoReconciliationItem {
  readonly id: string;
  readonly reconciliationId: string;
  readonly transactionDate: Date;
  readonly description: string;
  readonly amount: number;
  readonly cleared: boolean;
  readonly clearedDate?: Date;
}

export interface GoReconciliationsPortService {
  readonly createReconciliation: (accountId: string, period: Date, statementBalance: number) => 
    Effect.Effect<GoReconciliation, NetworkError>;
  readonly getReconciliation: (id: string) => 
    Effect.Effect<GoReconciliation, NotFoundError | NetworkError>;
  readonly listReconciliations: (filters?: { accountId?: string; status?: GoReconciliation['status'] }) => 
    Effect.Effect<readonly GoReconciliation[], NetworkError>;
  readonly markItemCleared: (reconciliationId: string, itemId: string) => 
    Effect.Effect<void, NetworkError>;
  readonly completeReconciliation: (id: string, reconciledBy: string) => 
    Effect.Effect<void, NetworkError>;
  readonly getReconciliationItems: (reconciliationId: string) => 
    Effect.Effect<readonly GoReconciliationItem[], NetworkError>;
  readonly undoReconciliation: (id: string, reason: string) => 
    Effect.Effect<void, NetworkError>;
}

export const GoReconciliationsPort = Context.GenericTag<GoReconciliationsPortService>(
  '@dykstra/GoReconciliationsPort'
);
