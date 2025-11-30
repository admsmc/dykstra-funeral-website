import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoEmployeeTerminationPortService,
  GoExitChecklistItem,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Employee Termination Adapter
 * 
 * Implements GoEmployeeTerminationPortService for employee
 * termination process and exit checklist management.
 */

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
