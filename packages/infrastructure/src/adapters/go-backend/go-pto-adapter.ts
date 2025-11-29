import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoPTOPortService,
  GoPTOBalance,
  GoPTORequest,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * PTO Adapter
 * 
 * Implements GoPTOPortService for PTO balance tracking
 * and request approval workflow.
 */

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
