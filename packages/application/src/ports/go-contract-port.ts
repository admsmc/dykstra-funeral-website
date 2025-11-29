import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Network error for Go backend communication failures
 */
export class NetworkError extends Error {
  readonly _tag = 'NetworkError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * Go Contract domain types
 * These mirror the Go backend Contract aggregate
 */
export interface GoContract {
  readonly id: string;
  readonly caseId: string;
  readonly version: number;
  readonly status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'completed' | 'cancelled';
  readonly services: readonly GoContractItem[];
  readonly products: readonly GoContractItem[];
  readonly totalAmount: number;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly signedBy: readonly string[];
  readonly signedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GoContractItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly glAccountId?: string;
}

export interface CreateContractCommand {
  readonly caseId: string;
  readonly services: readonly Omit<GoContractItem, 'id'>[];
  readonly products: readonly Omit<GoContractItem, 'id'>[];
}

export interface UpdateContractCommand {
  readonly services?: readonly Omit<GoContractItem, 'id'>[];
  readonly products?: readonly Omit<GoContractItem, 'id'>[];
}

export interface ApproveContractCommand {
  readonly approvedBy: string;
  readonly notes?: string;
}

/**
 * Go Contract Port
 * 
 * Defines interface for interacting with Go backend Contract Management module.
 * All methods communicate via HTTP/JSON through BFF proxy layer.
 * 
 * Architecture: This port follows hexagonal architecture principles:
 * - Defined in application layer
 * - Implemented by infrastructure adapter (GoContractAdapter)
 * - Never accessed directly from domain layer
 * 
 * Backend: Go ERP backend with event sourcing (EventStoreDB) and
 * TigerBeetle accounting integration
 */
export interface GoContractPortService {
  /**
   * Create a new contract for a case
   * 
   * Backend operation:
   * 1. Validates case exists
   * 2. Creates contract aggregate
   * 3. Emits ContractCreated event
   * 4. Returns contract with generated ID
   */
  readonly createContract: (
    command: CreateContractCommand
  ) => Effect.Effect<GoContract, NetworkError>;
  
  /**
   * Get contract by ID (current version)
   */
  readonly getContract: (
    id: string
  ) => Effect.Effect<GoContract, NotFoundError | NetworkError>;
  
  /**
   * List contracts by case ID
   */
  readonly listContractsByCase: (
    caseId: string
  ) => Effect.Effect<readonly GoContract[], NetworkError>;
  
  /**
   * Update contract (only allowed in draft status)
   * 
   * Backend operation:
   * 1. Validates contract is in draft status
   * 2. Updates items
   * 3. Emits ContractUpdated event
   */
  readonly updateContract: (
    id: string,
    command: UpdateContractCommand
  ) => Effect.Effect<GoContract, NetworkError>;
  
  /**
   * Approve contract
   * 
   * Backend operation:
   * 1. Validates contract is in pending_approval status
   * 2. Records approval
   * 3. Emits ContractApproved event
   * 4. Triggers provisioning orchestrator
   */
  readonly approveContract: (
    id: string,
    command: ApproveContractCommand
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Sign contract (records family/director signature)
   * 
   * Backend operation:
   * 1. Validates contract is approved
   * 2. Records signature
   * 3. Emits ContractSigned event
   * 4. Transitions to active when all signatures collected
   */
  readonly signContract: (
    id: string,
    signedBy: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Cancel contract
   * 
   * Backend operation:
   * 1. Validates contract can be cancelled
   * 2. Reverses any provisioning
   * 3. Emits ContractCancelled event
   */
  readonly cancelContract: (
    id: string,
    reason: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Get contract approval history
   */
  readonly getApprovalHistory: (
    id: string
  ) => Effect.Effect<readonly GoContractApproval[], NetworkError>;
}

export interface GoContractApproval {
  readonly id: string;
  readonly approvedBy: string;
  readonly approvedAt: Date;
  readonly level: number;
  readonly notes?: string;
}

/**
 * Go Contract Port service tag for dependency injection
 */
export const GoContractPort = Context.GenericTag<GoContractPortService>(
  '@dykstra/GoContractPort'
);
