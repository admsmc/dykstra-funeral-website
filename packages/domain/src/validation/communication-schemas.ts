import { z } from 'zod';
import { emailSchema } from './shared-schemas';

/**
 * Communication Validation Schemas
 * 
 * Schemas for email and SMS communication with families.
 */

// Communication type enum
export const COMMUNICATION_TYPES = ['email', 'sms'] as const;

// Recipient schema (for both email and SMS)
const recipientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export type Recipient = z.infer<typeof recipientSchema>;

/**
 * Schema for sending an email
 */
export const sendEmailSchema = z.object({
  templateId: z.string().optional(),
  recipients: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: emailSchema,
    })
  ).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject must be less than 255 characters'),
  body: z.string().min(1, 'Message is required').max(5000, 'Message must be less than 5000 characters'),
  caseId: z.string().optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

/**
 * Schema for sending an SMS
 */
export const sendSMSSchema = z.object({
  templateId: z.string().optional(),
  recipients: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      phone: z.string().regex(/^\(?([0-9]{3})\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})$/, 'Invalid phone number'),
    })
  ).min(1, 'At least one recipient is required'),
  body: z.string().min(1, 'Message is required').max(160, 'SMS messages must be 160 characters or less'),
  caseId: z.string().optional(),
});

export type SendSMSInput = z.infer<typeof sendSMSSchema>;

/**
 * Schema for creating a communication template
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255, 'Name must be less than 255 characters'),
  type: z.enum(COMMUNICATION_TYPES, {
    required_error: 'Template type is required',
  }),
  subject: z.string().max(255, 'Subject must be less than 255 characters').optional(),
  body: z.string().min(1, 'Template body is required').max(5000, 'Body must be less than 5000 characters'),
  variables: z.array(z.string()).default([]),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
