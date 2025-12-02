/**
 * Consolidations Port
 * 
 * Handles multi-entity financial consolidation including
 * inter-company eliminations and consolidated reporting.
 */

import { type Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoLegalEntity {
  readonly id: string;
  readonly entityCode: string;
  readonly entityName: string;
  readonly parentEntityId?: string;
  readonly currency: string;
}

export interface GoConsolidationReport {
  readonly asOfDate: Date;
  readonly entities: readonly string[];
  readonly sections: readonly GoConsolidationSection[];
}

export interface GoConsolidationSection {
  readonly name: string;
  readonly accounts: readonly GoConsolidationLineItem[];
  readonly subtotal: number;
}

export interface GoConsolidationLineItem {
  readonly accountNumber: string;
  readonly accountName: string;
  readonly entityAmounts: Record<string, number>;
  readonly eliminationAmount: number;
  readonly consolidatedAmount: number;
}

export interface GoConsolidationsPortService {
  readonly listEntities: () => 
    Effect.Effect<readonly GoLegalEntity[], NetworkError>;
  readonly generateConsolidationReport: (asOfDate: Date, entityIds: readonly string[]) => 
    Effect.Effect<GoConsolidationReport, NetworkError>;
}

export const GoConsolidationsPort = Context.GenericTag<GoConsolidationsPortService>(
  '@dykstra/GoConsolidationsPort'
);
