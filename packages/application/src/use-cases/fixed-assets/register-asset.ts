import { Effect } from 'effect';
import type { GoFixedAssetsPortService, GoFixedAsset } from '../../ports/go-fixed-assets-port';
import { GoFixedAssetsPort, NetworkError } from '../../ports/go-fixed-assets-port';

export interface RegisterAssetCommand {
  assetNumber: string;
  description: string;
  category: string;
  acquisitionDate: Date;
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
}

export const registerAsset = (
  command: RegisterAssetCommand
): Effect.Effect<GoFixedAsset, NetworkError, GoFixedAssetsPortService> =>
  Effect.gen(function* () {
    const fixedAssetsPort = yield* GoFixedAssetsPort;

    // Register the asset in the Go backend
    const asset = yield* fixedAssetsPort.createAsset({
      assetNumber: command.assetNumber,
      description: command.description,
      category: command.category,
      acquisitionDate: command.acquisitionDate,
      acquisitionCost: command.acquisitionCost,
      salvageValue: command.salvageValue,
      usefulLifeYears: command.usefulLifeYears,
      depreciationMethod: command.depreciationMethod,
      status: 'active',
    });

    return asset;
  });
