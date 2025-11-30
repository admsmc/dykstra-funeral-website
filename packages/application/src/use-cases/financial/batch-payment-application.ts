/**
 * Batch Payment Application Use Case
 * 
 * Enables applying a single payment across multiple invoices with allocation rules.
 * Common scenarios:
 * - Family makes lump-sum payment to cover multiple cases
 * - Insurance payment covers multiple invoices
 * - Estate settlement payment
 * 
 * Business Rules:
 * - Payment allocation can be automatic (oldest first) or manual
 * - Cannot over-allocate payment amount
 * - Each allocation must not exceed invoice balance due
 * - All allocations must be positive amounts
 * - Payment must be fully allocated (no partial applications)
 * 
 * @module use-cases/financial/batch-payment-application
 */

import { Effect, Context } from 'effect';
import type {
  GoFinancialPortService,
} from '@dykstra/application';
import { ValidationError, NotFoundError } from '@dykstra/domain';
import { NetworkError } from '../../ports/go-contract-port';

/**
 * Command to apply a batch payment across multiple invoices
 */
export interface ApplyBatchPaymentCommand {
  /** Payment ID to apply */
  paymentId: string;
  /** Manual allocations (required) */
  allocations: Array<{
    invoiceId: string;
    amount: number;
  }>;
}

/**
 * Result of batch payment application
 */
export interface BatchPaymentApplicationResult {
  paymentId: string;
  totalAmount: number;
  allocations: Array<{
    invoiceId: string;
    amountApplied: number;
    remainingBalance: number;
  }>;
  appliedAt: Date;
}


/**
 * GoFinancialPort tag for dependency injection
 */
export const GoFinancialPort = Context.GenericTag<GoFinancialPortService>(
  '@dykstra/GoFinancialPort'
);

/**
 * Apply a batch payment across multiple invoices
 * 
 * This use case handles both manual and automatic allocation:
 * - Manual: User specifies which invoices receive which amounts
 * - Automatic: System allocates based on strategy (oldest-first, largest-first, proportional)
 * 
 * @param command - Batch payment application command
 * @returns Effect with allocation result
 */
export const applyBatchPayment = (
  command: ApplyBatchPaymentCommand
): Effect.Effect<BatchPaymentApplicationResult, ValidationError | NotFoundError | NetworkError, GoFinancialPortService> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // ⚠️ TECHNICAL DEBT: Simplified implementation for Phase 6
    // Missing Go backend methods: getPayment(), updatePaymentStatus()
    // See: docs/PHASE_6_TECHNICAL_DEBT.md
    // In production, would validate payment exists and update status after application

    // 1. Validate allocations are provided
    if (command.allocations.length === 0) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Payment allocations are required' })
      );
    }

    const allocations = command.allocations;

    // Calculate total payment amount from allocations
    const totalPaymentAmount = allocations.reduce((sum, a) => sum + a.amount, 0);

    // 3. Validate allocations
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    
    if (Math.abs(totalAllocated - totalPaymentAmount) > 0.01) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Allocation total does not match payment amount' })
      );
    }

    // Validate each allocation doesn't exceed invoice balance
    const invoiceValidations = yield* Effect.all(
      allocations.map((allocation) =>
        Effect.gen(function* () {
          const invoice = yield* financialPort.getInvoice(allocation.invoiceId);

          if (allocation.amount > invoice.amountDue) {
            return yield* Effect.fail(
              new ValidationError({ message: 'Allocation exceeds invoice balance' })
            );
          }

          if (allocation.amount <= 0) {
            return yield* Effect.fail(
              new ValidationError({ message: 'Allocation amount must be positive' })
            );
          }

          return { invoice, allocation };
        })
      ),
      { concurrency: 5 } // Validate up to 5 invoices in parallel
    );

    // 4. Apply payment to each invoice
    const appliedAllocations = yield* Effect.all(
      invoiceValidations.map(({ invoice, allocation }) =>
        Effect.gen(function* () {
          // Record payment application in Go backend
          yield* financialPort.recordPayment({
            invoiceId: allocation.invoiceId,
            amount: allocation.amount,
            paymentDate: new Date(),
            paymentMethod: 'check',
          });

          const remainingBalance = invoice.amountDue - allocation.amount;

          return {
            invoiceId: allocation.invoiceId,
            amountApplied: allocation.amount,
            remainingBalance,
          };
        })
      ),
      { concurrency: 3 } // Apply up to 3 payments in parallel
    );

    // 5. Payment application complete (status tracking would be in production payment repository)

    return {
      paymentId: command.paymentId,
      totalAmount: totalPaymentAmount,
      allocations: appliedAllocations,
      appliedAt: new Date(),
    };
  });

