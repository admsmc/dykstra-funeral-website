import { z } from 'zod';
import {
  emailSchema,
  phoneSchema,
  createRequiredSelectSchema,
} from './shared-schemas';

/**
 * Family & Invitation Validation Schemas
 * 
 * Domain-level validation for family member and invitation forms.
 */

// ============================================================================
// Family Member Roles
// ============================================================================

export const FAMILY_ROLES = ['PRIMARY_CONTACT', 'FAMILY_MEMBER'] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

export const familyRoleSchema = createRequiredSelectSchema(
  FAMILY_ROLES,
  'Please select a role'
);

// ============================================================================
// Family Invitation Form Schema
// ============================================================================

/**
 * Family Invitation Form
 * Send magic link invitations to family members for case portal access
 * 
 * Features:
 * - Email validation (required)
 * - Phone validation (optional, E.164 format)
 * - Relationship tracking
 * - Role assignment (primary contact vs. family member)
 */
export const familyInvitationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  relationship: z
    .string()
    .max(100, 'Relationship must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  role: familyRoleSchema,
});

export type FamilyInvitationForm = z.infer<typeof familyInvitationSchema>;
