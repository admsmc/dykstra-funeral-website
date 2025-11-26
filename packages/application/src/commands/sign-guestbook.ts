import { Effect } from 'effect';
import { GuestbookEntry, ValidationError } from '@dykstra/domain';
import { GuestbookRepository, PersistenceError } from '../ports/guestbook-repository';

/**
 * Sign Guestbook command
 */
export interface SignGuestbookCommand {
  readonly id: string;
  readonly memorialId: string;
  readonly name: string;
  readonly email?: string;
  readonly message: string;
  readonly city?: string;
  readonly state?: string;
}

/**
 * Sign Guestbook command handler
 * Creates a new guestbook entry
 */
export const signGuestbook = (
  command: SignGuestbookCommand
): Effect.Effect<
  GuestbookEntry,
  ValidationError | PersistenceError,
  GuestbookRepository
> =>
  Effect.gen(function* (_) {
    // Get dependencies
    const guestbookRepo = yield* _(GuestbookRepository);
    
    // Create guestbook entry entity
    const entry = yield* _(
      GuestbookEntry.create({
        id: command.id,
        memorialId: command.memorialId,
        name: command.name,
        email: command.email,
        message: command.message,
        city: command.city,
        state: command.state,
      })
    );
    
    // Persist entry
    yield* _(guestbookRepo.save(entry));
    
    return entry;
  });
