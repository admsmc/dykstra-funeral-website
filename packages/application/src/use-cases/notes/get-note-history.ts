import { Effect } from 'effect';
import { NoteRepository } from '../../ports/note-repository';

/**
 * Get Note History
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

export interface GetNoteHistoryQuery {
  businessKey: string;
}

export interface GetNoteHistoryResult {
  history: Array<{
    id: string;
    version: number;
    content: string;
    createdBy: string;
    validFrom: Date;
    validTo: Date | null;
    isCurrent: boolean;
  }>;
}

/**
 * Get all versions of a note (SCD2 history)
 * Ordered by version descending (newest first)
 */
export const getNoteHistory = (query: GetNoteHistoryQuery): Effect.Effect<
  GetNoteHistoryResult,
  never,
  NoteRepository
> =>
  Effect.gen(function* () {
    const noteRepo = yield* NoteRepository;
    const history = yield* noteRepo.findHistory(query.businessKey);

    return {
      history: history.map((version) => ({
        id: version.id,
        version: version.version,
        content: version.content,
        createdBy: version.createdBy,
        validFrom: version.validFrom,
        validTo: version.validTo,
        isCurrent: version.isCurrent,
      })),
    };
  });
