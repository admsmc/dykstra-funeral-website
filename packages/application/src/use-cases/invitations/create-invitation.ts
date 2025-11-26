import { Effect } from 'effect';
import { randomBytes } from 'crypto';
import { InvitationRepository, CaseMemberRole, InvitationConflictError } from '../../ports/invitation-repository';
import { CaseRepository, NotFoundError, PersistenceError } from '../../ports/case-repository';
import { EmailPort, EmailError } from '../../ports/email-port';
import { ValidationError } from '@dykstra/domain';

export interface CreateInvitationCommand {
  caseId: string;
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
 * Business rules:
 * - Case must exist
 * - Email must not have an active invitation for this case
 * - Token is secure 64-character hex string
 * - Expiration is 7 days from creation
 * - Sends email with magic link
 */
export const createInvitation = (command: CreateInvitationCommand): Effect.Effect<
  CreateInvitationResult,
  ValidationError | InvitationConflictError | NotFoundError | PersistenceError | EmailError,
  InvitationRepository | CaseRepository | EmailPort
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;
    const caseRepo = yield* CaseRepository;
    const emailPort = yield* EmailPort;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(command.email)) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Invalid email format', field: 'email' })
      );
    }

    // Verify case exists
    const caseEntity = yield* caseRepo.findById(command.caseId as any);

    // Check for existing active invitation
    const hasActive = yield* invitationRepo.hasActiveInvitation(command.caseId, command.email);
    if (hasActive) {
      return yield* Effect.fail(
        new InvitationConflictError('An active invitation already exists for this email')
      );
    }

    // Generate secure token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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
