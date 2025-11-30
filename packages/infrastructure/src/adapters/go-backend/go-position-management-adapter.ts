import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoPositionManagementPortService,
  GoPosition,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Position Management Adapter
 * 
 * Implements GoPositionManagementPortService for employee
 * position changes and compensation adjustments.
 */

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
