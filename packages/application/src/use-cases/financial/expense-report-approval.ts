import { Effect } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  GoApprovalWorkflowPort,
  type GoApprovalWorkflowPortService,
  type NetworkError,
} from '../../ports/go-approval-workflow-port';
import {
  GoFinancialPort,
  type GoFinancialPortService,
} from '../../ports/go-financial-port';

/**
 * Use Case 7.5: Expense Report Approval
 * 
 * Business Context:
 * Employees submit expense reports for reimbursement. These reports require
 * approval based on amount thresholds and employee roles. Once approved, a
 * vendor bill is created for payment processing.
 * 
 * Integration Points:
 * - Go Approval Workflow module: Multi-level approval routing
 * - Go Financial module: Vendor bill creation for reimbursement
 * 
 * Business Rules:
 * - Expenses > $500 require manager approval
 * - Expenses > $2000 require executive approval
 * - All receipts must be attached and readable
 * - Approved reports create vendor bills for payment
 * - Employee ID used as "vendor" in vendor bill
 */

/**
 * Expense Report Approval
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

export interface ExpenseReportLineItem {
  readonly date: Date;
  readonly category: string;
  readonly description: string;
  readonly amount: number;
  readonly receiptAttached: boolean;
  readonly glAccountNumber: string;
}

export interface SubmitExpenseReportCommand {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly reportTitle: string;
  readonly businessPurpose: string;
  readonly lineItems: readonly ExpenseReportLineItem[];
  readonly submittedBy: string;
}

export interface ApproveExpenseReportCommand {
  readonly approvalRequestId: string;
  readonly approverId: string;
  readonly approverComments?: string;
}

export interface RejectExpenseReportCommand {
  readonly approvalRequestId: string;
  readonly approverId: string;
  readonly rejectionReason: string;
}

export interface ExpenseReportResult {
  readonly reportId: string;
  readonly approvalRequestId: string;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly totalAmount: number;
  readonly vendorBillId?: string; // Present when approved and bill created
  readonly approvedAt?: Date;
}

/**
 * Submit an expense report for approval
 */
export function submitExpenseReport(
  command: SubmitExpenseReportCommand
): Effect.Effect<ExpenseReportResult, ValidationError | NetworkError, GoApprovalWorkflowPortService> {
  return Effect.gen(function* () {
    // Step 1: Validate command
    yield* validateSubmitExpenseReportCommand(command);
    
    // Step 2: Calculate total amount
    const totalAmount = command.lineItems.reduce((sum, item) => sum + item.amount, 0);
    
    
    // Step 4: Submit to approval workflow
    const approvalWorkflowPort = yield* GoApprovalWorkflowPort;
    const entityId = `EXP-${Date.now()}`;
    const approvalRequest = yield* approvalWorkflowPort.createApprovalRequest(
      'expense_report',
      entityId,
      command.submittedBy
    );
    
    return {
      reportId: approvalRequest.entityId,
      approvalRequestId: approvalRequest.id,
      status: 'pending',
      totalAmount,
    };
  });
}

/**
 * Approve an expense report and create vendor bill for payment
 */
export function approveExpenseReport(
  command: ApproveExpenseReportCommand
): Effect.Effect<
  ExpenseReportResult,
  ValidationError | NetworkError,
  GoApprovalWorkflowPortService | GoFinancialPortService
> {
  return Effect.gen(function* () {
    // Step 1: Validate command
    yield* validateApproveExpenseReportCommand(command);
    
    // Step 2: Approve the request
    const approvalWorkflowPort = yield* GoApprovalWorkflowPort;
    yield* approvalWorkflowPort.approveRequest(
      command.approvalRequestId,
      command.approverId,
      command.approverComments
    );
    
    // Step 3: Get approval details
    const approvalHistory = yield* approvalWorkflowPort.getApprovalHistory(
      'expense_report',
      command.approvalRequestId
    );
    const approval = approvalHistory[0];
    if (!approval) throw new Error('Approval not found');
    
    const isFullyApproved = approval.status === 'approved';
    
    let vendorBillId: string | undefined;
    
    if (isFullyApproved) {
      // Step 4: Create vendor bill for reimbursement payment
      // In production, would fetch full expense report details
      const financialPort = yield* GoFinancialPort;
      const vendorBill = yield* financialPort.createVendorBill({
        vendorId: 'employee',
        billDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [
          {
            description: 'Employee expense reimbursement',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            glAccountId: '5100',
          },
        ],
      });
      
      vendorBillId = vendorBill.id;
    }
    
    return {
      reportId: command.approvalRequestId,
      approvalRequestId: command.approvalRequestId,
      status: isFullyApproved ? 'approved' : 'pending',
      totalAmount: 100,
      vendorBillId,
      approvedAt: isFullyApproved ? new Date() : undefined,
    };
  });
}

/**
 * Reject an expense report
 */
export function rejectExpenseReport(
  command: RejectExpenseReportCommand
): Effect.Effect<ExpenseReportResult, ValidationError | NetworkError, GoApprovalWorkflowPortService> {
  return Effect.gen(function* () {
    // Step 1: Validate command
    yield* validateRejectExpenseReportCommand(command);
    
    // Step 2: Reject the request
    const approvalWorkflowPort = yield* GoApprovalWorkflowPort;
    yield* approvalWorkflowPort.rejectRequest(
      command.approvalRequestId,
      command.approverId,
      command.rejectionReason
    );
    
    return {
      reportId: command.approvalRequestId,
      approvalRequestId: command.approvalRequestId,
      status: 'rejected',
      totalAmount: 100,
    };
  });
}

/**
 * Validate submit expense report command
 */
function validateSubmitExpenseReportCommand(
  command: SubmitExpenseReportCommand
): Effect.Effect<void, ValidationError> {
  return Effect.gen(function* () {
    const errors: string[] = [];
    
    if (!command.employeeId?.trim()) {
      errors.push('Employee ID is required');
    }
    
    if (!command.employeeName?.trim()) {
      errors.push('Employee name is required');
    }
    
    if (!command.reportTitle?.trim()) {
      errors.push('Report title is required');
    }
    
    if (!command.businessPurpose?.trim()) {
      errors.push('Business purpose is required');
    }
    
    if (!command.lineItems || command.lineItems.length === 0) {
      errors.push('At least one line item is required');
    }
    
    if (command.lineItems) {
      for (const [index, item] of command.lineItems.entries()) {
        if (!item.category?.trim()) {
          errors.push(`Line item ${index + 1}: Category is required`);
        }
        
        if (!item.description?.trim()) {
          errors.push(`Line item ${index + 1}: Description is required`);
        }
        
        if (typeof item.amount !== 'number' || item.amount <= 0) {
          errors.push(`Line item ${index + 1}: Amount must be positive`);
        }
        
        if (!item.receiptAttached) {
          errors.push(`Line item ${index + 1}: Receipt is required`);
        }
        
        if (!item.glAccountNumber?.trim()) {
          errors.push(`Line item ${index + 1}: GL account number is required`);
        }
      }
    }
    
    if (!command.submittedBy?.trim()) {
      errors.push('Submitter ID is required');
    }
    
    if (errors.length > 0) {
      return yield* Effect.fail(new ValidationError({ message: errors.join('; ') }));
    }
  });
}

/**
 * Validate approve expense report command
 */
function validateApproveExpenseReportCommand(
  command: ApproveExpenseReportCommand
): Effect.Effect<void, ValidationError> {
  return Effect.gen(function* () {
    const errors: string[] = [];
    
    if (!command.approvalRequestId?.trim()) {
      errors.push('Approval request ID is required');
    }
    
    if (!command.approverId?.trim()) {
      errors.push('Approver ID is required');
    }
    
    if (errors.length > 0) {
      return yield* Effect.fail(new ValidationError({ message: errors.join('; ') }));
    }
  });
}

/**
 * Validate reject expense report command
 */
function validateRejectExpenseReportCommand(
  command: RejectExpenseReportCommand
): Effect.Effect<void, ValidationError> {
  return Effect.gen(function* () {
    const errors: string[] = [];
    
    if (!command.approvalRequestId?.trim()) {
      errors.push('Approval request ID is required');
    }
    
    if (!command.approverId?.trim()) {
      errors.push('Approver ID is required');
    }
    
    if (!command.rejectionReason?.trim()) {
      errors.push('Rejection reason is required');
    }
    
    if (errors.length > 0) {
      return yield* Effect.fail(new ValidationError({ message: errors.join('; ') }));
    }
  });
}
