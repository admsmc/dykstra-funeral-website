import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoRehirePortService,
  GoEmployee,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Rehire Adapter
 * 
 * Implements GoRehirePortService for rehire eligibility
 * checks and former employee rehiring.
 * Split from GoHCMCommonAdapter for better separation of concerns.
 */

export const GoRehireAdapter: GoRehirePortService = {
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
};

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
