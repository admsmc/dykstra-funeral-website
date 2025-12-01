import { Effect } from 'effect';
import { GoPayrollPort, type GoPayrollPortService, NetworkError } from '../../ports/go-payroll-port';
import { GoFinancialPort, type GoFinancialPortService } from '../../ports/go-financial-port';
import { EXPENSE_ACCOUNTS, LIABILITY_ACCOUNTS, ValidationError } from '@dykstra/domain';

/**
 * Use Case 3.3: Case-Based Labor Costing
 * 
 * **Workflow**:
 * 1. Retrieve approved timesheets for a case
 * 2. Calculate total labor hours and costs for the case
 * 3. Create a labor cost GL journal entry
 * 4. Post to the case's job costing records
 * 
 * **Business Rules**:
 * - Only approved timesheets are included
 * - Labor cost = hours × hourly rate (from employee record)
 * - Debit: COGS - Professional Services (5110)
 * - Credit: Accrued Payroll (2200) or Case Work-in-Progress asset
 * 
 * **Error Cases**:
 * - ValidationError: No approved timesheets for case
 * - NetworkError: Go backend communication failure
 */

/**
 * Case Based Labor Costing
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

export interface CaseBasedLaborCostingCommand {
  readonly tenant: string;
  readonly caseId: string;
  readonly payPeriodStart: Date;
  readonly payPeriodEnd: Date;
}

export const calculateCaseBasedLaborCosting = (
  command: CaseBasedLaborCostingCommand
) =>
  Effect.gen(function* () {
    const payrollPort = yield* GoPayrollPort;
    const financialPort = yield* GoFinancialPort;

    // Retrieve all approved timesheets for the pay period
    const result = yield* payrollPort.listTimesheets({
      tenant: command.tenant,
      status: 'approved',
      from: command.payPeriodStart,
      to: command.payPeriodEnd,
    });

    if (result.items.length === 0) {
      return yield* Effect.fail(
        new ValidationError({ message: `No approved timesheets found for pay period` })
      );
    }

    // Calculate total labor hours and cost for this case
    // Note: GoPayrollWorkflowTimesheet.entries is readonly string[] (entry IDs)
    // We would need to fetch time entries separately to get case assignments
    // For now, we'll use a simplified approach with payroll line items
    
    // Use payroll run data instead (which has case assignments)
    // First, find payroll runs for this period
    const payrollRuns = yield* payrollPort.listPayrollRuns({
      startDate: command.payPeriodStart,
      endDate: command.payPeriodEnd,
      status: 'paid',
    });

    if (payrollRuns.length === 0) {
      return yield* Effect.fail(
        new ValidationError({ message: `No paid payroll runs found for pay period` })
      );
    }

    // Aggregate labor costs from all payroll runs
    let totalHours = 0;
    let totalLaborCost = 0;

    for (const run of payrollRuns) {
      const lineItems = yield* payrollPort.getPayrollLineItems(run.id);
      
      for (const item of lineItems) {
        // Filter to case assignments for this case
        const caseAssignments = item.caseAssignments.filter(
          assignment => assignment.caseId === command.caseId
        );
        
        if (caseAssignments.length > 0) {
          const caseHours = caseAssignments.reduce((sum, a) => sum + a.hours, 0);
          const hourlyRate = item.grossPay / (item.hoursWorked ?? 1);
          const caseLaborCost = caseHours * hourlyRate;
          
          totalHours += caseHours;
          totalLaborCost += caseLaborCost;
        }
      }
    }

    // Create GL journal entry for labor costing
    // DR: COGS - Professional Services (labor expense)
    // CR: Accrued Payroll (liability until paid)
    // Note: CreateJournalEntryCommand expects lines without accountNumber/accountName
    // The Go backend will look them up by accountId
    // For now, we'll need to fetch the account IDs first
    const expenseAccount = yield* financialPort.getGLAccountByNumber(EXPENSE_ACCOUNTS.COGS_PROFESSIONAL_SERVICES);
    const liabilityAccount = yield* financialPort.getGLAccountByNumber(LIABILITY_ACCOUNTS.ACCRUED_PAYROLL);
    
    const journalEntry = yield* financialPort.createJournalEntry({
      entryDate: new Date(),
      description: `Labor costing for case ${command.caseId}`,
      lines: [
        {
          accountId: expenseAccount.id,
          debit: totalLaborCost,
          credit: 0,
          description: `Labor cost for case ${command.caseId}: ${totalHours} hours`,
        },
        {
          accountId: liabilityAccount.id,
          debit: 0,
          credit: totalLaborCost,
          description: `Accrued labor cost for case ${command.caseId}`,
        },
      ],
    });

    // Post the journal entry to GL
    yield* financialPort.postJournalEntry(journalEntry.id);

    return {
      caseId: command.caseId,
      totalHours,
      totalLaborCost,
      payrollRunsProcessed: payrollRuns.length,
      journalEntryId: journalEntry.id,
    };
  }).pipe(
    Effect.withSpan('calculateCaseBasedLaborCosting', {
      attributes: {
        caseId: command.caseId,
        payPeriodStart: command.payPeriodStart.toISOString(),
        payPeriodEnd: command.payPeriodEnd.toISOString(),
      },
    })
  );

/**
 * Type helper for the Effect return
 */
export type CaseBasedLaborCostingEffect = Effect.Effect<
  {
    readonly caseId: string;
    readonly totalHours: number;
    readonly totalLaborCost: number;
    readonly payrollRunsProcessed: number;
    readonly journalEntryId: string;
  },
  ValidationError | NetworkError,
  GoPayrollPortService | GoFinancialPortService
>;
