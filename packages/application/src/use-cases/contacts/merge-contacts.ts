import { Effect } from 'effect';
import { Contact } from '@dykstra/domain';
import { ContactRepository, type ContactRepositoryService, NotFoundError, PersistenceError } from '../../ports/contact-repository';

/**
 * Merge Contacts
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface MergeContactsCommand {
  readonly sourceContactBusinessKey: string;
  readonly targetContactBusinessKey: string;
}

/**
 * Merge two contacts (deduplication)
 * Marks source contact as merged into target
 */
export const mergeContacts = (
  command: MergeContactsCommand
): Effect.Effect<
  Contact,
  NotFoundError | PersistenceError,
  ContactRepositoryService
> =>
  Effect.gen(function* () {
    const contactRepo = yield* ContactRepository;
    
    const sourceContact = yield* contactRepo.findByBusinessKey(command.sourceContactBusinessKey);
    const targetContact = yield* contactRepo.findByBusinessKey(command.targetContactBusinessKey);
    
    if (!sourceContact) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Source contact not found',
          entityType: 'Contact',
          entityId: command.sourceContactBusinessKey,
        })
      );
    }
    
    if (!targetContact) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Target contact not found',
          entityType: 'Contact',
          entityId: command.targetContactBusinessKey,
        })
      );
    }
    
    // Merge source into target
    const mergedSource = sourceContact.mergeInto(targetContact.id);
    yield* contactRepo.update(mergedSource);
    
    return targetContact;
  });
