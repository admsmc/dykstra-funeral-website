import { Effect, Context } from 'effect';
import { Case, type CaseId, NotFoundError } from '@dykstra/domain';

/**
 * Persistence error
 */
export class PersistenceError extends Error {
  readonly _tag = 'PersistenceError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * Case Repository port
 * Defines interface for case persistence with SCD Type 2 temporal support
 */
export interface CaseRepository {
  /**
   * Find current version of case by business key
   */
  readonly findById: (id: CaseId) => Effect.Effect<Case, NotFoundError | PersistenceError>;
  
  /**
   * Find case as it existed at a specific point in time
   * @param businessKey - The case's immutable business identifier
   * @param asOf - Point in time to query (defaults to now)
   */
  readonly findByIdAtTime: (
    businessKey: string,
    asOf: Date
  ) => Effect.Effect<Case, NotFoundError | PersistenceError>;
  
  /**
   * Find complete version history of a case
   * @param businessKey - The case's immutable business identifier
   * @returns All versions ordered by version number
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly Case[], NotFoundError | PersistenceError>;
  
  /**
   * Find changes between two points in time
   * @param businessKey - The case's immutable business identifier
   * @param from - Start date
   * @param to - End date
   * @returns Versions that were effective between from and to
   */
  readonly findChangesBetween: (
    businessKey: string,
    from: Date,
    to: Date
  ) => Effect.Effect<readonly Case[], PersistenceError>;
  
  /**
   * Find current versions of cases by funeral home
   */
  readonly findByFuneralHome: (
    funeralHomeId: string
  ) => Effect.Effect<readonly Case[], PersistenceError>;
  
  /**
   * Find current versions of cases by family member
   */
  readonly findByFamilyMember: (
    userId: string
  ) => Effect.Effect<readonly Case[], PersistenceError>;
  
  /**
   * Save case - creates new version (SCD2)
   * This operation:
   * 1. Closes the current version (sets validTo, isCurrent=false)
   * 2. Inserts new version with incremented version number
   * 3. Never modifies existing versions (immutable history)
   */
  readonly save: (case_: Case) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Delete case (soft delete by closing all versions)
   * Sets validTo to now and isCurrent=false on the current version
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Case Repository service tag for dependency injection
 */
export const CaseRepository = Context.GenericTag<CaseRepository>('@dykstra/CaseRepository');
