import { z } from 'zod';

/**
 * Shared Validation Schemas
 * 
 * Common validation rules used across multiple forms.
 * These schemas enforce domain-level constraints for core data types.
 */

// ============================================================================
// Email
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const optionalEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters')
  .optional()
  .or(z.literal(''));

// ============================================================================
// Phone Number (US Format)
// ============================================================================

const US_PHONE_REGEX = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(US_PHONE_REGEX, 'Phone must be in format (555) 123-4567');

export const optionalPhoneSchema = z
  .string()
  .regex(US_PHONE_REGEX, 'Phone must be in format (555) 123-4567')
  .optional()
  .or(z.literal(''));

// ============================================================================
// Name Fields
// ============================================================================

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const optionalNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .optional()
  .or(z.literal(''));

// Decedent name allows more flexibility
export const decedentNameSchema = z
  .string()
  .min(1, 'Decedent name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(150, 'Name must be less than 150 characters')
  .trim();

// ============================================================================
// Currency / Monetary Amounts
// ============================================================================

/**
 * Standard currency amount with bounds
 * Range: $0.01 to $999,999.99
 */
export const currencySchema = z
  .number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  })
  .positive('Amount must be greater than zero')
  .max(999999.99, 'Amount cannot exceed $999,999.99')
  .multipleOf(0.01, 'Amount must be a valid currency amount (e.g., 12.34)');

/**
 * Optional currency amount
 */
export const optionalCurrencySchema = z
  .number()
  .positive('Amount must be greater than zero')
  .max(999999.99, 'Amount cannot exceed $999,999.99')
  .multipleOf(0.01, 'Amount must be a valid currency amount')
  .optional();

/**
 * Large currency amount for high-value transactions
 * Range: $0.01 to $9,999,999.99
 */
export const largeCurrencySchema = z
  .number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  })
  .positive('Amount must be greater than zero')
  .max(9999999.99, 'Amount cannot exceed $9,999,999.99')
  .multipleOf(0.01, 'Amount must be a valid currency amount');

// ============================================================================
// Text Fields
// ============================================================================

/**
 * Short text field (e.g., titles, labels)
 * Max: 255 characters
 */
export const shortTextSchema = z
  .string()
  .min(1, 'This field is required')
  .max(255, 'Must be less than 255 characters')
  .trim();

export const optionalShortTextSchema = z
  .string()
  .max(255, 'Must be less than 255 characters')
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Medium text field (e.g., descriptions, summaries)
 * Max: 1000 characters
 */
export const mediumTextSchema = z
  .string()
  .min(1, 'This field is required')
  .max(1000, 'Must be less than 1000 characters')
  .trim();

export const optionalMediumTextSchema = z
  .string()
  .max(1000, 'Must be less than 1000 characters')
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Long text field (e.g., notes, messages)
 * Max: 2000 characters
 */
export const longTextSchema = z
  .string()
  .min(1, 'This field is required')
  .max(2000, 'Must be less than 2000 characters')
  .trim();

export const optionalLongTextSchema = z
  .string()
  .max(2000, 'Must be less than 2000 characters')
  .trim()
  .optional()
  .or(z.literal(''));

// ============================================================================
// Dates
// ============================================================================

/**
 * Required date field
 */
export const dateSchema = z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Please enter a valid date',
});

/**
 * Optional date field
 */
export const optionalDateSchema = z.date().optional();

/**
 * Date that must be in the past
 */
export const pastDateSchema = z
  .date({
    required_error: 'Date is required',
    invalid_type_error: 'Please enter a valid date',
  })
  .refine((date) => date <= new Date(), {
    message: 'Date must be in the past',
  });

/**
 * Date that must be in the future
 */
export const futureDateSchema = z
  .date({
    required_error: 'Date is required',
    invalid_type_error: 'Please enter a valid date',
  })
  .refine((date) => date >= new Date(), {
    message: 'Date must be in the future',
  });

// ============================================================================
// IDs / Keys
// ============================================================================

/**
 * UUID v4 format
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

/**
 * Business key format (alphanumeric + hyphens)
 */
export const businessKeySchema = z
  .string()
  .min(1, 'ID is required')
  .regex(/^[a-zA-Z0-9-]+$/, 'Invalid ID format');

// ============================================================================
// Helpers
// ============================================================================

/**
 * Creates a schema for a required select/dropdown field
 */
export function createRequiredSelectSchema<T extends string>(
  values: readonly T[],
  errorMessage = 'Please select an option'
) {
  return z.enum(values as [T, ...T[]], {
    errorMap: () => ({ message: errorMessage }),
  });
}

/**
 * Creates a schema for an optional select/dropdown field
 */
export function createOptionalSelectSchema<T extends string>(values: readonly T[]) {
  return z.enum(values as [T, ...T[]]).optional();
}
