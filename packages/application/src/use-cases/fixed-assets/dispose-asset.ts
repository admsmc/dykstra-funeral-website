import { Effect } from 'effect';
import type { GoFixedAssetsPortService } from '../../ports/go-fixed-assets-port';
import { GoFixedAssetsPort, NetworkError } from '../../ports/go-fixed-assets-port';

export interface DisposeAssetCommand {
  assetId: string;
  disposalDate: Date;
  disposalAmount: number;
}

export const disposeAsset = (
  command: DisposeAssetCommand
): Effect.Effect<void, NetworkError, GoFixedAssetsPortService> =>
  Effect.gen(function* () {
    const fixedAssetsPort = yield* GoFixedAssetsPort;

    // Dispose asset in Go backend
    yield* fixedAssetsPort.disposeAsset(
      command.assetId,
      command.disposalDate,
      command.disposalAmount
    );
  });
