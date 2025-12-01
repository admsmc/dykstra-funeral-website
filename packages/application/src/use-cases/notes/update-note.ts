import { Effect } from 'effect';
import { NoteRepository, NoteNotFoundError } from '../../ports/note-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * Update Note
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

export interface UpdateNoteCommand {
  businessKey: string;
  content: string;
  updatedBy: string;
}

export interface UpdateNoteResult {
  id: string;
  businessKey: string;
  version: number;
  content: string;
  createdBy: {
    name: string;
    email: string;
  };
  updatedAt: Date;
}

/**
 * Update a note using SCD2 pattern
 * Closes the current version and creates a new version
 */
export const updateNote = (command: UpdateNoteCommand): Effect.Effect<
  UpdateNoteResult,
  ValidationError | NoteNotFoundError,
  NoteRepository
> =>
  Effect.gen(function* () {
    // Validate content
    if (!command.content || command.content.trim().length === 0) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Content cannot be empty', field: 'content' })
      );
    }

    if (command.content.length > 10000) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Content cannot exceed 10000 characters', field: 'content' })
      );
    }

    const noteRepo = yield* NoteRepository;

    // Find current version
    const currentNote = yield* noteRepo.findCurrentByBusinessKey(command.businessKey);

    if (!currentNote) {
      return yield* Effect.fail(
        new NoteNotFoundError(command.businessKey)
      );
    }

    // Create new version (repository handles SCD2 closure)
    const newNote = yield* noteRepo.createNewVersion({
      businessKey: command.businessKey,
      content: command.content,
      createdBy: command.updatedBy,
      previousVersion: currentNote,
    });

    return {
      id: newNote.id,
      businessKey: newNote.businessKey,
      version: newNote.version,
      content: newNote.content,
      createdBy: {
        name: newNote.creator.name,
        email: newNote.creator.email,
      },
      updatedAt: newNote.updatedAt,
    };
  });
