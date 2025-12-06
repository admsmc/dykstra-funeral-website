import { Effect, type Context } from 'effect';
import { GoFinancialPort, type GoAccountBalance } from '../../ports/go-financial-port';
import { NetworkError } from '../../ports/go-contract-port';

/**
 * Get Account Balances
 * 
 * Returns current balances for all accounts or specific account IDs.
 * Delegates to Go backend which queries TigerBeetle ledger.
 */
export const getAccountBalances = (params: {
  funeralHomeId: string;
  accountIds?: readonly string[];
  asOfDate?: Date;
}): Effect.Effect<{
  balances: readonly GoAccountBalance[];
  asOfDate: Date;
  totalAccounts: number;
}, NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    const goFinancial = yield* GoFinancialPort;
    
    // If specific account IDs provided, query just those
    // Otherwise, get all accounts and query their balances
    const accountIds = params.accountIds && params.accountIds.length > 0
      ? params.accountIds
      : (yield* goFinancial.getChartOfAccounts()).map(account => account.id);
    
    // Get balances from Go backend
    const balances = yield* goFinancial.getAccountBalances(
      accountIds,
      params.asOfDate
    );
    
    const asOfDate = params.asOfDate ?? new Date();
    
    return {
      balances,
      asOfDate,
      totalAccounts: balances.length,
    };
  });
