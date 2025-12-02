/**
 * Position Management Port
 * 
 * Handles employee position changes including promotions,
 * transfers, and compensation adjustments.
 */

import { type Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoPosition {
  readonly id: string;
  readonly title: string;
  readonly department: string;
  readonly jobLevel: number;
  readonly baseSalary: number;
}

export interface GoPositionManagementPortService {
  readonly promoteEmployee: (employeeId: string, newPositionId: string, effectiveDate: Date) => 
    Effect.Effect<void, NetworkError>;
  readonly transferEmployee: (employeeId: string, newDepartment: string, effectiveDate: Date) => 
    Effect.Effect<void, NetworkError>;
  readonly adjustCompensation: (employeeId: string, newSalary: number, effectiveDate: Date) => 
    Effect.Effect<void, NetworkError>;
  readonly listPositions: () => 
    Effect.Effect<readonly GoPosition[], NetworkError>;
}

export const GoPositionManagementPort = Context.GenericTag<GoPositionManagementPortService>(
  '@dykstra/GoPositionManagementPort'
);
