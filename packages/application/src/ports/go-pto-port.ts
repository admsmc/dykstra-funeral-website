/**
 * PTO (Paid Time Off) Port
 * 
 * Handles PTO balance tracking, request submission,
 * and approval workflow.
 */

import { Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoPTOBalance {
  readonly employeeId: string;
  readonly ptoType: 'vacation' | 'sick' | 'personal';
  readonly accrued: number;
  readonly used: number;
  readonly balance: number;
}

export interface GoPTORequest {
  readonly id: string;
  readonly employeeId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly ptoType: 'vacation' | 'sick' | 'personal';
  readonly hours: number;
  readonly status: 'pending' | 'approved' | 'rejected';
}

export interface GoPTOPortService {
  readonly getPTOBalances: (employeeId: string) => 
    Effect.Effect<readonly GoPTOBalance[], NetworkError>;
  readonly submitPTORequest: (employeeId: string, startDate: Date, endDate: Date, ptoType: GoPTOBalance['ptoType']) => 
    Effect.Effect<GoPTORequest, NetworkError>;
  readonly approvePTORequest: (requestId: string) => 
    Effect.Effect<void, NetworkError>;
  readonly rejectPTORequest: (requestId: string, reason: string) => 
    Effect.Effect<void, NetworkError>;
  readonly getPendingPTORequests: (managerId: string) => 
    Effect.Effect<readonly GoPTORequest[], NetworkError>;
}

export const GoPTOPort = Context.GenericTag<GoPTOPortService>(
  '@dykstra/GoPTOPort'
);
