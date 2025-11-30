/**
 * Fixed Assets Port
 * 
 * Handles fixed asset lifecycle management including acquisition,
 * depreciation calculation, and asset disposal tracking.
 */

import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NotFoundError, NetworkError };

export interface GoFixedAsset {
  readonly id: string;
  readonly assetNumber: string;
  readonly description: string;
  readonly category: string;
  readonly acquisitionDate: Date;
  readonly acquisitionCost: number;
  readonly salvageValue: number;
  readonly usefulLifeYears: number;
  readonly depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
  readonly status: 'active' | 'disposed' | 'fully_depreciated';
  readonly currentBookValue: number;
  readonly accumulatedDepreciation: number;
}

export interface GoDepreciationSchedule {
  readonly assetId: string;
  readonly entries: readonly GoDepreciationEntry[];
}

export interface GoDepreciationEntry {
  readonly period: string;
  readonly beginningBookValue: number;
  readonly depreciationExpense: number;
  readonly endingBookValue: number;
}

export interface GoFixedAssetsPortService {
  readonly createAsset: (asset: Omit<GoFixedAsset, 'id' | 'currentBookValue' | 'accumulatedDepreciation'>) => 
    Effect.Effect<GoFixedAsset, NetworkError>;
  readonly getAsset: (id: string) => 
    Effect.Effect<GoFixedAsset, NotFoundError | NetworkError>;
  readonly listAssets: (filters?: { category?: string; status?: GoFixedAsset['status'] }) => 
    Effect.Effect<readonly GoFixedAsset[], NetworkError>;
  readonly getDepreciationSchedule: (assetId: string) => 
    Effect.Effect<GoDepreciationSchedule, NetworkError>;
  readonly disposeAsset: (assetId: string, disposalDate: Date, disposalAmount: number) => 
    Effect.Effect<void, NetworkError>;
  readonly runMonthlyDepreciation: (period: Date) => 
    Effect.Effect<void, NetworkError>;
}

export const GoFixedAssetsPort = Context.GenericTag<GoFixedAssetsPortService>(
  '@dykstra/GoFixedAssetsPort'
);
