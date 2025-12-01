import { Effect } from 'effect';
import { NoteRepository, NoteNotFoundError } from '../../ports/note-repository';
import { NoteManagementPolicyRepository } from '../../ports/note-management-policy-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * Update Note
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-DRIVEN
 * Policy Entity: NoteManagementPolicy
 * Persisted In: PostgreSQL (packages/infrastructure/prisma/schema.prisma)
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 14 tests
 * Last Updated: Phase 1.4
 */

export interface UpdateNoteCommand {
  funeralHomeId: string;  // Required for policy loading
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
 * Applies NoteManagementPolicy per funeral home
 */
export const updateNote = (command: UpdateNoteCommand): Effect.Effect<
  UpdateNoteResult,
  ValidationError | NoteNotFoundError,
  NoteRepository | NoteManagementPolicyRepository
> =>
  Effect.gen(function* () {
    const noteRepo = yield* NoteRepository;
    const policyRepo = yield* NoteManagementPolicyRepository;

    // Load policy for this funeral home
    const policy = yield* policyRepo.findCurrentByFuneralHome(command.funeralHomeId);

    // Validate content using policy-driven rules
    if (!command.content || command.content.trim().length === 0) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Content cannot be empty', field: 'content' })
      );
    }

    const trimmedContent = command.content.trim();
    const contentLength = trimmedContent.length;

    // Apply policy minimum length
    if (contentLength < policy.minContentLength) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Content must be at least ${policy.minContentLength} character(s)`,
          field: 'content',
        })
      );
    }

    // Apply policy maximum length (policy-driven, not hardcoded 10000)
    if (contentLength > policy.maxContentLength) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Content cannot exceed ${policy.maxContentLength} characters`,
          field: 'content',
        })
      );
    }

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
      content: trimmedContent,
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
