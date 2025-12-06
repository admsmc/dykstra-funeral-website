import { Effect, type Context } from 'effect';
import { GoFinancialPort, type GoTrialBalance, type GoFinancialStatement, type GoJournalEntry, type CreateJournalEntryCommand, type NotFoundError } from '../../ports/go-financial-port';
import { NetworkError } from '../../ports/go-contract-port';

/**
 * Get GL Trial Balance
 * 
 * Returns all GL accounts with debit/credit balances for a specific period.
 * Delegates to Go backend which queries TigerBeetle ledger.
 */
export const getGLTrialBalance = (params: {
  period: Date;
  funeralHomeId: string;
}): Effect.Effect<GoTrialBalance, NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    const goFinancial = yield* GoFinancialPort;
    
    // Delegate to Go backend - it handles TigerBeetle queries
    return yield* goFinancial.getTrialBalance(params.period);
  });

/**
 * Get Account History
 * 
 * Returns detailed transaction history for a GL account over a date range.
 * Queries journal entries from Go backend.
 */
export const getAccountHistory = (params: {
  accountId: string;
  startDate: Date;
  endDate: Date;
  funeralHomeId: string;
}): Effect.Effect<{
  accountId: string;
  transactions: readonly GoJournalEntry[];
  openingBalance: number;
  closingBalance: number;
}, NotFoundError | NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    const goFinancial = yield* GoFinancialPort;
    
    // Get account details
    const account = yield* goFinancial.getGLAccount(params.accountId);
    
    // Get journal entries for this account in date range
    const entries = yield* goFinancial.listJournalEntries({
      startDate: params.startDate,
      endDate: params.endDate,
      accountId: params.accountId,
      status: 'posted',
    });
    
    // Calculate opening and closing balances
    // For now, using account.balance as closing (Go backend tracks this)
    const closingBalance = account.balance;
    
    // Calculate opening by subtracting period activity
    const periodActivity = entries.reduce((sum, entry) => {
      const line = entry.lines.find(l => l.accountId === params.accountId);
      if (!line) return sum;
      return sum + (line.debit - line.credit);
    }, 0);
    
    const openingBalance = closingBalance - periodActivity;
    
    return {
      accountId: params.accountId,
      transactions: entries,
      openingBalance,
      closingBalance,
    };
  });

/**
 * Get Financial Statement
 * 
 * Generates P&L, Balance Sheet, or Cash Flow statement.
 * Delegates to Go backend which formats data from TigerBeetle.
 */
export const getFinancialStatement = (params: {
  type: 'income_statement' | 'balance_sheet' | 'cash_flow';
  startDate?: Date;
  endDate: Date;
  funeralHomeId: string;
}): Effect.Effect<GoFinancialStatement, NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    const goFinancial = yield* GoFinancialPort;
    
    // Map tRPC type to Go backend type
    const goType = params.type === 'income_statement' ? 'income_statement' : 
                   params.type === 'balance_sheet' ? 'balance_sheet' : 
                   'cash_flow';
    
    // Delegate to Go backend
    return yield* goFinancial.generateFinancialStatement(goType, params.endDate);
  });

/**
 * Post Journal Entry
 * 
 * Creates and posts a manual journal entry to the GL.
 * Validates debits = credits before delegating to Go backend.
 */
export const postJournalEntry = (params: {
  entryDate: Date;
  description: string;
  funeralHomeId: string;
  lines: readonly {
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }[];
}): Effect.Effect<GoJournalEntry, NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    const goFinancial = yield* GoFinancialPort;
    
    // Validate debits = credits (should be done in router, but double-check)
    const totalDebits = params.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = params.lines.reduce((sum, line) => sum + line.credit, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return yield* Effect.fail(
        new NetworkError(
          `Journal entry out of balance. Debits: ${totalDebits}, Credits: ${totalCredits}`,
          new Error('Validation failed')
        )
      );
    }
    
    // Create journal entry command
    const command: CreateJournalEntryCommand = {
      entryDate: params.entryDate,
      description: params.description,
      lines: params.lines.map(line => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
      })),
    };
    
    // Create entry (status: draft)
    const entry = yield* goFinancial.createJournalEntry(command);
    
    // Post entry to TigerBeetle (status: posted)
    yield* goFinancial.postJournalEntry(entry.id);
    
    // Return posted entry
    return entry;
  });
