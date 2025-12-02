/**
 * Employee Onboarding Port
 * 
 * Handles new employee hire process including onboarding tasks
 * and checklist management.
 */

import { type Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoEmployee {
  readonly id: string;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly hireDate: Date;
  readonly terminationDate?: Date;
  readonly status: 'active' | 'terminated' | 'on_leave';
  readonly positionId: string;
  readonly positionTitle: string;
  readonly department: string;
}

export interface GoOnboardingTask {
  readonly id: string;
  readonly name: string;
  readonly completed: boolean;
  readonly completedAt?: Date;
}

export interface GoEmployeeOnboardingPortService {
  readonly hireEmployee: (employee: Omit<GoEmployee, 'id' | 'employeeNumber' | 'status'>) => 
    Effect.Effect<GoEmployee, NetworkError>;
  readonly getOnboardingTasks: (employeeId: string) => 
    Effect.Effect<readonly GoOnboardingTask[], NetworkError>;
  readonly completeOnboardingTask: (employeeId: string, taskId: string) => 
    Effect.Effect<void, NetworkError>;
}

export const GoEmployeeOnboardingPort = Context.GenericTag<GoEmployeeOnboardingPortService>(
  '@dykstra/GoEmployeeOnboardingPort'
);
