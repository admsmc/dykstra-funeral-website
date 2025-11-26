import { Effect } from 'effect';
import { randomBytes } from 'crypto';
import { InvitationRepository, InvitationNotFoundError } from '../../ports/invitation-repository';
import { EmailPort, EmailError } from '../../ports/email-port';
import { ValidationError } from '@dykstra/domain';

export interface ResendInvitationCommand {
  businessKey: string;
  sentBy: string;
  baseUrl: string;
}

export const resendInvitation = (command: ResendInvitationCommand): Effect.Effect<
  { success: true; message: string },
  ValidationError | InvitationNotFoundError | EmailError,
  InvitationRepository | EmailPort
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;
    const emailPort = yield* EmailPort;

    const current = yield* invitationRepo.findByBusinessKey(command.businessKey);

    if (!['PENDING', 'EXPIRED'].includes(current.status)) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Can only resend pending or expired invitations', field: 'status' })
      );
    }

    const newToken = randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const updated = yield* invitationRepo.createNewVersion(command.businessKey, {
      status: 'PENDING',
      token: newToken,
      expiresAt: newExpiresAt,
      sentBy: command.sentBy,
    });

    const magicLink = `${command.baseUrl}/api/accept-invitation/${newToken}`;
    yield* emailPort.sendInvitation(
      updated.email,
      magicLink,
      updated.case?.funeralHome.name || 'Funeral Home',
      updated.case?.decedentName || 'Deceased'
    );

    return { success: true, message: 'Invitation resent successfully' };
  });
