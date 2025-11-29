import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoConsolidationsPortService,
  GoLegalEntity,
  GoConsolidationSection,
  GoConsolidationLineItem,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Consolidations Adapter
 * 
 * Implements GoConsolidationsPortService for multi-entity
 * financial consolidation and reporting.
 */

export const GoConsolidationsAdapter: GoConsolidationsPortService = {
  listEntities: () =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/consolidations/entities', {});
        
        if (res.error) {
          throw new Error(res.error.message);
        }
        
        return (res.data.entities || []).map((e: any): GoLegalEntity => ({
          id: e.id,
          entityCode: e.entity_code,
          entityName: e.entity_name,
          parentEntityId: e.parent_entity_id,
          currency: e.currency,
        }));
      },
      catch: (error) => new NetworkError('Failed to list entities', error as Error)
    }),
  
  generateConsolidationReport: (asOfDate: Date, entityIds: readonly string[]) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/consolidations/reports', {
          body: {
            as_of_date: asOfDate.toISOString(),
            entity_ids: entityIds,
          }
        });
        const data = unwrapResponse(res);
        return {
          asOfDate: new Date(data.as_of_date),
          entities: data.entities || [],
          sections: (data.sections || []).map((s: any): GoConsolidationSection => ({
            name: s.name,
            subtotal: s.subtotal,
            accounts: (s.accounts || []).map((acc: any): GoConsolidationLineItem => ({
              accountNumber: acc.account_number,
              accountName: acc.account_name,
              entityAmounts: acc.entity_amounts || {},
              eliminationAmount: acc.elimination_amount,
              consolidatedAmount: acc.consolidated_amount,
            })),
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to generate consolidation report', error as Error)
    }),
};
