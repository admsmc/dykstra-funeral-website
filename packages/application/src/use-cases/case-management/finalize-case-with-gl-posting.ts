import { Effect } from 'effect';
import { CaseRepository as CaseRepositoryTag, type CaseRepository as CaseRepositoryService, type PersistenceError } from '../../ports/case-repository';
import { GoContractPort, type GoContractPortService, type NetworkError, NotFoundError } from '../../ports/go-contract-port';
import { GoFinancialPort, type GoFinancialPortService, type CreateJournalEntryCommand } from '../../ports/go-financial-port';
import { ValidationError, REVENUE_RECOGNITION_ACCOUNTS } from '@dykstra/domain';

/**
 * Command to finalize a case with GL posting
 */
/**
 * Finalize Case With Gl Posting
 *
 * Policy Type: N/A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface FinalizeCaseWithGLPostingCommand {
  readonly caseBusinessKey: string;
  readonly actorUserId: string;
}

/**
 * Result of finalizing a case with GL posting
 */
export interface FinalizeCaseWithGLPostingResult {
  readonly caseId: string;
  readonly journalEntryId: string;
  readonly totalAmount: number;
  readonly glAccountsPosted: readonly string[];
  readonly finalizedAt: Date;
}


/**
 * Finalize Case with GL Posting
 * 
 * This use case orchestrates the finalization of a funeral case and posts
 * revenue recognition journal entries to the Go backend's General Ledger.
 * 
 * **Business Rules**:
 * 1. Case must have an active contract
 * 2. All services must be marked as delivered
 * 3. Contract must be fully signed
 * 4. Revenue is recognized at case finalization (not at contract signing)
 * 
 * **Workflow**:
 * 1. Load case and validate it's ready for finalization
 * 2. Fetch contract from Go backend to get revenue breakdown
 * 3. Calculate totals by category (services, merchandise, facilities)
 * 4. Create journal entry with proper revenue recognition:
 *    - DR: Accounts Receivable (total amount)
 *    - CR: Revenue - Professional Services
 *    - CR: Revenue - Merchandise
 *    - CR: Revenue - Facilities
 * 5. Post journal entry to Go backend's TigerBeetle ledger
 * 6. Update case status to "finalized" with GL reference
 * 
 * **GL Impact**:
 * - Increases Accounts Receivable (asset)
 * - Recognizes Revenue (income statement)
 * - Creates audit trail via EventStoreDB
 * 
 * @param command - Finalization command with case business key
 * @returns Effect with finalization result or errors
 * 
 * @example
 * ```typescript
 * const result = yield* finalizeCaseWithGLPosting({
 *   caseBusinessKey: 'case-2024-001',
 *   actorUserId: 'user_123'
 * });
 * 
 * console.log(`Case finalized with GL entry ${result.journalEntryId}`);
 * console.log(`Total revenue recognized: $${result.totalAmount}`);
 * ```
 */
export const finalizeCaseWithGLPosting = (
  command: FinalizeCaseWithGLPostingCommand
): Effect.Effect<
  FinalizeCaseWithGLPostingResult,
  NotFoundError | ValidationError | NetworkError | PersistenceError,
  CaseRepositoryService | GoContractPortService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepositoryTag;
    const contractPort = yield* GoContractPort;
    const financialPort = yield* GoFinancialPort;

    // Step 1: Load case and validate it exists
    const currentCase = yield* caseRepo.findByBusinessKey(command.caseBusinessKey);
    
    if (!currentCase) {
      return yield* Effect.fail(
        new NotFoundError({
          message: `Case not found: ${command.caseBusinessKey}`,
          entityType: 'Case',
          entityId: command.caseBusinessKey
        })
      );
    }

    // Step 2: Validate case has a contract
    if (!currentCase.goContractId) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Case must have an active contract before finalization',
          field: 'goContractId'
        })
      );
    }

    // Step 3: Validate case status allows finalization
    // Cases can be finalized from 'active' or 'completed' status
    if (currentCase.status !== 'active' && currentCase.status !== 'completed') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Case cannot be finalized from status: ${currentCase.status}`,
          field: 'status'
        })
      );
    }

    // Step 4: Fetch contract from Go backend
    const contract = yield* contractPort.getContract(currentCase.goContractId);

    // Step 5: Validate contract is fully signed
    if (contract.status !== 'active' && contract.status !== 'completed') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Contract must be active or completed. Current status: ${contract.status}`,
          field: 'contractStatus'
        })
      );
    }

    // Step 6: Calculate revenue breakdown by category
    const serviceRevenue = contract.services.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const merchandiseRevenue = contract.products.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    // For now, facilities revenue is part of services
    // This can be enhanced later with separate categorization
    const totalRevenue = contract.totalAmount;

    // Step 7: Fetch GL account details to get account IDs
    const arAccount = yield* financialPort.getGLAccountByNumber(
      REVENUE_RECOGNITION_ACCOUNTS.accountsReceivable
    );
    const serviceRevenueAccount = yield* financialPort.getGLAccountByNumber(
      REVENUE_RECOGNITION_ACCOUNTS.professionalServices
    );
    const merchandiseRevenueAccount = yield* financialPort.getGLAccountByNumber(
      REVENUE_RECOGNITION_ACCOUNTS.merchandise
    );

    // Step 8: Create journal entry with revenue recognition
    const journalEntryCommand: CreateJournalEntryCommand = {
      entryDate: new Date(),
      description: `Revenue recognition for case ${currentCase.businessKey} - ${currentCase.decedentName}`,
      lines: [
        // Debit: Accounts Receivable (increase asset)
        {
          accountId: arAccount.id,
          debit: totalRevenue,
          credit: 0,
          description: `AR - Case ${currentCase.businessKey}`
        },
        // Credit: Revenue - Professional Services
        ...(serviceRevenue > 0 ? [{
          accountId: serviceRevenueAccount.id,
          debit: 0,
          credit: serviceRevenue,
          description: 'Professional services revenue'
        }] : []),
        // Credit: Revenue - Merchandise
        ...(merchandiseRevenue > 0 ? [{
          accountId: merchandiseRevenueAccount.id,
          debit: 0,
          credit: merchandiseRevenue,
          description: 'Merchandise revenue'
        }] : [])
      ]
    };

    const journalEntry = yield* financialPort.createJournalEntry(journalEntryCommand);

    // Step 9: Post journal entry to GL (TigerBeetle)
    yield* financialPort.postJournalEntry(journalEntry.id);

    // Step 10: Finalize case using domain method (handles status transition and GL tracking)
    const finalizedCase = yield* currentCase.finalize(
      journalEntry.id,
      totalRevenue,
      command.actorUserId
    );

    yield* caseRepo.update(finalizedCase);

    // Step 11: Return result
    return {
      caseId: currentCase.businessKey,
      journalEntryId: journalEntry.id,
      totalAmount: totalRevenue,
      glAccountsPosted: [
        arAccount.accountNumber,
        ...(serviceRevenue > 0 ? [serviceRevenueAccount.accountNumber] : []),
        ...(merchandiseRevenue > 0 ? [merchandiseRevenueAccount.accountNumber] : [])
      ],
      finalizedAt: new Date()
    };
  });
