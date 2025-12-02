import { Context, type Effect } from 'effect';
import { type EmailCalendarSyncPolicy, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Email/Calendar Synchronization Policy Repository Port
 *
 * Handles persistence of email/calendar sync policies per funeral home.
 * Supports SCD2 versioning to track policy changes over time.
 */
export interface EmailCalendarSyncPolicyRepositoryService {
  /**
   * Find the current active policy for a funeral home
   */
  findCurrentByFuneralHomeId(
    funeralHomeId: string,
  ): Effect.Effect<EmailCalendarSyncPolicy, NotFoundError | PersistenceError, never>;

  /**
   * Find all versions of a policy (for audit trail)
   */
  findAllVersionsByFuneralHomeId(
    funeralHomeId: string,
  ): Effect.Effect<EmailCalendarSyncPolicy[], NotFoundError | PersistenceError, never>;

  /**
   * Find a specific policy version by ID
   */
  findById(id: string): Effect.Effect<EmailCalendarSyncPolicy, NotFoundError | PersistenceError, never>;

  /**
   * Create a new policy (version 1)
   */
  create(
    policy: Omit<EmailCalendarSyncPolicy, 'id' | 'createdAt' | 'updatedAt'>,
  ): Effect.Effect<EmailCalendarSyncPolicy, PersistenceError, never>;

  /**
   * Update an existing policy - creates a new version (SCD2)
   * Marks previous version as inactive
   */
  update(
    funeralHomeId: string,
    updates: Partial<
      Omit<EmailCalendarSyncPolicy, 'id' | 'businessKey' | 'version' | 'validFrom' | 'validTo' | 'isCurrent' | 'funeralHomeId' | 'createdAt'>
    >,
  ): Effect.Effect<EmailCalendarSyncPolicy, NotFoundError | PersistenceError, never>;

  /**
   * List all funeral homes with their current policies
   */
  listCurrentPolicies(): Effect.Effect<EmailCalendarSyncPolicy[], PersistenceError, never>;
}

export const EmailCalendarSyncPolicyRepository = Context.GenericTag<EmailCalendarSyncPolicyRepositoryService>(
  '@dykstra/EmailCalendarSyncPolicyRepository',
);
