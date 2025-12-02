import { type Effect, Context } from 'effect';
import { type PaymentManagementPolicy, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Payment Management Policy Repository port
 * Defines interface for policy persistence and retrieval
 */
export interface PaymentManagementPolicyRepositoryService {
  /**
   * Find current active policy for a funeral home
   */
  readonly findByFuneralHome: (
    funeralHomeId: string
  ) => Effect.Effect<PaymentManagementPolicy, NotFoundError | PersistenceError>;

  /**
   * Find specific policy version by business key
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<PaymentManagementPolicy, NotFoundError | PersistenceError>;

  /**
   * Find all versions of a policy (historical tracking)
   */
  readonly findAllVersions: (
    businessKey: string
  ) => Effect.Effect<readonly PaymentManagementPolicy[], PersistenceError>;

  /**
   * List all current active policies
   */
  readonly findAll: () => Effect.Effect<readonly PaymentManagementPolicy[], PersistenceError>;

  /**
   * Save new policy version (for updates, creates new version with SCD2)
   */
  readonly save: (policy: PaymentManagementPolicy) => Effect.Effect<void, PersistenceError>;

  /**
   * Update policy (closes current version, creates new version)
   */
  readonly update: (policy: PaymentManagementPolicy) => Effect.Effect<PaymentManagementPolicy, PersistenceError>;

  /**
   * Delete policy (hard delete - rare operation)
   */
  readonly delete: (id: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Payment Management Policy Repository service tag for dependency injection
 */
export const PaymentManagementPolicyRepository = Context.GenericTag<PaymentManagementPolicyRepositoryService>(
  '@dykstra/PaymentManagementPolicyRepository'
);
