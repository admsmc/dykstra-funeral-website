import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoReconciliationsPortService,
  GoReconciliation,
  GoReconciliationItem,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Reconciliations Adapter
 * 
 * Implements GoReconciliationsPortService for GL account
 * reconciliation workflow management.
 */

export const GoReconciliationsAdapter: GoReconciliationsPortService = {
  createReconciliation: (accountId: string, period: Date, statementBalance: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/reconciliations', {
          body: {
            account_id: accountId,
            period: period.toISOString(),
            statement_balance: statementBalance,
          }
        });
        return mapToGoReconciliation(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create reconciliation', error as Error)
    }),
  
  getReconciliation: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/reconciliations/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Reconciliation not found', entityType: 'Reconciliation', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoReconciliation(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get reconciliation', error as Error);
      }
    }),
  
  listReconciliations: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/reconciliations', {
          params: { query: filters as any }
        });
        const data = unwrapResponse(res);
        return (data.reconciliations || []).map(mapToGoReconciliation);
      },
      catch: (error) => new NetworkError('Failed to list reconciliations', error as Error)
    }),
  
  markItemCleared: (reconciliationId: string, itemId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/reconciliations/{reconId}/items/{id}/clear', {
          params: { path: { reconId: reconciliationId, id: itemId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to mark item cleared', error as Error)
    }),
  
  completeReconciliation: (reconciliationId: string, reconciledBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/reconciliations/{id}/complete', {
          params: { path: { id: reconciliationId } },
          body: {
            reconciled_by: reconciledBy,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to complete reconciliation', error as Error)
    }),
  
  getReconciliationItems: (reconciliationId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/reconciliations/{id}/items', {
          params: { path: { id: reconciliationId } }
        });
        const data = unwrapResponse(res);
        return (data.items || []).map(mapToGoReconciliationItem);
      },
      catch: (error) => new NetworkError('Failed to get reconciliation items', error as Error)
    }),
  
  undoReconciliation: (id: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/reconciliations/{id}/undo', {
          params: { path: { id } },
          body: { reason }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to undo reconciliation', error as Error)
    }),
};

function mapToGoReconciliation(data: any): GoReconciliation {
  return {
    id: data.id,
    accountId: data.account_id,
    accountNumber: data.account_number,
    accountName: data.account_name,
    period: new Date(data.period),
    status: data.status,
    glBalance: data.gl_balance,
    statementBalance: data.statement_balance,
    difference: data.difference,
    reconciledBy: data.reconciled_by,
    reconciledAt: data.reconciled_at ? new Date(data.reconciled_at) : undefined,
  };
}

function mapToGoReconciliationItem(data: any): GoReconciliationItem {
  return {
    id: data.id,
    reconciliationId: data.reconciliation_id,
    transactionDate: new Date(data.transaction_date),
    description: data.description,
    amount: data.amount,
    cleared: data.cleared,
    clearedDate: data.cleared_date ? new Date(data.cleared_date) : undefined,
  };
}
