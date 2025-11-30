import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoPerformancePortService,
  GoPerformanceReview,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Performance Adapter
 * 
 * Implements GoPerformancePortService for employee
 * performance review management.
 * Split from GoHCMCommonAdapter for better separation of concerns.
 */

export const GoPerformanceAdapter: GoPerformancePortService = {
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
};

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
