import { Effect } from 'effect';
import type { GoFixedAssetsPortService, GoDepreciationRun } from '../../ports/go-fixed-assets-port';
import { GoFixedAssetsPort, NetworkError } from '../../ports/go-fixed-assets-port';

export interface RunDepreciationCommand {
  period: Date;
}

export const runDepreciation = (
  command: RunDepreciationCommand
): Effect.Effect<GoDepreciationRun, NetworkError, GoFixedAssetsPortService> =>
  Effect.gen(function* () {
    const fixedAssetsPort = yield* GoFixedAssetsPort;

    // Run monthly depreciation in Go backend
    const result = yield* fixedAssetsPort.runMonthlyDepreciation(command.period);

    return result;
  });
