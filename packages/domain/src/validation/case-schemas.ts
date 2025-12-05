import { z } from 'zod';
import {
  decedentNameSchema,
  optionalDateSchema,
  pastDateSchema,
  optionalLongTextSchema,
  createRequiredSelectSchema,
} from './shared-schemas';

/**
 * Case Validation Schemas
 * 
 * Domain-level validation for case/funeral arrangement forms.
 * Matches business rules from Phase 1 (Core Case Management).
 */

// ============================================================================
// Case Types
// ============================================================================

export const CASE_TYPES = ['AT_NEED', 'PRE_NEED', 'INQUIRY'] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const caseTypeSchema = createRequiredSelectSchema(
  CASE_TYPES,
  'Please select a case type'
);

// ============================================================================
// Case Status
// ============================================================================

export const CASE_STATUSES = [
  'INQUIRY',
  'ARRANGEMENT',
  'SERVICES_PENDING',
  'SERVICES_COMPLETE',
  'CLOSED',
  'CANCELLED',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const caseStatusSchema = createRequiredSelectSchema(
  CASE_STATUSES,
  'Please select a case status'
);

// ============================================================================
// Service Types
// ============================================================================

export const SERVICE_TYPES = [
  'TRADITIONAL_FUNERAL',
  'MEMORIAL_SERVICE',
  'GRAVESIDE_SERVICE',
  'CREMATION_ONLY',
  'DIRECT_BURIAL',
  'CELEBRATION_OF_LIFE',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const serviceTypeSchema = createRequiredSelectSchema(
  SERVICE_TYPES,
  'Please select a service type'
);

// ============================================================================
// New Case Creation Schema
// ============================================================================

/**
 * New Case Creation Form
 * Phase 1 - Core Case Management
 * 
 * Creates a new funeral case with minimal required information.
 */
export const newCaseSchema = z.object({
  decedentName: decedentNameSchema,
  type: caseTypeSchema,
});

export type NewCaseForm = z.infer<typeof newCaseSchema>;

// ============================================================================
// Case Details Schema
// ============================================================================

/**
 * Complete Case Information
 * Used for case detail editing
 */
export const caseDetailsSchema = z.object({
  // Decedent Information
  decedentName: decedentNameSchema,
  dateOfBirth: optionalDateSchema,
  dateOfDeath: pastDateSchema.optional(),
  placeOfDeath: z
    .string()
    .max(200, 'Place of death must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  
  // Case Classification
  type: caseTypeSchema,
  status: caseStatusSchema,
  
  // Service Information
  serviceType: serviceTypeSchema.optional(),
  serviceDate: optionalDateSchema,
  serviceLocation: z
    .string()
    .max(200, 'Service location must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  
  // Additional Notes
  notes: optionalLongTextSchema,
}).refine(
  (data) => {
    // Date of death must be after date of birth
    if (data.dateOfBirth && data.dateOfDeath) {
      return data.dateOfDeath >= data.dateOfBirth;
    }
    return true;
  },
  {
    message: 'Date of death must be after date of birth',
    path: ['dateOfDeath'],
  }
).refine(
  (data) => {
    // Service date should be after date of death
    if (data.dateOfDeath && data.serviceDate) {
      return data.serviceDate >= data.dateOfDeath;
    }
    return true;
  },
  {
    message: 'Service date should be after date of death',
    path: ['serviceDate'],
  }
);

export type CaseDetailsForm = z.infer<typeof caseDetailsSchema>;

// ============================================================================
// Family Member Schema
// ============================================================================

export const FAMILY_MEMBER_RELATIONSHIPS = [
  'SPOUSE',
  'CHILD',
  'PARENT',
  'SIBLING',
  'GRANDCHILD',
  'GRANDPARENT',
  'OTHER_RELATIVE',
  'FRIEND',
  'EXECUTOR',
  'PRIMARY_CONTACT',
] as const;

export type FamilyMemberRelationship = (typeof FAMILY_MEMBER_RELATIONSHIPS)[number];

export const familyMemberRelationshipSchema = createRequiredSelectSchema(
  FAMILY_MEMBER_RELATIONSHIPS,
  'Please select a relationship'
);

/**
 * Family Member / Contact Addition
 * Add family members to a case
 */
export const familyMemberSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  relationship: familyMemberRelationshipSchema,
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, 'Phone must be in format (555) 123-4567')
    .optional()
    .or(z.literal('')),
  isPrimaryContact: z.boolean().default(false),
  notes: optionalLongTextSchema,
});

export type FamilyMemberForm = z.infer<typeof familyMemberSchema>;

// ============================================================================
// Case Assignment Schema
// ============================================================================

export const CASE_ROLES = [
  'FUNERAL_DIRECTOR',
  'ASSISTANT_DIRECTOR',
  'EMBALMER',
  'COORDINATOR',
  'ADMINISTRATOR',
] as const;

export type CaseRole = (typeof CASE_ROLES)[number];

export const caseRoleSchema = createRequiredSelectSchema(
  CASE_ROLES,
  'Please select a role'
);

/**
 * Staff Assignment to Case
 * Assign staff members to cases with specific roles
 */
export const caseAssignmentSchema = z.object({
  staffId: z.string().min(1, 'Please select a staff member'),
  role: caseRoleSchema,
  notes: optionalLongTextSchema,
});

export type CaseAssignmentForm = z.infer<typeof caseAssignmentSchema>;
