import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoTrainingPortService,
  GoTrainingRecord,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Training Adapter
 * 
 * Implements GoTrainingPortService for employee training
 * and certification tracking.
 * Split from GoHCMCommonAdapter for better separation of concerns.
 */

export const GoTrainingAdapter: GoTrainingPortService = {
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
};

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
