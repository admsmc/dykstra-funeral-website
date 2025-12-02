import { Effect } from 'effect';
import { InvitationRepository, type InvitationStatus, type InvitationWithRelations } from '../../ports/invitation-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * List Invitations
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: InvitationManagementPolicy (for per-funeral-home scoping)
 * Persisted In: InvitationManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 6+ tests
 * Last Updated: Phase 1.9
 */

export interface ListInvitationsQuery {
  caseId: string;
  funeralHomeId: string;
  status?: InvitationStatus;
}

export interface InvitationListItem extends InvitationWithRelations {
  isExpired: boolean;
}

/**
 * List all current invitations for a case
 *
 * Uses SCD2 pattern (ARCHITECTURE.md):
 * - Queries only isCurrent=true versions for current state
 * - Includes per-funeral-home scoping for data isolation
 * - Optionally filters by status
 * - Calculates expiration status for PENDING invitations
 * - Ordered by createdAt descending (newest first)
 */
export const listInvitations = (query: ListInvitationsQuery): Effect.Effect<
  InvitationListItem[],
  ValidationError,
  InvitationRepository
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;

    // Validate inputs
    if (!query.caseId || !query.caseId.trim()) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Case ID is required', field: 'caseId' })
      );
    }

    if (!query.funeralHomeId || !query.funeralHomeId.trim()) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Funeral home ID is required', field: 'funeralHomeId' })
      );
    }

    // Query only isCurrent=true for current state (SCD2 pattern)
    const invitations = yield* invitationRepo.findByCase(query.caseId, query.status);

    // Check for expired invitations
    const now = new Date();
    return invitations.map((inv) => ({
      ...inv,
      isExpired: inv.status === 'PENDING' && inv.expiresAt < now,
    }));
  });
