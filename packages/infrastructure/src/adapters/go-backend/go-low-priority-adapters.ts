import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoConsolidationsPortService,
  GoLegalEntity,
  GoConsolidationSection,
  GoConsolidationLineItem,
  GoEmployeeOnboardingPortService,
  GoEmployee,
  GoOnboardingTask,
  GoEmployeeTerminationPortService,
  GoExitChecklistItem,
  GoPositionManagementPortService,
  GoPosition,
  GoPTOPortService,
  GoPTOBalance,
  GoPTORequest,
  GoHCMCommonPortService,
  GoPerformanceReview,
  GoTrainingRecord,
  GoOrgChartNode,
  GoCompensationHistoryEntry,
  UpdateEmployeeInfoCommand,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Low-Priority Go Adapters
 * 
 * This file consolidates 6 low-priority adapters:
 * 1. Consolidations
 * 2. Employee Onboarding
 * 3. Employee Termination
 * 4. Position Management
 * 5. PTO Management
 * 6. HCM Common (Performance, Training, Rehire)
 */

// ============================================================================
// 1. CONSOLIDATIONS ADAPTER
// ============================================================================

export const GoConsolidationsAdapter: GoConsolidationsPortService = {
  listEntities: () =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/consolidations/entities', {});
        
        if (res.error) {
          throw new Error(res.error.message);
        }
        
        return (res.data.entities || []).map((e: any): GoLegalEntity => ({
          id: e.id,
          entityCode: e.entity_code,
          entityName: e.entity_name,
          parentEntityId: e.parent_entity_id,
          currency: e.currency,
        }));
      },
      catch: (error) => new NetworkError('Failed to list entities', error as Error)
    }),
  
  generateConsolidationReport: (asOfDate: Date, entityIds: readonly string[]) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/consolidations/reports', {
          body: {
            as_of_date: asOfDate.toISOString(),
            entity_ids: entityIds,
          }
        });
        const data = unwrapResponse(res);
        return {
          asOfDate: new Date(data.as_of_date),
          entities: data.entities || [],
          sections: (data.sections || []).map((s: any): GoConsolidationSection => ({
            name: s.name,
            subtotal: s.subtotal,
            accounts: (s.accounts || []).map((acc: any): GoConsolidationLineItem => ({
              accountNumber: acc.account_number,
              accountName: acc.account_name,
              entityAmounts: acc.entity_amounts || {},
              eliminationAmount: acc.elimination_amount,
              consolidatedAmount: acc.consolidated_amount,
            })),
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to generate consolidation report', error as Error)
    }),
};

// ============================================================================
// 2. EMPLOYEE ONBOARDING ADAPTER
// ============================================================================

export const GoEmployeeOnboardingAdapter: GoEmployeeOnboardingPortService = {
  hireEmployee: (employee) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/hire', {
          body: {
            first_name: employee.firstName,
            last_name: employee.lastName,
            email: employee.email,
            hire_date: employee.hireDate.toISOString(),
            position_id: employee.positionId,
            position_title: employee.positionTitle,
            department: employee.department,
          }
        });
        return mapToGoEmployee(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to hire employee', error as Error)
    }),
  
  getOnboardingTasks: (employeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}/onboarding/tasks', {
          params: { path: { id: employeeId } }
        });
        const data = unwrapResponse(res);
        return (data.tasks || []).map((t: any): GoOnboardingTask => ({
          id: t.id,
          name: t.name,
          completed: t.completed,
          completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
        }));
      },
      catch: (error) => new NetworkError('Failed to get onboarding tasks', error as Error)
    }),
  
  completeOnboardingTask: (employeeId: string, taskId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/onboarding/tasks/{taskId}/complete', {
          params: { path: { id: employeeId, taskId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to complete onboarding task', error as Error)
    }),
};

// ============================================================================
// 3. EMPLOYEE TERMINATION ADAPTER
// ============================================================================

export const GoEmployeeTerminationAdapter: GoEmployeeTerminationPortService = {
  terminateEmployee: (employeeId: string, terminationDate: Date, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/terminate', {
          params: { path: { id: employeeId } },
          body: {
            termination_date: terminationDate.toISOString(),
            reason,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to terminate employee', error as Error)
    }),
  
  getExitChecklist: (employeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}/exit/checklist', {
          params: { path: { id: employeeId } }
        });
        const data = unwrapResponse(res);
        return (data.checklist || []).map((item: any): GoExitChecklistItem => ({
          id: item.id,
          name: item.name,
          completed: item.completed,
        }));
      },
      catch: (error) => new NetworkError('Failed to get exit checklist', error as Error)
    }),
  
  processFinalPaycheck: (employeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/exit/final-paycheck', {
          params: { path: { id: employeeId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to process final paycheck', error as Error)
    }),
};

// ============================================================================
// 4. POSITION MANAGEMENT ADAPTER
// ============================================================================

export const GoPositionManagementAdapter: GoPositionManagementPortService = {
  promoteEmployee: (employeeId: string, newPositionId: string, effectiveDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/promote', {
          params: { path: { id: employeeId } },
          body: {
            new_position_id: newPositionId,
            effective_date: effectiveDate.toISOString(),
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to promote employee', error as Error)
    }),
  
  transferEmployee: (employeeId: string, newDepartment: string, effectiveDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/transfer', {
          params: { path: { id: employeeId } },
          body: {
            new_department: newDepartment,
            effective_date: effectiveDate.toISOString(),
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to transfer employee', error as Error)
    }),
  
  adjustCompensation: (employeeId: string, newSalary: number, effectiveDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/adjust-compensation', {
          params: { path: { id: employeeId } },
          body: {
            new_salary: newSalary,
            effective_date: effectiveDate.toISOString(),
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to adjust compensation', error as Error)
    }),
  
  listPositions: () =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/positions', {});
        
        if (res.error) {
          throw new Error(res.error.message);
        }
        
        return (res.data.positions || []).map((p: any): GoPosition => ({
          id: p.id,
          title: p.title,
          department: p.department,
          jobLevel: p.job_level,
          baseSalary: p.base_salary,
        }));
      },
      catch: (error) => new NetworkError('Failed to list positions', error as Error)
    }),
};

// ============================================================================
// 5. PTO MANAGEMENT ADAPTER
// ============================================================================

export const GoPTOAdapter: GoPTOPortService = {
  getPTOBalances: (employeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}/pto/balances', {
          params: { path: { id: employeeId } }
        });
        const data = unwrapResponse(res);
        return (data.balances || []).map((b: any): GoPTOBalance => ({
          employeeId: b.employee_id,
          ptoType: b.pto_type,
          accrued: b.accrued,
          used: b.used,
          balance: b.balance,
        }));
      },
      catch: (error) => new NetworkError('Failed to get PTO balances', error as Error)
    }),
  
  submitPTORequest: (employeeId: string, startDate: Date, endDate: Date, ptoType: GoPTOBalance['ptoType']) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/pto/requests', {
          params: { path: { id: employeeId } },
          body: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            pto_type: ptoType,
          }
        });
        return mapToGoPTORequest(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to submit PTO request', error as Error)
    }),
  
  approvePTORequest: (requestId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/pto/requests/{id}/approve', {
          params: { path: { id: requestId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve PTO request', error as Error)
    }),
  
  rejectPTORequest: (requestId: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/pto/requests/{id}/reject', {
          params: { path: { id: requestId } },
          body: { reason }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to reject PTO request', error as Error)
    }),
  
  getPendingPTORequests: (managerId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/pto/requests', {
          params: { query: { manager_id: managerId, status: 'pending' } }
        });
        const data = unwrapResponse(res);
        return (data.requests || []).map(mapToGoPTORequest);
      },
      catch: (error) => new NetworkError('Failed to get pending PTO requests', error as Error)
    }),
};

// ============================================================================
// 6. HCM COMMON ADAPTER (Performance, Training, Rehire)
// ============================================================================

export const GoHCMCommonAdapter: GoHCMCommonPortService = {
  // Performance Reviews
  createPerformanceReview: (employeeId: string, periodStart: Date, periodEnd: Date, rating: number, comments: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/performance-reviews', {
          params: { path: { id: employeeId } },
          body: {
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            overall_rating: rating,
            comments,
          }
        });
        return mapToGoPerformanceReview(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create performance review', error as Error)
    }),
  
  getEmployeeReviews: (employeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}/performance-reviews', {
          params: { path: { id: employeeId } }
        });
        const data = unwrapResponse(res);
        return (data.reviews || []).map(mapToGoPerformanceReview);
      },
      catch: (error) => new NetworkError('Failed to get employee reviews', error as Error)
    }),
  
  // Training & Certifications
  recordTraining: (employeeId: string, trainingName: string, completedDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/training', {
          params: { path: { id: employeeId } },
          body: {
            training_name: trainingName,
            completed_date: completedDate.toISOString(),
          }
        });
        return mapToGoTrainingRecord(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to record training', error as Error)
    }),
  
  getEmployeeTraining: (employeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}/training', {
          params: { path: { id: employeeId } }
        });
        const data = unwrapResponse(res);
        return (data.training || []).map(mapToGoTrainingRecord);
      },
      catch: (error) => new NetworkError('Failed to get employee training', error as Error)
    }),
  
  getExpiringCertifications: (withinDays: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/training/expiring', {
          params: { query: { within_days: withinDays } }
        });
        const data = unwrapResponse(res);
        return (data.certifications || []).map(mapToGoTrainingRecord);
      },
      catch: (error) => new NetworkError('Failed to get expiring certifications', error as Error)
    }),
  
  // Rehire
  checkRehireEligibility: (formerEmployeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}/rehire-eligibility', {
          params: { path: { id: formerEmployeeId } }
        });
        const data = unwrapResponse(res);
        return {
          eligible: data.eligible,
          reason: data.reason,
          formerTerminationDate: data.former_termination_date ? new Date(data.former_termination_date) : undefined,
          formerTerminationReason: data.former_termination_reason,
        };
      },
      catch: (error) => new NetworkError('Failed to check rehire eligibility', error as Error)
    }),
  
  rehireEmployee: (formerEmployeeId: string, hireDate: Date, positionId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/hcm/employees/{id}/rehire', {
          params: { path: { id: formerEmployeeId } },
          body: {
            hire_date: hireDate.toISOString(),
            position_id: positionId,
          }
        });
        return mapToGoEmployee(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to rehire employee', error as Error)
    }),
  
  // Employee Master Data
  getEmployeeById: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Employee not found', entityType: 'Employee', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoEmployee(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get employee by ID', error as Error);
      }
    }),
  
  updateEmployeeInfo: (id: string, command: UpdateEmployeeInfoCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PATCH('/v1/hcm/employees/{id}', {
          params: { path: { id } },
          body: {
            email: command.email,
            phone: command.phone,
            address: command.address,
            emergency_contact: command.emergencyContact,
            emergency_phone: command.emergencyPhone,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to update employee info', error as Error)
    }),
  
  getOrgChart: (rootEmployeeId?: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/org-chart', {
          params: { query: { root_employee_id: rootEmployeeId } }
        });
        const data = unwrapResponse(res);
        return mapToGoOrgChartNode(data);
      },
      catch: (error) => new NetworkError('Failed to get org chart', error as Error)
    }),
  
  getCompensationHistory: (employeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}/compensation-history', {
          params: { path: { id: employeeId } }
        });
        const data = unwrapResponse(res);
        return (data.history || []).map(mapToGoCompensationHistoryEntry);
      },
      catch: (error) => new NetworkError('Failed to get compensation history', error as Error)
    }),
};

// Mappers
function mapToGoEmployee(data: any): GoEmployee {
  return {
    id: data.id,
    employeeNumber: data.employee_number,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    hireDate: new Date(data.hire_date),
    terminationDate: data.termination_date ? new Date(data.termination_date) : undefined,
    status: data.status,
    positionId: data.position_id,
    positionTitle: data.position_title,
    department: data.department,
  };
}

function mapToGoPTORequest(data: any): GoPTORequest {
  return {
    id: data.id,
    employeeId: data.employee_id,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    ptoType: data.pto_type,
    hours: data.hours,
    status: data.status,
  };
}

function mapToGoPerformanceReview(data: any): GoPerformanceReview {
  return {
    id: data.id,
    employeeId: data.employee_id,
    reviewPeriodStart: new Date(data.review_period_start),
    reviewPeriodEnd: new Date(data.review_period_end),
    overallRating: data.overall_rating,
    comments: data.comments,
    reviewedBy: data.reviewed_by,
    reviewedAt: new Date(data.reviewed_at),
  };
}

function mapToGoTrainingRecord(data: any): GoTrainingRecord {
  return {
    id: data.id,
    employeeId: data.employee_id,
    trainingName: data.training_name,
    completedDate: new Date(data.completed_date),
    certificationDate: data.certification_date ? new Date(data.certification_date) : undefined,
    expirationDate: data.expiration_date ? new Date(data.expiration_date) : undefined,
  };
}

function mapToGoOrgChartNode(data: any): GoOrgChartNode {
  return {
    employeeId: data.employee_id,
    employeeName: data.employee_name,
    positionTitle: data.position_title,
    managerId: data.manager_id,
    children: (data.children || []).map(mapToGoOrgChartNode),
  };
}

function mapToGoCompensationHistoryEntry(data: any): GoCompensationHistoryEntry {
  return {
    effectiveDate: new Date(data.effective_date),
    compensationType: data.compensation_type,
    amount: data.amount,
    reason: data.reason,
    approvedBy: data.approved_by,
  };
}
