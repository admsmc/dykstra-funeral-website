import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoApprovalWorkflowPortService,
  GoApprovalRequest,
  GoApprovalStep,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Approval Workflow Adapter
 * 
 * Implements GoApprovalWorkflowPortService for multi-level
 * approval workflows across various entity types.
 */

export const GoApprovalWorkflowAdapter: GoApprovalWorkflowPortService = {
  createApprovalRequest: (entityType: string, entityId: string, requestedBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/workflows/approval-requests', {
          body: {
            entity_type: entityType,
            entity_id: entityId,
            requested_by: requestedBy,
          }
        });
        return mapToGoApprovalRequest(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create approval request', error as Error)
    }),
  
  approveRequest: (requestId: string, approvedBy: string, notes?: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/workflows/approval-requests/{id}/approve', {
          params: { path: { id: requestId } },
          body: {
            approved_by: approvedBy,
            notes,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve request', error as Error)
    }),
  
  rejectRequest: (requestId: string, rejectedBy: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/workflows/approval-requests/{id}/reject', {
          params: { path: { id: requestId } },
          body: {
            rejected_by: rejectedBy,
            reason,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to reject request', error as Error)
    }),
  
  getPendingApprovals: (approverId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/workflows/approval-requests', {
          params: { query: { approver_id: approverId, status: 'pending' } }
        });
        const data = unwrapResponse(res);
        return (data.requests || []).map(mapToGoApprovalRequest);
      },
      catch: (error) => new NetworkError('Failed to get pending approvals', error as Error)
    }),
  
  getApprovalHistory: (entityType: string, entityId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/workflows/approval-requests', {
          params: { query: { entity_type: entityType, entity_id: entityId } }
        });
        const data = unwrapResponse(res);
        return (data.requests || []).map(mapToGoApprovalRequest);
      },
      catch: (error) => new NetworkError('Failed to get approval history', error as Error)
    }),
};

function mapToGoApprovalRequest(data: any): GoApprovalRequest {
  return {
    id: data.id,
    entityType: data.entity_type,
    entityId: data.entity_id,
    requestedBy: data.requested_by,
    requestedAt: new Date(data.requested_at),
    status: data.status,
    currentLevel: data.current_level,
    totalLevels: data.total_levels,
    approvals: (data.approvals || []).map((a: any): GoApprovalStep => ({
      level: a.level,
      approvedBy: a.approved_by,
      approvedAt: a.approved_at ? new Date(a.approved_at) : undefined,
      decision: a.decision,
      notes: a.notes,
    })),
  };
}
