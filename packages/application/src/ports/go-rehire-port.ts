/**
 * Rehire Port
 * 
 * Handles rehire eligibility checks and rehiring of former employees.
 * Split from GoHCMCommonPort to follow Interface Segregation Principle.
 */

import { type Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';
import type { GoEmployee } from './go-employee-onboarding-port';

// Re-export for convenience
export { NetworkError };
export type { GoEmployee };

export interface GoRehireEligibility {
  readonly eligible: boolean;
  readonly reason?: string;
  readonly formerTerminationDate?: Date;
  readonly formerTerminationReason?: string;
}

export interface GoRehirePortService {
  readonly checkRehireEligibility: (formerEmployeeId: string) => 
    Effect.Effect<GoRehireEligibility, NetworkError>;
  readonly rehireEmployee: (formerEmployeeId: string, hireDate: Date, positionId: string) => 
    Effect.Effect<GoEmployee, NetworkError>;
}

export const GoRehirePort = Context.GenericTag<GoRehirePortService>(
  '@dykstra/GoRehirePort'
);
