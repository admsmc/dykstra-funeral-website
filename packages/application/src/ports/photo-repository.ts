import { Effect, Context } from 'effect';
import { Photo, type PhotoId, type MemorialId, NotFoundError } from '@dykstra/domain';
import type { PersistenceError } from './case-repository';

export type { PersistenceError } from './case-repository';

/**
 * Photo Repository port
 * Defines interface for photo persistence with SCD Type 2 temporal support
 */
export interface PhotoRepository {
  /**
   * Find current version of photo by ID
   */
  readonly findById: (id: PhotoId) => Effect.Effect<Photo, NotFoundError | PersistenceError>;
  
  /**
   * Find photo as it existed at a specific point in time
   * @param businessKey - The photo's immutable business identifier
   * @param asOf - Point in time to query (defaults to now)
   */
  readonly findByIdAtTime: (
    businessKey: string,
    asOf: Date
  ) => Effect.Effect<Photo, NotFoundError | PersistenceError>;
  
  /**
   * Find complete version history of a photo
   * @param businessKey - The photo's immutable business identifier
   * @returns All versions ordered by version number
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly Photo[], NotFoundError | PersistenceError>;
  
  /**
   * Find current versions of photos by memorial
   * @returns Photos ordered by uploadedAt descending (newest first)
   */
  readonly findByMemorial: (
    memorialId: MemorialId
  ) => Effect.Effect<readonly Photo[], PersistenceError>;
  
  /**
   * Find current versions of photos by case
   * @returns Photos ordered by uploadedAt descending (newest first)
   */
  readonly findByCase: (
    caseId: string
  ) => Effect.Effect<readonly Photo[], PersistenceError>;
  
  /**
   * Find photos uploaded by a specific user
   * @returns Photos ordered by uploadedAt descending (newest first)
   */
  readonly findByUploader: (
    userId: string
  ) => Effect.Effect<readonly Photo[], PersistenceError>;
  
  /**
   * Save photo - creates new version (SCD2)
   * This operation:
   * 1. Closes the current version (sets validTo, isCurrent=false)
   * 2. Inserts new version with incremented version number
   * 3. Never modifies existing versions (immutable history)
   */
  readonly save: (photo: Photo) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Delete photo (soft delete by closing current version)
   * Sets validTo to now and isCurrent=false on the current version
   * Note: Does NOT delete from storage - storage cleanup is separate concern
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Photo Repository service tag for dependency injection
 */
export const PhotoRepository = Context.GenericTag<PhotoRepository>('@dykstra/PhotoRepository');
