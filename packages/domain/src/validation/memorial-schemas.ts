import { z } from 'zod';
import {
  emailSchema,
} from './shared-schemas';

/**
 * Memorial & Tribute Validation Schemas
 * 
 * Domain-level validation for memorial page forms.
 * Used in family-facing memorial/obituary pages.
 */

// ============================================================================
// Tribute Form Schema
// ============================================================================

/**
 * Memorial Tribute Form
 * Family and friends can submit tributes/condolences
 * 
 * Features:
 * - Name and email required
 * - Message with max length
 * - Moderation before publishing (handled in backend)
 */
export const tributeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
});

export type TributeForm = z.infer<typeof tributeSchema>;

// ============================================================================
// Guestbook Form Schema
// ============================================================================

/**
 * Memorial Guestbook Form
 * Family and friends can sign the online guestbook
 * 
 * Features:
 * - Name, email, message required
 * - Optional city and state
 * - State validation (2-letter code)
 */
export const guestbookSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  state: z
    .string()
    .length(2, 'State must be a 2-letter code')
    .optional()
    .or(z.literal('')),
});

export type GuestbookForm = z.infer<typeof guestbookSchema>;
