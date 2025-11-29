import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoProfessionalServicesPortService,
  GoPSEngagement,
  GoPSTimesheet,
  GoPSTimesheetEntry,
  GoApprovalWorkflowPortService,
  GoApprovalRequest,
  GoApprovalStep,
  GoFixedAssetsPortService,
  GoFixedAsset,
  GoDepreciationEntry,
  GoReconciliationsPortService,
  GoReconciliation,
  GoReconciliationItem,
  GoBudgetPortService,
  GoBudget,
  GoBudgetVariance,
  GoSegmentReportingPortService,
  GoSegment,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Medium-Priority Go Adapters
 * 
 * This file consolidates 6 medium-priority adapters:
 * 1. Professional Services
 * 2. Approval Workflows
 * 3. Fixed Assets
 * 4. Reconciliations
 * 5. Budget
 * 6. Segment Reporting
 */

// ============================================================================
// 1. PROFESSIONAL SERVICES ADAPTER
// ============================================================================

export const GoProfessionalServicesAdapter: GoProfessionalServicesPortService = {
  createEngagement: (caseId: string, employeeId: string, role: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/professional-services/engagements', {
          body: {
            case_id: caseId,
            employee_id: employeeId,
            role,
          }
        });
        return mapToGoPSEngagement(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create engagement', error as Error)
    }),
  
  submitTimesheet: (employeeId: string, entries: readonly GoPSTimesheetEntry[]) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/professional-services/timesheets', {
          body: {
            employee_id: employeeId,
            entries: entries.map(e => ({
              case_id: e.caseId,
              date: e.date.toISOString(),
              hours: e.hours,
              description: e.description,
            })),
          }
        });
        return mapToGoPSTimesheet(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to submit timesheet', error as Error)
    }),
  
  approveTimesheet: (timesheetId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/professional-services/timesheets/{id}/approve', {
          params: { path: { id: timesheetId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve timesheet', error as Error)
    }),
  
  getCaseEngagements: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/professional-services/engagements', {
          params: { query: { case_id: caseId } }
        });
        const data = unwrapResponse(res);
        return (data.engagements || []).map(mapToGoPSEngagement);
      },
      catch: (error) => new NetworkError('Failed to get case engagements', error as Error)
    }),
};

function mapToGoPSEngagement(data: any): GoPSEngagement {
  return {
    id: data.id,
    caseId: data.case_id,
    employeeId: data.employee_id,
    role: data.role,
    startDate: new Date(data.start_date),
    endDate: data.end_date ? new Date(data.end_date) : undefined,
    status: data.status,
    billable: data.billable,
    hourlyRate: data.hourly_rate,
  };
}

function mapToGoPSTimesheet(data: any): GoPSTimesheet {
  return {
    id: data.id,
    employeeId: data.employee_id,
    weekEnding: new Date(data.week_ending),
    entries: (data.entries || []).map((e: any) => ({
      caseId: e.case_id,
      date: new Date(e.date),
      hours: e.hours,
      description: e.description,
    })),
    totalHours: data.total_hours,
    status: data.status,
  };
}

// ============================================================================
// 2. APPROVAL WORKFLOW ADAPTER
// ============================================================================

export const GoApprovalWorkflowAdapter: GoApprovalWorkflowPortService = {
  createApprovalRequest: (entityType: string, entityId: string, requestedBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/workflows/approval-requests', {
          body: {
            entity_type: entityType,
            entity_id: entityId,
            requested_by: requestedBy,
          }
        });
        return mapToGoApprovalRequest(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create approval request', error as Error)
    }),
  
  approveRequest: (requestId: string, approvedBy: string, notes?: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/workflows/approval-requests/{id}/approve', {
          params: { path: { id: requestId } },
          body: {
            approved_by: approvedBy,
            notes,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve request', error as Error)
    }),
  
  rejectRequest: (requestId: string, rejectedBy: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/workflows/approval-requests/{id}/reject', {
          params: { path: { id: requestId } },
          body: {
            rejected_by: rejectedBy,
            reason,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to reject request', error as Error)
    }),
  
  getPendingApprovals: (approverId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/workflows/approval-requests', {
          params: { query: { approver_id: approverId, status: 'pending' } }
        });
        const data = unwrapResponse(res);
        return (data.requests || []).map(mapToGoApprovalRequest);
      },
      catch: (error) => new NetworkError('Failed to get pending approvals', error as Error)
    }),
  
  getApprovalHistory: (entityType: string, entityId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/workflows/approval-requests', {
          params: { query: { entity_type: entityType, entity_id: entityId } }
        });
        const data = unwrapResponse(res);
        return (data.requests || []).map(mapToGoApprovalRequest);
      },
      catch: (error) => new NetworkError('Failed to get approval history', error as Error)
    }),
};

function mapToGoApprovalRequest(data: any): GoApprovalRequest {
  return {
    id: data.id,
    entityType: data.entity_type,
    entityId: data.entity_id,
    requestedBy: data.requested_by,
    requestedAt: new Date(data.requested_at),
    status: data.status,
    currentLevel: data.current_level,
    totalLevels: data.total_levels,
    approvals: (data.approvals || []).map((a: any): GoApprovalStep => ({
      level: a.level,
      approvedBy: a.approved_by,
      approvedAt: a.approved_at ? new Date(a.approved_at) : undefined,
      decision: a.decision,
      notes: a.notes,
    })),
  };
}

// ============================================================================
// 3. FIXED ASSETS ADAPTER
// ============================================================================

export const GoFixedAssetsAdapter: GoFixedAssetsPortService = {
  createAsset: (asset) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/fixed-assets/assets', {
          body: {
            asset_number: asset.assetNumber,
            description: asset.description,
            category: asset.category,
            acquisition_date: asset.acquisitionDate.toISOString(),
            acquisition_cost: asset.acquisitionCost,
            salvage_value: asset.salvageValue,
            useful_life_years: asset.usefulLifeYears,
            depreciation_method: asset.depreciationMethod,
            status: asset.status,
          }
        });
        return mapToGoFixedAsset(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create asset', error as Error)
    }),
  
  getAsset: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/fixed-assets/assets/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'FixedAsset not found', entityType: 'FixedAsset', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoFixedAsset(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get asset', error as Error);
      }
    }),
  
  listAssets: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/fixed-assets/assets', {
          params: { query: filters as any }
        });
        const data = unwrapResponse(res);
        return (data.assets || []).map(mapToGoFixedAsset);
      },
      catch: (error) => new NetworkError('Failed to list assets', error as Error)
    }),
  
  getDepreciationSchedule: (assetId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/fixed-assets/assets/{id}/depreciation-schedule', {
          params: { path: { id: assetId } }
        });
        const data = unwrapResponse(res);
        return {
          assetId: data.asset_id,
          entries: (data.entries || []).map((e: any): GoDepreciationEntry => ({
            period: e.period,
            beginningBookValue: e.beginning_book_value,
            depreciationExpense: e.depreciation_expense,
            endingBookValue: e.ending_book_value,
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to get depreciation schedule', error as Error)
    }),
  
  disposeAsset: (assetId: string, disposalDate: Date, disposalAmount: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/fixed-assets/assets/{id}/dispose', {
          params: { path: { id: assetId } },
          body: {
            disposal_date: disposalDate.toISOString(),
            disposal_amount: disposalAmount,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to dispose asset', error as Error)
    }),
  
  runMonthlyDepreciation: (period: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/fixed-assets/depreciation/run', {
          body: {
            period: period.toISOString(),
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to run monthly depreciation', error as Error)
    }),
};

function mapToGoFixedAsset(data: any): GoFixedAsset {
  return {
    id: data.id,
    assetNumber: data.asset_number,
    description: data.description,
    category: data.category,
    acquisitionDate: new Date(data.acquisition_date),
    acquisitionCost: data.acquisition_cost,
    salvageValue: data.salvage_value,
    usefulLifeYears: data.useful_life_years,
    depreciationMethod: data.depreciation_method,
    status: data.status,
    currentBookValue: data.current_book_value,
    accumulatedDepreciation: data.accumulated_depreciation,
  };
}

// ============================================================================
// 4. RECONCILIATIONS ADAPTER
// ============================================================================

export const GoReconciliationsAdapter: GoReconciliationsPortService = {
  createReconciliation: (accountId: string, period: Date, statementBalance: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/reconciliations', {
          body: {
            account_id: accountId,
            period: period.toISOString(),
            statement_balance: statementBalance,
          }
        });
        return mapToGoReconciliation(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create reconciliation', error as Error)
    }),
  
  getReconciliation: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/reconciliations/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Reconciliation not found', entityType: 'Reconciliation', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoReconciliation(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get reconciliation', error as Error);
      }
    }),
  
  listReconciliations: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/reconciliations', {
          params: { query: filters as any }
        });
        const data = unwrapResponse(res);
        return (data.reconciliations || []).map(mapToGoReconciliation);
      },
      catch: (error) => new NetworkError('Failed to list reconciliations', error as Error)
    }),
  
  markItemCleared: (reconciliationId: string, itemId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/reconciliations/{reconId}/items/{id}/clear', {
          params: { path: { reconId: reconciliationId, id: itemId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to mark item cleared', error as Error)
    }),
  
  completeReconciliation: (reconciliationId: string, reconciledBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/reconciliations/{id}/complete', {
          params: { path: { id: reconciliationId } },
          body: {
            reconciled_by: reconciledBy,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to complete reconciliation', error as Error)
    }),
  
  getReconciliationItems: (reconciliationId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/reconciliations/{id}/items', {
          params: { path: { id: reconciliationId } }
        });
        const data = unwrapResponse(res);
        return (data.items || []).map(mapToGoReconciliationItem);
      },
      catch: (error) => new NetworkError('Failed to get reconciliation items', error as Error)
    }),
  
  undoReconciliation: (id: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/reconciliations/{id}/undo', {
          params: { path: { id } },
          body: { reason }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to undo reconciliation', error as Error)
    }),
};

function mapToGoReconciliation(data: any): GoReconciliation {
  return {
    id: data.id,
    accountId: data.account_id,
    accountNumber: data.account_number,
    accountName: data.account_name,
    period: new Date(data.period),
    status: data.status,
    glBalance: data.gl_balance,
    statementBalance: data.statement_balance,
    difference: data.difference,
    reconciledBy: data.reconciled_by,
    reconciledAt: data.reconciled_at ? new Date(data.reconciled_at) : undefined,
  };
}

function mapToGoReconciliationItem(data: any): GoReconciliationItem {
  return {
    id: data.id,
    reconciliationId: data.reconciliation_id,
    transactionDate: new Date(data.transaction_date),
    description: data.description,
    amount: data.amount,
    cleared: data.cleared,
    clearedDate: data.cleared_date ? new Date(data.cleared_date) : undefined,
  };
}

// ============================================================================
// 5. BUDGET ADAPTER
// ============================================================================

export const GoBudgetAdapter: GoBudgetPortService = {
  createBudget: (fiscalYear: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/budgets', {
          body: {
            fiscal_year: fiscalYear,
          }
        });
        return mapToGoBudget(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create budget', error as Error)
    }),
  
  getBudget: (fiscalYear: number) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/budgets', {
          params: { query: { fiscal_year: fiscalYear } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Budget not found', entityType: 'Budget', entityId: String(fiscalYear) });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoBudget(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get budget', error as Error);
      }
    }),
  
  updateBudgetAccount: (budgetId: string, accountId: string, periods: readonly any[]) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PATCH('/v1/budgets/{id}/accounts/{accountId}', {
          params: { path: { id: budgetId, accountId } },
          body: { periods }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to update budget account', error as Error)
    }),
  
  approveBudget: (budgetId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/budgets/{id}/approve', {
          params: { path: { id: budgetId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve budget', error as Error)
    }),
  
  getBudgetVarianceReport: (period: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/budgets/variance', {
          params: { query: { period: period.toISOString() } }
        });
        const data = unwrapResponse(res);
        return {
          period: new Date(data.period),
          accounts: (data.accounts || []).map((v: any): GoBudgetVariance => ({
            accountNumber: v.account_number,
            accountName: v.account_name,
            budgetAmount: v.budget_amount,
            actualAmount: v.actual_amount,
            variance: v.variance,
            variancePercent: v.variance_percent,
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to get budget variance report', error as Error)
    }),
};

function mapToGoBudget(data: any): GoBudget {
  return {
    id: data.id,
    fiscalYear: data.fiscal_year,
    version: data.version,
    status: data.status,
    accounts: (data.accounts || []).map((acc: any) => ({
      accountId: acc.account_id,
      accountNumber: acc.account_number,
      accountName: acc.account_name,
      periods: (acc.periods || []).map((p: any) => ({
        period: p.period,
        amount: p.amount,
      })),
      totalBudget: acc.total_budget,
    })),
    totalBudget: data.total_budget,
  };
}

// ============================================================================
// 6. SEGMENT REPORTING ADAPTER
// ============================================================================

export const GoSegmentReportingAdapter: GoSegmentReportingPortService = {
  listSegments: (segmentType?: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/segments', {
          params: { query: segmentType ? { type: segmentType } : {} }
        });
        const data = unwrapResponse(res);
        return (data.segments || []).map(mapToGoSegment);
      },
      catch: (error) => new NetworkError('Failed to list segments', error as Error)
    }),
  
  generateSegmentReport: (asOfDate: Date, segmentType: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/segments/reports', {
          params: {
            query: {
              as_of_date: asOfDate.toISOString(),
              segment_type: segmentType,
            }
          }
        });
        const data = unwrapResponse(res);
        return {
          asOfDate: new Date(data.as_of_date),
          segmentType: data.segment_type,
          segments: (data.segments || []).map((s: any) => ({
            segmentCode: s.segment_code,
            segmentName: s.segment_name,
            revenue: s.revenue,
            expenses: s.expenses,
            netIncome: s.net_income,
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to generate segment report', error as Error)
    }),
};

function mapToGoSegment(data: any): GoSegment {
  return {
    id: data.id,
    segmentType: data.segment_type,
    code: data.code,
    name: data.name,
  };
}
