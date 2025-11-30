import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type { 
  GoContractPortService,
  GoContract,
  GoContractApproval,
  CreateContractCommand,
  UpdateContractCommand,
  ApproveContractCommand,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Go Contract Adapter
 * 
 * Object-based adapter implementing GoContractPortService.
 * Wraps OpenAPI client and routes requests through BFF proxy.
 * 
 * Architecture:
 * - Infrastructure layer (this file)
 * - Implements port from application layer
 * - Uses Effect for error handling
 * - All requests go through BFF proxy (/api/go-proxy)
 * 
 * Backend: Go ERP with event sourcing and TigerBeetle
 */
export const GoContractAdapter: GoContractPortService = {
  createContract: (command: CreateContractCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts', {
          body: {
            case_id: command.caseId,
            services: command.services.map(s => ({
              description: s.description,
              quantity: s.quantity,
              unit_price: s.unitPrice,
              total_price: s.totalPrice,
              gl_account_id: s.glAccountId,
            })),
            products: command.products.map(p => ({
              description: p.description,
              quantity: p.quantity,
              unit_price: p.unitPrice,
              total_price: p.totalPrice,
              gl_account_id: p.glAccountId,
            })),
          }
        });
        
        const data = unwrapResponse(res);
        return mapToGoContract(data);
      },
      catch: (error) => new NetworkError(
        'Failed to create contract',
        error as Error
      )
    }),
  
  getContract: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/contracts/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Contract not found', entityType: 'Contract', entityId: id });
          }
          throw new Error(res.error.message || 'Failed to get contract');
        }
        
        return mapToGoContract(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new NetworkError(
          'Failed to get contract',
          error as Error
        );
      }
    }),
  
  listContractsByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/contracts', {
          params: { query: { case_id: caseId } }
        });
        
        const data = unwrapResponse(res);
        return (data.contracts || []).map(mapToGoContract);
      },
      catch: (error) => new NetworkError(
        'Failed to list contracts',
        error as Error
      )
    }),
  
  updateContract: (id: string, command: UpdateContractCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PATCH('/v1/contracts/{id}', {
          params: { path: { id } },
          body: {
            services: command.services?.map(s => ({
              description: s.description,
              quantity: s.quantity,
              unit_price: s.unitPrice,
              total_price: s.totalPrice,
              gl_account_id: s.glAccountId,
            })),
            products: command.products?.map(p => ({
              description: p.description,
              quantity: p.quantity,
              unit_price: p.unitPrice,
              total_price: p.totalPrice,
              gl_account_id: p.glAccountId,
            })),
          }
        });
        
        const data = unwrapResponse(res);
        return mapToGoContract(data);
      },
      catch: (error) => new NetworkError(
        'Failed to update contract',
        error as Error
      )
    }),
  
  approveContract: (id: string, command: ApproveContractCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts/{id}/approve', {
          params: { path: { id } },
          body: {
            approved_by: command.approvedBy,
            notes: command.notes,
          }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError(
        'Failed to approve contract',
        error as Error
      )
    }),
  
  signContract: (id: string, signedBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts/{id}/sign', {
          params: { path: { id } },
          body: { signed_by: signedBy }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError(
        'Failed to sign contract',
        error as Error
      )
    }),
  
  cancelContract: (id: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts/{id}/cancel', {
          params: { path: { id } },
          body: { reason }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError(
        'Failed to cancel contract',
        error as Error
      )
    }),
  
  getApprovalHistory: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/contracts/{id}/approvals', {
          params: { path: { id } }
        });
        
        const data = unwrapResponse(res);
        return (data.approvals || []).map(mapToGoContractApproval);
      },
      catch: (error) => new NetworkError(
        'Failed to get approval history',
        error as Error
      )
    }),
};

/**
 * Map Go API response to GoContract domain type
 * 
 * Handles snake_case to camelCase conversion and type coercion
 */
function mapToGoContract(data: any): GoContract {
  return {
    id: data.id,
    caseId: data.case_id,
    version: data.version,
    status: data.status,
    services: (data.services || []).map((s: any) => ({
      id: s.id,
      description: s.description,
      quantity: s.quantity,
      unitPrice: s.unit_price,
      totalPrice: s.total_price,
      glAccountId: s.gl_account_id,
    })),
    products: (data.products || []).map((p: any) => ({
      id: p.id,
      description: p.description,
      quantity: p.quantity,
      unitPrice: p.unit_price,
      totalPrice: p.total_price,
      glAccountId: p.gl_account_id,
    })),
    totalAmount: data.total_amount,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
    signedBy: data.signed_by || [],
    signedAt: data.signed_at ? new Date(data.signed_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Map Go API response to GoContractApproval domain type
 */
function mapToGoContractApproval(data: any): GoContractApproval {
  return {
    id: data.id,
    approvedBy: data.approved_by,
    approvedAt: new Date(data.approved_at),
    level: data.level,
    notes: data.notes,
  };
}
