import { Effect, type Context } from 'effect';
import { GoFinancialPort, type GoGLAccount } from '../../ports/go-financial-port';
import { NetworkError } from '../../ports/go-contract-port';

/**
 * Get Chart of Accounts
 * 
 * Returns all GL accounts with hierarchy.
 * Delegates to Go backend which queries the chart of accounts.
 */
export const getChartOfAccounts = (params: {
  funeralHomeId: string;
  includeInactive?: boolean;
}): Effect.Effect<{
  accounts: readonly GoGLAccount[];
  totalAccounts: number;
}, NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    const goFinancial = yield* GoFinancialPort;
    
    // Get all accounts from Go backend
    const accounts = yield* goFinancial.getChartOfAccounts();
    
    // Filter out inactive accounts if requested
    const filteredAccounts = params.includeInactive 
      ? accounts 
      : accounts.filter(account => account.isActive);
    
    return {
      accounts: filteredAccounts,
      totalAccounts: filteredAccounts.length,
    };
  });
