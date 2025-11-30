import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoTimesheetPortService,
  GoTimesheet,
  GoTimesheetEntry,
  GoTimesheetSummary,
  CreateTimesheetCommand,
  AddTimesheetEntryCommand,
  UpdateTimesheetEntryCommand,
  BulkApproveTimesheetsCommand,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Go Timesheet Adapter
 * 
 * Time tracking and approval workflow implementation.
 * Integrates with payroll processing and case-based billing.
 */
export const GoTimesheetAdapter: GoTimesheetPortService = {
  createTimesheet: (command: CreateTimesheetCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/timesheets', {
          body: {
            employee_id: command.employeeId,
            week_ending: command.weekEnding.toISOString(),
          }
        });
        
        return mapToGoTimesheet(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create timesheet', error as Error)
    }),
  
  getTimesheet: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/timesheets/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Timesheet not found', entityType: 'Timesheet', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoTimesheet(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get timesheet', error as Error);
      }
    }),
  
  listTimesheets: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/timesheets', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.timesheets || []).map(mapToGoTimesheet);
      },
      catch: (error) => new NetworkError('Failed to list timesheets', error as Error)
    }),
  
  getTimesheetSummaries: (employeeId: string, startDate: Date, endDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/timesheets/summaries', {
          params: {
            query: {
              employee_id: employeeId,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            }
          }
        });
        
        const data = unwrapResponse(res);
        return (data.summaries || []).map(mapToGoTimesheetSummary);
      },
      catch: (error) => new NetworkError('Failed to get timesheet summaries', error as Error)
    }),
  
  addTimesheetEntry: (timesheetId: string, command: AddTimesheetEntryCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/timesheets/{id}/entries', {
          params: { path: { id: timesheetId } },
          body: {
            date: command.date.toISOString(),
            case_id: command.caseId,
            project_code: command.projectCode,
            description: command.description,
            regular_hours: command.regularHours,
            overtime_hours: command.overtimeHours || 0,
            billable: command.billable || false,
          }
        });
        
        return mapToGoTimesheetEntry(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to add timesheet entry', error as Error)
    }),
  
  updateTimesheetEntry: (timesheetId: string, entryId: string, command: UpdateTimesheetEntryCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PATCH('/v1/timesheets/{id}/entries/{entryId}', {
          params: { path: { id: timesheetId, entryId } },
          body: {
            date: command.date?.toISOString(),
            case_id: command.caseId,
            project_code: command.projectCode,
            description: command.description,
            regular_hours: command.regularHours,
            overtime_hours: command.overtimeHours,
            billable: command.billable,
          }
        });
        
        return mapToGoTimesheetEntry(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to update timesheet entry', error as Error)
    }),
  
  deleteTimesheetEntry: (timesheetId: string, entryId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.DELETE('/v1/timesheets/{id}/entries/{entryId}', {
          params: { path: { id: timesheetId, entryId } }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to delete timesheet entry', error as Error)
    }),
  
  submitTimesheet: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/timesheets/{id}/submit', {
          params: { path: { id } }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to submit timesheet', error as Error)
    }),
  
  approveTimesheet: (id: string, approvedBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/timesheets/{id}/approve', {
          params: { path: { id } },
          body: { approved_by: approvedBy }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve timesheet', error as Error)
    }),
  
  rejectTimesheet: (id: string, rejectedBy: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/timesheets/{id}/reject', {
          params: { path: { id } },
          body: {
            rejected_by: rejectedBy,
            reason,
          }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to reject timesheet', error as Error)
    }),
  
  bulkApproveTimesheets: (command: BulkApproveTimesheetsCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/timesheets/bulk-approve', {
          body: {
            timesheet_ids: command.timesheetIds,
            approved_by: command.approvedBy,
          }
        });
        
        const data = unwrapResponse(res);
        return {
          totalTimesheets: data.total_timesheets,
          approvedCount: data.approved_count,
          failedCount: data.failed_count,
          errors: (data.errors || []).map((e: any) => ({
            timesheetId: e.timesheet_id,
            reason: e.reason,
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to bulk approve timesheets', error as Error)
    }),
  
  getTimesheetsByPayPeriod: (payPeriodStart: Date, payPeriodEnd: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/timesheets/pay-period', {
          params: {
            query: {
              pay_period_start: payPeriodStart.toISOString(),
              pay_period_end: payPeriodEnd.toISOString(),
            }
          }
        });
        
        const data = unwrapResponse(res);
        return {
          payPeriodStart: new Date(data.pay_period_start),
          payPeriodEnd: new Date(data.pay_period_end),
          timesheets: (data.timesheets || []).map(mapToGoTimesheet),
          totalEmployees: data.total_employees,
          submittedCount: data.submitted_count,
          approvedCount: data.approved_count,
          pendingCount: data.pending_count,
          totalHours: data.total_hours,
        };
      },
      catch: (error) => new NetworkError('Failed to get timesheets by pay period', error as Error)
    }),
  
  getPendingTimesheetsForManager: (managerId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/timesheets/pending', {
          params: { query: { manager_id: managerId } }
        });
        
        const data = unwrapResponse(res);
        return (data.timesheets || []).map(mapToGoTimesheet);
      },
      catch: (error) => new NetworkError('Failed to get pending timesheets', error as Error)
    }),
  
  getCaseHoursSummary: (caseId: string, startDate?: Date, endDate?: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/timesheets/case-hours/{caseId}', {
          params: {
            path: { caseId },
            query: {
              start_date: startDate?.toISOString(),
              end_date: endDate?.toISOString(),
            }
          }
        });
        
        const data = unwrapResponse(res);
        return {
          caseId: data.case_id,
          employees: (data.employees || []).map((e: any) => ({
            employeeId: e.employee_id,
            employeeName: e.employee_name,
            role: e.role,
            totalHours: e.total_hours,
            regularHours: e.regular_hours,
            overtimeHours: e.overtime_hours,
          })),
          totalHours: data.total_hours,
          totalRegularHours: data.total_regular_hours,
          totalOvertimeHours: data.total_overtime_hours,
          totalCost: data.total_cost,
        };
      },
      catch: (error) => new NetworkError('Failed to get case hours summary', error as Error)
    }),
  
  recallTimesheet: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/timesheets/{id}/recall', {
          params: { path: { id } }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to recall timesheet', error as Error)
    }),
};

// Mapper functions

function mapToGoTimesheet(data: any): GoTimesheet {
  return {
    id: data.id,
    timesheetNumber: data.timesheet_number,
    employeeId: data.employee_id,
    employeeName: data.employee_name,
    weekEnding: new Date(data.week_ending),
    status: data.status,
    entries: (data.entries || []).map(mapToGoTimesheetEntry),
    totalHours: data.total_hours,
    totalRegularHours: data.total_regular_hours,
    totalOvertimeHours: data.total_overtime_hours,
    submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
    rejectedBy: data.rejected_by,
    rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
    rejectionReason: data.rejection_reason,
    payrollRunId: data.payroll_run_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapToGoTimesheetEntry(data: any): GoTimesheetEntry {
  return {
    id: data.id,
    date: new Date(data.date),
    caseId: data.case_id,
    projectCode: data.project_code,
    description: data.description,
    regularHours: data.regular_hours,
    overtimeHours: data.overtime_hours,
    totalHours: data.total_hours,
    billable: data.billable,
    rate: data.rate,
  };
}

function mapToGoTimesheetSummary(data: any): GoTimesheetSummary {
  return {
    employeeId: data.employee_id,
    employeeName: data.employee_name,
    weekEnding: new Date(data.week_ending),
    totalHours: data.total_hours,
    status: data.status,
    submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
  };
}
