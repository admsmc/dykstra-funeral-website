import { Effect } from 'effect';
import { 
  GoReconciliationsPort,
  type GoReconciliationsPortService,
  type NetworkError, 
  type NotFoundError,
  type GoReconciliationItem
} from '../../ports/go-reconciliations-port';
import { GoFinancialPort, type GoFinancialPortService } from '../../ports/go-financial-port';
import { ValidationError, EXPENSE_ACCOUNTS } from '@dykstra/domain';

/**
 * Command to start bank reconciliation
 */
/**
 * Bank Reconciliation
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface StartBankReconciliationCommand {
  readonly accountId: string;
  readonly accountNumber: string;
  readonly period: Date;
  readonly statementBalance: number;
  readonly statementDate: Date;
}

/**
 * Command to clear reconciliation items
 */
export interface ClearReconciliationItemsCommand {
  readonly reconciliationId: string;
  readonly itemIds: readonly string[];
}

/**
 * Command to complete reconciliation
 */
export interface CompleteBankReconciliationCommand {
  readonly reconciliationId: string;
  readonly reconciledBy: string;
  readonly adjustmentAmount?: number; // If difference requires GL adjustment
  readonly adjustmentReason?: string;
}

/**
 * Result of starting bank reconciliation
 */
export interface StartBankReconciliationResult {
  readonly reconciliationId: string;
  readonly accountId: string;
  readonly accountNumber: string;
  readonly period: Date;
  readonly glBalance: number;
  readonly statementBalance: number;
  readonly difference: number;
  readonly unmatchedItems: readonly GoReconciliationItem[];
}

/**
 * Result of completing bank reconciliation
 */
export interface CompleteBankReconciliationResult {
  readonly reconciliationId: string;
  readonly matchedCount: number;
  readonly adjustmentAmount: number;
  readonly adjustmentJournalId?: string;
  readonly status: 'completed';
  readonly reconciledAt: Date;
}

/**
 * Start Bank Reconciliation
 * 
 * This use case initiates a bank reconciliation workflow by creating a
 * reconciliation workspace and fetching unreconciled GL transactions.
 * 
 * **Business Rules**:
 * 1. Must reconcile against a cash/bank account (GL account type: asset)
 * 2. Reconciliation period must be within fiscal year
 * 3. Previous period must be reconciled first (sequential)
 * 4. Bank statement balance provided by user
 * 
 * **Workflow**:
 * 1. Create reconciliation record in Go backend
 * 2. Fetch unreconciled GL transactions for cash account
 * 3. Calculate initial difference (GL balance - statement balance)
 * 4. Return unmatched items for user review
 * 
 * **Auto-Matching** (performed by Go backend):
 * - Exact amount and date matches
 * - Check number matches
 * - Reference number matches
 * 
 * @param command - Reconciliation start command
 * @returns Effect with reconciliation start result
 * 
 * @example
 * ```typescript
 * const result = yield* startBankReconciliation({
 *   accountId: 'account-1',
 *   accountNumber: '1010',
 *   period: new Date('2024-11-30'),
 *   statementBalance: 50000.00,
 *   statementDate: new Date('2024-11-30')
 * });
 * 
 * console.log(`Difference: $${result.difference}`);
 * console.log(`Unmatched items: ${result.unmatchedItems.length}`);
 * ```
 */
export const startBankReconciliation = (
  command: StartBankReconciliationCommand
): Effect.Effect<
  StartBankReconciliationResult,
  NotFoundError | ValidationError | NetworkError,
  GoReconciliationsPortService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    const reconciliationsPort = yield* GoReconciliationsPort;
    const financialPort = yield* GoFinancialPort;

    // Step 1: Validate account exists and is a cash/bank account
    const account = yield* financialPort.getGLAccountByNumber(command.accountNumber);
    
    if (account.type !== 'asset') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Account ${command.accountNumber} is not an asset account. Only cash/bank accounts can be reconciled.`,
          field: 'accountNumber'
        })
      );
    }

    // Step 2: Create reconciliation workspace in Go backend
    const reconciliation = yield* reconciliationsPort.createReconciliation(
      command.accountId,
      command.period,
      command.statementBalance
    );

    // Step 3: Fetch unreconciled GL transactions
    const items = yield* reconciliationsPort.getReconciliationItems(reconciliation.id);

    // Step 4: Calculate difference
    const difference = reconciliation.glBalance - reconciliation.statementBalance;

    // Step 5: Filter unmatched items (those not auto-cleared)
    const unmatchedItems = items.filter(item => !item.cleared);

    // Step 6: Return result
    return {
      reconciliationId: reconciliation.id,
      accountId: reconciliation.accountId,
      accountNumber: reconciliation.accountNumber,
      period: reconciliation.period,
      glBalance: reconciliation.glBalance,
      statementBalance: reconciliation.statementBalance,
      difference: difference,
      unmatchedItems: unmatchedItems
    };
  });

/**
 * Clear Reconciliation Items
 * 
 * Mark multiple reconciliation items as cleared (matched to bank statement).
 * This is typically done by user after manual review.
 * 
 * @param command - Clear items command
 * @returns Effect with void result
 * 
 * @example
 * ```typescript
 * yield* clearReconciliationItems({
 *   reconciliationId: 'recon-1',
 *   itemIds: ['item-1', 'item-2', 'item-3']
 * });
 * ```
 */
export const clearReconciliationItems = (
  command: ClearReconciliationItemsCommand
): Effect.Effect<
  void,
  NetworkError,
  GoReconciliationsPortService
> =>
  Effect.gen(function* () {
    const reconciliationsPort = yield* GoReconciliationsPort;

    // Mark each item as cleared
    yield* Effect.all(
      command.itemIds.map(itemId =>
        reconciliationsPort.markItemCleared(command.reconciliationId, itemId)
      ),
      { concurrency: 'unbounded' }
    );
  });

/**
 * Complete Bank Reconciliation
 * 
 * Finalizes the bank reconciliation after all items have been matched.
 * Optionally posts an adjustment journal entry if there's a remaining difference.
 * 
 * **Business Rules**:
 * 1. All items must be cleared before completion
 * 2. If difference exists, adjustment entry must be approved
 * 3. Adjustment reasons include: bank fees, interest, NSF, errors
 * 4. Completion is irreversible (requires undo + new reconciliation)
 * 
 * **Adjustment Entry** (if needed):
 * - DR: Cash (if bank balance > GL balance)
 * - CR: Bank Fees / Interest Income / Other
 * OR
 * - DR: Bank Fees / NSF Charges / Other
 * - CR: Cash (if GL balance > bank balance)
 * 
 * @param command - Complete reconciliation command
 * @returns Effect with completion result
 * 
 * @example
 * ```typescript
 * const result = yield* completeBankReconciliation({
 *   reconciliationId: 'recon-1',
 *   reconciledBy: 'user_123',
 *   adjustmentAmount: 25.00,
 *   adjustmentReason: 'Bank service fee for November'
 * });
 * 
 * console.log(`Matched ${result.matchedCount} items`);
 * if (result.adjustmentJournalId) {
 *   console.log(`Posted adjustment: ${result.adjustmentJournalId}`);
 * }
 * ```
 */
export const completeBankReconciliation = (
  command: CompleteBankReconciliationCommand
): Effect.Effect<
  CompleteBankReconciliationResult,
  NotFoundError | ValidationError | NetworkError,
  GoReconciliationsPortService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    const reconciliationsPort = yield* GoReconciliationsPort;
    const financialPort = yield* GoFinancialPort;

    // Step 1: Get reconciliation details
    const reconciliation = yield* reconciliationsPort.getReconciliation(
      command.reconciliationId
    );

    // Step 2: Get all reconciliation items
    const items = yield* reconciliationsPort.getReconciliationItems(
      command.reconciliationId
    );

    // Step 3: Validate all items are cleared
    const unclearedItems = items.filter(item => !item.cleared);
    if (unclearedItems.length > 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Cannot complete reconciliation. ${unclearedItems.length} item(s) remain uncleared.`,
          field: 'itemIds'
        })
      );
    }

    // Step 4: Post adjustment entry if needed
    let adjustmentJournalId: string | undefined;
    const adjustmentAmount = command.adjustmentAmount ?? 0;

    if (adjustmentAmount !== 0) {
      if (!command.adjustmentReason) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Adjustment reason is required when posting adjustment entry',
            field: 'adjustmentReason'
          })
        );
      }

      // Fetch cash account
      const cashAccount = yield* financialPort.getGLAccount(reconciliation.accountId);

      // Post to Bank Fees account
      // In production, this could be configurable based on adjustment reason
      const bankFeesAccount = yield* financialPort.getGLAccountByNumber(EXPENSE_ACCOUNTS.BANK_FEES);

      // Create adjustment journal entry
      const journalEntry = yield* financialPort.createJournalEntry({
        entryDate: new Date(),
        description: `Bank reconciliation adjustment - ${command.adjustmentReason}`,
        lines: adjustmentAmount > 0 ? [
          // DR: Cash (increase if bank statement shows more)
          {
            accountId: cashAccount.id,
            debit: Math.abs(adjustmentAmount),
            credit: 0,
            description: command.adjustmentReason
          },
          // CR: Bank Fees (or Interest Income)
          {
            accountId: bankFeesAccount.id,
            debit: 0,
            credit: Math.abs(adjustmentAmount),
            description: command.adjustmentReason
          }
        ] : [
          // DR: Bank Fees (decrease cash if GL shows more)
          {
            accountId: bankFeesAccount.id,
            debit: Math.abs(adjustmentAmount),
            credit: 0,
            description: command.adjustmentReason
          },
          // CR: Cash
          {
            accountId: cashAccount.id,
            debit: 0,
            credit: Math.abs(adjustmentAmount),
            description: command.adjustmentReason
          }
        ]
      });

      // Post the adjustment
      yield* financialPort.postJournalEntry(journalEntry.id);
      adjustmentJournalId = journalEntry.id;
    }

    // Step 5: Complete reconciliation in Go backend
    yield* reconciliationsPort.completeReconciliation(
      command.reconciliationId,
      command.reconciledBy
    );

    // Step 6: Return result
    return {
      reconciliationId: command.reconciliationId,
      matchedCount: items.length,
      adjustmentAmount: adjustmentAmount,
      adjustmentJournalId: adjustmentJournalId,
      status: 'completed' as const,
      reconciledAt: new Date()
    };
  });

/**
 * Undo Bank Reconciliation
 * 
 * Reverts a completed reconciliation, allowing items to be re-reconciled.
 * Used when errors are discovered after completion.
 * 
 * **Note**: This does NOT reverse adjustment entries. Those must be reversed
 * separately using reverseJournalEntry.
 * 
 * @param reconciliationId - ID of reconciliation to undo
 * @param reason - Reason for undoing reconciliation
 * @returns Effect with void result
 * 
 * @example
 * ```typescript
 * yield* undoBankReconciliation(
 *   'recon-1',
 *   'Discovered bank statement error - need to re-reconcile'
 * );
 * ```
 */
export const undoBankReconciliation = (
  reconciliationId: string,
  reason: string
): Effect.Effect<
  void,
  NetworkError,
  GoReconciliationsPortService
> =>
  Effect.gen(function* () {
    const reconciliationsPort = yield* GoReconciliationsPort;
    
    yield* reconciliationsPort.undoReconciliation(reconciliationId, reason);
  });
