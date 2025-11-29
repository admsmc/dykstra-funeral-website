import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NotFoundError, NetworkError };

/**
 * Go Payroll domain types
 * Michigan-compliant payroll with dual-ledger (HCM + Payroll) support
 */
export interface GoPayrollRun {
  readonly id: string;
  readonly payPeriodStart: Date;
  readonly payPeriodEnd: Date;
  readonly payDate: Date;
  readonly status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  readonly totalGross: number;
  readonly totalNet: number;
  readonly totalTaxes: number;
  readonly totalDeductions: number;
  readonly employeeCount: number;
  readonly calculatedAt?: Date;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly paidAt?: Date;
  readonly nachaFileId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GoPayrollEmployee {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly employmentType: 'W2_HOURLY' | 'W2_SALARY' | '1099_CONTRACTOR';
  readonly status: 'active' | 'terminated' | 'on_leave';
  readonly hireDate: Date;
  readonly terminationDate?: Date;
  readonly payRate: number;
  readonly payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  readonly federalWithholding: GoTaxWithholding;
  readonly stateWithholding: GoTaxWithholding;
  readonly directDeposit?: GoDirectDeposit;
}

export interface GoTaxWithholding {
  readonly filingStatus: 'single' | 'married' | 'married_separate' | 'head_of_household';
  readonly allowances: number;
  readonly additionalWithholding: number;
}

export interface GoDirectDeposit {
  readonly routingNumber: string;
  readonly accountNumber: string;
  readonly accountType: 'checking' | 'savings';
}

export interface GoPayrollLineItem {
  readonly id: string;
  readonly payrollRunId: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly grossPay: number;
  readonly netPay: number;
  readonly federalTax: number;
  readonly stateTax: number;
  readonly ficaTax: number;
  readonly medicareTax: number;
  readonly deductions: readonly GoDeduction[];
  readonly hoursWorked?: number;
  readonly caseAssignments: readonly GoCaseAssignment[];
}

export interface GoDeduction {
  readonly type: string;
  readonly description: string;
  readonly amount: number;
}

export interface GoCaseAssignment {
  readonly caseId: string;
  readonly role: string;
  readonly hours: number;
  readonly commissionAmount: number;
}

export interface CreatePayrollRunCommand {
  readonly payPeriodStart: Date;
  readonly payPeriodEnd: Date;
  readonly payDate: Date;
}

export interface ApprovePayrollRunCommand {
  readonly approvedBy: string;
  readonly notes?: string;
}

export interface ImportTimeEntriesCommand {
  readonly payPeriodId: string;
  readonly entries: readonly GoTimeEntryImport[];
}

export interface GoTimeEntryImport {
  readonly employeeId: string;
  readonly date: Date;
  readonly hours: number;
  readonly caseId?: string;
  readonly description?: string;
}

export interface GoTimeEntryImportResult {
  readonly imported: number;
  readonly failed: number;
  readonly errors: readonly { employeeId: string; reason: string }[];
}

export interface GoPayrollExpenseSummary {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly totalGross: number;
  readonly totalNet: number;
  readonly totalTaxes: number;
  readonly totalBenefits: number;
  readonly totalEmployerTaxes: number;
  readonly groups: readonly GoExpenseGroup[];
}

export interface GoExpenseGroup {
  readonly groupKey: string;
  readonly groupName: string;
  readonly totalGross: number;
  readonly totalNet: number;
  readonly employeeCount: number;
}

export interface GoPayrollWorkflowTimesheet {
  readonly id: string;
  readonly timesheetId: string;
  readonly workerId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly status: 'submitted' | 'approved' | 'rejected';
  readonly entries: readonly string[];
  readonly notes?: string;
  readonly submittedAt: Date;
  readonly approvedAt?: Date;
  readonly approvedBy?: string;
  readonly rejectedAt?: Date;
  readonly rejectedBy?: string;
  readonly rejectionReason?: string;
}

/**
 * Go Payroll Port
 * 
 * Defines interface for Michigan-compliant payroll processing.
 * Integrates with dual-ledger pattern (HCM + Payroll) and TigerBeetle accounting.
 * 
 * Features:
 * - Michigan state tax calculations
 * - W-2 and 1099 support
 * - Direct deposit (NACHA file generation)
 * - Case-based commission tracking
 * - Time tracking integration
 * 
 * Backend: Go ERP with event sourcing and TigerBeetle
 */
export interface GoPayrollPortService {
  /**
   * Create a new payroll run
   * 
   * Backend operation:
   * 1. Validates pay period doesn't overlap existing runs
   * 2. Creates payroll run aggregate
   * 3. Emits PayrollRunCreated event
   */
  readonly createPayrollRun: (
    command: CreatePayrollRunCommand
  ) => Effect.Effect<GoPayrollRun, NetworkError>;
  
  /**
   * Get payroll run by ID
   */
  readonly getPayrollRun: (
    id: string
  ) => Effect.Effect<GoPayrollRun, NotFoundError | NetworkError>;
  
  /**
   * List payroll runs with optional filters
   */
  readonly listPayrollRuns: (
    filters?: {
      status?: GoPayrollRun['status'];
      startDate?: Date;
      endDate?: Date;
    }
  ) => Effect.Effect<readonly GoPayrollRun[], NetworkError>;
  
  /**
   * Calculate payroll (Michigan tax rules)
   * 
   * Backend operation:
   * 1. Fetches timesheets for pay period
   * 2. Calculates gross pay
   * 3. Applies Michigan state tax withholding
   * 4. Calculates federal tax, FICA, Medicare
   * 5. Processes deductions
   * 6. Emits PayrollCalculated event
   */
  readonly calculatePayroll: (
    id: string
  ) => Effect.Effect<readonly GoPayrollLineItem[], NetworkError>;
  
  /**
   * Get payroll line items for a run
   */
  readonly getPayrollLineItems: (
    payrollRunId: string
  ) => Effect.Effect<readonly GoPayrollLineItem[], NetworkError>;
  
  /**
   * Approve payroll run
   * 
   * Backend operation:
   * 1. Validates run is calculated
   * 2. Records approval
   * 3. Emits PayrollApproved event
   * 4. Triggers NACHA file generation
   */
  readonly approvePayrollRun: (
    id: string,
    command: ApprovePayrollRunCommand
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Mark payroll as paid (after ACH processing)
   * 
   * Backend operation:
   * 1. Posts to TigerBeetle (payroll expense accounts)
   * 2. Posts to GL (debits/credits)
   * 3. Emits PayrollPaid event
   */
  readonly markPayrollPaid: (
    id: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Cancel payroll run (only if not yet paid)
   */
  readonly cancelPayrollRun: (
    id: string,
    reason: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * List employees (active, terminated, on leave)
   */
  readonly listEmployees: (
    filters?: {
      status?: GoPayrollEmployee['status'];
      employmentType?: GoPayrollEmployee['employmentType'];
    }
  ) => Effect.Effect<readonly GoPayrollEmployee[], NetworkError>;
  
  /**
   * Get employee by ID
   */
  readonly getEmployee: (
    id: string
  ) => Effect.Effect<GoPayrollEmployee, NotFoundError | NetworkError>;
  
  /**
   * Get employee payroll history (past pay stubs)
   */
  readonly getEmployeePayrollHistory: (
    employeeId: string,
    startDate?: Date,
    endDate?: Date
  ) => Effect.Effect<readonly GoPayrollLineItem[], NetworkError>;
  
  /**
   * Generate W-2 for employee (year-end)
   */
  readonly generateW2: (
    employeeId: string,
    taxYear: number
  ) => Effect.Effect<GoW2Form, NetworkError>;
  
  /**
   * Generate 1099 for contractor (year-end)
   */
  readonly generate1099: (
    contractorId: string,
    taxYear: number
  ) => Effect.Effect<Go1099Form, NetworkError>;
  
  /**
   * Import time entries from CRM
   * 
   * Backend operation:
   * 1. Validates time entries format
   * 2. Links to employees
   * 3. Associates with pay period
   * 4. Emits TimeEntriesImported event
   * 5. Makes available for payroll calculation
   */
  readonly importTimeEntries: (
    command: ImportTimeEntriesCommand
  ) => Effect.Effect<GoTimeEntryImportResult, NetworkError>;
  
  /**
   * Get payroll expense summary for reporting
   * 
   * Backend operation:
   * 1. Aggregates payroll expenses by period
   * 2. Groups by department/cost center
   * 3. Includes employer taxes and benefits
   */
  readonly getExpenseSummary: (
    startDate: Date,
    endDate: Date,
    groupBy?: 'department' | 'employee' | 'cost_center'
  ) => Effect.Effect<GoPayrollExpenseSummary, NetworkError>;
  
  /**
   * Submit timesheet for approval
   * 
   * Backend: POST /ps/timesheets/submit
   * Pattern: Event-sourced workflow (not bulk import)
   * Stream: timesheet|{tenant}|{id}
   */
  readonly submitTimesheet: (command: {
    tenant: string;
    timesheetId: string;
    workerId: string;
    periodStart: Date;
    periodEnd: Date;
    entries: readonly string[];  // Time entry IDs (created separately)
    notes?: string;
  }) => Effect.Effect<{
    stream: string;
    eventId: string;
    appended: boolean;
  }, NetworkError>;
  
  /**
   * Approve timesheet
   * 
   * Backend: POST /ps/timesheets/{id}/approve
   */
  readonly approveTimesheet: (params: {
    timesheetId: string;
    tenant: string;
    actor: string;  // Manager ID
  }) => Effect.Effect<{
    stream: string;
    eventId: string;
    appended: boolean;
  }, NetworkError>;
  
  /**
   * Reject timesheet
   * 
   * Backend: POST /ps/timesheets/{id}/reject
   */
  readonly rejectTimesheet: (params: {
    timesheetId: string;
    tenant: string;
    actor: string;
    reason: string;
  }) => Effect.Effect<{
    stream: string;
    eventId: string;
    appended: boolean;
  }, NetworkError>;
  
  /**
   * List timesheets
   * 
   * Backend: GET /ps/timesheets
   */
  readonly listTimesheets: (query: {
    tenant: string;
    workerId?: string;
    status?: 'submitted' | 'approved' | 'rejected';
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) => Effect.Effect<{
    items: readonly GoPayrollWorkflowTimesheet[];
    count: number;
  }, NetworkError>;
}

export interface GoW2Form {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly employeeSSN: string;
  readonly taxYear: number;
  readonly wages: number;
  readonly federalTaxWithheld: number;
  readonly socialSecurityWages: number;
  readonly socialSecurityTaxWithheld: number;
  readonly medicareWages: number;
  readonly medicareTaxWithheld: number;
  readonly stateTaxWithheld: number;
  readonly pdfUrl: string;
}

export interface Go1099Form {
  readonly contractorId: string;
  readonly contractorName: string;
  readonly contractorTIN: string;
  readonly taxYear: number;
  readonly nonemployeeCompensation: number;
  readonly pdfUrl: string;
}

/**
 * Go Payroll Port service tag for dependency injection
 */
export const GoPayrollPort = Context.GenericTag<GoPayrollPortService>(
  '@dykstra/GoPayrollPort'
);
