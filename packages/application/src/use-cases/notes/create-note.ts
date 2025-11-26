import { Effect } from 'effect';
import { NoteRepository, NoteValidationError } from '../../ports/note-repository';
import { ValidationError } from '@dykstra/domain';

export interface CreateNoteCommand {
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
 */
export const createNote = (command: CreateNoteCommand): Effect.Effect<
  CreateNoteResult,
  ValidationError,
  NoteRepository
> =>
  Effect.gen(function* () {
    // Validate content
    if (!command.content || command.content.trim().length === 0) {
      return yield* Effect.fail(
        new ValidationError('Content cannot be empty')
      );
    }

    if (command.content.length > 10000) {
      return yield* Effect.fail(
        new ValidationError('Content cannot exceed 10000 characters')
      );
    }

    const noteRepo = yield* NoteRepository;

    // Generate unique business key
    const businessKey = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const note = yield* noteRepo.create({
      businessKey,
      caseId: command.caseId,
      content: command.content,
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
