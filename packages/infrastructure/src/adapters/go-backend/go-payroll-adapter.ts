import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoPayrollPortService,
  GoPayrollRun,
  GoPayrollLineItem,
  GoPayrollEmployee,
  GoPayrollWorkflowTimesheet,
  CreatePayrollRunCommand,
  ApprovePayrollRunCommand,
  ImportTimeEntriesCommand,
  GoTimeEntryImportResult,
  GoPayrollExpenseSummary,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Go Payroll Adapter
 * 
 * Michigan-compliant payroll processing with dual-ledger support.
 * Integrates with TigerBeetle for payroll GL entries.
 */
export const GoPayrollAdapter: GoPayrollPortService = {
  createPayrollRun: (command: CreatePayrollRunCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/payroll/runs', {
          body: {
            pay_period_start: command.payPeriodStart.toISOString(),
            pay_period_end: command.payPeriodEnd.toISOString(),
            pay_date: command.payDate.toISOString(),
          }
        });
        
        return mapToGoPayrollRun(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create payroll run', error as Error)
    }),
  
  getPayrollRun: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/payroll/runs/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'PayrollRun not found', entityType: 'PayrollRun', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoPayrollRun(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get payroll run', error as Error);
      }
    }),
  
  listPayrollRuns: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/payroll/runs', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.runs || []).map(mapToGoPayrollRun);
      },
      catch: (error) => new NetworkError('Failed to list payroll runs', error as Error)
    }),
  
  calculatePayroll: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/payroll/runs/{id}/calculate', {
          params: { path: { id } }
        });
        
        const data = unwrapResponse(res);
        return (data.line_items || []).map(mapToGoPayrollLineItem);
      },
      catch: (error) => new NetworkError('Failed to calculate payroll', error as Error)
    }),
  
  getPayrollLineItems: (payrollRunId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/payroll/runs/{id}/line-items', {
          params: { path: { id: payrollRunId } }
        });
        
        const data = unwrapResponse(res);
        return (data.line_items || []).map(mapToGoPayrollLineItem);
      },
      catch: (error) => new NetworkError('Failed to get payroll line items', error as Error)
    }),
  
  approvePayrollRun: (id: string, command: ApprovePayrollRunCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/payroll/runs/{id}/approve', {
          params: { path: { id } },
          body: {
            approved_by: command.approvedBy,
            notes: command.notes,
          }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve payroll run', error as Error)
    }),
  
  markPayrollPaid: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/payroll/runs/{id}/mark-paid', {
          params: { path: { id } }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to mark payroll paid', error as Error)
    }),
  
  cancelPayrollRun: (id: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/payroll/runs/{id}/cancel', {
          params: { path: { id } },
          body: { reason }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to cancel payroll run', error as Error)
    }),
  
  listEmployees: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/payroll/employees', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.employees || []).map(mapToGoPayrollEmployee);
      },
      catch: (error) => new NetworkError('Failed to list employees', error as Error)
    }),
  
  getEmployee: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/payroll/employees/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Employee not found', entityType: 'Employee', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoPayrollEmployee(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get employee', error as Error);
      }
    }),
  
  getEmployeePayrollHistory: (employeeId: string, startDate?: Date, endDate?: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/payroll/employees/{id}/history', {
          params: {
            path: { id: employeeId },
            query: {
              start_date: startDate?.toISOString(),
              end_date: endDate?.toISOString(),
            }
          }
        });
        
        const data = unwrapResponse(res);
        return (data.line_items || []).map(mapToGoPayrollLineItem);
      },
      catch: (error) => new NetworkError('Failed to get employee payroll history', error as Error)
    }),
  
  generateW2: (employeeId: string, taxYear: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/payroll/employees/{id}/w2', {
          params: { path: { id: employeeId } },
          body: { tax_year: taxYear }
        });
        
        const data = unwrapResponse(res);
        return {
          employeeId: data.employee_id,
          employeeName: data.employee_name,
          employeeSSN: data.employee_ssn,
          taxYear: data.tax_year,
          wages: data.wages,
          federalTaxWithheld: data.federal_tax_withheld,
          socialSecurityWages: data.social_security_wages,
          socialSecurityTaxWithheld: data.social_security_tax_withheld,
          medicareWages: data.medicare_wages,
          medicareTaxWithheld: data.medicare_tax_withheld,
          stateTaxWithheld: data.state_tax_withheld,
          pdfUrl: data.pdf_url,
        };
      },
      catch: (error) => new NetworkError('Failed to generate W2', error as Error)
    }),
  
  generate1099: (contractorId: string, taxYear: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/payroll/contractors/{id}/1099', {
          params: { path: { id: contractorId } },
          body: { tax_year: taxYear }
        });
        
        const data = unwrapResponse(res);
        return {
          contractorId: data.contractor_id,
          contractorName: data.contractor_name,
          contractorTIN: data.contractor_tin,
          taxYear: data.tax_year,
          nonemployeeCompensation: data.nonemployee_compensation,
          pdfUrl: data.pdf_url,
        };
      },
      catch: (error) => new NetworkError('Failed to generate 1099', error as Error)
    }),
  
  importTimeEntries: (command: ImportTimeEntriesCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/payroll/import-time-entries', {
          body: {
            pay_period_id: command.payPeriodId,
            entries: command.entries.map(e => ({
              employee_id: e.employeeId,
              date: e.date.toISOString(),
              hours: e.hours,
              case_id: e.caseId,
              description: e.description,
            })),
          }
        });
        
        const data = unwrapResponse(res);
        return mapToGoTimeEntryImportResult(data);
      },
      catch: (error) => new NetworkError('Failed to import time entries', error as Error)
    }),
  
  getExpenseSummary: (startDate: Date, endDate: Date, groupBy?: 'department' | 'employee' | 'cost_center') =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/payroll/expense-summary', {
          params: {
            query: {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              group_by: groupBy,
            }
          }
        });
        
        const data = unwrapResponse(res);
        return mapToGoPayrollExpenseSummary(data);
      },
      catch: (error) => new NetworkError('Failed to get expense summary', error as Error)
    }),
  
  submitTimesheet: (command) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/ps/timesheets/submit', {
          body: {
            tenant: command.tenant,
            timesheet_id: command.timesheetId,
            worker_id: command.workerId,
            period_start: command.periodStart.toISOString(),
            period_end: command.periodEnd.toISOString(),
            entries: command.entries,
            notes: command.notes,
          }
        });
        
        const data = unwrapResponse(res);
        return {
          stream: data.stream,
          eventId: data.event_id,
          appended: data.appended,
        };
      },
      catch: (error) => new NetworkError('Failed to submit timesheet', error as Error)
    }),
  
  approveTimesheet: (params) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/ps/timesheets/{timesheetId}/approve', {
          params: { path: { timesheetId: params.timesheetId } },
          body: {
            tenant: params.tenant,
            actor: params.actor,
          }
        });
        
        const data = unwrapResponse(res);
        return {
          stream: data.stream,
          eventId: data.event_id,
          appended: data.appended,
        };
      },
      catch: (error) => new NetworkError('Failed to approve timesheet', error as Error)
    }),
  
  rejectTimesheet: (params) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/ps/timesheets/{timesheetId}/reject', {
          params: { path: { timesheetId: params.timesheetId } },
          body: {
            tenant: params.tenant,
            actor: params.actor,
            reason: params.reason,
          }
        });
        
        const data = unwrapResponse(res);
        return {
          stream: data.stream,
          eventId: data.event_id,
          appended: data.appended,
        };
      },
      catch: (error) => new NetworkError('Failed to reject timesheet', error as Error)
    }),
  
  listTimesheets: (query) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/ps/timesheets', {
          params: {
            query: {
              tenant: query.tenant,
              worker_id: query.workerId,
              status: query.status,
              from: query.from?.toISOString(),
              to: query.to?.toISOString(),
              limit: query.limit,
              offset: query.offset,
            }
          }
        });
        
        const data = unwrapResponse(res);
        return {
          items: (data.items || []).map(mapToGoPayrollWorkflowTimesheet),
          count: data.count,
        };
      },
      catch: (error) => new NetworkError('Failed to list timesheets', error as Error)
    }),
};

// Mappers
function mapToGoPayrollRun(data: any): GoPayrollRun {
  return {
    id: data.id,
    payPeriodStart: new Date(data.pay_period_start),
    payPeriodEnd: new Date(data.pay_period_end),
    payDate: new Date(data.pay_date),
    status: data.status,
    totalGross: data.total_gross,
    totalNet: data.total_net,
    totalTaxes: data.total_taxes,
    totalDeductions: data.total_deductions,
    employeeCount: data.employee_count,
    calculatedAt: data.calculated_at ? new Date(data.calculated_at) : undefined,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
    paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
    nachaFileId: data.nacha_file_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapToGoPayrollEmployee(data: any): GoPayrollEmployee {
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    employmentType: data.employment_type,
    status: data.status,
    hireDate: new Date(data.hire_date),
    terminationDate: data.termination_date ? new Date(data.termination_date) : undefined,
    payRate: data.pay_rate,
    payFrequency: data.pay_frequency,
    federalWithholding: {
      filingStatus: data.federal_withholding.filing_status,
      allowances: data.federal_withholding.allowances,
      additionalWithholding: data.federal_withholding.additional_withholding,
    },
    stateWithholding: {
      filingStatus: data.state_withholding.filing_status,
      allowances: data.state_withholding.allowances,
      additionalWithholding: data.state_withholding.additional_withholding,
    },
    directDeposit: data.direct_deposit ? {
      routingNumber: data.direct_deposit.routing_number,
      accountNumber: data.direct_deposit.account_number,
      accountType: data.direct_deposit.account_type,
    } : undefined,
  };
}

function mapToGoPayrollLineItem(data: any): GoPayrollLineItem {
  return {
    id: data.id,
    payrollRunId: data.payroll_run_id,
    employeeId: data.employee_id,
    employeeName: data.employee_name,
    grossPay: data.gross_pay,
    netPay: data.net_pay,
    federalTax: data.federal_tax,
    stateTax: data.state_tax,
    ficaTax: data.fica_tax,
    medicareTax: data.medicare_tax,
    deductions: (data.deductions || []).map((d: any) => ({
      type: d.type,
      description: d.description,
      amount: d.amount,
    })),
    hoursWorked: data.hours_worked,
    caseAssignments: (data.case_assignments || []).map((ca: any) => ({
      caseId: ca.case_id,
      role: ca.role,
      hours: ca.hours,
      commissionAmount: ca.commission_amount,
    })),
  };
}

function mapToGoTimeEntryImportResult(data: any): GoTimeEntryImportResult {
  return {
    imported: data.imported,
    failed: data.failed,
    errors: (data.errors || []).map((e: any) => ({
      employeeId: e.employee_id,
      reason: e.reason,
    })),
  };
}

function mapToGoPayrollExpenseSummary(data: any): GoPayrollExpenseSummary {
  return {
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    totalGross: data.total_gross,
    totalNet: data.total_net,
    totalTaxes: data.total_taxes,
    totalBenefits: data.total_benefits,
    totalEmployerTaxes: data.total_employer_taxes,
    groups: (data.groups || []).map((g: any) => ({
      groupKey: g.group_key,
      groupName: g.group_name,
      totalGross: g.total_gross,
      totalNet: g.total_net,
      employeeCount: g.employee_count,
    })),
  };
}

function mapToGoPayrollWorkflowTimesheet(data: any): GoPayrollWorkflowTimesheet {
  return {
    id: data.id,
    timesheetId: data.timesheet_id,
    workerId: data.worker_id,
    periodStart: new Date(data.period_start),
    periodEnd: new Date(data.period_end),
    status: data.status,
    entries: data.entries || [],
    notes: data.notes,
    submittedAt: new Date(data.submitted_at),
    approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
    approvedBy: data.approved_by,
    rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
    rejectedBy: data.rejected_by,
    rejectionReason: data.rejection_reason,
  };
}
