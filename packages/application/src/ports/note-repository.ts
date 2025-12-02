import { type Effect, Context } from 'effect';

/**
 * Internal Note - Domain Model
 */
export interface Note {
  id: string;
  businessKey: string;
  version: number;
  caseId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  validFrom: Date;
  validTo: Date | null;
  isCurrent: boolean;
}

/**
 * Note with creator details
 */
export interface NoteWithCreator extends Note {
  creator: {
    name: string;
    email: string;
  };
}

/**
 * Note history version
 */
export interface NoteHistoryVersion {
  id: string;
  version: number;
  content: string;
  createdBy: string;
  validFrom: Date;
  validTo: Date | null;
  isCurrent: boolean;
}

/**
 * Custom errors for Note operations
 */
export class NoteNotFoundError {
  readonly _tag = 'NoteNotFoundError';
  constructor(readonly businessKey: string) {}
}

export class NoteValidationError {
  readonly _tag = 'NoteValidationError';
  constructor(readonly message: string) {}
}

/**
 * Note Repository Port
 * Defines operations for managing internal notes with SCD2 temporal pattern
 */
export interface NoteRepository {
  /**
   * Find current notes by case ID
   */
  findCurrentByCase(caseId: string): Effect.Effect<NoteWithCreator[], never, never>;

  /**
   * Find note history by business key (all versions)
   */
  findHistory(businessKey: string): Effect.Effect<NoteHistoryVersion[], never, never>;

  /**
   * Find current note by business key
   */
  findCurrentByBusinessKey(businessKey: string): Effect.Effect<Note | null, never, never>;

  /**
   * Create a new note (initial version)
   */
  create(data: {
    businessKey: string;
    caseId: string;
    content: string;
    createdBy: string;
  }): Effect.Effect<NoteWithCreator, never, never>;

  /**
   * Create a new version of an existing note (SCD2 pattern)
   * Closes the current version and creates a new one
   */
  createNewVersion(data: {
    businessKey: string;
    content: string;
    createdBy: string;
    previousVersion: Note;
  }): Effect.Effect<NoteWithCreator, never, never>;

  /**
   * Soft delete a note (mark as not current)
   */
  softDelete(businessKey: string): Effect.Effect<void, NoteNotFoundError, never>;
}

export const NoteRepository = Context.GenericTag<NoteRepository>('@dykstra/NoteRepository');
