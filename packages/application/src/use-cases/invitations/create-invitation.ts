import { Effect } from 'effect';
import { randomBytes } from 'crypto';
import { InvitationRepository, type CaseMemberRole, InvitationConflictError } from '../../ports/invitation-repository';
import { CaseRepository, type NotFoundError, type PersistenceError } from '../../ports/case-repository';
import { EmailPort, type EmailError } from '../../ports/email-port';
import { ValidationError } from '@dykstra/domain';
import { InvitationManagementPolicyRepository, type InvitationManagementPolicyRepositoryService } from '../../ports/invitation-management-policy-repository';

/**
 * Create Invitation
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: InvitationManagementPolicy
 * Persisted In: InvitationManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 18+ tests
 * Last Updated: Phase 1.8
 */

export interface CreateInvitationCommand {
  caseId: string;
  funeralHomeId: string;
  email: string;
  name: string;
  phone?: string;
  relationship?: string;
  role: CaseMemberRole;
  permissions: Record<string, boolean>;
  sentBy: string;
  baseUrl: string; // For generating magic link
}

export interface CreateInvitationResult {
  invitation: {
    id: string;
    businessKey: string;
    email: string;
    name: string;
    status: string;
    expiresAt: Date;
  };
}

/**
 * Create and send family invitation
 * 
 * Uses InvitationManagementPolicy to enforce:
 * - Token length and format
 * - Expiration window
 * - Email validation rules
 * - Duplicate invitation handling
 */
export const createInvitation = (command: CreateInvitationCommand): Effect.Effect<
  CreateInvitationResult,
  ValidationError | InvitationConflictError | NotFoundError | PersistenceError | EmailError,
  InvitationRepository | CaseRepository | EmailPort | InvitationManagementPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;
    const caseRepo = yield* CaseRepository;
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

    // Validate email format based on policy
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Default strict validation
    if (!policy.requireStrictEmailValidation) {
      // Relaxed validation - allow edge cases
      emailRegex = /^.+@.+$/;
    }
    if (!emailRegex.test(command.email)) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Invalid email format', field: 'email' })
      );
    }

    // Validate phone number if required by policy
    if (policy.requirePhoneNumber && !command.phone) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Phone number is required', field: 'phone' })
      );
    }

    // Verify case exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Branded type conversion
    const caseEntity = yield* caseRepo.findById(command.caseId as any);

    // Check for existing active invitation (based on policy allowance)
    const hasActive = yield* invitationRepo.hasActiveInvitation(command.caseId, command.email);
    if (hasActive && !policy.allowMultipleInvitationsPerEmail) {
      return yield* Effect.fail(
        new InvitationConflictError('An active invitation already exists for this email')
      );
    }

    // Generate token with policy-configured length
    const token = randomBytes(policy.tokenLengthBytes).toString('hex');

    // Set expiration based on policy
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + policy.expirationDays);

    // Generate unique business key
    const businessKey = `INV_${Date.now()}_${randomBytes(4).toString('hex')}`;

    // Create invitation
    const invitation = yield* invitationRepo.create({
      businessKey,
      caseId: command.caseId,
      email: command.email,
      name: command.name,
      phone: command.phone,
      relationship: command.relationship,
      role: command.role,
      permissions: command.permissions,
      status: 'PENDING',
      token,
      expiresAt,
      sentBy: command.sentBy,
    });

    // Send email with magic link
    const magicLink = `${command.baseUrl}/api/accept-invitation/${token}`;
    yield* emailPort.sendInvitation(
      command.email,
      magicLink,
      invitation.case?.funeralHome.name || 'Funeral Home',
      caseEntity.decedentName
    );

    return {
      invitation: {
        id: invitation.id,
        businessKey: invitation.businessKey,
        email: invitation.email,
        name: invitation.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    };
  });
