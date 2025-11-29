import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NotFoundError, NetworkError };

/**
 * Go Timesheet domain types
 * Time tracking and approval workflow for payroll integration
 */

export interface GoTimesheet {
  readonly id: string;
  readonly timesheetNumber: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly weekEnding: Date;
  readonly status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  readonly entries: readonly GoTimesheetEntry[];
  readonly totalHours: number;
  readonly totalRegularHours: number;
  readonly totalOvertimeHours: number;
  readonly submittedAt?: Date;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly rejectedBy?: string;
  readonly rejectedAt?: Date;
  readonly rejectionReason?: string;
  readonly payrollRunId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GoTimesheetEntry {
  readonly id: string;
  readonly date: Date;
  readonly caseId?: string;
  readonly projectCode?: string;
  readonly description: string;
  readonly regularHours: number;
  readonly overtimeHours: number;
  readonly totalHours: number;
  readonly billable: boolean;
  readonly rate?: number;
}

export interface GoTimesheetSummary {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly weekEnding: Date;
  readonly totalHours: number;
  readonly status: GoTimesheet['status'];
  readonly submittedAt?: Date;
}

export interface GoPayPeriodTimesheets {
  readonly payPeriodStart: Date;
  readonly payPeriodEnd: Date;
  readonly timesheets: readonly GoTimesheet[];
  readonly totalEmployees: number;
  readonly submittedCount: number;
  readonly approvedCount: number;
  readonly pendingCount: number;
  readonly totalHours: number;
}

// Commands
export interface CreateTimesheetCommand {
  readonly employeeId: string;
  readonly weekEnding: Date;
}

export interface AddTimesheetEntryCommand {
  readonly date: Date;
  readonly caseId?: string;
  readonly projectCode?: string;
  readonly description: string;
  readonly regularHours: number;
  readonly overtimeHours?: number;
  readonly billable?: boolean;
}

export interface UpdateTimesheetEntryCommand {
  readonly date?: Date;
  readonly caseId?: string;
  readonly projectCode?: string;
  readonly description?: string;
  readonly regularHours?: number;
  readonly overtimeHours?: number;
  readonly billable?: boolean;
}

export interface BulkApproveTimesheetsCommand {
  readonly timesheetIds: readonly string[];
  readonly approvedBy: string;
}

/**
 * Go Timesheet Port
 * 
 * Defines interface for time tracking and approval workflows.
 * Integrates with payroll processing and case-based billing.
 * 
 * Features:
 * - Weekly timesheet creation and entry
 * - Manager approval workflows
 * - Overtime tracking
 * - Case/project assignment
 * - Billable hours tracking
 * - Payroll integration
 * - Timesheet reporting and analytics
 * 
 * Backend: Go ERP with event sourcing and payroll integration
 */
export interface GoTimesheetPortService {
  /**
   * Create a new timesheet for employee
   * 
   * Backend operation:
   * 1. Validates employee exists
   * 2. Creates timesheet aggregate
   * 3. Emits TimesheetCreated event
   * 4. Status: draft
   */
  readonly createTimesheet: (
    command: CreateTimesheetCommand
  ) => Effect.Effect<GoTimesheet, NetworkError>;
  
  /**
   * Get timesheet by ID
   */
  readonly getTimesheet: (
    id: string
  ) => Effect.Effect<GoTimesheet, NotFoundError | NetworkError>;
  
  /**
   * List timesheets with filters
   */
  readonly listTimesheets: (
    filters?: {
      employeeId?: string;
      weekEnding?: Date;
      status?: GoTimesheet['status'];
      startDate?: Date;
      endDate?: Date;
    }
  ) => Effect.Effect<readonly GoTimesheet[], NetworkError>;
  
  /**
   * Get timesheet summary for employee
   * Returns list of timesheet summaries for a given period
   */
  readonly getTimesheetSummaries: (
    employeeId: string,
    startDate: Date,
    endDate: Date
  ) => Effect.Effect<readonly GoTimesheetSummary[], NetworkError>;
  
  /**
   * Add entry to timesheet
   * 
   * Backend operation:
   * 1. Validates timesheet is in draft status
   * 2. Adds entry
   * 3. Emits TimesheetEntryAdded event
   * 4. Recalculates total hours
   */
  readonly addTimesheetEntry: (
    timesheetId: string,
    command: AddTimesheetEntryCommand
  ) => Effect.Effect<GoTimesheetEntry, NetworkError>;
  
  /**
   * Update timesheet entry
   * 
   * Backend operation:
   * 1. Validates timesheet is in draft status
   * 2. Updates entry
   * 3. Emits TimesheetEntryUpdated event
   * 4. Recalculates total hours
   */
  readonly updateTimesheetEntry: (
    timesheetId: string,
    entryId: string,
    command: UpdateTimesheetEntryCommand
  ) => Effect.Effect<GoTimesheetEntry, NetworkError>;
  
  /**
   * Delete timesheet entry
   * 
   * Backend operation:
   * 1. Validates timesheet is in draft status
   * 2. Removes entry
   * 3. Emits TimesheetEntryDeleted event
   * 4. Recalculates total hours
   */
  readonly deleteTimesheetEntry: (
    timesheetId: string,
    entryId: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Submit timesheet for approval
   * 
   * Backend operation:
   * 1. Validates timesheet is in draft status
   * 2. Validates all required fields present
   * 3. Submits timesheet
   * 4. Emits TimesheetSubmitted event
   * 5. Transitions to submitted status
   * 6. Routes to manager for approval
   */
  readonly submitTimesheet: (
    id: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Approve timesheet
   * 
   * Backend operation:
   * 1. Validates timesheet is submitted
   * 2. Records approval
   * 3. Emits TimesheetApproved event
   * 4. Transitions to approved status
   * 5. Makes available for payroll processing
   */
  readonly approveTimesheet: (
    id: string,
    approvedBy: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Reject timesheet
   * 
   * Backend operation:
   * 1. Validates timesheet is submitted
   * 2. Records rejection
   * 3. Emits TimesheetRejected event
   * 4. Transitions to rejected status
   * 5. Returns to employee for corrections
   */
  readonly rejectTimesheet: (
    id: string,
    rejectedBy: string,
    reason: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Bulk approve timesheets
   * 
   * Backend operation:
   * 1. Validates all timesheets are submitted
   * 2. Approves all in batch
   * 3. Emits TimesheetApproved events for each
   * 4. Returns summary of results
   */
  readonly bulkApproveTimesheets: (
    command: BulkApproveTimesheetsCommand
  ) => Effect.Effect<GoBulkApprovalResult, NetworkError>;
  
  /**
   * Get timesheets for pay period
   * Returns all approved timesheets ready for payroll processing
   */
  readonly getTimesheetsByPayPeriod: (
    payPeriodStart: Date,
    payPeriodEnd: Date
  ) => Effect.Effect<GoPayPeriodTimesheets, NetworkError>;
  
  /**
   * Get pending timesheets for manager
   * Returns all submitted timesheets awaiting approval
   */
  readonly getPendingTimesheetsForManager: (
    managerId: string
  ) => Effect.Effect<readonly GoTimesheet[], NetworkError>;
  
  /**
   * Get case hours summary
   * Returns total hours by case for billing purposes
   */
  readonly getCaseHoursSummary: (
    caseId: string,
    startDate?: Date,
    endDate?: Date
  ) => Effect.Effect<GoCaseHoursSummary, NetworkError>;
  
  /**
   * Recall timesheet from approval
   * Allows employee to recall submitted timesheet before approval
   */
  readonly recallTimesheet: (
    id: string
  ) => Effect.Effect<void, NetworkError>;
}

export interface GoBulkApprovalResult {
  readonly totalTimesheets: number;
  readonly approvedCount: number;
  readonly failedCount: number;
  readonly errors: readonly {
    readonly timesheetId: string;
    readonly reason: string;
  }[];
}

export interface GoCaseHoursSummary {
  readonly caseId: string;
  readonly employees: readonly {
    readonly employeeId: string;
    readonly employeeName: string;
    readonly role: string;
    readonly totalHours: number;
    readonly regularHours: number;
    readonly overtimeHours: number;
  }[];
  readonly totalHours: number;
  readonly totalRegularHours: number;
  readonly totalOvertimeHours: number;
  readonly totalCost: number;
}

/**
 * Go Timesheet Port service tag for dependency injection
 */
export const GoTimesheetPort = Context.GenericTag<GoTimesheetPortService>(
  '@dykstra/GoTimesheetPort'
);
