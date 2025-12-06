import { z } from 'zod';
import {
  shortTextSchema,
  optionalShortTextSchema,
  optionalLongTextSchema,
  createRequiredSelectSchema,
} from './shared-schemas';

/**
 * Lead Management Validation Schemas
 * 
 * Domain-level validation for CRM lead forms and operations.
 */

// ============================================================================
// Lead Source
// ============================================================================

export const LEAD_SOURCES = [
  'website',
  'phone',
  'email',
  'referral',
  'social_media',
  'event',
  'direct_mail',
  'other',
] as const;

export const leadSourceSchema = createRequiredSelectSchema(
  LEAD_SOURCES,
  'Please select how this lead was acquired'
);

// ============================================================================
// Lead Type
// ============================================================================

export const LEAD_TYPES = ['at_need', 'pre_need', 'general_inquiry'] as const;

export const leadTypeSchema = createRequiredSelectSchema(
  LEAD_TYPES,
  'Please select the lead type'
);

// ============================================================================
// Create Lead Form Schema
// ============================================================================

/**
 * Create Lead Form
 * Initial lead capture with essential contact information
 */
export const createLeadSchema = z.object({
  firstName: shortTextSchema,
  lastName: shortTextSchema,
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: optionalShortTextSchema,
  source: leadSourceSchema,
  type: leadTypeSchema.default('general_inquiry'),
  notes: optionalLongTextSchema,
});

export type CreateLeadForm = z.infer<typeof createLeadSchema>;

// ============================================================================
// Lead Status
// ============================================================================

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'nurturing',
  'converted',
  'lost',
] as const;

export const leadStatusSchema = createRequiredSelectSchema(
  LEAD_STATUSES,
  'Please select a status'
);

// ============================================================================
// Update Lead Form Schema
// ============================================================================

/**
 * Update Lead Form
 * Edit existing lead information
 */
export const updateLeadSchema = z.object({
  firstName: shortTextSchema,
  lastName: shortTextSchema,
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: optionalShortTextSchema,
  source: leadSourceSchema,
  type: leadTypeSchema,
  status: leadStatusSchema,
  notes: optionalLongTextSchema,
});

export type UpdateLeadForm = z.infer<typeof updateLeadSchema>;

// ============================================================================
// Qualify Lead Form Schema
// ============================================================================

/**
 * Qualify Lead Form
 * Scoring and qualification criteria
 */
export const qualifyLeadSchema = z.object({
  score: z
    .number()
    .min(0, 'Score must be at least 0')
    .max(100, 'Score cannot exceed 100'),
  status: leadStatusSchema,
  notes: optionalLongTextSchema,
});

export type QualifyLeadForm = z.infer<typeof qualifyLeadSchema>;

// ============================================================================
// Convert Lead to Case Form Schema
// ============================================================================

/**
 * Convert Lead to Case Form
 * Conversion workflow with reason tracking
 */
export const convertLeadToCaseSchema = z.object({
  decedentFirstName: shortTextSchema,
  decedentLastName: shortTextSchema,
  dateOfDeath: z.date({
    required_error: 'Date of death is required',
    invalid_type_error: 'Invalid date format',
  }),
  placeOfDeath: optionalShortTextSchema,
  notes: optionalLongTextSchema,
});

export type ConvertLeadToCaseInput = z.infer<typeof convertLeadToCaseSchema>;

/**
 * Schema for full lead to case conversion with case details
 */
export const convertLeadWithDetailsSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  decedentName: z.string().min(1, 'Decedent name is required').max(255, 'Name must be less than 255 characters'),
  caseType: z.enum(['AT_NEED', 'PRE_NEED', 'INQUIRY'], {
    required_error: 'Case type is required',
  }),
});

export type ConvertLeadWithDetailsInput = z.infer<typeof convertLeadWithDetailsSchema>;
