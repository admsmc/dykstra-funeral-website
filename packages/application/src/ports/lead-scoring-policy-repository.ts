import { Effect, Context } from 'effect';
import { LeadScoringPolicy } from '@dykstra/domain';

/**
 * LeadScoringPolicyRepository Port
 * 
 * Repository for managing lead scoring policies per funeral home.
 * Implements SCD Type 2 versioning for policy audit trails.
 * 
 * Type A Operation: Policy stored in PostgreSQL
 * All operations are per-funeral-home scoped
 */
export interface LeadScoringPolicyRepository {
  /**
   * Find the current (active) lead scoring policy for a funeral home
   * Returns the latest version where isCurrent = true
   */
  readonly findCurrentByFuneralHome: (
    funeralHomeId: string
  ) => Effect.Effect<LeadScoringPolicy, NotFoundError | PersistenceError>;

  /**
   * Get the full version history of lead scoring policies for a funeral home
   * Includes all past versions for audit trails
   */
  readonly getHistory: (
    funeralHomeId: string
  ) => Effect.Effect<LeadScoringPolicy[], PersistenceError>;

  /**
   * Get a specific version of a policy
   */
  readonly getByVersion: (
    businessKey: string,
    version: number
  ) => Effect.Effect<LeadScoringPolicy, NotFoundError | PersistenceError>;

  /**
   * Save a new version of the policy (SCD2 pattern)
   * Automatically closes the current version and inserts new version
   */
  readonly save: (policy: LeadScoringPolicy) => Effect.Effect<void, PersistenceError>;

  /**
   * Delete a policy (soft delete via SCD2)
   * Closes all versions of the policy
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Error: Policy not found
 */
export class NotFoundError extends Error {
  readonly _tag = 'NotFoundError';
  constructor(
    override readonly message: string,
    readonly entityType: string = 'LeadScoringPolicy',
    readonly entityId: string = ''
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Error: Database operation failed
 */
export class PersistenceError extends Error {
  readonly _tag = 'PersistenceError';
  constructor(
    override readonly message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/**
 * Context tag for dependency injection
 * Usage: const repo = yield* LeadScoringPolicyRepository;
 */
export const LeadScoringPolicyRepository = Context.GenericTag<LeadScoringPolicyRepository>(
  '@dykstra/LeadScoringPolicyRepository'
);
