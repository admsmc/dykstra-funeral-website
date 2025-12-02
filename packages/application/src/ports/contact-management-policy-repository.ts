import { Context, type Effect } from 'effect';
import { type ContactManagementPolicy, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Contact Management Policy Repository Port
 *
 * Handles persistence of contact management policies per funeral home.
 * Supports SCD2 versioning to track policy changes over time.
 */
export interface ContactManagementPolicyRepositoryService {
  /**
   * Find the current active policy for a funeral home
   */
  findCurrentByFuneralHomeId(
    funeralHomeId: string,
  ): Effect.Effect<ContactManagementPolicy, NotFoundError | PersistenceError, never>;

  /**
   * Find all versions of a policy (for audit trail)
   */
  findAllVersionsByFuneralHomeId(
    funeralHomeId: string,
  ): Effect.Effect<ContactManagementPolicy[], NotFoundError | PersistenceError, never>;

  /**
   * Find a specific policy version by ID
   */
  findById(id: string): Effect.Effect<ContactManagementPolicy, NotFoundError | PersistenceError, never>;

  /**
   * Create a new policy (version 1)
   */
  create(policy: Omit<ContactManagementPolicy, 'id' | 'createdAt' | 'updatedAt'>): Effect.Effect<
    ContactManagementPolicy,
    PersistenceError,
    never
  >;

  /**
   * Update an existing policy - creates a new version (SCD2)
   * Marks previous version as inactive
   */
  update(
    funeralHomeId: string,
    updates: Partial<
      Omit<ContactManagementPolicy, 'id' | 'businessKey' | 'version' | 'validFrom' | 'validTo' | 'isCurrent' | 'funeralHomeId' | 'createdAt'>
    >,
  ): Effect.Effect<ContactManagementPolicy, NotFoundError | PersistenceError, never>;

  /**
   * List all funeral homes with their current policies
   */
  listCurrentPolicies(): Effect.Effect<ContactManagementPolicy[], PersistenceError, never>;
}

export const ContactManagementPolicyRepository = Context.GenericTag<ContactManagementPolicyRepositoryService>(
  '@dykstra/ContactManagementPolicyRepository',
);
