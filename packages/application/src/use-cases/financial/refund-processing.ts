/**
 * Refund Processing Use Case
 * 
 * Handles refunding payments to customers with proper GL entries and audit trail.
 * Common scenarios:
 * - Customer overpayment refund
 * - Service cancellation refund
 * - Payment error correction
 * - Partial refunds for service adjustments
 * 
 * Business Rules:
 * - Refund amount cannot exceed original payment amount
 * - Original payment must be in 'cleared' or 'pending' status
 * - Refund creates a new payment record with negative amount
 * - Original payment status updated to 'refunded' (partial or full)
 * - GL entries reverse the original payment entries
 * - SCD2 pattern: creates new versions for audit trail
 * 
 * GL Entries:
 * - DR: AR (reverse the payment credit)
 * - CR: Cash/Bank (reverse the payment debit)
 * 
 * @module use-cases/financial/refund-processing
 */

import { Effect, Context } from 'effect';
import type {
  GoFinancialPortService,
} from '@dykstra/application';
import { ValidationError, NotFoundError } from '@dykstra/domain';
import { NetworkError } from '../../ports/go-contract-port';

/**
 * Command to process a refund
 */
/**
 * Refund Processing
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

export interface ProcessRefundCommand {
  /** Original payment ID to refund */
  paymentId: string;
  /** Refund amount (must be <= original payment amount) */
  refundAmount: number;
  /** Reason for refund */
  reason: 'overpayment' | 'cancellation' | 'error_correction' | 'service_adjustment' | 'other';
  /** Additional notes about the refund */
  notes?: string;
  /** User processing the refund */
  processedBy: string;
  /** Refund date (defaults to today) */
  refundDate?: Date;
}

/**
 * Result of refund processing
 */
export interface ProcessRefundResult {
  /** New refund payment ID */
  refundPaymentId: string;
  /** Original payment ID */
  originalPaymentId: string;
  /** Refund amount */
  refundAmount: number;
  /** Refund status */
  refundStatus: 'pending' | 'processed' | 'failed';
  /** GL journal entry ID for refund */
  journalEntryId: string;
  /** Whether original payment is fully refunded */
  isFullRefund: boolean;
  /** Remaining amount that can be refunded */
  remainingRefundableAmount: number;
  /** Refund processed date */
  processedAt: Date;
}

/**
 * GoFinancialPort tag for dependency injection
 */
export const GoFinancialPort = Context.GenericTag<GoFinancialPortService>(
  '@dykstra/GoFinancialPort'
);

/**
 * Process a refund for a payment
 * 
 * This use case:
 * 1. Validates the original payment exists and is refundable
 * 2. Validates refund amount doesn't exceed remaining refundable amount
 * 3. Creates a new payment record with negative amount (refund)
 * 4. Creates GL entry to reverse the payment
 * 5. Updates original payment status
 * 
 * @param command - Refund processing command
 * @returns Effect with refund result
 */
export const processRefund = (
  command: ProcessRefundCommand
): Effect.Effect<ProcessRefundResult, ValidationError | NotFoundError | NetworkError, GoFinancialPortService> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // ⚠️ TECHNICAL DEBT: Simplified implementation for Phase 6
    // Missing Go backend methods: getPayment(), updatePaymentStatus()
    // See: docs/PHASE_6_TECHNICAL_DEBT.md for full details
    // In production, would:
    // 1. Get payment details from payment repository (getPayment)
    // 2. Validate payment status and refundable amount
    // 3. Track previous refunds
    // 4. Update original payment status (updatePaymentStatus)

    // 1. Basic validation
    if (command.refundAmount <= 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Refund amount must be positive',
          field: 'refundAmount',
        })
      );
    }

    // 2. For simplified implementation, create GL entry for refund
    const refundDate = command.refundDate || new Date();
    
    // Get GL accounts for the journal entry
    const arAccount = yield* financialPort.getGLAccountByNumber('1200'); // AR
    const cashAccount = yield* financialPort.getGLAccountByNumber('1000'); // Cash

    const journalEntry = yield* financialPort.createJournalEntry({
      entryDate: refundDate,
      description: `Refund ${command.paymentId} - ${command.reason}`,
      lines: [
        {
          // DR: Accounts Receivable (reverse payment credit)
          accountId: arAccount.id,
          debit: command.refundAmount,
          credit: 0,
          description: 'Refund - reverse AR credit',
        },
        {
          // CR: Cash/Bank (reverse payment debit)
          accountId: cashAccount.id,
          debit: 0,
          credit: command.refundAmount,
          description: 'Refund - reverse cash debit',
        },
      ],
    });

    // 3. Post the journal entry
    yield* financialPort.postJournalEntry(journalEntry.id);

    // 4. Generate refund payment ID (in production would use payment repository)
    const refundPaymentId = `refund-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return {
      refundPaymentId,
      originalPaymentId: command.paymentId,
      refundAmount: command.refundAmount,
      refundStatus: 'processed',
      journalEntryId: journalEntry.id,
      isFullRefund: true, // Simplified: assume full refund
      remainingRefundableAmount: 0,
      processedAt: refundDate,
    };
  });

/**
 * Calculate refundable amount for a payment
 * 
 * Helper function to determine how much of a payment can still be refunded.
 * In production, this would query payment repository for all previous refunds.
 * 
 * @param _paymentId - Payment ID (unused in simplified implementation)
 * @param paymentAmount - Original payment amount
 * @returns Effect with refundable amount
 */
export const getRefundableAmount = (
  _paymentId: string,
  paymentAmount: number
): Effect.Effect<number, ValidationError> =>
  Effect.gen(function* () {
    // Simplified implementation for Phase 6
    // In production, would query payment repository for refund history
    
    // For now, return the full amount (assumes no previous refunds)
    return paymentAmount;
  });
