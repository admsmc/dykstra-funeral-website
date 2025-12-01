import { Effect } from 'effect';
import { NoteRepository, NoteNotFoundError } from '../../ports/note-repository';

/**
 * Delete Note
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

export interface DeleteNoteCommand {
  businessKey: string;
}

export interface DeleteNoteResult {
  success: true;
}

/**
 * Soft delete a note (SCD2 pattern)
 * Marks the current version as not current (isCurrent=false)
 * This is append-only, never physically deletes
 */
export const deleteNote = (command: DeleteNoteCommand): Effect.Effect<
  DeleteNoteResult,
  NoteNotFoundError,
  NoteRepository
> =>
  Effect.gen(function* () {
    const noteRepo = yield* NoteRepository;

    // Soft delete (marks as not current)
    yield* noteRepo.softDelete(command.businessKey);

    return { success: true };
  });
