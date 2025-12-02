import { Effect } from 'effect';
import { GoPayrollPort, type GoPayrollPortService, type NetworkError } from '../../ports/go-payroll-port';
import { GoFinancialPort, type GoFinancialPortService } from '../../ports/go-financial-port';
import { ValidationError, PAYROLL_EXPENSE_ACCOUNTS } from '@dykstra/domain';

/**
 * Use Case 3.1: Create Payroll Run from Timesheets
 * 
 * Creates a payroll run, calculates payroll, approves it, marks it as paid,
 * and posts a GL journal entry for payroll expenses.
 * 
 * @see docs/Implement 35 Critical Use Cases with Verified Go Backend Ports.md - Phase 3, Use Case 3.1
 */

/**
 * Create Payroll Run From Timesheets
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

export interface CreatePayrollRunFromTimesheetsCommand {
  readonly tenant: string;
  readonly payPeriodStart: Date;
  readonly payPeriodEnd: Date;
  readonly payDate: Date;
  readonly approvedBy: string;
}

export interface CreatePayrollRunFromTimesheetsResult {
  readonly payrollRunId: string;
  readonly employeeCount: number;
  readonly grossPay: number;
  readonly netPay: number;
  readonly taxesWithheld: number;
  readonly journalEntryId: string;
  readonly payDate: Date;
}

export const createPayrollRunFromTimesheets = (
  command: CreatePayrollRunFromTimesheetsCommand
): Effect.Effect<
  CreatePayrollRunFromTimesheetsResult,
  ValidationError | NetworkError | import('@dykstra/domain').NotFoundError,
  GoPayrollPortService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    const payrollPort = yield* GoPayrollPort;
    const financialPort = yield* GoFinancialPort;

    // Step 1: List approved timesheets for pay period
    const timesheetsResponse = yield* payrollPort.listTimesheets({
      tenant: command.tenant,
      status: 'approved',
      from: command.payPeriodStart,
      to: command.payPeriodEnd,
    });

    // Step 2: Validate all timesheets are approved
    if (timesheetsResponse.count === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'No approved timesheets found for pay period',
          field: 'timesheets',
        })
      );
    }

    // Step 3: Create payroll run
    const payrollRun = yield* payrollPort.createPayrollRun({
      payPeriodStart: command.payPeriodStart,
      payPeriodEnd: command.payPeriodEnd,
      payDate: command.payDate,
    });

    // Step 4: Calculate payroll
    const lineItems = yield* payrollPort.calculatePayroll(payrollRun.id);

    // Step 5: Approve payroll run
    yield* payrollPort.approvePayrollRun(payrollRun.id, {
      approvedBy: command.approvedBy,
    });

    // Step 6: Mark as paid (posts to GL)
    yield* payrollPort.markPayrollPaid(payrollRun.id);

    // Step 7: Create GL journal entry for payroll expense
    const totalGross = lineItems.reduce((sum, item) => sum + item.grossPay, 0);
    const totalNet = lineItems.reduce((sum, item) => sum + item.netPay, 0);
    const totalTaxes = totalGross - totalNet;

    // Fetch account IDs by account number
    const wagesExpenseAccount = yield* financialPort.getGLAccountByNumber(PAYROLL_EXPENSE_ACCOUNTS.WAGES_EXPENSE);
    const cashAccount = yield* financialPort.getGLAccountByNumber(PAYROLL_EXPENSE_ACCOUNTS.CASH);
    const liabilitiesAccount = yield* financialPort.getGLAccountByNumber(PAYROLL_EXPENSE_ACCOUNTS.PAYROLL_LIABILITIES);

    const journalEntry = yield* financialPort.createJournalEntry({
      entryDate: command.payDate,
      description: `Payroll for period ${command.payPeriodStart.toISOString().slice(0, 10)} to ${command.payPeriodEnd.toISOString().slice(0, 10)}`,
      lines: [
        {
          accountId: wagesExpenseAccount.id,
          debit: totalGross,
          credit: 0,
          description: 'Gross wages',
        },
        {
          accountId: cashAccount.id,
          debit: 0,
          credit: totalNet,
          description: 'Net pay disbursement',
        },
        {
          accountId: liabilitiesAccount.id,
          debit: 0,
          credit: totalTaxes,
          description: 'Tax withholdings payable',
        },
      ],
    });

    yield* financialPort.postJournalEntry(journalEntry.id);

    return {
      payrollRunId: payrollRun.id,
      employeeCount: lineItems.length,
      grossPay: totalGross,
      netPay: totalNet,
      taxesWithheld: totalTaxes,
      journalEntryId: journalEntry.id,
      payDate: command.payDate,
    };
  });
