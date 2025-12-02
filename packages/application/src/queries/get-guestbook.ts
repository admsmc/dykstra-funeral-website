import { Effect } from 'effect';
import { type GuestbookEntry, type MemorialId } from '@dykstra/domain';
import { GuestbookRepository, type PersistenceError } from '../ports/guestbook-repository';

/**
 * Get Guestbook query
 */
export interface GetGuestbookQuery {
  readonly memorialId: string;
}

/**
 * Guestbook result with metadata
 */
export interface GuestbookResult {
  readonly entries: GuestbookEntry[];
  readonly totalCount: number;
}

/**
 * Get Guestbook query handler
 * Retrieves guestbook entries for a memorial with count
 */
export const getGuestbook = (
  query: GetGuestbookQuery
): Effect.Effect<
  GuestbookResult,
  PersistenceError,
  GuestbookRepository
> =>
  Effect.gen(function* (_) {
    const guestbookRepo = yield* _(GuestbookRepository);
    
    // Fetch entries and count in parallel
    const [entries, totalCount] = yield* _(
      Effect.all([
        guestbookRepo.findByMemorial(query.memorialId as MemorialId),
        guestbookRepo.countByMemorial(query.memorialId as MemorialId),
      ])
    );
    
    return {
      entries,
      totalCount,
    };
  });
