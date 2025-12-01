import { Effect } from 'effect';
import { NoteRepository } from '../../ports/note-repository';

/**
 * List Notes
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

export interface ListNotesQuery {
  caseId: string;
}

export interface ListNotesResult {
  notes: Array<{
    id: string;
    businessKey: string;
    version: number;
    content: string;
    createdBy: {
      name: string;
      email: string;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
}

/**
 * List current notes for a case
 * Returns only the current versions (isCurrent=true)
 */
export const listNotes = (query: ListNotesQuery): Effect.Effect<
  ListNotesResult,
  never,
  NoteRepository
> =>
  Effect.gen(function* () {
    const noteRepo = yield* NoteRepository;
    const notes = yield* noteRepo.findCurrentByCase(query.caseId);

    return {
      notes: notes.map((note) => ({
        id: note.id,
        businessKey: note.businessKey,
        version: note.version,
        content: note.content,
        createdBy: {
          name: note.creator.name,
          email: note.creator.email,
        },
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    };
  });
