import { z } from 'zod';
import {
  optionalLongTextSchema,
} from './shared-schemas';

/**
 * Contract Template Validation Schemas
 * 
 * Domain-level validation for contract template management.
 * Used by staff to create and manage reusable contract templates.
 */

// ============================================================================
// Contract Template Service Types
// ============================================================================

export const CONTRACT_SERVICE_TYPES = [
  'TRADITIONAL_BURIAL',
  'TRADITIONAL_CREMATION',
  'MEMORIAL_SERVICE',
  'DIRECT_BURIAL',
  'DIRECT_CREMATION',
  'CELEBRATION_OF_LIFE',
] as const;

export type ContractServiceType = (typeof CONTRACT_SERVICE_TYPES)[number];

// ============================================================================
// Contract Template Form Schema
// ============================================================================

/**
 * Contract Template Form
 * Create/edit contract templates with variable substitution
 * 
 * Features:
 * - Template name and description
 * - Service type categorization
 * - Template content (rich text/markdown)
 * - Variable placeholders (e.g., {{decedentName}})
 * - Default template flag per service type
 */
export const contractTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name must be less than 200 characters'),
  description: optionalLongTextSchema,
  serviceType: z
    .enum(CONTRACT_SERVICE_TYPES)
    .optional()
    .or(z.literal('')),
  content: z
    .string()
    .min(1, 'Content is required')
    .min(10, 'Content must be at least 10 characters'),
  // Variables and isDefault are always present in the form model with sensible defaults,
  // so we model them as required fields with default values.
  variables: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
});

export type ContractTemplateForm = z.infer<typeof contractTemplateSchema>;
