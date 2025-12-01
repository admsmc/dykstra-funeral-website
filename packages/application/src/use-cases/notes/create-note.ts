import { Effect } from 'effect';
import { NoteRepository } from '../../ports/note-repository';
import { NoteManagementPolicyRepository } from '../../ports/note-management-policy-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * Create Note
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-DRIVEN
 * Policy Entity: NoteManagementPolicy
 * Persisted In: PostgreSQL (packages/infrastructure/prisma/schema.prisma)
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 18+ tests
 * Last Updated: Phase 1.3
 */

export interface CreateNoteCommand {
  funeralHomeId: string;  // Required for policy loading
  caseId: string;
  content: string;
  createdBy: string;
}

export interface CreateNoteResult {
  id: string;
  businessKey: string;
  version: number;
  content: string;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

/**
 * Create a new internal note
 * Initial version (version=1, isCurrent=true)
 * Applies NoteManagementPolicy per funeral home
 */
export const createNote = (command: CreateNoteCommand): Effect.Effect<
  CreateNoteResult,
  ValidationError,
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

    // Apply policy maximum length (policy-driven)
    if (contentLength > policy.maxContentLength) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Content cannot exceed ${policy.maxContentLength} characters`,
          field: 'content',
        })
      );
    }

    // Generate unique business key
    const businessKey = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const note = yield* noteRepo.create({
      businessKey,
      caseId: command.caseId,
      content: trimmedContent,
      createdBy: command.createdBy,
    });

    return {
      id: note.id,
      businessKey: note.businessKey,
      version: note.version,
      content: note.content,
      createdBy: {
        name: note.creator.name,
        email: note.creator.email,
      },
      createdAt: note.createdAt,
    };
  });
