import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoEmployeeOnboardingPortService,
  GoEmployee,
  GoOnboardingTask,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Employee Onboarding Adapter
 * 
 * Implements GoEmployeeOnboardingPortService for new employee
 * hire process and onboarding workflow.
 */

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
