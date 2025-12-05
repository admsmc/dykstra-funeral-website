import { describe, it, expect } from 'vitest';
import {
  manualPaymentSchema,
  refundSchema,
  createRefundSchemaWithMax,
  paymentApplicationSchema,
  createPaymentApplicationSchema,
  insuranceClaimSchema,
  PAYMENT_METHODS,
  REFUND_REASONS,
} from '../payment-schemas';

describe('Manual Payment Schema', () => {
  const validPayment = {
    caseId: 'case-123',
    amount: 500.00,
    method: 'cash' as const,
    checkNumber: '',
    paymentDate: new Date('2025-12-01'),
    notes: 'Payment received',
  };

  it('validates correct manual payment data', () => {
    const result = manualPaymentSchema.parse(validPayment);
    expect(result.caseId).toBe('case-123');
    expect(result.amount).toBe(500.00);
    expect(result.method).toBe('cash');
  });

  it('requires case ID', () => {
    const invalid = { ...validPayment, caseId: '' };
    expect(() => manualPaymentSchema.parse(invalid)).toThrow('Please select a case');
  });

  it('validates amount bounds', () => {
    const tooLarge = { ...validPayment, amount: 1000000 };
    expect(() => manualPaymentSchema.parse(tooLarge)).toThrow('Amount cannot exceed');
    
    const negative = { ...validPayment, amount: -10 };
    expect(() => manualPaymentSchema.parse(negative)).toThrow('Amount must be greater than zero');
  });

  it('requires check number for check payments', () => {
    const checkPayment = { ...validPayment, method: 'check' as const, checkNumber: '' };
    expect(() => manualPaymentSchema.parse(checkPayment)).toThrow('Check number is required');
    
    const validCheck = { ...validPayment, method: 'check' as const, checkNumber: '1234' };
    expect(manualPaymentSchema.parse(validCheck)).toBeTruthy();
  });

  it('does not require check number for non-check payments', () => {
    const cashPayment = { ...validPayment, method: 'cash' as const, checkNumber: '' };
    expect(manualPaymentSchema.parse(cashPayment)).toBeTruthy();
    
    const achPayment = { ...validPayment, method: 'ach' as const, checkNumber: '' };
    expect(manualPaymentSchema.parse(achPayment)).toBeTruthy();
  });

  it('validates payment methods', () => {
    expect(PAYMENT_METHODS).toContain('cash');
    expect(PAYMENT_METHODS).toContain('check');
    expect(PAYMENT_METHODS).toContain('ach');
  });
});

describe('Refund Schema', () => {
  const validRefund = {
    refundAmount: 100.00,
    reason: 'Customer request',
    notes: 'Partial refund approved',
  };

  it('validates correct refund data', () => {
    const result = refundSchema.parse(validRefund);
    expect(result.refundAmount).toBe(100.00);
    expect(result.reason).toBe('Customer request');
  });

  it('requires refund amount', () => {
    const invalid = { ...validRefund, refundAmount: 0 };
    expect(() => refundSchema.parse(invalid)).toThrow('Amount must be greater than zero');
  });

  it('requires refund reason', () => {
    const invalid = { ...validRefund, reason: '' };
    expect(() => refundSchema.parse(invalid)).toThrow('Please select or enter a reason');
  });

  it('allows optional notes', () => {
    const withoutNotes = { ...validRefund, notes: '' };
    expect(refundSchema.parse(withoutNotes)).toBeTruthy();
  });

  it('validates refund reasons enum', () => {
    expect(REFUND_REASONS).toContain('Customer request');
    expect(REFUND_REASONS).toContain('Duplicate payment');
    expect(REFUND_REASONS).toContain('Service cancellation');
    expect(REFUND_REASONS).toContain('Other');
  });
});

describe('Refund Schema with Max Amount', () => {
  it('creates schema with custom max amount', () => {
    const schema = createRefundSchemaWithMax(500.00);
    
    const validRefund = {
      refundAmount: 500.00,
      reason: 'Customer request',
      notes: '',
    };
    expect(schema.parse(validRefund)).toBeTruthy();
  });

  it('rejects refund exceeding max amount', () => {
    const schema = createRefundSchemaWithMax(500.00);
    
    const invalidRefund = {
      refundAmount: 600.00,
      reason: 'Customer request',
      notes: '',
    };
    expect(() => schema.parse(invalidRefund)).toThrow('Refund amount cannot exceed original payment amount of $500.00');
  });
});

describe('Payment Application Schema', () => {
  const validApplication = {
    paymentId: 'payment-123',
    allocations: [
      { invoiceId: 'inv-001', amount: 100.00 },
      { invoiceId: 'inv-002', amount: 50.00 },
    ],
  };

  it('validates correct payment application', () => {
    const result = paymentApplicationSchema.parse(validApplication);
    expect(result.allocations).toHaveLength(2);
  });

  it('requires at least one allocation', () => {
    const invalid = { ...validApplication, allocations: [] };
    expect(() => paymentApplicationSchema.parse(invalid)).toThrow('At least one allocation is required');
  });

  it('validates total allocations do not exceed payment amount', () => {
    const schema = createPaymentApplicationSchema(100.00);
    
    const invalidApplication = {
      paymentId: 'payment-123',
      allocations: [
        { invoiceId: 'inv-001', amount: 75.00 },
        { invoiceId: 'inv-002', amount: 50.00 }, // Total: 125, exceeds 100
      ],
    };
    
    expect(() => schema.parse(invalidApplication)).toThrow('Total allocations cannot exceed payment amount of $100.00');
  });

  it('allows allocations equal to payment amount', () => {
    const schema = createPaymentApplicationSchema(150.00);
    
    const validApplication = {
      paymentId: 'payment-123',
      allocations: [
        { invoiceId: 'inv-001', amount: 100.00 },
        { invoiceId: 'inv-002', amount: 50.00 }, // Total: 150
      ],
    };
    
    expect(schema.parse(validApplication)).toBeTruthy();
  });
});

describe('Insurance Claim Schema', () => {
  const validClaim = {
    caseId: 'case-456',
    policyNumber: 'POL-123456',
    insuranceProvider: 'Acme Insurance Co.',
    claimAmount: 5000.00,
    submissionDate: new Date('2025-12-01'),
    notes: 'Initial claim submission',
  };

  it('validates correct insurance claim data', () => {
    const result = insuranceClaimSchema.parse(validClaim);
    expect(result.policyNumber).toBe('POL-123456');
    expect(result.insuranceProvider).toBe('Acme Insurance Co.');
    expect(result.claimAmount).toBe(5000.00);
  });

  it('requires policy number', () => {
    const invalid = { ...validClaim, policyNumber: '' };
    expect(() => insuranceClaimSchema.parse(invalid)).toThrow('Policy number is required');
  });

  it('requires insurance provider', () => {
    const invalid = { ...validClaim, insuranceProvider: '' };
    expect(() => insuranceClaimSchema.parse(invalid)).toThrow('Insurance provider is required');
  });

  it('validates claim amount', () => {
    const invalid = { ...validClaim, claimAmount: -100 };
    expect(() => insuranceClaimSchema.parse(invalid)).toThrow('Amount must be greater than zero');
  });

  it('enforces policy number max length', () => {
    const invalid = { ...validClaim, policyNumber: 'A'.repeat(51) };
    expect(() => insuranceClaimSchema.parse(invalid)).toThrow('Policy number must be less than 50 characters');
  });

  it('enforces provider name max length', () => {
    const invalid = { ...validClaim, insuranceProvider: 'A'.repeat(101) };
    expect(() => insuranceClaimSchema.parse(invalid)).toThrow('Provider name must be less than 100 characters');
  });
});
