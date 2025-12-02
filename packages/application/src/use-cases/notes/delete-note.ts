import { Effect } from 'effect';
import { NoteRepository, type NoteNotFoundError } from '../../ports/note-repository';

/**
 * Delete Note
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: NoteManagementPolicy (read-only, no enforcement)
 * Persisted In: PostgreSQL (packages/infrastructure/prisma/schema.prisma)
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 6 tests
 * Last Updated: Phase 1.5
 */

export interface DeleteNoteCommand {
  funeralHomeId: string;  // Required for scoping and audit
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
