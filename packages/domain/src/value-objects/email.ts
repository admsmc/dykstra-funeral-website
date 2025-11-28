import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';

/**
 * EmailAddress value object
 * Immutable, validated email address
 */
export class EmailAddress extends Data.Class<{ readonly value: string }> {
  /**
   * Create an Email from a string
   * Returns Effect with ValidationError if invalid
   */
  static create(value: string): Effect.Effect<EmailAddress, ValidationError> {
    const trimmed = value.trim().toLowerCase();
    
    if (!trimmed) {
      return Effect.fail(
        new ValidationError({ message: 'Email cannot be empty', field: 'email' })
      );
    }
    
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmed)) {
      return Effect.fail(
        new ValidationError({ message: 'Invalid email format', field: 'email' })
      );
    }
    
    if (trimmed.length > 255) {
      return Effect.fail(
        new ValidationError({ message: 'Email too long (max 255 characters)', field: 'email' })
      );
    }
    
    return Effect.succeed(new EmailAddress({ value: trimmed }));
  }
  
  /**
   * Get the email domain
   */
  get domain(): string {
    return this.value.split('@')[1] ?? '';
  }
  
  /**
   * Get the email local part (before @)
   */
  get localPart(): string {
    return this.value.split('@')[0] ?? '';
  }
  
  override toString(): string {
    return this.value;
  }
}
