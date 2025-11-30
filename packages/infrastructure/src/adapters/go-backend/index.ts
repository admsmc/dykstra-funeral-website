/**
 * Go Backend Adapters
 * 
 * Object-based adapters implementing Go ERP port interfaces.
 * All adapters route requests through BFF proxy (/api/go-proxy).
 * 
 * Architecture:
 * - Infrastructure layer adapters
 * - Implement ports from application layer
 * - Use Effect for error handling
 * - Never access Go infrastructure directly
 * 
 * Pattern:
 * ```typescript
 * export const GoModuleAdapter: GoModulePortService = {
 *   method: (params) => Effect.tryPromise({
 *     try: async () => {
 *       const res = await goClient.POST('/v1/endpoint', { body });
 *       return unwrapResponse(res);
 *     },
 *     catch: (error) => new NetworkError('Message', error)
 *   })
 * };
 * ```
 */

export { goClient, unwrapResponse } from './client';

// High-Priority Adapters (Complete)
export { GoContractAdapter } from './go-contract-adapter';
export { GoFinancialAdapter } from './go-financial-adapter';
export { GoInventoryAdapter } from './go-inventory-adapter';
export { GoPayrollAdapter } from './go-payroll-adapter';
export { GoProcurementAdapter } from './go-procurement-adapter';
export { GoTimesheetAdapter } from './go-timesheet-adapter';

// Medium-Priority Adapters (Complete)
export { GoApprovalWorkflowAdapter } from './go-approval-workflow-adapter';
export { GoBudgetAdapter } from './go-budget-adapter';
export { GoFixedAssetsAdapter } from './go-fixed-assets-adapter';
export { GoProfessionalServicesAdapter } from './go-professional-services-adapter';
export { GoReconciliationsAdapter } from './go-reconciliations-adapter';
export { GoSegmentReportingAdapter } from './go-segment-reporting-adapter';

// Low-Priority Adapters (Complete)
export { GoConsolidationsAdapter } from './go-consolidations-adapter';
export { GoEmployeeMasterDataAdapter } from './go-employee-master-data-adapter';
export { GoEmployeeOnboardingAdapter } from './go-employee-onboarding-adapter';
export { GoEmployeeTerminationAdapter } from './go-employee-termination-adapter';
export { GoPerformanceAdapter } from './go-performance-adapter';
export { GoPositionManagementAdapter } from './go-position-management-adapter';
export { GoPTOAdapter } from './go-pto-adapter';
export { GoRehireAdapter } from './go-rehire-adapter';
export { GoTrainingAdapter } from './go-training-adapter';
