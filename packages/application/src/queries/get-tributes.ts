import { Effect } from 'effect';
import { type Tribute, type MemorialId } from '@dykstra/domain';
import { TributeRepository, type PersistenceError } from '../ports/tribute-repository';

/**
 * Get Tributes query
 */
export interface GetTributesQuery {
  readonly memorialId: string;
  readonly includeUnapproved?: boolean; // Staff only
}

/**
 * Get Tributes query handler
 * Retrieves tributes for a memorial (public: approved only, staff: all or pending)
 */
export const getTributes = (
  query: GetTributesQuery
): Effect.Effect<
  Tribute[],
  PersistenceError,
  TributeRepository
> =>
  Effect.gen(function* (_) {
    const tributeRepo = yield* _(TributeRepository);
    
    if (query.includeUnapproved) {
      // Staff view: all tributes
      return yield* _(tributeRepo.findByMemorial(query.memorialId as MemorialId));
    } else {
      // Public view: approved only
      return yield* _(tributeRepo.findApprovedByMemorial(query.memorialId as MemorialId));
    }
  });

/**
 * Get Pending Tributes query handler
 * Retrieves tributes awaiting moderation (staff only)
 */
export const getPendingTributes = (
  memorialId: string
): Effect.Effect<
  Tribute[],
  PersistenceError,
  TributeRepository
> =>
  Effect.gen(function* (_) {
    const tributeRepo = yield* _(TributeRepository);
    return yield* _(tributeRepo.findPendingByMemorial(memorialId as MemorialId));
  });
