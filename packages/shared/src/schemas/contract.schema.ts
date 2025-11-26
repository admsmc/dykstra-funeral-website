import { z } from 'zod';

/**
 * Contract status
 */
export const ContractStatusSchema = z.enum([
  'draft',
  'pending_review',
  'pending_signatures',
  'fully_signed',
  'cancelled',
]);

export type ContractStatus = z.infer<typeof ContractStatusSchema>;

/**
 * Contract line item
 */
export const ContractLineItemSchema = z.object({
  id: z.string().cuid(),
  description: z.string().min(1).max(500),
  category: z.enum(['service', 'merchandise', 'facility', 'other']),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
});

export type ContractLineItem = z.infer<typeof ContractLineItemSchema>;

/**
 * Main Contract schema
 */
export const ContractSchema = z.object({
  id: z.string().cuid(),
  caseId: z.string().cuid(),
  version: z.number().int().positive(),
  status: ContractStatusSchema,
  services: z.array(ContractLineItemSchema).default([]),
  products: z.array(ContractLineItemSchema).default([]),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative(),
  termsAndConditions: z.string().max(10000),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().cuid(),
});

export type Contract = z.infer<typeof ContractSchema>;

/**
 * Signature schema (ESIGN Act compliant)
 */
export const SignatureSchema = z.object({
  id: z.string().cuid(),
  contractId: z.string().cuid(),
  signerId: z.string().cuid(),
  signerName: z.string().min(1).max(255),
  signerEmail: z.string().email(),
  signedAt: z.date(),
  ipAddress: z.string().ip(),
  userAgent: z.string().max(1000),
  signatureData: z.string(), // Base64 encoded signature image
  consentText: z.string().max(5000), // Legal consent text shown to signer
  consentAccepted: z.boolean(),
});

export type Signature = z.infer<typeof SignatureSchema>;

/**
 * Contract signing request
 */
export const SignContractRequestSchema = z.object({
  contractId: z.string().cuid(),
  signatureData: z.string().min(1), // Base64 signature
  consentAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the consent to sign',
  }),
});

export type SignContractRequest = z.infer<typeof SignContractRequestSchema>;
