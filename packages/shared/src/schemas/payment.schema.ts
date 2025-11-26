import { z } from 'zod';

/**
 * Payment method
 */
export const PaymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'ach',
  'check',
  'cash',
  'insurance_assignment',
  'payment_plan',
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

/**
 * Payment status
 */
export const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

/**
 * Main Payment schema
 */
export const PaymentSchema = z.object({
  id: z.string().cuid(),
  caseId: z.string().cuid(),
  amount: z.number().positive(),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  stripePaymentIntentId: z.string().nullable(),
  stripePaymentMethodId: z.string().nullable(),
  receiptUrl: z.string().url().nullable(),
  failureReason: z.string().max(1000).nullable(),
  notes: z.string().max(2000).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().cuid(),
});

export type Payment = z.infer<typeof PaymentSchema>;

/**
 * Payment plan
 */
export const PaymentPlanSchema = z.object({
  id: z.string().cuid(),
  caseId: z.string().cuid(),
  totalAmount: z.number().positive(),
  numberOfInstallments: z.number().int().positive(),
  installmentAmount: z.number().positive(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  firstPaymentDate: z.date(),
  status: z.enum(['active', 'completed', 'defaulted', 'cancelled']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentPlan = z.infer<typeof PaymentPlanSchema>;

/**
 * Create payment intent request
 */
export const CreatePaymentIntentRequestSchema = z.object({
  caseId: z.string().cuid(),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
});

export type CreatePaymentIntentRequest = z.infer<typeof CreatePaymentIntentRequestSchema>;

/**
 * Process payment request
 */
export const ProcessPaymentRequestSchema = z.object({
  caseId: z.string().cuid(),
  amount: z.number().positive(),
  method: PaymentMethodSchema,
  stripePaymentIntentId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type ProcessPaymentRequest = z.infer<typeof ProcessPaymentRequestSchema>;
