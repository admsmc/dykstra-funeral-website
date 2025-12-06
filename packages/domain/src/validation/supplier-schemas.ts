import { z } from 'zod';
import { emailSchema } from './shared-schemas';

/**
 * Supplier/Vendor Validation Schemas
 * 
 * Schemas for vendor management and supplier operations.
 */

// Common payment terms
export const PAYMENT_TERMS = [
  'Due on Receipt',
  'Net 10',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  '2/10 Net 30', // 2% discount if paid within 10 days, otherwise net 30
  'COD', // Cash on Delivery
  'Other',
] as const;

// US states (abbreviated list - expand as needed)
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

/**
 * Schema for creating a new vendor/supplier
 */
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(255, 'Name must be less than 255 characters'),
  contactName: z.string().max(255, 'Contact name must be less than 255 characters').optional(),
  email: emailSchema.optional(),
  phone: z.string().optional(),
  address: z.object({
    street1: z.string().min(1, 'Street address is required'),
    street2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.enum(US_STATES, {
      required_error: 'State is required',
    }),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format (e.g., 12345 or 12345-6789)'),
    country: z.string().default('US'),
  }),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  taxId: z.string().regex(/^\d{2}-\d{7}$/, 'Invalid EIN format (e.g., 12-3456789)').optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
