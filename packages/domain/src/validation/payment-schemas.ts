import { z } from 'zod';
import {
  currencySchema,
  businessKeySchema,
  dateSchema,
  optionalLongTextSchema,
  optionalShortTextSchema,
  createRequiredSelectSchema,
} from './shared-schemas';

/**
 * Payment Validation Schemas
 * 
 * Domain-level validation for payment-related forms and operations.
 * Matches business rules from Use Cases 6.1-6.7 (Accounts Payable).
 */

// ============================================================================
// Payment Methods
// ============================================================================

export const PAYMENT_METHODS = ['cash', 'check', 'ach', 'credit_card', 'stripe'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodSchema = createRequiredSelectSchema(
  PAYMENT_METHODS,
  'Please select a payment method'
);

// ============================================================================
// Refund Reasons
// ============================================================================

export const REFUND_REASONS = [
  'Customer request',
  'Duplicate payment',
  'Service cancellation',
  'Pricing error',
  'Billing dispute',
  'Other',
] as const;

export type RefundReason = (typeof REFUND_REASONS)[number];

export const refundReasonSchema = createRequiredSelectSchema(
  REFUND_REASONS,
  'Please select a refund reason'
);

// ============================================================================
// Manual Payment Form Schema
// ============================================================================

/**
 * Manual Payment Recording
 * Use Case 6.2 - Batch Payment Application
 * 
 * Records cash, check, or ACH payments made outside Stripe.
 */
export const manualPaymentSchema = z.object({
  caseId: businessKeySchema.refine((val) => val.length > 0, {
    message: 'Please select a case',
  }),
  amount: currencySchema,
  method: z.enum(['cash', 'check', 'ach'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  checkNumber: optionalShortTextSchema,
  paymentDate: dateSchema,
  notes: optionalLongTextSchema,
}).refine(
  (data) => {
    // If payment method is check, checkNumber should be provided
    if (data.method === 'check' && !data.checkNumber) {
      return false;
    }
    return true;
  },
  {
    message: 'Check number is required for check payments',
    path: ['checkNumber'],
  }
);

export type ManualPaymentForm = z.infer<typeof manualPaymentSchema>;

// ============================================================================
// Refund Form Schema
// ============================================================================

/**
 * Payment Refund Processing
 * Use Case 6.3 - Refund Processing
 * 
 * Process full or partial refunds for completed payments.
 */
export const refundSchema = z.object({
  refundAmount: currencySchema,
  reason: z.string().min(1, 'Please select or enter a reason'),
  notes: optionalLongTextSchema,
});

export type RefundForm = z.infer<typeof refundSchema>;

/**
 * Creates a refund schema with max amount validation
 * @param maxAmount - Maximum refund amount (original payment amount)
 */
export function createRefundSchemaWithMax(maxAmount: number) {
  return refundSchema.extend({
    refundAmount: currencySchema.max(
      maxAmount,
      `Refund amount cannot exceed original payment amount of $${maxAmount.toFixed(2)}`
    ),
  });
}

// ============================================================================
// Payment Application Schema
// ============================================================================

/**
 * Batch Payment Application
 * Use Case 6.2 - Apply payments to multiple invoices/cases
 */
export const paymentApplicationSchema = z.object({
  paymentId: businessKeySchema,
  allocations: z
    .array(
      z.object({
        invoiceId: businessKeySchema,
        amount: currencySchema,
      })
    )
    .min(1, 'At least one allocation is required'),
});

export type PaymentApplicationForm = z.infer<typeof paymentApplicationSchema>;

// Validate total allocations don't exceed payment amount
export function createPaymentApplicationSchema(totalPaymentAmount: number) {
  return paymentApplicationSchema.refine(
    (data) => {
      const totalAllocated = data.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      return totalAllocated <= totalPaymentAmount;
    },
    {
      message: `Total allocations cannot exceed payment amount of $${totalPaymentAmount.toFixed(2)}`,
      path: ['allocations'],
    }
  );
}

// ============================================================================
// Insurance Claim Schema
// ============================================================================

/**
 * Insurance Claim Processing
 * Use Case 6.1 - Insurance Claim Processing
 */
export const insuranceClaimSchema = z.object({
  caseId: businessKeySchema,
  policyNumber: z
    .string()
    .min(1, 'Policy number is required')
    .max(50, 'Policy number must be less than 50 characters'),
  insuranceProvider: z
    .string()
    .min(1, 'Insurance provider is required')
    .max(100, 'Provider name must be less than 100 characters'),
  claimAmount: currencySchema,
  submissionDate: dateSchema,
  notes: optionalLongTextSchema,
});

export type InsuranceClaimForm = z.infer<typeof insuranceClaimSchema>;

// ============================================================================
// Payment Status Updates
// ============================================================================

export const PAYMENT_STATUSES = [
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const paymentStatusSchema = createRequiredSelectSchema(
  PAYMENT_STATUSES,
  'Please select a payment status'
);

// ============================================================================
// Portal Payment Form Schema
// ============================================================================

/**
 * Portal Payment Form
 * Family-facing payment form with Stripe integration
 * 
 * Simplified payment form for family portal.
 */
export const portalPaymentSchema = z.object({
  amount: currencySchema,
  notes: optionalLongTextSchema,
});

export type PortalPaymentForm = z.infer<typeof portalPaymentSchema>;
