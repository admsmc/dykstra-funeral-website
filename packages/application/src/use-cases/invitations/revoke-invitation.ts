import { Effect } from 'effect';
import { InvitationRepository, InvitationNotFoundError } from '../../ports/invitation-repository';
import { ValidationError } from '@dykstra/domain';

export interface RevokeInvitationCommand {
  businessKey: string;
}

export const revokeInvitation = (command: RevokeInvitationCommand): Effect.Effect<
  { success: true; message: string },
  ValidationError | InvitationNotFoundError,
  InvitationRepository
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;
    const current = yield* invitationRepo.findByBusinessKey(command.businessKey);

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

    yield* invitationRepo.createNewVersion(command.businessKey, {
      status: 'REVOKED',
      revokedAt: new Date(),
    });

    return { success: true, message: 'Invitation revoked successfully' };
  });
