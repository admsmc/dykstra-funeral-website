import { Effect } from 'effect';
import type { GoFixedAssetsPortService, GoDepreciationSchedule } from '../../ports/go-fixed-assets-port';
import { GoFixedAssetsPort, NetworkError } from '../../ports/go-fixed-assets-port';

export const getDepreciationSchedule = (
  assetId: string
): Effect.Effect<GoDepreciationSchedule, NetworkError, GoFixedAssetsPortService> =>
  Effect.gen(function* () {
    const fixedAssetsPort = yield* GoFixedAssetsPort;

    // Fetch depreciation schedule from Go backend
    const schedule = yield* fixedAssetsPort.getDepreciationSchedule(assetId);

    return schedule;
  });
