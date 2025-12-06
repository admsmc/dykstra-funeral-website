import { Effect } from 'effect';
import type { GoFixedAssetsPortService, GoFixedAsset } from '../../ports/go-fixed-assets-port';
import { GoFixedAssetsPort, NetworkError } from '../../ports/go-fixed-assets-port';

export interface GetAssetRegisterQuery {
  category?: string;
  status?: 'active' | 'disposed' | 'fully_depreciated';
}

export const getAssetRegister = (
  query: GetAssetRegisterQuery = {}
): Effect.Effect<readonly GoFixedAsset[], NetworkError, GoFixedAssetsPortService> =>
  Effect.gen(function* () {
    const fixedAssetsPort = yield* GoFixedAssetsPort;

    // Fetch all assets matching the filter criteria
    const assets = yield* fixedAssetsPort.listAssets({
      category: query.category,
      status: query.status,
    });

    return assets;
  });
