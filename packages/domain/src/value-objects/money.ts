import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';

/**
 * Money value object
 * Immutable monetary amount with currency
 */
export class Money extends Data.Class<{
  readonly amount: number;
  readonly currency: string;
}> {
  /**
   * Create Money from amount and currency
   */
  static create(amount: number, currency: string = 'USD'): Effect.Effect<Money, ValidationError> {
    if (!Number.isFinite(amount)) {
      return Effect.fail(
        new ValidationError({ message: 'Amount must be a finite number', field: 'amount' })
      );
    }
    
    if (amount < 0) {
      return Effect.fail(
        new ValidationError({ message: 'Amount cannot be negative', field: 'amount' })
      );
    }
    
    // Round to 2 decimal places to avoid floating point issues
    const rounded = Math.round(amount * 100) / 100;
    
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
    if (!validCurrencies.includes(currency)) {
      return Effect.fail(
        new ValidationError({
          message: `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`,
          field: 'currency',
        })
      );
    }
    
    return Effect.succeed(new Money({ amount: rounded, currency }));
  }
  
  /**
   * Create zero money
   */
  static zero(currency: string = 'USD'): Money {
    return new Money({ amount: 0, currency });
  }
  
  /**
   * Add two Money values
   */
  add(other: Money): Effect.Effect<Money, ValidationError> {
    if (this.currency !== other.currency) {
      return Effect.fail(
        new ValidationError({ message: 'Cannot add money with different currencies' })
      );
    }
    return Money.create(this.amount + other.amount, this.currency);
  }
  
  /**
   * Subtract two Money values
   */
  subtract(other: Money): Effect.Effect<Money, ValidationError> {
    if (this.currency !== other.currency) {
      return Effect.fail(
        new ValidationError({ message: 'Cannot subtract money with different currencies' })
      );
    }
    return Money.create(this.amount - other.amount, this.currency);
  }
  
  /**
   * Multiply money by a scalar
   */
  multiply(scalar: number): Effect.Effect<Money, ValidationError> {
    return Money.create(this.amount * scalar, this.currency);
  }
  
  /**
   * Check if money is zero
   */
  get isZero(): boolean {
    return this.amount === 0;
  }
  
  /**
   * Check if money is positive
   */
  get isPositive(): boolean {
    return this.amount > 0;
  }
  
  /**
   * Format as currency string
   */
  format(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }
  
  override toString(): string {
    return this.format();
  }
}
