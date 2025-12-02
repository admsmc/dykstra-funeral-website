import { Effect } from 'effect';
import { Tribute, type ValidationError } from '@dykstra/domain';
import { TributeRepository } from '../ports/tribute-repository';
import { type PersistenceError } from '../ports/case-repository';

/**
 * Add Tribute command
 */
export interface AddTributeCommand {
  readonly id: string;
  readonly memorialId: string;
  readonly authorName: string;
  readonly authorEmail?: string;
  readonly message: string;
  readonly isPublic?: boolean;
}

/**
 * Add Tribute command handler
 * Creates a new tribute (requires moderation)
 */
export const addTribute = (
  command: AddTributeCommand
): Effect.Effect<
  Tribute,
  ValidationError | PersistenceError,
  TributeRepository
> =>
  Effect.gen(function* (_) {
    // Get dependencies
    const tributeRepo = yield* _(TributeRepository);
    
    // Create tribute entity (will be isApproved=false by default)
    const tribute = yield* _(
      Tribute.create({
        id: command.id,
        memorialId: command.memorialId,
        authorName: command.authorName,
        authorEmail: command.authorEmail,
        message: command.message,
        isPublic: command.isPublic,
      })
    );
    
    // Persist tribute
    yield* _(tributeRepo.save(tribute));
    
    return tribute;
  });
