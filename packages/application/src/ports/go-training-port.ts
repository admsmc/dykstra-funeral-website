/**
 * Training Port
 * 
 * Handles employee training and certification tracking.
 * Split from GoHCMCommonPort to follow Interface Segregation Principle.
 */

import { Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoTrainingRecord {
  readonly id: string;
  readonly employeeId: string;
  readonly trainingName: string;
  readonly completedDate: Date;
  readonly certificationDate?: Date;
  readonly expirationDate?: Date;
}

export interface GoTrainingPortService {
  readonly recordTraining: (employeeId: string, trainingName: string, completedDate: Date) => 
    Effect.Effect<GoTrainingRecord, NetworkError>;
  readonly getEmployeeTraining: (employeeId: string) => 
    Effect.Effect<readonly GoTrainingRecord[], NetworkError>;
  readonly getExpiringCertifications: (withinDays: number) => 
    Effect.Effect<readonly GoTrainingRecord[], NetworkError>;
}

export const GoTrainingPort = Context.GenericTag<GoTrainingPortService>(
  '@dykstra/GoTrainingPort'
);
