import { type Effect, Context } from 'effect';
import type { GuestbookEntry, GuestbookEntryId, MemorialId } from '@dykstra/domain';
import { type NotFoundError } from '@dykstra/domain';
import type { PersistenceError } from './case-repository';

export type { PersistenceError } from './case-repository';

/**
 * Guestbook Repository Port
 * Interface for guestbook entry persistence operations
 */
export interface GuestbookRepository {
  /**
   * Find guestbook entry by ID
   */
  readonly findById: (id: GuestbookEntryId) => Effect.Effect<GuestbookEntry, NotFoundError | PersistenceError>;

  /**
   * Find all guestbook entries for a memorial
   */
  readonly findByMemorial: (memorialId: MemorialId) => Effect.Effect<GuestbookEntry[], PersistenceError>;

  /**
   * Save guestbook entry
   */
  readonly save: (entry: GuestbookEntry) => Effect.Effect<void, PersistenceError>;

  /**
   * Delete guestbook entry
   */
  readonly delete: (id: GuestbookEntryId) => Effect.Effect<void, NotFoundError | PersistenceError>;

  /**
   * Count entries for a memorial
   */
  readonly countByMemorial: (memorialId: MemorialId) => Effect.Effect<number, PersistenceError>;
}

/**
 * Guestbook Repository service tag for dependency injection
 */
export const GuestbookRepository = Context.GenericTag<GuestbookRepository>('@dykstra/GuestbookRepository');
