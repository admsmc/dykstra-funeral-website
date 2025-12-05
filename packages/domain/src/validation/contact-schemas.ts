import { z } from 'zod';
import {
  nameSchema,
  emailSchema,
  optionalPhoneSchema,
  longTextSchema,
  optionalEmailSchema,
} from './shared-schemas';

/**
 * Contact Validation Schemas
 * 
 * Domain-level validation for contact forms and profile management.
 */

// ============================================================================
// Public Contact Form Schema
// ============================================================================

/**
 * Public Contact Form
 * Used on the public website for families to reach out
 */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  message: longTextSchema,
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ============================================================================
// Profile Settings Schema
// ============================================================================

/**
 * User Profile Settings
 * Personal information and notification preferences
 */
export const profileSettingsSchema = z.object({
  name: nameSchema,
  phone: optionalPhoneSchema,
  // Email is typically read-only in profile settings
});

export type ProfileSettingsForm = z.infer<typeof profileSettingsSchema>;

// ============================================================================
// Notification Preferences Schema
// ============================================================================

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.object({
    caseUpdates: z.boolean().default(true),
    paymentReminders: z.boolean().default(true),
    documentUploads: z.boolean().default(true),
    taskAssignments: z.boolean().default(true),
  }).default({
    caseUpdates: true,
    paymentReminders: true,
    documentUploads: true,
    taskAssignments: true,
  }),
  smsNotifications: z.object({
    urgentUpdates: z.boolean().default(false),
    appointmentReminders: z.boolean().default(false),
  }).default({
    urgentUpdates: false,
    appointmentReminders: false,
  }),
});

export type NotificationPreferencesForm = z.infer<typeof notificationPreferencesSchema>;

// ============================================================================
// Combined Profile Schema
// ============================================================================

/**
 * Complete profile update (personal info + preferences)
 */
export const completeProfileSchema = z.object({
  name: nameSchema,
  phone: optionalPhoneSchema,
  preferences: notificationPreferencesSchema,
});

export type CompleteProfileForm = z.infer<typeof completeProfileSchema>;

// ============================================================================
// Email Invitation Schema
// ============================================================================

/**
 * Family Member Email Invitation
 * Invite family members to portal access
 */
export const emailInvitationSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type EmailInvitationForm = z.infer<typeof emailInvitationSchema>;

// ============================================================================
// Bulk Contact Import Schema
// ============================================================================

/**
 * Import multiple contacts (CSV upload)
 */
export const bulkContactSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: nameSchema,
        email: optionalEmailSchema,
        phone: optionalPhoneSchema,
        relationship: z.string().max(50, 'Relationship must be less than 50 characters').optional(),
      })
    )
    .min(1, 'At least one contact is required')
    .max(100, 'Cannot import more than 100 contacts at once'),
});

export type BulkContactForm = z.infer<typeof bulkContactSchema>;
