/**
 * Approval Workflow Port
 * 
 * Handles multi-level approval workflows for various entity types
 * (contracts, purchase orders, vendor bills, etc.)
 */

import { Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoApprovalRequest {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly requestedBy: string;
  readonly requestedAt: Date;
  readonly status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  readonly currentLevel: number;
  readonly totalLevels: number;
  readonly approvals: readonly GoApprovalStep[];
}

export interface GoApprovalStep {
  readonly level: number;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly decision?: 'approved' | 'rejected';
  readonly notes?: string;
}

export interface GoApprovalWorkflowPortService {
  readonly createApprovalRequest: (entityType: string, entityId: string, requestedBy: string) => 
    Effect.Effect<GoApprovalRequest, NetworkError>;
  readonly approveRequest: (requestId: string, approvedBy: string, notes?: string) => 
    Effect.Effect<void, NetworkError>;
  readonly rejectRequest: (requestId: string, rejectedBy: string, reason: string) => 
    Effect.Effect<void, NetworkError>;
  readonly getPendingApprovals: (approverId: string) => 
    Effect.Effect<readonly GoApprovalRequest[], NetworkError>;
  readonly getApprovalHistory: (entityType: string, entityId: string) => 
    Effect.Effect<readonly GoApprovalRequest[], NetworkError>;
}

export const GoApprovalWorkflowPort = Context.GenericTag<GoApprovalWorkflowPortService>(
  '@dykstra/GoApprovalWorkflowPort'
);
