import { Effect } from 'effect';
import type { GoFinancialPortService } from '../../ports/go-financial-port';
import { GoFinancialPort, NetworkError } from '../../ports/go-financial-port';

export interface GetFinancialKPIsCommand {
  funeralHomeId: string;
  period: string;
}

export interface FinancialKPIs {
  revenue: number;
  expenses: number;
  netIncome: number;
  grossMargin: number;
  operatingMargin: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashOnHand: number;
}

export const getFinancialKPIs = (
  command: GetFinancialKPIsCommand
): Effect.Effect<FinancialKPIs, NetworkError, GoFinancialPortService> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // Fetch financial data from Go backend
    const kpis = yield* financialPort.getFinancialKPIs(
      command.funeralHomeId,
      command.period
    );

    return kpis;
  });
