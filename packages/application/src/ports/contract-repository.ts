import { type Effect, Context } from 'effect';
import { type Contract, type ContractId, type NotFoundError } from '@dykstra/domain';
import type { PersistenceError } from './case-repository';

export type { PersistenceError } from './case-repository';

/**
 * Contract Repository port
 * Defines interface for contract persistence with SCD Type 2 temporal support
 */
export interface ContractRepository {
  /**
   * Find current version of contract by business key
   */
  readonly findById: (id: ContractId) => Effect.Effect<Contract, NotFoundError | PersistenceError>;
  
  /**
   * Find contract as it existed at a specific point in time
   * Critical for legal compliance - "what did the contract say when it was signed?"
   */
  readonly findByIdAtTime: (
    businessKey: string,
    asOf: Date
  ) => Effect.Effect<Contract, NotFoundError | PersistenceError>;
  
  /**
   * Find complete version history of a contract
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly Contract[], NotFoundError | PersistenceError>;
  
  /**
   * Find current versions of contracts by case
   */
  readonly findByCase: (
    caseId: string
  ) => Effect.Effect<readonly Contract[], PersistenceError>;
  
  /**
   * Find current version of contract by business key (string identifier)
   * Convenience method for when you only have the business key string
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<Contract | null, PersistenceError>;
  
  /**
   * Find current version of contract by case
   * Returns only one contract per case (the current/active one)
   */
  readonly findCurrentByCase: (
    caseId: string
  ) => Effect.Effect<Contract | null, PersistenceError>;
  
  /**
   * Save contract - creates new version (SCD2)
   * ESIGN Act: Signed contracts must never be modified (immutable)
   */
  readonly save: (contract: Contract) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Create new contract - convenience method
   */
  readonly create: (contract: Contract) => Effect.Effect<Contract, PersistenceError>;
  
  /**
   * Update contract - convenience method that wraps save for SCD2 updates
   * Creates new version of existing contract
   */
  readonly update: (contract: Contract) => Effect.Effect<Contract, PersistenceError>;
  
  /**
   * Delete contract (soft delete by closing current version)
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Contract Repository service tag for dependency injection
 */
export const ContractRepository = Context.GenericTag<ContractRepository>('@dykstra/ContractRepository');
