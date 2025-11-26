import { Effect } from 'effect';
import { InvitationRepository, InvitationStatus, InvitationWithRelations } from '../../ports/invitation-repository';

export interface ListInvitationsQuery {
  caseId: string;
  status?: InvitationStatus;
}

export interface InvitationListItem extends InvitationWithRelations {
  isExpired: boolean;
}

/**
 * List all current invitations for a case
 * Optionally filter by status
 * Checks for expired invitations
 */
export const listInvitations = (query: ListInvitationsQuery): Effect.Effect<
  InvitationListItem[],
  never,
  InvitationRepository
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;

    const invitations = yield* invitationRepo.findByCase(query.caseId, query.status);

    // Check for expired invitations
    const now = new Date();
    return invitations.map((inv) => ({
      ...inv,
      isExpired: inv.status === 'PENDING' && inv.expiresAt < now,
    }));
  });
