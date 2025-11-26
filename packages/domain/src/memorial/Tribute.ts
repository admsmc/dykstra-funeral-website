import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';
import type { MemorialId } from './Photo';

/**
 * Tribute ID branded type
 */
export type TributeId = string & { readonly _brand: 'TributeId' };

/**
 * Tribute entity
 * Represents a tribute message left on a memorial page
 */
export class Tribute extends Data.Class<{
  readonly id: TributeId;
  readonly memorialId: MemorialId;
  readonly authorName: string;
  readonly authorEmail: string | null;
  readonly message: string;
  readonly isPublic: boolean;
  readonly isApproved: boolean;
  readonly createdAt: Date;
}> {
  /**
   * Maximum message length
   */
  static readonly MAX_MESSAGE_LENGTH = 5000;

  /**
   * Maximum author name length
   */
  static readonly MAX_NAME_LENGTH = 255;

  /**
   * Create a new Tribute
   */
  static create(params: {
    id: string;
    memorialId: string;
    authorName: string;
    authorEmail?: string;
    message: string;
    isPublic?: boolean;
  }): Effect.Effect<Tribute, ValidationError> {
    return Effect.gen(function* (_) {
      // Validate author name
      const trimmedName = params.authorName.trim();
      if (!trimmedName) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Author name is required', field: 'authorName' })
        ));
      }

      if (trimmedName.length > Tribute.MAX_NAME_LENGTH) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Author name too long (max ${Tribute.MAX_NAME_LENGTH} characters)`,
            field: 'authorName',
          })
        ));
      }

      // Validate message
      const trimmedMessage = params.message.trim();
      if (!trimmedMessage) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Message is required', field: 'message' })
        ));
      }

      if (trimmedMessage.length > Tribute.MAX_MESSAGE_LENGTH) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Message too long (max ${Tribute.MAX_MESSAGE_LENGTH} characters)`,
            field: 'message',
          })
        ));
      }

      // Validate email if provided
      let email: string | null = null;
      if (params.authorEmail) {
        const trimmedEmail = params.authorEmail.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return yield* _(Effect.fail(
            new ValidationError({ message: 'Invalid email format', field: 'authorEmail' })
          ));
        }
        email = trimmedEmail.toLowerCase();
      }

      return new Tribute({
        id: params.id as TributeId,
        memorialId: params.memorialId as MemorialId,
        authorName: trimmedName,
        authorEmail: email,
        message: trimmedMessage,
        isPublic: params.isPublic ?? true,
        isApproved: false, // Requires moderation
        createdAt: new Date(),
      });
    });
  }

  /**
   * Approve the tribute (staff only)
   */
  approve(): Tribute {
    return new Tribute({
      ...this,
      isApproved: true,
    });
  }

  /**
   * Set visibility
   */
  setVisibility(isPublic: boolean): Tribute {
    return new Tribute({
      ...this,
      isPublic,
    });
  }

  /**
   * Get excerpt of message (first N characters)
   */
  getExcerpt(maxLength: number = 150): string {
    if (this.message.length <= maxLength) {
      return this.message;
    }
    return this.message.substring(0, maxLength).trim() + '...';
  }

  /**
   * Check if tribute is visible (public and approved)
   */
  get isVisible(): boolean {
    return this.isPublic && this.isApproved;
  }
}
