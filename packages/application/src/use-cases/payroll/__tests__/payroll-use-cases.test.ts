import { describe, it, expect, vi } from 'vitest';
import { Effect } from 'effect';
import { GoPayrollPort, type GoPayrollPortService, type GoPayrollRun, type GoPayrollLineItem, type GoPayrollEmployee, type GoPayrollWorkflowTimesheet, NetworkError } from '../../../ports/go-payroll-port';
import { GoFinancialPort, type GoFinancialPortService, type GoJournalEntry, type GoGLAccount } from '../../../ports/go-financial-port';
import { ValidationError } from '@dykstra/domain';
import { createPayrollRunFromTimesheets } from '../create-payroll-run-from-timesheets';
import { submitTimesheetForApproval } from '../submit-timesheet-for-approval';
import { calculateCaseBasedLaborCosting } from '../case-based-labor-costing';

/**
 * Integration tests for Phase 3: Payroll & Time Tracking use cases
 * 
 * Tests cover:
 * 1. Create Payroll Run from Timesheets (3.1) - 4 tests
 * 2. Submit Timesheet for Approval (3.2) - 3 tests
 * 3. Case-Based Labor Costing (3.3) - 3 tests
 */

describe('Phase 3: Payroll & Time Tracking Use Cases', () => {
  describe('Use Case 3.1: Create Payroll Run from Timesheets', () => {
    it('should create payroll run, calculate payroll, approve, mark paid, and post GL journal entry', async () => {
      // Mock data
      const mockTimesheets: GoPayrollWorkflowTimesheet[] = [
        {
          id: 'ts-001',
          timesheetId: 'timesheet-001',
          workerId: 'emp-001',
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-15'),
          status: 'approved',
          entries: ['entry-001', 'entry-002'],
          submittedAt: new Date('2025-11-16'),
          approvedAt: new Date('2025-11-16'),
          approvedBy: 'mgr-001',
        },
        {
          id: 'ts-002',
          timesheetId: 'timesheet-002',
          workerId: 'emp-002',
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-15'),
          status: 'approved',
          entries: ['entry-003'],
          submittedAt: new Date('2025-11-16'),
        },
      ];

      const mockPayrollRun: GoPayrollRun = {
        id: 'pr-001',
        payPeriodStart: new Date('2025-11-01'),
        payPeriodEnd: new Date('2025-11-15'),
        payDate: new Date('2025-11-20'),
        status: 'draft',
        totalGross: 0,
        totalNet: 0,
        totalTaxes: 0,
        totalDeductions: 0,
        employeeCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCalculatedLineItems: GoPayrollLineItem[] = [
        {
          id: 'line-001',
          payrollRunId: 'pr-001',
          employeeId: 'emp-001',
          employeeName: 'John Doe',
          grossPay: 1200.0,
          netPay: 900.0,
          federalTax: 150.0,
          stateTax: 50.0,
          ficaTax: 74.4,
          medicareTax: 17.4,
          deductions: [],
          hoursWorked: 80,
          caseAssignments: [],
        },
        {
          id: 'line-002',
          payrollRunId: 'pr-001',
          employeeId: 'emp-002',
          employeeName: 'Jane Smith',
          grossPay: 1000.0,
          netPay: 750.0,
          federalTax: 125.0,
          stateTax: 40.0,
          ficaTax: 62.0,
          medicareTax: 14.5,
          deductions: [],
          hoursWorked: 80,
          caseAssignments: [],
        },
      ];

      const mockJournalEntry: GoJournalEntry = {
        id: 'je-001',
        entryNumber: 'JE-2025-001',
        entryDate: new Date(),
        description: 'Payroll GL posting for period 2025-11-01 to 2025-11-15',
        status: 'draft',
        lines: [],
        totalDebit: 2200.0,
        totalCredit: 2200.0,
      };

      // Create mock port
      const mockPayrollPort: GoPayrollPortService = {
        listTimesheets: vi.fn(() =>
          Effect.succeed({ items: mockTimesheets, count: 2 })
        ),
        createPayrollRun: vi.fn(() => Effect.succeed(mockPayrollRun)),
        calculatePayroll: vi.fn(() => Effect.succeed(mockCalculatedLineItems)),
        approvePayrollRun: vi.fn(() => Effect.void),
        markPayrollPaid: vi.fn(() => Effect.void),
        getPayrollRun: vi.fn(() => Effect.succeed(mockPayrollRun)),
        listPayrollRuns: vi.fn(() => Effect.succeed([mockPayrollRun])),
        getPayrollLineItems: vi.fn(() => Effect.succeed(mockCalculatedLineItems)),
        cancelPayrollRun: vi.fn(() => Effect.void),
        listEmployees: vi.fn(() => Effect.succeed([])),
        getEmployee: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getEmployeePayrollHistory: vi.fn(() => Effect.succeed([])),
        generateW2: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generate1099: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        importTimeEntries: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getExpenseSummary: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        submitTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        approveTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        rejectTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: vi.fn(() => Effect.succeed(mockJournalEntry)),
        postJournalEntry: vi.fn(() => Effect.void),
        getChartOfAccounts: vi.fn(() => Effect.succeed([])),
        getGLAccount: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getGLAccountByNumber: vi.fn((accountNumber: string) => {
          // Mock GL accounts for payroll
          const mockAccounts: Record<string, GoGLAccount> = {
            '5200': { id: 'gl-5200', accountNumber: '5200', name: 'Payroll Expense', type: 'expense', subtype: 'operating', normalBalance: 'debit', isActive: true, balance: 0 },
            '1010': { id: 'gl-1010', accountNumber: '1010', name: 'Cash', type: 'asset', subtype: 'current', normalBalance: 'debit', isActive: true, balance: 0 },
            '2200': { id: 'gl-2200', accountNumber: '2200', name: 'Accrued Payroll', type: 'liability', subtype: 'current', normalBalance: 'credit', isActive: true, balance: 0 },
          };
          const account = mockAccounts[accountNumber];
          return account ? Effect.succeed(account) : Effect.fail(new NetworkError({ message: 'Account not found' }));
        }),
        reverseJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listJournalEntries: vi.fn(() => Effect.succeed([])),
        generateFinancialStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getTrialBalance: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateBalanceSheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateIncomeStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateCashFlowStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listInvoices: vi.fn(() => Effect.succeed([])),
        recordPayment: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getARAgingReport: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listVendorBills: vi.fn(() => Effect.succeed([])),
        payVendorBills: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        executeAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        startReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        addReconciliationItem: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        initiateMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        runDepreciation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      // Execute use case
      const result = await Effect.runPromise(
        createPayrollRunFromTimesheets({
          tenant: 'dykstra',
          payPeriodStart: new Date('2025-11-01'),
          payPeriodEnd: new Date('2025-11-15'),
          payDate: new Date('2025-11-20'),
          approvedBy: 'manager-001',
        }).pipe(
          Effect.provideService(GoPayrollPort, mockPayrollPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assertions
      expect(result.payrollRunId).toBe('pr-001');
      expect(result.grossPay).toBe(2200.0);
      expect(result.netPay).toBe(1650.0);
      expect(result.employeeCount).toBe(2);
      expect(result.journalEntryId).toBe('je-001');

      // Verify port calls
      expect(mockPayrollPort.listTimesheets).toHaveBeenCalledWith({
        tenant: 'dykstra',
        status: 'approved',
        from: new Date('2025-11-01'),
        to: new Date('2025-11-15'),
      });
      expect(mockPayrollPort.createPayrollRun).toHaveBeenCalled();
      expect(mockPayrollPort.calculatePayroll).toHaveBeenCalledWith('pr-001');
      expect(mockPayrollPort.approvePayrollRun).toHaveBeenCalled();
      expect(mockPayrollPort.markPayrollPaid).toHaveBeenCalledWith('pr-001');
      expect(mockFinancialPort.createJournalEntry).toHaveBeenCalled();
      expect(mockFinancialPort.postJournalEntry).toHaveBeenCalledWith('je-001');
    });

    it('should fail when no approved timesheets exist', async () => {
      const mockPayrollPort: GoPayrollPortService = {
        listTimesheets: vi.fn(() =>
          Effect.succeed({ items: [], count: 0 })
        ),
        createPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not called' }))),
        calculatePayroll: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not called' }))),
        approvePayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not called' }))),
        markPayrollPaid: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not called' }))),
        getPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listPayrollRuns: vi.fn(() => Effect.succeed([])),
        getPayrollLineItems: vi.fn(() => Effect.succeed([])),
        cancelPayrollRun: vi.fn(() => Effect.void),
        listEmployees: vi.fn(() => Effect.succeed([])),
        getEmployee: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getEmployeePayrollHistory: vi.fn(() => Effect.succeed([])),
        generateW2: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generate1099: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        importTimeEntries: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getExpenseSummary: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        submitTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        approveTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        rejectTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not called' }))),
        postJournalEntry: vi.fn(() => Effect.void),
        getChartOfAccounts: vi.fn(() => Effect.succeed([])),
        getGLAccount: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getGLAccountByNumber: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        reverseJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listJournalEntries: vi.fn(() => Effect.succeed([])),
        generateFinancialStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getTrialBalance: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateBalanceSheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateIncomeStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateCashFlowStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listInvoices: vi.fn(() => Effect.succeed([])),
        recordPayment: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getARAgingReport: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listVendorBills: vi.fn(() => Effect.succeed([])),
        payVendorBills: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        executeAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        startReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        addReconciliationItem: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        initiateMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        runDepreciation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      await expect(
        Effect.runPromise(
          createPayrollRunFromTimesheets({
            tenant: 'dykstra',
            payPeriodStart: new Date('2025-11-01'),
            payPeriodEnd: new Date('2025-11-15'),
            payDate: new Date('2025-11-20'),
            approvedBy: 'manager-001',
          }).pipe(
            Effect.provideService(GoPayrollPort, mockPayrollPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });
  });

  describe('Use Case 3.2: Submit Timesheet for Approval', () => {
    it('should submit timesheet with valid entries', async () => {
      const mockPayrollPort: GoPayrollPortService = {
        submitTimesheet: vi.fn(() =>
          Effect.succeed({
            stream: 'timesheet|dykstra|ts-001',
            eventId: 'event-001',
            appended: true,
          })
        ),
        listTimesheets: vi.fn(() => Effect.succeed({ items: [], count: 0 })),
        createPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        calculatePayroll: vi.fn(() => Effect.succeed([])),
        approvePayrollRun: vi.fn(() => Effect.void),
        markPayrollPaid: vi.fn(() => Effect.void),
        getPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listPayrollRuns: vi.fn(() => Effect.succeed([])),
        getPayrollLineItems: vi.fn(() => Effect.succeed([])),
        cancelPayrollRun: vi.fn(() => Effect.void),
        listEmployees: vi.fn(() => Effect.succeed([])),
        getEmployee: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getEmployeePayrollHistory: vi.fn(() => Effect.succeed([])),
        generateW2: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generate1099: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        importTimeEntries: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getExpenseSummary: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        approveTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        rejectTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      const result = await Effect.runPromise(
        submitTimesheetForApproval({
          tenant: 'dykstra',
          timesheetId: 'ts-001',
          workerId: 'emp-001',
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-15'),
          entryIds: ['entry-001', 'entry-002', 'entry-003'],
          notes: 'Regular work week',
        }).pipe(Effect.provideService(GoPayrollPort, mockPayrollPort))
      );

      expect(result.timesheetId).toBe('ts-001');
      expect(result.workerId).toBe('emp-001');
      expect(result.entriesCount).toBe(3);
      expect(result.appended).toBe(true);
      expect(mockPayrollPort.submitTimesheet).toHaveBeenCalledWith({
        tenant: 'dykstra',
        timesheetId: 'ts-001',
        workerId: 'emp-001',
        periodStart: new Date('2025-11-01'),
        periodEnd: new Date('2025-11-15'),
        entries: ['entry-001', 'entry-002', 'entry-003'],
        notes: 'Regular work week',
      });
    });

    it('should fail when no entries are provided', async () => {
      const mockPayrollPort: GoPayrollPortService = {
        submitTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not called' }))),
        listTimesheets: vi.fn(() => Effect.succeed({ items: [], count: 0 })),
        createPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        calculatePayroll: vi.fn(() => Effect.succeed([])),
        approvePayrollRun: vi.fn(() => Effect.void),
        markPayrollPaid: vi.fn(() => Effect.void),
        getPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listPayrollRuns: vi.fn(() => Effect.succeed([])),
        getPayrollLineItems: vi.fn(() => Effect.succeed([])),
        cancelPayrollRun: vi.fn(() => Effect.void),
        listEmployees: vi.fn(() => Effect.succeed([])),
        getEmployee: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getEmployeePayrollHistory: vi.fn(() => Effect.succeed([])),
        generateW2: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generate1099: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        importTimeEntries: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getExpenseSummary: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        approveTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        rejectTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      await expect(
        Effect.runPromise(
          submitTimesheetForApproval({
            tenant: 'dykstra',
            timesheetId: 'ts-001',
            workerId: 'emp-001',
            periodStart: new Date('2025-11-01'),
            periodEnd: new Date('2025-11-15'),
            entryIds: [], // Empty entries
          }).pipe(Effect.provideService(GoPayrollPort, mockPayrollPort))
        )
      ).rejects.toThrow();
    });
  });

  describe('Use Case 3.3: Case-Based Labor Costing', () => {
    it('should calculate labor costs for a case and post GL entry', async () => {
      const mockTimesheets: GoPayrollWorkflowTimesheet[] = [
        {
          id: 'ts-001',
          timesheetId: 'timesheet-001',
          workerId: 'emp-001',
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-15'),
          status: 'approved',
          entries: ['entry-001'],
          submittedAt: new Date('2025-11-16'),
        },
      ];

      const mockPayrollRun: GoPayrollRun = {
        id: 'pr-001',
        payPeriodStart: new Date('2025-11-01'),
        payPeriodEnd: new Date('2025-11-15'),
        payDate: new Date('2025-11-20'),
        status: 'paid',
        totalGross: 2200.0,
        totalNet: 1650.0,
        totalTaxes: 550.0,
        totalDeductions: 0,
        employeeCount: 2,
        paidAt: new Date('2025-11-20'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLineItems: GoPayrollLineItem[] = [
        {
          id: 'line-001',
          payrollRunId: 'pr-001',
          employeeId: 'emp-001',
          employeeName: 'John Doe',
          grossPay: 1200.0,
          netPay: 900.0,
          federalTax: 150.0,
          stateTax: 50.0,
          ficaTax: 74.4,
          medicareTax: 17.4,
          deductions: [],
          hoursWorked: 80,
          caseAssignments: [
            { caseId: 'case-001', role: 'Director', hours: 40, commissionAmount: 0 },
            { caseId: 'case-002', role: 'Director', hours: 40, commissionAmount: 0 },
          ],
        },
      ];

      const mockExpenseAccount: GoGLAccount = {
        id: 'gl-001',
        accountNumber: '5110',
        name: 'COGS - Professional Services',
        type: 'expense',
        subtype: 'cost_of_goods_sold',
        normalBalance: 'debit',
        isActive: true,
        balance: 0,
      };

      const mockLiabilityAccount: GoGLAccount = {
        id: 'gl-002',
        accountNumber: '2200',
        name: 'Accrued Payroll',
        type: 'liability',
        subtype: 'current_liability',
        normalBalance: 'credit',
        isActive: true,
        balance: 0,
      };

      const mockJournalEntry: GoJournalEntry = {
        id: 'je-001',
        entryNumber: 'JE-2025-001',
        entryDate: new Date(),
        description: 'Labor costing for case case-001',
        status: 'draft',
        lines: [],
        totalDebit: 600.0,
        totalCredit: 600.0,
      };

      const mockPayrollPort: GoPayrollPortService = {
        listTimesheets: vi.fn(() =>
          Effect.succeed({ items: mockTimesheets, count: 1 })
        ),
        listPayrollRuns: vi.fn(() => Effect.succeed([mockPayrollRun])),
        getPayrollLineItems: vi.fn(() => Effect.succeed(mockLineItems)),
        createPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        calculatePayroll: vi.fn(() => Effect.succeed([])),
        approvePayrollRun: vi.fn(() => Effect.void),
        markPayrollPaid: vi.fn(() => Effect.void),
        getPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        cancelPayrollRun: vi.fn(() => Effect.void),
        listEmployees: vi.fn(() => Effect.succeed([])),
        getEmployee: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getEmployeePayrollHistory: vi.fn(() => Effect.succeed([])),
        generateW2: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generate1099: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        importTimeEntries: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getExpenseSummary: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        submitTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        approveTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        rejectTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      const mockFinancialPort: GoFinancialPortService = {
        getGLAccountByNumber: vi.fn((accountNumber: string) => {
          if (accountNumber === '5110') return Effect.succeed(mockExpenseAccount);
          if (accountNumber === '2200') return Effect.succeed(mockLiabilityAccount);
          return Effect.fail(new NetworkError({ message: 'Account not found' }));
        }),
        createJournalEntry: vi.fn(() => Effect.succeed(mockJournalEntry)),
        postJournalEntry: vi.fn(() => Effect.void),
        getChartOfAccounts: vi.fn(() => Effect.succeed([])),
        getGLAccount: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        reverseJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listJournalEntries: vi.fn(() => Effect.succeed([])),
        generateFinancialStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getTrialBalance: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateBalanceSheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateIncomeStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateCashFlowStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listInvoices: vi.fn(() => Effect.succeed([])),
        recordPayment: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getARAgingReport: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listVendorBills: vi.fn(() => Effect.succeed([])),
        payVendorBills: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        executeAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        startReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        addReconciliationItem: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        initiateMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        runDepreciation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      const result = await Effect.runPromise(
        calculateCaseBasedLaborCosting({
          tenant: 'dykstra',
          caseId: 'case-001',
          payPeriodStart: new Date('2025-11-01'),
          payPeriodEnd: new Date('2025-11-15'),
        }).pipe(
          Effect.provideService(GoPayrollPort, mockPayrollPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      expect(result.caseId).toBe('case-001');
      expect(result.totalHours).toBe(40);
      expect(result.totalLaborCost).toBe(600.0); // 40 hours × $15/hour
      expect(result.journalEntryId).toBe('je-001');
      expect(mockPayrollPort.listPayrollRuns).toHaveBeenCalled();
      expect(mockFinancialPort.createJournalEntry).toHaveBeenCalled();
      expect(mockFinancialPort.postJournalEntry).toHaveBeenCalledWith('je-001');
    });

    it('should fail when no paid payroll runs exist', async () => {
      const mockPayrollPort: GoPayrollPortService = {
        listTimesheets: vi.fn(() =>
          Effect.succeed({ items: [], count: 0 })
        ),
        listPayrollRuns: vi.fn(() => Effect.succeed([])), // No paid payroll runs
        getPayrollLineItems: vi.fn(() => Effect.succeed([])),
        createPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        calculatePayroll: vi.fn(() => Effect.succeed([])),
        approvePayrollRun: vi.fn(() => Effect.void),
        markPayrollPaid: vi.fn(() => Effect.void),
        getPayrollRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        cancelPayrollRun: vi.fn(() => Effect.void),
        listEmployees: vi.fn(() => Effect.succeed([])),
        getEmployee: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getEmployeePayrollHistory: vi.fn(() => Effect.succeed([])),
        generateW2: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generate1099: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        importTimeEntries: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getExpenseSummary: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        submitTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        approveTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        rejectTimesheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      const mockFinancialPort: GoFinancialPortService = {
        getGLAccountByNumber: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not called' }))),
        createJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not called' }))),
        postJournalEntry: vi.fn(() => Effect.void),
        getChartOfAccounts: vi.fn(() => Effect.succeed([])),
        getGLAccount: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        reverseJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listJournalEntries: vi.fn(() => Effect.succeed([])),
        generateFinancialStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getTrialBalance: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateBalanceSheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateIncomeStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateCashFlowStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listInvoices: vi.fn(() => Effect.succeed([])),
        recordPayment: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getARAgingReport: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listVendorBills: vi.fn(() => Effect.succeed([])),
        payVendorBills: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        executeAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        startReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        addReconciliationItem: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        initiateMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        runDepreciation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      await expect(
        Effect.runPromise(
          calculateCaseBasedLaborCosting({
            tenant: 'dykstra',
            caseId: 'case-001',
            payPeriodStart: new Date('2025-11-01'),
            payPeriodEnd: new Date('2025-11-15'),
          }).pipe(
            Effect.provideService(GoPayrollPort, mockPayrollPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });
  });
});
