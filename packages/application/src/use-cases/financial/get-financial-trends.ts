import { Effect } from 'effect';
import type { GoFinancialPortService } from '../../ports/go-financial-port';
import { GoFinancialPort, NetworkError } from '../../ports/go-financial-port';

export interface GetFinancialTrendsCommand {
  funeralHomeId: string;
  fromPeriod: string; // e.g., 2024-01
  toPeriod: string;   // e.g., 2024-12
}

export interface FinancialTrendPoint {
  period: string; // e.g., 2024-01
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface FinancialTrendsResponse {
  series: readonly FinancialTrendPoint[];
}

export const getFinancialTrends = (
  command: GetFinancialTrendsCommand
): Effect.Effect<FinancialTrendsResponse, NetworkError, GoFinancialPortService> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;
    const series = yield* financialPort.getFinancialTrends(
      command.funeralHomeId,
      command.fromPeriod,
      command.toPeriod
    );

    return { series };
  });
