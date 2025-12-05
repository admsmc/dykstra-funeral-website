/**
 * Approve Vendor Bill Use Case
 * 
 * Approves a vendor bill for payment after verification and validation.
 * This is typically done after:
 * - 3-way match validation (PO → Receipt → Invoice)
 * - Manager review and approval
 * - Budget availability confirmation
 * 
 * Business Rules:
 * - Bill must be in 'pending_approval' status
 * - Approver must have appropriate authorization level
 * - Approval creates audit trail entry
 * - Bill status updated to 'approved'
 * - AP credit posted to TigerBeetle upon approval
 * 
 * GL Impact (performed by Go backend):
 * - DR: Expense Account (from bill line items)
 * - CR: Accounts Payable (liability increase)
 * 
 * @module use-cases/financial/approve-vendor-bill
 */

import { Effect } from 'effect';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  type NetworkError,
} from '../../ports/go-financial-port';

/**
 * Command to approve a vendor bill
 */
export interface ApproveVendorBillCommand {
  /** Bill ID to approve */
  readonly billId: string;
  
  /** User ID of approver */
  readonly approvedBy: string;
  
  /** Optional approval notes */
  readonly notes?: string;
}

/**
 * Result of vendor bill approval
 */
export interface ApproveVendorBillResult {
  /** Bill ID that was approved */
  readonly billId: string;
  
  /** Timestamp of approval */
  readonly approvedAt: Date;
  
  /** User who approved */
  readonly approvedBy: string;
  
  /** GL journal entry ID (if posted) */
  readonly glJournalId?: string;
}

/**
 * Approve a vendor bill for payment
 * 
 * This use case:
 * 1. Validates bill exists and is in pending_approval status
 * 2. Records approval in Go backend
 * 3. Posts AP credit to TigerBeetle
 * 4. Emits VendorBillApproved event
 * 5. Updates bill status to 'approved'
 * 
 * @param command - Approval command
 * @returns Effect with approval result
 * 
 * @example
 * ```typescript
 * const result = yield* approveVendorBill({
 *   billId: 'bill-123',
 *   approvedBy: 'user_456',
 *   notes: 'Approved after 3-way match validation'
 * });
 * 
 * console.log(`Bill ${result.billId} approved at ${result.approvedAt}`);
 * ```
 */
export const approveVendorBill = (
  command: ApproveVendorBillCommand
): Effect.Effect<ApproveVendorBillResult, NetworkError, GoFinancialPortService> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // Call Go backend to approve bill
    // This will:
    // 1. Validate bill is in pending_approval status
    // 2. Record approval with timestamp and approver
    // 3. Post AP credit to TigerBeetle
    // 4. Emit VendorBillApproved event
    yield* financialPort.approveVendorBill(command.billId, command.approvedBy);

    // Return approval result
    return {
      billId: command.billId,
      approvedAt: new Date(),
      approvedBy: command.approvedBy,
      // Note: glJournalId would come from Go backend in production
      // For now, Go backend doesn't return it in the void response
    };
  });
