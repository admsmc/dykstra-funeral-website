import { Effect } from 'effect';
import { InvitationRepository, InvitationNotFoundError, InvitationWithRelations } from '../../ports/invitation-repository';

/**
 * Get Invitation History
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface GetInvitationHistoryQuery {
  businessKey: string;
}

export const getInvitationHistory = (query: GetInvitationHistoryQuery): Effect.Effect<
  InvitationWithRelations[],
  InvitationNotFoundError,
  InvitationRepository
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;
    return yield* invitationRepo.findHistory(query.businessKey);
  });
