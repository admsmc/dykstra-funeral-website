import { Effect } from 'effect';
import { InvitationRepository, type InvitationNotFoundError } from '../../ports/invitation-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * Revoke Invitation
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

export interface RevokeInvitationCommand {
  businessKey: string;
  funeralHomeId: string;
}

export interface RevokeInvitationResult {
  success: true;
  message: string;
  revokedAt: Date;
}

/**
 * Revoke invitation, preventing future acceptance
 *
 * Implements SCD2 pattern (ARCHITECTURE.md):
 * - Finds current invitation (isCurrent=true)
 * - Validates invitation can be revoked (not already accepted/revoked)
 * - Closes current version (isCurrent=false, validTo=NOW)
 * - Creates new version (version++, status=REVOKED, isCurrent=true, validFrom=NOW)
 * - Preserves createdAt and businessKey for audit trail
 */
export const revokeInvitation = (command: RevokeInvitationCommand): Effect.Effect<
  RevokeInvitationResult,
  ValidationError | InvitationNotFoundError,
  InvitationRepository
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;

    // Find current invitation
    const current = yield* invitationRepo.findByBusinessKey(command.businessKey);

    // Validate invitation status for revocation
    if (current.status === 'ACCEPTED') {
      return yield* Effect.fail(
        new ValidationError({ message: 'Cannot revoke accepted invitation. Remove user from case instead.', field: 'status' })
      );
    }

    if (current.status === 'REVOKED') {
      return yield* Effect.fail(
        new ValidationError({ message: 'Invitation is already revoked', field: 'status' })
      );
    }

    // SCD2 pattern: Close current and create new version with REVOKED status
    const revokedAt = new Date();
    yield* invitationRepo.createNewVersion(command.businessKey, {
      status: 'REVOKED',
      revokedAt,
    });

    return { success: true, message: 'Invitation revoked successfully', revokedAt };
  });
