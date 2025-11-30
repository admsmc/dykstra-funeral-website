import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoFixedAssetsPortService,
  GoFixedAsset,
  GoDepreciationEntry,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Fixed Assets Adapter
 * 
 * Implements GoFixedAssetsPortService for fixed asset lifecycle
 * management and depreciation tracking.
 */

export const GoFixedAssetsAdapter: GoFixedAssetsPortService = {
  createAsset: (asset) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/fixed-assets/assets', {
          body: {
            asset_number: asset.assetNumber,
            description: asset.description,
            category: asset.category,
            acquisition_date: asset.acquisitionDate.toISOString(),
            acquisition_cost: asset.acquisitionCost,
            salvage_value: asset.salvageValue,
            useful_life_years: asset.usefulLifeYears,
            depreciation_method: asset.depreciationMethod,
            status: asset.status,
          }
        });
        return mapToGoFixedAsset(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create asset', error as Error)
    }),
  
  getAsset: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/fixed-assets/assets/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'FixedAsset not found', entityType: 'FixedAsset', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoFixedAsset(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get asset', error as Error);
      }
    }),
  
  listAssets: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/fixed-assets/assets', {
          params: { query: filters as any }
        });
        const data = unwrapResponse(res);
        return (data.assets || []).map(mapToGoFixedAsset);
      },
      catch: (error) => new NetworkError('Failed to list assets', error as Error)
    }),
  
  getDepreciationSchedule: (assetId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/fixed-assets/assets/{id}/depreciation-schedule', {
          params: { path: { id: assetId } }
        });
        const data = unwrapResponse(res);
        return {
          assetId: data.asset_id,
          entries: (data.entries || []).map((e: any): GoDepreciationEntry => ({
            period: e.period,
            beginningBookValue: e.beginning_book_value,
            depreciationExpense: e.depreciation_expense,
            endingBookValue: e.ending_book_value,
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to get depreciation schedule', error as Error)
    }),
  
  disposeAsset: (assetId: string, disposalDate: Date, disposalAmount: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/fixed-assets/assets/{id}/dispose', {
          params: { path: { id: assetId } },
          body: {
            disposal_date: disposalDate.toISOString(),
            disposal_amount: disposalAmount,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to dispose asset', error as Error)
    }),
  
  runMonthlyDepreciation: (period: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/fixed-assets/depreciation/run', {
          body: {
            period: period.toISOString(),
          }
        });
        const data = unwrapResponse(res);
        return {
          runId: data.run_id || 'depr-' + period.toISOString().slice(0, 7),
          period: new Date(data.period || period),
          assetsProcessed: data.assets_processed || 0,
          totalDepreciationAmount: data.total_depreciation_amount || 0,
        };
      },
      catch: (error) => new NetworkError('Failed to run monthly depreciation', error as Error)
    }),
};

function mapToGoFixedAsset(data: any): GoFixedAsset {
  return {
    id: data.id,
    assetNumber: data.asset_number,
    description: data.description,
    category: data.category,
    acquisitionDate: new Date(data.acquisition_date),
    acquisitionCost: data.acquisition_cost,
    salvageValue: data.salvage_value,
    usefulLifeYears: data.useful_life_years,
    depreciationMethod: data.depreciation_method,
    status: data.status,
    currentBookValue: data.current_book_value,
    accumulatedDepreciation: data.accumulated_depreciation,
  };
}
