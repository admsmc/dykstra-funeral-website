import { type Effect, Context } from 'effect';
import { type LeadToCaseConversionPolicy, type NotFoundError } from '@dykstra/domain';
import { type PersistenceError } from '../errors';

/**
 * LeadToCaseConversionPolicyRepository Port
 * 
 * Repository for managing lead-to-case conversion policies per funeral home.
 * Implements SCD Type 2 versioning for policy audit trails.
 * 
 * Type A Operation: Policy stored in PostgreSQL
 * All operations are per-funeral-home scoped
 */
export interface LeadToCaseConversionPolicyRepositoryService {
  /**
   * Find the current (active) lead-to-case conversion policy for a funeral home
   * Returns the latest version where isCurrent = true
   */
  readonly findCurrentByFuneralHome: (
    funeralHomeId: string
  ) => Effect.Effect<LeadToCaseConversionPolicy, NotFoundError | PersistenceError>;

  /**
   * Get the full version history of policies for a funeral home
   * Includes all past versions for audit trails
   */
  readonly getHistory: (
    funeralHomeId: string
  ) => Effect.Effect<LeadToCaseConversionPolicy[], PersistenceError>;

  /**
   * Get a specific version of a policy
   */
  readonly getByVersion: (
    businessKey: string,
    version: number
  ) => Effect.Effect<LeadToCaseConversionPolicy, NotFoundError | PersistenceError>;

  /**
   * Save a new version of the policy (SCD2 pattern)
   * Automatically closes the current version and inserts new version
   */
  readonly save: (policy: LeadToCaseConversionPolicy) => Effect.Effect<void, PersistenceError>;

  /**
   * Delete a policy (soft delete via SCD2)
   * Closes all versions of the policy
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Context tag for dependency injection
 * Usage: const repo = yield* LeadToCaseConversionPolicyRepository;
 */
export const LeadToCaseConversionPolicyRepository = Context.GenericTag<LeadToCaseConversionPolicyRepositoryService>(
  '@dykstra/LeadToCaseConversionPolicyRepository'
);
