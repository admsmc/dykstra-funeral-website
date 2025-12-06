import { Effect, type Context } from 'effect';
import { GoFinancialPort, type NotFoundError } from '../../ports/go-financial-port';
import { NetworkError } from '../../ports/go-contract-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Reverse Journal Entry
 * 
 * Creates a reversal entry for an existing journal entry by flipping debits/credits.
 * Validates entry exists and hasn't already been reversed.
 */
export const reverseJournalEntry = (params: {
  journalEntryId: string;
  reversalDate: Date;
  reversalReason: string;
  reversedBy: string;
  funeralHomeId: string;
}): Effect.Effect<{
  reversalEntryId: string;
  reversalEntryNumber: string;
  originalEntryId: string;
  reversalDate: Date;
}, NotFoundError | ValidationError | NetworkError, Context.Tag.Identifier<typeof GoFinancialPort>> =>
  Effect.gen(function* () {
    const goFinancial = yield* GoFinancialPort;
    
    // Delegate to Go backend which handles:
    // 1. Fetching original entry
    // 2. Validating not already reversed
    // 3. Creating reversal entry (flip debits/credits)
    // 4. Posting to TigerBeetle
    const reversalEntry = yield* goFinancial.reverseJournalEntry(
      params.journalEntryId,
      params.reversalDate,
      params.reversalReason
    );
    
    return {
      reversalEntryId: reversalEntry.id,
      reversalEntryNumber: reversalEntry.entryNumber,
      originalEntryId: params.journalEntryId,
      reversalDate: params.reversalDate,
    };
  });
