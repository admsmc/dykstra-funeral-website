import { Effect } from 'effect';
import { randomBytes } from 'crypto';
import { InvitationRepository, type InvitationNotFoundError } from '../../ports/invitation-repository';
import { EmailPort, type EmailPortService, type EmailError } from '../../ports/email-port';
import { ValidationError, type NotFoundError } from '@dykstra/domain';
import { InvitationManagementPolicyRepository, type InvitationManagementPolicyRepositoryService, type PersistenceError } from '../../ports/invitation-management-policy-repository';

/**
 * Resend Invitation
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: InvitationManagementPolicy
 * Persisted In: InvitationManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 6+ tests
 * Last Updated: Phase 1.9
 */

export interface ResendInvitationCommand {
  businessKey: string;
  funeralHomeId: string;
  sentBy: string;
  baseUrl: string;
}

export interface ResendInvitationResult {
  success: true;
  message: string;
  token: string;
  expiresAt: Date;
}

/**
 * Resend invitation with new token
 *
 * Uses InvitationManagementPolicy to enforce:
 * - Token length and format
 * - Expiration window
 * - Policy-per-funeral-home scoping
 *
 * Implements SCD2 pattern (ARCHITECTURE.md):
 * - Finds current invitation (isCurrent=true)
 * - Closes current version (isCurrent=false, validTo=NOW)
 * - Creates new version (version++, isCurrent=true, validFrom=NOW)
 * - Preserves createdAt and businessKey for audit trail
 */
export const resendInvitation = (command: ResendInvitationCommand): Effect.Effect<
  ResendInvitationResult,
  ValidationError | EmailError | InvitationNotFoundError | NotFoundError | PersistenceError,
  InvitationRepository | EmailPortService | InvitationManagementPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;
    const emailPort = yield* EmailPort;
    const policyRepo = yield* InvitationManagementPolicyRepository;

    // Load policy for this funeral home
    const policy = yield* policyRepo.findByFuneralHome(command.funeralHomeId);

    // Validate policy is active
    if (!policy.isCurrent) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Policy is not active',
          field: 'policy',
        })
      );
    }

    // Find current invitation
    const current = yield* invitationRepo.findByBusinessKey(command.businessKey);

    // Validate current invitation can be resent
    if (!['PENDING', 'EXPIRED'].includes(current.status)) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Can only resend pending or expired invitations', field: 'status' })
      );
    }

    // Generate token with policy-configured length
    const newToken = randomBytes(policy.tokenLengthBytes).toString('hex');

    // Set expiration based on policy
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + policy.expirationDays);

    // SCD2 pattern: Close current and create new version
    const updated = yield* invitationRepo.createNewVersion(command.businessKey, {
      status: 'PENDING',
      token: newToken,
      expiresAt: newExpiresAt,
      sentBy: command.sentBy,
    });

    // Send email with magic link
    const magicLink = `${command.baseUrl}/api/accept-invitation/${newToken}`;
    yield* emailPort.sendInvitation(
      updated.email,
      magicLink,
      updated.case?.funeralHome.name || 'Funeral Home',
      updated.case?.decedentName || 'Deceased'
    );

    return { success: true, message: 'Invitation resent successfully', token: newToken, expiresAt: newExpiresAt };
  });
