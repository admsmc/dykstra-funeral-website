import { type Effect, Context } from 'effect';
import type { Tribute, TributeId, MemorialId } from '@dykstra/domain';
import { type NotFoundError } from '@dykstra/domain';
import type { PersistenceError } from './case-repository';

export type { PersistenceError } from './case-repository';

/**
 * Tribute Repository Port
 * Interface for tribute persistence operations
 */
export interface TributeRepository {
  /**
   * Find tribute by ID
   */
  readonly findById: (id: TributeId) => Effect.Effect<Tribute, NotFoundError | PersistenceError>;

  /**
   * Find all tributes for a memorial
   */
  readonly findByMemorial: (memorialId: MemorialId) => Effect.Effect<Tribute[], PersistenceError>;

  /**
   * Find approved tributes for a memorial (public view)
   */
  readonly findApprovedByMemorial: (memorialId: MemorialId) => Effect.Effect<Tribute[], PersistenceError>;

  /**
   * Find pending tributes (awaiting moderation)
   */
  readonly findPendingByMemorial: (memorialId: MemorialId) => Effect.Effect<Tribute[], PersistenceError>;

  /**
   * Save tribute
   */
  readonly save: (tribute: Tribute) => Effect.Effect<void, PersistenceError>;

  /**
   * Delete tribute
   */
  readonly delete: (id: TributeId) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Tribute Repository service tag for dependency injection
 */
export const TributeRepository = Context.GenericTag<TributeRepository>('@dykstra/TributeRepository');
