/**
 * Employee Termination Port
 * 
 * Handles employee termination process including exit checklist
 * and final paycheck processing.
 */

import { Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoExitChecklistItem {
  readonly id: string;
  readonly name: string;
  readonly completed: boolean;
}

export interface GoEmployeeTerminationPortService {
  readonly terminateEmployee: (employeeId: string, terminationDate: Date, reason: string) => 
    Effect.Effect<void, NetworkError>;
  readonly getExitChecklist: (employeeId: string) => 
    Effect.Effect<readonly GoExitChecklistItem[], NetworkError>;
  readonly processFinalPaycheck: (employeeId: string) => 
    Effect.Effect<void, NetworkError>;
}

export const GoEmployeeTerminationPort = Context.GenericTag<GoEmployeeTerminationPortService>(
  '@dykstra/GoEmployeeTerminationPort'
);
