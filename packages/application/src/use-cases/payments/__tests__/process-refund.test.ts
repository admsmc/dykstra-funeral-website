import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import type { PaymentMethod } from '@dykstra/shared';
import {
  Payment,
  ValidationError,
  BusinessRuleViolationError,
  NotFoundError,
  PaymentManagementPolicy,
  DEFAULT_PAYMENT_MANAGEMENT_POLICY,
  PERMISSIVE_PAYMENT_MANAGEMENT_POLICY,
} from '@dykstra/domain';
import { processRefund, ProcessRefundCommand, ProcessRefundResult } from '../process-refund';
import { PaymentRepository, type PaymentRepositoryService } from '../../../ports/payment-repository';
import {
  PaymentManagementPolicyRepository,
  type PaymentManagementPolicyRepositoryService,
} from '../../../ports/payment-management-policy-repository';

const mockFuneralHomeId = 'funeral-home-001';
const mockCaseId = 'case-001' as any;

// Helper: Create succeeded payment
const createSucceededPayment = (
  id: string,
  businessKey: string,
  amount: number,
  method: PaymentMethod = 'cash',
  ageInDays: number = 0
): Payment => {
  const payment = Effect.runSync(
    Payment.create({
      id,
      businessKey,
      caseId: mockCaseId,
      amount,
      method,
      notes: 'Test payment',
      createdBy: 'user-001',
    })
  );
  const processing = Effect.runSync(payment.transitionStatus('processing'));
  const succeeded = Effect.runSync(processing.transitionStatus('succeeded'));

  if (ageInDays > 0) {
    const olderDate = new Date();
    olderDate.setDate(olderDate.getDate() - ageInDays);
    return { ...succeeded, createdAt: olderDate };
  }
  return succeeded;
};

// Helper: Run refund with mocks
const runRefund = (
  payment: Payment,
  policy: PaymentManagementPolicy,
  command: Omit<ProcessRefundCommand, 'paymentBusinessKey' | 'funeralHomeId'>
) => {
  const paymentRepo: PaymentRepositoryService = {
    findById: (id) =>
      id === payment.businessKey
        ? Effect.succeed(payment)
        : Effect.fail(new NotFoundError({ message: 'Not found', resource: 'Payment' })),
    save: (p) => Effect.succeed(p),
    delete: () => Effect.succeed(undefined),
    findByCase: () => Effect.succeed([payment]),
    findAll: () => Effect.succeed([payment]),
  };

  const policyRepo: PaymentManagementPolicyRepositoryService = {
    findByFuneralHome: (fhId) =>
      fhId === mockFuneralHomeId
        ? Effect.succeed(policy)
        : Effect.fail(new NotFoundError({ message: 'Not found', resource: 'Policy' })),
    save: (p) => Effect.succeed(p),
    findHistory: () => Effect.succeed([policy]),
    findByDate: () => Effect.succeed(policy),
  };

  const layer = Layer.merge(
    Layer.succeed(PaymentRepository, paymentRepo),
    Layer.succeed(PaymentManagementPolicyRepository, policyRepo)
  );

  return Effect.provide(
    processRefund({
      paymentBusinessKey: payment.businessKey,
      funeralHomeId: mockFuneralHomeId,
      ...command,
    }),
    layer
  );
};

describe('process-refund (Phase 2.2)', () => {
  describe('Full refund processing', () => {
    it('should process full refund without amount specified', () => {
      const payment = createSucceededPayment('p1', 'bk-1', 500, 'cash');
      const policy = new PaymentManagementPolicy({
        id: 'policy-1',
        businessKey: mockFuneralHomeId,
        funeralHomeId: mockFuneralHomeId,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null,
        reason: null,
        ...DEFAULT_PAYMENT_MANAGEMENT_POLICY,
        requireOriginalPaymentProof: false, // Not required for this test
      });

      const result = Effect.runSync(
        runRefund(payment, policy, {
          reason: 'Customer request',
          processedBy: 'user-001',
        })
      ) as ProcessRefundResult;

      expect(result.originalPayment.status).toBe('refunded');
      expect(result.refundPayment.amount.amount).toBe(500);
    });

    it('should process partial refund with specific amount', () => {
      const payment = createSucceededPayment('p2', 'bk-2', 1000, 'check');
      const policy = new PaymentManagementPolicy({
        id: 'policy-2',
        businessKey: mockFuneralHomeId,
        funeralHomeId: mockFuneralHomeId,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null,
        reason: null,
        ...PERMISSIVE_PAYMENT_MANAGEMENT_POLICY,
      });

      const result = Effect.runSync(
        runRefund(payment, policy, {
          refundAmount: 300,
          reason: 'Partial refund',
          processedBy: 'user-001',
        })
      ) as ProcessRefundResult;

      expect(result.refundPayment.amount.amount).toBe(300);
      expect(result.originalPayment.status).toBe('refunded');
    });
  });

  describe('Policy enforcement', () => {
    it('should require approval above policy threshold', () => {
      const payment = createSucceededPayment('p3', 'bk-3', 1000, 'ach');
      const policy = new PaymentManagementPolicy({
        id: 'policy-3',
        businessKey: mockFuneralHomeId,
        funeralHomeId: mockFuneralHomeId,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null,
        reason: null,
        ...DEFAULT_PAYMENT_MANAGEMENT_POLICY, // $500 threshold
        requireOriginalPaymentProof: false,
      });

      const result = Effect.runSync(
        runRefund(payment, policy, {
          refundAmount: 750,
          reason: 'Service complaint',
          processedBy: 'user-001',
        })
      ) as ProcessRefundResult;

      expect(result.requiresApproval).toBe(true);
      expect(result.refundPayment.status).toBe('pending');
    });

    it('should reject refund outside refund window', () => {
      const payment = createSucceededPayment('p4', 'bk-4', 500, 'cash', 45); // 45 days old
      const policy = new PaymentManagementPolicy({
        id: 'policy-4',
        businessKey: mockFuneralHomeId,
        funeralHomeId: mockFuneralHomeId,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null,
        reason: null,
        ...DEFAULT_PAYMENT_MANAGEMENT_POLICY, // 30 day window
      });

      const result = Effect.runSync(
        Effect.either(
          runRefund(payment, policy, {
            refundAmount: 200,
            reason: 'Too old',
            processedBy: 'user-001',
          })
        )
      );

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        // Can be either error type depending on which validation catches it first
        const isValidError = result.left instanceof ValidationError || result.left instanceof BusinessRuleViolationError;
        expect(isValidError).toBe(true);
      }
    });

    it('should reject refund if disabled in policy', () => {
      const payment = createSucceededPayment('p5', 'bk-5', 500, 'cash');
      const policy = new PaymentManagementPolicy({
        id: 'policy-5',
        businessKey: mockFuneralHomeId,
        funeralHomeId: mockFuneralHomeId,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null,
        reason: null,
        ...DEFAULT_PAYMENT_MANAGEMENT_POLICY,
        allowRefunds: false, // Disabled
      });

      const result = Effect.runSync(
        Effect.either(
          runRefund(payment, policy, {
            refundAmount: 200,
            reason: 'Should fail',
            processedBy: 'user-001',
          })
        )
      );

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('Validation errors', () => {
    it('should reject refund amount exceeding original', () => {
      const payment = createSucceededPayment('p6', 'bk-6', 500, 'cash');
      const policy = new PaymentManagementPolicy({
        id: 'policy-6',
        businessKey: mockFuneralHomeId,
        funeralHomeId: mockFuneralHomeId,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null,
        reason: null,
        ...DEFAULT_PAYMENT_MANAGEMENT_POLICY,
      });

      const result = Effect.runSync(
        Effect.either(
          runRefund(payment, policy, {
            refundAmount: 600,
            reason: 'Over-refund',
            processedBy: 'user-001',
          })
        )
      );

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ValidationError);
      }
    });

    it('should reject non-succeeded payment', () => {
      const paymentRaw = Effect.runSync(
        Payment.create({
          id: 'p7',
          businessKey: 'bk-7',
          caseId: mockCaseId,
          amount: 500,
          method: 'cash',
          notes: 'Test',
          createdBy: 'user-001',
        })
      );
      const policy = new PaymentManagementPolicy({
        id: 'policy-7',
        businessKey: mockFuneralHomeId,
        funeralHomeId: mockFuneralHomeId,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null,
        reason: null,
        ...DEFAULT_PAYMENT_MANAGEMENT_POLICY,
      });

      const result = Effect.runSync(
        Effect.either(
          runRefund(paymentRaw, policy, {
            refundAmount: 200,
            reason: 'Pending payment',
            processedBy: 'user-001',
          })
        )
      );

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(BusinessRuleViolationError);
      }
    });
  });

  describe('Audit trail', () => {
    it('should include refund metadata in notes', () => {
      const payment = createSucceededPayment('p8', 'bk-8', 1000, 'check');
      const policy = new PaymentManagementPolicy({
        id: 'policy-8',
        businessKey: mockFuneralHomeId,
        funeralHomeId: mockFuneralHomeId,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: null,
        reason: null,
        ...PERMISSIVE_PAYMENT_MANAGEMENT_POLICY,
      });

      const result = Effect.runSync(
        runRefund(payment, policy, {
          refundAmount: 500,
          reason: 'Customer dissatisfied',
          notes: 'Manager approval: John Smith',
          processedBy: 'user-002',
        })
      ) as ProcessRefundResult;

      expect(result.refundPayment.notes).toContain('Customer dissatisfied');
      expect(result.refundPayment.notes).toContain('Manager approval: John Smith');
      expect(result.refundPayment.notes).toContain(`Refund for payment ${payment.businessKey}`);
    });
  });
});
