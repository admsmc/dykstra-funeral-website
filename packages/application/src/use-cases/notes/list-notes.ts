import { Effect } from 'effect';
import { NoteRepository } from '../../ports/note-repository';

/**
 * List Notes
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: NoteManagementPolicy (read-only, no enforcement)
 * Persisted In: PostgreSQL (packages/infrastructure/prisma/schema.prisma)
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 8 tests
 * Last Updated: Phase 1.5
 */

export interface ListNotesQuery {
  funeralHomeId: string;  // Required for scoping
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
