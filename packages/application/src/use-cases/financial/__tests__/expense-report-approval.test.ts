import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  submitExpenseReport,
  approveExpenseReport,
  rejectExpenseReport,
  type SubmitExpenseReportCommand,
  type ApproveExpenseReportCommand,
  type RejectExpenseReportCommand,
} from '../expense-report-approval';
import {
  GoApprovalWorkflowPort,
  type GoApprovalWorkflowPortService,
  NetworkError,
  type GoApprovalRequest,
  type GoApprovalRequestStatus,
} from '../../../ports/go-approval-workflow-port';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  type GoVendorBill,
} from '../../../ports/go-financial-port';

const mockApprovalRequest: GoApprovalRequest = {
  id: 'approval-1',
  entityType: 'expense_report',
  entityId: 'EXP-1001',
  title: 'Travel Expenses - Client Visit',
  description: 'John Smith: Meeting with out-of-state family',
  requester: 'emp-123',
  priority: 'normal',
  status: 'pending' as GoApprovalRequestStatus,
  currentApprover: 'mgr-456',
  metadata: {
    employeeId: 'emp-123',
    employeeName: 'John Smith',
    totalAmount: '450.75',
    lineItemCount: '3',
  },
  createdAt: new Date('2024-01-15'),
  createdBy: 'emp-123',
};

const mockVendorBill: GoVendorBill = {
  id: 'bill-789',
  billNumber: 'EXP-EXP-1001',
  vendorId: 'emp-123',
  vendorName: 'John Smith (Employee)',
  billDate: new Date('2024-01-20'),
  dueDate: new Date('2024-02-19'),
  description: 'Expense reimbursement: Travel Expenses - Client Visit',
  lineItems: [
    {
      id: 'line-1',
      description: 'Employee expense reimbursement',
      quantity: 1,
      unitPrice: 450.75,
      totalAmount: 450.75,
      glAccountNumber: '5100',
    },
  ],
  subtotal: 450.75,
  totalAmount: 450.75,
  status: 'pending',
  createdAt: new Date('2024-01-20'),
  createdBy: 'mgr-456',
};

const baseSubmitCommand: SubmitExpenseReportCommand = {
  employeeId: 'emp-123',
  employeeName: 'John Smith',
  reportTitle: 'Travel Expenses - Client Visit',
  businessPurpose: 'Meeting with out-of-state family',
  lineItems: [
    {
      date: new Date('2024-01-10'),
      category: 'Travel',
      description: 'Airfare to Chicago',
      amount: 350.00,
      receiptAttached: true,
      glAccountNumber: '5200',
    },
    {
      date: new Date('2024-01-11'),
      category: 'Meals',
      description: 'Client dinner',
      amount: 75.50,
      receiptAttached: true,
      glAccountNumber: '5300',
    },
    {
      date: new Date('2024-01-11'),
      category: 'Lodging',
      description: 'Hotel',
      amount: 125.25,
      receiptAttached: true,
      glAccountNumber: '5400',
    },
  ],
  submittedBy: 'emp-123',
};

const baseApproveCommand: ApproveExpenseReportCommand = {
  approvalRequestId: 'approval-1',
  approverId: 'mgr-456',
  approverComments: 'Approved - valid business expenses',
};

const baseRejectCommand: RejectExpenseReportCommand = {
  approvalRequestId: 'approval-1',
  approverId: 'mgr-456',
  rejectionReason: 'Missing receipts for meals',
};

describe('Use Case 7.5: Expense Report Approval', () => {
  describe('Submit Expense Report', () => {
    describe('Happy Paths', () => {
      it('should submit expense report for approval', async () => {
        const mockApprovalWorkflowPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.succeed(mockApprovalRequest),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.fail(new NetworkError('Not implemented')),
          reject: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const result = await Effect.runPromise(
          submitExpenseReport(baseSubmitCommand).pipe(
            Effect.provide(Layer.succeed(GoApprovalWorkflowPort, mockApprovalWorkflowPort))
          )
        );

        expect(result.reportId).toBe('EXP-1001');
        expect(result.approvalRequestId).toBe('approval-1');
        expect(result.status).toBe('pending');
        expect(result.totalAmount).toBe(550.75); // 350 + 75.50 + 125.25
      });

      it('should mark high-value expenses as high priority', async () => {
        let capturedPriority: string | undefined;
        
        const mockApprovalWorkflowPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: (cmd) => {
            capturedPriority = cmd.priority;
            return Effect.succeed(mockApprovalRequest);
          },
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.fail(new NetworkError('Not implemented')),
          reject: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const highValueCommand = {
          ...baseSubmitCommand,
          lineItems: [
            {
              ...baseSubmitCommand.lineItems[0],
              amount: 2500.00, // Over $2000 threshold
            },
          ],
        };

        await Effect.runPromise(
          submitExpenseReport(highValueCommand).pipe(
            Effect.provide(Layer.succeed(GoApprovalWorkflowPort, mockApprovalWorkflowPort))
          )
        );

        expect(capturedPriority).toBe('high');
      });
    });

    describe('Validation Errors', () => {
      it('should fail when employee ID is missing', async () => {
        const invalidCommand = {
          ...baseSubmitCommand,
          employeeId: '',
        };

        const mockPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.fail(new NetworkError('Should not be called')),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.fail(new NetworkError('Not implemented')),
          reject: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const result = Effect.runPromise(
          submitExpenseReport(invalidCommand).pipe(
            Effect.provide(Layer.succeed(GoApprovalWorkflowPort, mockPort))
          )
        );

        await expect(result).rejects.toThrow('Employee ID is required');
      });

      it('should fail when line items have no receipts', async () => {
        const invalidCommand = {
          ...baseSubmitCommand,
          lineItems: [
            {
              ...baseSubmitCommand.lineItems[0],
              receiptAttached: false,
            },
          ],
        };

        const mockPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.fail(new NetworkError('Should not be called')),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.fail(new NetworkError('Not implemented')),
          reject: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const result = Effect.runPromise(
          submitExpenseReport(invalidCommand).pipe(
            Effect.provide(Layer.succeed(GoApprovalWorkflowPort, mockPort))
          )
        );

        await expect(result).rejects.toThrow('Receipt is required');
      });

      it('should fail when line items is empty', async () => {
        const invalidCommand = {
          ...baseSubmitCommand,
          lineItems: [],
        };

        const mockPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.fail(new NetworkError('Should not be called')),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.fail(new NetworkError('Not implemented')),
          reject: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const result = Effect.runPromise(
          submitExpenseReport(invalidCommand).pipe(
            Effect.provide(Layer.succeed(GoApprovalWorkflowPort, mockPort))
          )
        );

        await expect(result).rejects.toThrow('At least one line item is required');
      });
    });
  });

  describe('Approve Expense Report', () => {
    describe('Happy Paths', () => {
      it('should approve expense report and create vendor bill', async () => {
        const approvedRequest: GoApprovalRequest = {
          ...mockApprovalRequest,
          status: 'approved' as GoApprovalRequestStatus,
        };

        const mockApprovalWorkflowPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.succeed(approvedRequest),
          reject: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const mockFinancialPort: GoFinancialPortService = {
          createVendorBill: () => Effect.succeed(mockVendorBill),
          uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
          getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
          listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
          approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
          payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
          getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
          listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
          generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
          getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
          getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
          createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
          generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
          getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
          generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
          generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
          getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
          createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
          getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
          listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
          recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
          getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
          getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
          createRefund: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const result = await Effect.runPromise(
          approveExpenseReport(baseApproveCommand).pipe(
            Effect.provide(
              Layer.mergeAll(
                Layer.succeed(GoApprovalWorkflowPort, mockApprovalWorkflowPort),
                Layer.succeed(GoFinancialPort, mockFinancialPort)
              )
            )
          )
        );

        expect(result.status).toBe('approved');
        expect(result.vendorBillId).toBe('bill-789');
        expect(result.approvedAt).toBeDefined();
      });

      it('should handle partial approval (multi-level)', async () => {
        const partiallyApprovedRequest: GoApprovalRequest = {
          ...mockApprovalRequest,
          status: 'pending' as GoApprovalRequestStatus,
          currentApprover: 'exec-789', // Moved to executive approval
        };

        const mockApprovalWorkflowPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.succeed(partiallyApprovedRequest),
          reject: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const mockFinancialPort: GoFinancialPortService = {
          createVendorBill: () => Effect.fail(new NetworkError('Should not be called')),
          uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
          getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
          listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
          approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
          payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
          getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
          listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
          generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
          getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
          getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
          createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
          generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
          getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
          generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
          generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
          getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
          createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
          getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
          listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
          recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
          getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
          getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
          createRefund: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const result = await Effect.runPromise(
          approveExpenseReport(baseApproveCommand).pipe(
            Effect.provide(
              Layer.mergeAll(
                Layer.succeed(GoApprovalWorkflowPort, mockApprovalWorkflowPort),
                Layer.succeed(GoFinancialPort, mockFinancialPort)
              )
            )
          )
        );

        // Should remain pending, no vendor bill created
        expect(result.status).toBe('pending');
        expect(result.vendorBillId).toBeUndefined();
        expect(result.approvedAt).toBeUndefined();
      });
    });

    describe('Validation Errors', () => {
      it('should fail when approval request ID is missing', async () => {
        const invalidCommand = {
          ...baseApproveCommand,
          approvalRequestId: '',
        };

        const mockApprovalPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.fail(new NetworkError('Should not be called')),
          reject: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const mockFinancialPort: GoFinancialPortService = {
          createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
          uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
          getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
          listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
          approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
          payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
          getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
          listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
          generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
          getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
          getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
          createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
          listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
          generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
          getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
          generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
          generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
          getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
          createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
          getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
          listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
          recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
          getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
          getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
          createRefund: () => Effect.fail(new NetworkError('Not implemented')),
        };

        const result = Effect.runPromise(
          approveExpenseReport(invalidCommand).pipe(
            Effect.provide(
              Layer.mergeAll(
                Layer.succeed(GoApprovalWorkflowPort, mockApprovalPort),
                Layer.succeed(GoFinancialPort, mockFinancialPort)
              )
            )
          )
        );

        await expect(result).rejects.toThrow('Approval request ID is required');
      });
    });
  });

  describe('Reject Expense Report', () => {
    describe('Happy Paths', () => {
      it('should reject expense report', async () => {
        const rejectedRequest: GoApprovalRequest = {
          ...mockApprovalRequest,
          status: 'rejected' as GoApprovalRequestStatus,
        };

        const mockApprovalWorkflowPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.fail(new NetworkError('Not implemented')),
          reject: () => Effect.succeed(rejectedRequest),
        };

        const result = await Effect.runPromise(
          rejectExpenseReport(baseRejectCommand).pipe(
            Effect.provide(Layer.succeed(GoApprovalWorkflowPort, mockApprovalWorkflowPort))
          )
        );

        expect(result.status).toBe('rejected');
        expect(result.vendorBillId).toBeUndefined(); // No bill created on rejection
      });
    });

    describe('Validation Errors', () => {
      it('should fail when rejection reason is missing', async () => {
        const invalidCommand = {
          ...baseRejectCommand,
          rejectionReason: '',
        };

        const mockPort: GoApprovalWorkflowPortService = {
          createApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          getApprovalRequest: () => Effect.fail(new NetworkError('Not implemented')),
          listApprovalRequests: () => Effect.fail(new NetworkError('Not implemented')),
          approve: () => Effect.fail(new NetworkError('Not implemented')),
          reject: () => Effect.fail(new NetworkError('Should not be called')),
        };

        const result = Effect.runPromise(
          rejectExpenseReport(invalidCommand).pipe(
            Effect.provide(Layer.succeed(GoApprovalWorkflowPort, mockPort))
          )
        );

        await expect(result).rejects.toThrow('Rejection reason is required');
      });
    });
  });
});
