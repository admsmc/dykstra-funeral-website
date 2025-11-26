import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';
import type { MemorialId } from './Photo';

/**
 * GuestbookEntry ID branded type
 */
export type GuestbookEntryId = string & { readonly _brand: 'GuestbookEntryId' };

/**
 * GuestbookEntry entity
 * Represents an entry in a memorial guestbook
 */
export class GuestbookEntry extends Data.Class<{
  readonly id: GuestbookEntryId;
  readonly memorialId: MemorialId;
  readonly name: string;
  readonly email: string | null;
  readonly message: string;
  readonly city: string | null;
  readonly state: string | null;
  readonly createdAt: Date;
}> {
  /**
   * Maximum message length
   */
  static readonly MAX_MESSAGE_LENGTH = 2000;

  /**
   * Maximum name length
   */
  static readonly MAX_NAME_LENGTH = 255;

  /**
   * Maximum city length
   */
  static readonly MAX_CITY_LENGTH = 100;

  /**
   * Valid US state codes (two-letter abbreviations)
   */
  static readonly VALID_STATES = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
  ]);

  /**
   * Create a new GuestbookEntry
   */
  static create(params: {
    id: string;
    memorialId: string;
    name: string;
    email?: string;
    message: string;
    city?: string;
    state?: string;
  }): Effect.Effect<GuestbookEntry, ValidationError> {
    return Effect.gen(function* (_) {
      // Validate name
      const trimmedName = params.name.trim();
      if (!trimmedName) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Name is required', field: 'name' })
        ));
      }

      if (trimmedName.length > GuestbookEntry.MAX_NAME_LENGTH) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Name too long (max ${GuestbookEntry.MAX_NAME_LENGTH} characters)`,
            field: 'name',
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

      if (trimmedMessage.length > GuestbookEntry.MAX_MESSAGE_LENGTH) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Message too long (max ${GuestbookEntry.MAX_MESSAGE_LENGTH} characters)`,
            field: 'message',
          })
        ));
      }

      // Validate email if provided
      let email: string | null = null;
      if (params.email) {
        const trimmedEmail = params.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return yield* _(Effect.fail(
            new ValidationError({ message: 'Invalid email format', field: 'email' })
          ));
        }
        email = trimmedEmail.toLowerCase();
      }

      // Validate city if provided
      let city: string | null = null;
      if (params.city) {
        const trimmedCity = params.city.trim();
        if (trimmedCity.length > GuestbookEntry.MAX_CITY_LENGTH) {
          return yield* _(Effect.fail(
            new ValidationError({
              message: `City name too long (max ${GuestbookEntry.MAX_CITY_LENGTH} characters)`,
              field: 'city',
            })
          ));
        }
        city = trimmedCity;
      }

      // Validate state if provided
      let state: string | null = null;
      if (params.state) {
        const upperState = params.state.trim().toUpperCase();
        if (!GuestbookEntry.VALID_STATES.has(upperState)) {
          return yield* _(Effect.fail(
            new ValidationError({
              message: 'Invalid state code (must be 2-letter US state abbreviation)',
              field: 'state',
            })
          ));
        }
        state = upperState;
      }

      return new GuestbookEntry({
        id: params.id as GuestbookEntryId,
        memorialId: params.memorialId as MemorialId,
        name: trimmedName,
        email,
        message: trimmedMessage,
        city,
        state,
        createdAt: new Date(),
      });
    });
  }

  /**
   * Get location string (City, ST format)
   */
  get location(): string | null {
    if (this.city && this.state) {
      return `${this.city}, ${this.state}`;
    }
    if (this.city) {
      return this.city;
    }
    if (this.state) {
      return this.state;
    }
    return null;
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
}
