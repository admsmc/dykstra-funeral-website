import { Effect } from 'effect';
import { NoteRepository } from '../../ports/note-repository';

/**
 * Get Note History
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

export interface GetNoteHistoryQuery {
  funeralHomeId: string;  // Required for scoping
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
