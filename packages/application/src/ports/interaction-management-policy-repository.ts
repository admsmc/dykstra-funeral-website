import { type Effect, Context } from 'effect';
import { type InteractionManagementPolicy, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Interaction Management Policy Repository port
 * Defines interface for policy persistence and retrieval
 */
export interface InteractionManagementPolicyRepositoryService {
  /**
   * Find current active policy for a funeral home
   */
  readonly findByFuneralHome: (
    funeralHomeId: string
  ) => Effect.Effect<InteractionManagementPolicy, NotFoundError | PersistenceError>;

  /**
   * Find specific policy version by business key
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<InteractionManagementPolicy, NotFoundError | PersistenceError>;

  /**
   * Find all versions of a policy (historical tracking)
   */
  readonly findAllVersions: (
    businessKey: string
  ) => Effect.Effect<readonly InteractionManagementPolicy[], PersistenceError>;

  /**
   * List all current active policies
   */
  readonly findAll: () => Effect.Effect<readonly InteractionManagementPolicy[], PersistenceError>;

  /**
   * Save new policy version (for updates, creates new version with SCD2)
   */
  readonly save: (policy: InteractionManagementPolicy) => Effect.Effect<void, PersistenceError>;

  /**
   * Update policy (closes current version, creates new version)
   */
  readonly update: (policy: InteractionManagementPolicy) => Effect.Effect<InteractionManagementPolicy, PersistenceError>;

  /**
   * Delete policy (hard delete - rare operation)
   */
  readonly delete: (id: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Interaction Management Policy Repository service tag for dependency injection
 */
export const InteractionManagementPolicyRepository = Context.GenericTag<InteractionManagementPolicyRepositoryService>('@dykstra/InteractionManagementPolicyRepository');
