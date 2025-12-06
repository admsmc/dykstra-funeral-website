import { Effect } from 'effect';
import type { GoFixedAssetsPortService, GoFixedAsset } from '../../ports/go-fixed-assets-port';
import { GoFixedAssetsPort, NotFoundError, NetworkError } from '../../ports/go-fixed-assets-port';

export const getAssetDetails = (
  assetId: string
): Effect.Effect<GoFixedAsset, NotFoundError | NetworkError, GoFixedAssetsPortService> =>
  Effect.gen(function* () {
    const fixedAssetsPort = yield* GoFixedAssetsPort;

    // Fetch asset details from Go backend
    const asset = yield* fixedAssetsPort.getAsset(assetId);

    return asset;
  });
