/**
 * Performance Port
 * 
 * Handles employee performance review creation and retrieval.
 * Split from GoHCMCommonPort to follow Interface Segregation Principle.
 */

import { type Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoPerformanceReview {
  readonly id: string;
  readonly employeeId: string;
  readonly reviewPeriodStart: Date;
  readonly reviewPeriodEnd: Date;
  readonly overallRating: number;
  readonly comments: string;
  readonly reviewedBy: string;
  readonly reviewedAt: Date;
}

export interface GoPerformancePortService {
  readonly createPerformanceReview: (employeeId: string, periodStart: Date, periodEnd: Date, rating: number, comments: string) => 
    Effect.Effect<GoPerformanceReview, NetworkError>;
  readonly getEmployeeReviews: (employeeId: string) => 
    Effect.Effect<readonly GoPerformanceReview[], NetworkError>;
}

export const GoPerformancePort = Context.GenericTag<GoPerformancePortService>(
  '@dykstra/GoPerformancePort'
);
