import { Effect } from 'effect';
import { 
  GoFinancialPort,
  type GoFinancialPortService,
  type NetworkError, 
  type NotFoundError,
  type CreateAPPaymentRunCommand,
  type GoVendorBill
} from '../../ports/go-financial-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Command to create and execute an AP payment run
 */
/**
 * Ap Payment Run
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

export interface ExecuteAPPaymentRunCommand {
  readonly billIds: readonly string[];
  readonly runDate: Date;
  readonly paymentMethod: 'check' | 'ach' | 'wire';
  readonly createdBy: string;
  readonly tenant: string;
  readonly legalEntity?: string;
  readonly currency?: string;
  readonly bankId?: string;
  readonly autoApprove?: boolean; // If true, auto-approves after creation
  readonly autoExecute?: boolean; // If true, auto-executes after approval
}

/**
 * Result of executing an AP payment run
 */
export interface ExecuteAPPaymentRunResult {
  readonly paymentRunId: string;
  readonly runNumber: string;
  readonly billCount: number;
  readonly totalAmount: number;
  readonly paymentDate: Date;
  readonly status: 'draft' | 'approved' | 'completed';
  readonly glJournalId?: string;
  readonly executed: boolean;
}

/**
 * Execute AP Payment Run
 * 
 * This use case orchestrates the batch payment of approved vendor bills through
 * the Go backend's Accounts Payable module.
 * 
 * **Business Rules**:
 * 1. All bills must be in 'approved' status
 * 2. Bills must be from the same vendor (batch by vendor)
 * 3. Payment run must be approved before execution
 * 4. Execution posts GL entries and generates payment file
 * 
 * **Workflow**:
 * 1. List approved vendor bills by due date
 * 2. User selects bills to include in payment run
 * 3. Create payment run (status: draft)
 * 4. Generate payment preview (total amount, vendor count)
 * 5. User confirms and approves payment run
 * 6. Execute payment run (mark bills paid, create GL entries)
 * 
 * **Payment Methods**:
 * - **ACH**: Generates NACHA file for electronic transfer
 * - **Wire**: Generates wire transfer instructions
 * - **Check**: Generates check printing file
 * 
 * **GL Impact**:
 * - DR: Accounts Payable (reduce liability)
 * - CR: Cash (reduce asset)
 * 
 * @param command - Payment run execution command
 * @returns Effect with payment run result or errors
 * 
 * @example
 * ```typescript
 * // Create, approve, and execute payment run
 * const result = yield* executeAPPaymentRun({
 *   billIds: ['bill-1', 'bill-2', 'bill-3'],
 *   runDate: new Date(),
 *   paymentMethod: 'ach',
 *   createdBy: 'user_123',
 *   tenant: 'funeral-home-1',
 *   autoApprove: true,
 *   autoExecute: true
 * });
 * 
 * console.log(`Paid ${result.billCount} bills totaling $${result.totalAmount}`);
 * console.log(`GL Journal: ${result.glJournalId}`);
 * ```
 */
export const executeAPPaymentRun = (
  command: ExecuteAPPaymentRunCommand
): Effect.Effect<
  ExecuteAPPaymentRunResult,
  NotFoundError | ValidationError | NetworkError,
  GoFinancialPortService
> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // Step 1: Validate we have bills to pay
    if (command.billIds.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Payment run must include at least one bill',
          field: 'billIds'
        })
      );
    }

    // Step 2: Fetch all bills to validate their status
    const bills = yield* Effect.all(
      command.billIds.map(billId => financialPort.getVendorBill(billId)),
      { concurrency: 'unbounded' }
    );

    // Step 3: Validate all bills are approved
    const unapprovedBills = bills.filter(bill => bill.status !== 'approved');
    if (unapprovedBills.length > 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: `${unapprovedBills.length} bill(s) are not approved: ${unapprovedBills.map(b => b.billNumber).join(', ')}`,
          field: 'billIds'
        })
      );
    }

    // Step 4: Calculate total amount
    const totalAmount = bills.reduce((sum, bill) => sum + bill.amountDue, 0);

    // Step 5: Create payment run command
    const createPaymentRunCommand: CreateAPPaymentRunCommand = {
      runDate: command.runDate,
      billIds: command.billIds,
      paymentMethod: command.paymentMethod,
      createdBy: command.createdBy,
      tenant: command.tenant,
      legalEntity: command.legalEntity,
      currency: command.currency
    };

    // Step 6: Create payment run in Go backend
    const paymentRun = yield* financialPort.createAPPaymentRun(createPaymentRunCommand);

    // Step 7: Approve payment run if autoApprove is true
    let approvedRun = paymentRun;
    if (command.autoApprove) {
      approvedRun = yield* financialPort.approveAPPaymentRun(
        paymentRun.id,
        command.createdBy
      );
    }

    // Step 8: Execute payment run if autoExecute is true
    let executed = false;
    let glJournalId: string | undefined;
    if (command.autoExecute && command.autoApprove) {
      const execution = yield* financialPort.executeAPPaymentRun({
        id: approvedRun.id,
        bankId: command.bankId
      });
      executed = true;
      glJournalId = execution.glJournalId;
    }

    // Step 9: Determine final status
    const finalStatus: 'draft' | 'approved' | 'completed' = 
      executed ? 'completed' :
      command.autoApprove ? 'approved' :
      'draft';

    // Step 10: Return result
    return {
      paymentRunId: approvedRun.id,
      runNumber: approvedRun.runNumber,
      billCount: command.billIds.length,
      totalAmount: totalAmount,
      paymentDate: command.runDate,
      status: finalStatus,
      glJournalId: glJournalId,
      executed: executed
    };
  });

/**
 * List Approved Bills Ready for Payment
 * 
 * Helper function to fetch approved bills by due date for payment run creation.
 * 
 * @param filters - Filter criteria for bills
 * @returns Effect with list of approved bills
 * 
 * @example
 * ```typescript
 * const bills = yield* listApprovedBillsForPayment({
 *   dueDateEnd: new Date('2024-12-31'),
 *   vendorId: 'vendor-123'
 * });
 * 
 * console.log(`Found ${bills.length} bills ready for payment`);
 * ```
 */
export const listApprovedBillsForPayment = (
  filters?: {
    dueDateEnd?: Date;
    vendorId?: string;
  }
): Effect.Effect<
  readonly GoVendorBill[],
  NetworkError,
  GoFinancialPortService
> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;
    
    // Fetch approved bills
    const allBills = yield* financialPort.listVendorBills({
      status: 'approved',
      vendorId: filters?.vendorId,
      endDate: filters?.dueDateEnd
    });

    // Filter by due date if provided
    if (filters?.dueDateEnd) {
      return allBills.filter(bill => 
        bill.dueDate <= filters.dueDateEnd!
      );
    }

    return allBills;
  });

/**
 * Get Payment Run Preview
 * 
 * Generates a preview of a payment run before execution.
 * Useful for UI confirmation dialogs.
 * 
 * @param billIds - Bills to include in preview
 * @returns Effect with payment run preview
 * 
 * @example
 * ```typescript
 * const preview = yield* getPaymentRunPreview(['bill-1', 'bill-2']);
 * 
 * console.log(`Total: $${preview.totalAmount}`);
 * console.log(`Vendors: ${preview.vendorCount}`);
 * ```
 */
export const getPaymentRunPreview = (
  billIds: readonly string[]
): Effect.Effect<
  {
    billCount: number;
    totalAmount: number;
    vendorCount: number;
    vendors: Array<{ vendorId: string; vendorName: string; amount: number }>;
  },
  NotFoundError | NetworkError,
  GoFinancialPortService
> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // Fetch all bills
    const bills = yield* Effect.all(
      billIds.map(billId => financialPort.getVendorBill(billId)),
      { concurrency: 'unbounded' }
    );

    // Calculate totals
    const totalAmount = bills.reduce((sum, bill) => sum + bill.amountDue, 0);

    // Group by vendor
    const vendorMap = new Map<string, { vendorId: string; vendorName: string; amount: number }>();
    
    for (const bill of bills) {
      const existing = vendorMap.get(bill.vendorId);
      if (existing) {
        existing.amount += bill.amountDue;
      } else {
        vendorMap.set(bill.vendorId, {
          vendorId: bill.vendorId,
          vendorName: bill.vendorName,
          amount: bill.amountDue
        });
      }
    }

    const vendors = Array.from(vendorMap.values());

    return {
      billCount: bills.length,
      totalAmount: totalAmount,
      vendorCount: vendors.length,
      vendors: vendors
    };
  });
