/**
 * Pay Vendor Bill Use Case
 * 
 * Records payment for an approved vendor bill.
 * Supports multiple payment methods:
 * - Check (generates check number)
 * - ACH (generates NACHA file)
 * - Wire transfer
 * - Credit card
 * 
 * Business Rules:
 * - Bill must be in 'approved' status
 * - Payment method must be valid for vendor
 * - Payment posts GL entries to TigerBeetle
 * - Bill status updated to 'paid'
 * 
 * GL Impact (performed by Go backend):
 * - DR: Accounts Payable (reduce liability)
 * - CR: Cash/Bank Account (reduce asset)
 * 
 * @module use-cases/financial/pay-vendor-bill
 */

import { Effect } from 'effect';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  type NetworkError,
  type PayVendorBillsCommand,
} from '../../ports/go-financial-port';

/**
 * Command to pay a vendor bill
 */
export interface PayVendorBillCommand {
  /** Bill ID to pay */
  readonly billId: string;
  
  /** Vendor ID */
  readonly vendorId: string;
  
  /** Payment date */
  readonly paymentDate: Date;
  
  /** Payment method */
  readonly paymentMethod: 'check' | 'ach' | 'wire';
  
  /** Payment amount */
  readonly amount: number;
  
  /** Check number (if payment method is check) */
  readonly checkNumber?: string;
  
  /** Reference number (for ACH/wire) */
  readonly referenceNumber?: string;
  
  /** User ID of person recording payment */
  readonly paidBy: string;
}

/**
 * Result of vendor bill payment
 */
export interface PayVendorBillResult {
  /** Bill ID that was paid */
  readonly billId: string;
  
  /** Payment ID created */
  readonly paymentId: string;
  
  /** Payment date */
  readonly paidAt: Date;
  
  /** User who recorded payment */
  readonly paidBy: string;
  
  /** Payment amount */
  readonly amount: number;
  
  /** Check number (if applicable) */
  readonly checkNumber?: string;
  
  /** NACHA file ID (if ACH payment) */
  readonly nachaFileId?: string;
}

/**
 * Pay a vendor bill
 * 
 * This use case:
 * 1. Validates bill is approved and unpaid
 * 2. Creates vendor payment in Go backend
 * 3. Posts cash credit / AP debit to TigerBeetle
 * 4. Generates payment file (check, NACHA, wire instructions)
 * 5. Emits VendorPaymentCreated event
 * 6. Updates bill status to 'paid'
 * 
 * Note: The Go backend has `payVendorBills` (plural) for batch payments.
 * This use case wraps it for single-bill convenience.
 * 
 * @param command - Payment command
 * @returns Effect with payment result
 * 
 * @example
 * ```typescript
 * const result = yield* payVendorBill({
 *   billId: 'bill-123',
 *   paymentDate: new Date(),
 *   paymentMethod: 'check',
 *   checkNumber: '10234',
 *   paidBy: 'user_456'
 * });
 * 
 * console.log(`Payment ${result.paymentId} recorded`);
 * console.log(`Check number: ${result.checkNumber}`);
 * ```
 */
export const payVendorBill = (
  command: PayVendorBillCommand
): Effect.Effect<PayVendorBillResult, NetworkError, GoFinancialPortService> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // Build command for Go backend (which expects batch format)
    const batchCommand: PayVendorBillsCommand = {
      vendorId: command.vendorId,
      billIds: [command.billId],
      paymentDate: command.paymentDate,
      paymentMethod: command.paymentMethod,
    };

    // Call Go backend to pay bills (batch operation with single bill)
    // This will:
    // 1. Validate bill is approved
    // 2. Create vendor payment
    // 3. Post cash credit / AP debit to TigerBeetle
    // 4. Generate payment file (check, NACHA, wire)
    // 5. Emit VendorPaymentCreated event
    const payment = yield* financialPort.payVendorBills(batchCommand);

    // Return payment result
    return {
      billId: command.billId,
      paymentId: payment.id,
      paidAt: payment.paymentDate,
      paidBy: command.paidBy,
      amount: payment.amount,
      checkNumber: payment.checkNumber,
      nachaFileId: payment.nachaFileId,
    };
  });

/**
 * Pay multiple vendor bills in batch
 * 
 * This is a convenience wrapper around the Go backend's batch payment operation.
 * Use this when paying multiple bills to the same vendor or on the same payment run.
 * 
 * @param billIds - Array of bill IDs to pay
 * @param command - Payment command (same payment method for all)
 * @returns Effect with batch payment result
 * 
 * @example
 * ```typescript
 * const result = yield* payVendorBillsBatch(
 *   ['bill-123', 'bill-456', 'bill-789'],
 *   {
 *     paymentDate: new Date(),
 *     paymentMethod: 'ach',
 *     referenceNumber: 'BATCH-001',
 *     paidBy: 'user_456'
 *   }
 * );
 * 
 * console.log(`Paid ${result.billsPaid} bills in payment ${result.paymentId}`);
 * ```
 */
export const payVendorBillsBatch = (
  billIds: readonly string[],
  command: Omit<PayVendorBillCommand, 'billId'>
): Effect.Effect<
  {
    paymentId: string;
    billsPaid: number;
    amount: number;
    nachaFileId?: string;
  },
  NetworkError,
  GoFinancialPortService
> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    const batchCommand: PayVendorBillsCommand = {
      vendorId: command.vendorId,
      billIds: billIds as string[],
      paymentDate: command.paymentDate,
      paymentMethod: command.paymentMethod,
    };

    const payment = yield* financialPort.payVendorBills(batchCommand);

    return {
      paymentId: payment.id,
      billsPaid: billIds.length,
      amount: payment.amount,
      nachaFileId: payment.nachaFileId,
    };
  });
