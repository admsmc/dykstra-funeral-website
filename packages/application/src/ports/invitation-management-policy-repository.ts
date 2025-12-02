import { type Effect, Context } from 'effect';
import { type InvitationManagementPolicy, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Invitation Management Policy Repository port
 * Defines interface for policy persistence and retrieval
 */
export interface InvitationManagementPolicyRepositoryService {
  /**
   * Find current active policy for a funeral home
   */
  readonly findByFuneralHome: (
    funeralHomeId: string
  ) => Effect.Effect<InvitationManagementPolicy, NotFoundError | PersistenceError>;

  /**
   * Find specific policy version by business key
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<InvitationManagementPolicy, NotFoundError | PersistenceError>;

  /**
   * Find all versions of a policy (historical tracking)
   */
  readonly findAllVersions: (
    businessKey: string
  ) => Effect.Effect<readonly InvitationManagementPolicy[], PersistenceError>;

  /**
   * List all current active policies
   */
  readonly findAll: () => Effect.Effect<readonly InvitationManagementPolicy[], PersistenceError>;

  /**
   * Save new policy version (for updates, creates new version with SCD2)
   */
  readonly save: (policy: InvitationManagementPolicy) => Effect.Effect<void, PersistenceError>;

  /**
   * Update policy (closes current version, creates new version)
   */
  readonly update: (policy: InvitationManagementPolicy) => Effect.Effect<InvitationManagementPolicy, PersistenceError>;

  /**
   * Delete policy (hard delete - rare operation)
   */
  readonly delete: (id: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Invitation Management Policy Repository service tag for dependency injection
 */
export const InvitationManagementPolicyRepository = Context.GenericTag<InvitationManagementPolicyRepositoryService>('@dykstra/InvitationManagementPolicyRepository');
