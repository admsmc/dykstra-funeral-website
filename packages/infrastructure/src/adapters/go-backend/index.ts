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

// High-Priority Adapters (Phase 3 - Complete)
export { GoContractAdapter } from './go-contract-adapter';
export { GoInventoryAdapter } from './go-inventory-adapter';
export { GoPayrollAdapter } from './go-payroll-adapter';
export { GoFinancialAdapter } from './go-financial-adapter';
export { GoProcurementAdapter } from './go-procurement-adapter';
export { GoTimesheetAdapter } from './go-timesheet-adapter';

// Medium-Priority Adapters (Phase 3 - Complete)
export {
  GoProfessionalServicesAdapter,
  GoApprovalWorkflowAdapter,
  GoFixedAssetsAdapter,
  GoReconciliationsAdapter,
  GoBudgetAdapter,
  GoSegmentReportingAdapter,
} from './go-medium-priority-adapters';

// Low-Priority Adapters (Phase 3 - Complete)
export {
  GoConsolidationsAdapter,
  GoEmployeeOnboardingAdapter,
  GoEmployeeTerminationAdapter,
  GoPositionManagementAdapter,
  GoPTOAdapter,
  GoHCMCommonAdapter,
} from './go-low-priority-adapters';
