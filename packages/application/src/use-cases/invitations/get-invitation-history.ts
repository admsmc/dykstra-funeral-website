import { Effect } from 'effect';
import { InvitationRepository, InvitationNotFoundError, InvitationWithRelations } from '../../ports/invitation-repository';

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
