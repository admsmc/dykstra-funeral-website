import { Effect } from 'effect';
import { Payment, ValidationError, BusinessRuleViolationError, type InvalidStateTransitionError, type NotFoundError } from '@dykstra/domain';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';
import { PaymentManagementPolicyRepository, type PaymentManagementPolicyRepositoryService } from '../../ports/payment-management-policy-repository';
import { randomUUID } from 'crypto';

/**
 * Process Refund
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: PaymentManagementPolicy
 * Persisted In: PaymentManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 6+ tests
 * Last Updated: Phase 2.2
 */

export interface ProcessRefundCommand {
  readonly paymentBusinessKey: string;
  readonly funeralHomeId: string;
  readonly refundAmount?: number;  // If omitted, full refund
  readonly reason: string;
  readonly notes?: string;
  readonly processedBy: string;
}

/**
 * Process refund result
 * Returns both the refunded original payment and the new refund payment record
 */
export interface ProcessRefundResult {
  readonly originalPayment: Payment;
  readonly refundPayment: Payment;
  readonly requiresApproval: boolean;
}

/**
 * Process refund use case
 * Refunds a succeeded payment by:
 * 1. Marking original payment as 'refunded' (SCD2: creates new version)
 * 2. Creating a new payment record with negative amount
 *
 * Uses PaymentManagementPolicy to enforce:
 * - Refund enablement (allowRefunds flag)
 * - Maximum refund window (maxRefundDays)
 * - Proof requirements (requireOriginalPaymentProof)
 * - Approval thresholds (requireRefundApproval)
 * - Per-funeral-home configuration
 *
 * Business rules:
 * - Can only refund 'succeeded' payments within policy window
 * - Refund amount cannot exceed original amount
 * - Full refund if amount not specified
 * - Creates audit trail via SCD2 versioning
 * - Returns approval requirement status
 *
 * Clean Architecture:
 * - Loads policy first, validates against it
 * - Depends on PaymentRepository and PaymentManagementPolicyRepository
 * - Business logic in domain entity (Payment.refund)
 * - Returns Effect for composition
 */
export const processRefund = (
  command: ProcessRefundCommand
): Effect.Effect<
  ProcessRefundResult,
  ValidationError | BusinessRuleViolationError | InvalidStateTransitionError | NotFoundError | PersistenceError,
  PaymentRepository | PaymentManagementPolicyRepositoryService
> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    const policyRepo = yield* _(PaymentManagementPolicyRepository);

    // Load policy for this funeral home
    const policy = yield* _(policyRepo.findByFuneralHome(command.funeralHomeId));

    // Validate policy is active
    if (!policy.isCurrent) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Payment policy is not active',
          field: 'policy',
        })
      ));
    }

    // Validate refunds are enabled in policy
    if (!policy.allowRefunds) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Refunds are not enabled in policy',
          field: 'refunds',
        })
      ));
    }

    // Find original payment
    const originalPayment = yield* _(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Branded type conversion
      paymentRepo.findById(command.paymentBusinessKey as any)
    );

    // Validate payment can be refunded
    if (!originalPayment.canBeRefunded) {
      return yield* _(Effect.fail(
        new BusinessRuleViolationError({
          message: `Cannot refund payment with status: ${originalPayment.status}`,
          rule: 'refund_succeeded_only',
        })
      ));
    }

    // Validate refund window (maxRefundDays)
    const paymentAgeDays = Math.floor(
      (new Date().getTime() - originalPayment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (paymentAgeDays > policy.maxRefundDays) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: `Cannot refund payment older than ${policy.maxRefundDays} days`,
          field: 'paymentDate',
        })
      ));
    }

    // Validate proof requirement if needed
    if (policy.requireOriginalPaymentProof && !command.notes) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Proof of original payment is required for refunds',
          field: 'notes',
        })
      ));
    }

    // Calculate refund amount
    const refundAmount = command.refundAmount ?? originalPayment.amount.amount;

    // Validate refund amount
    if (refundAmount <= 0) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Refund amount must be positive',
          field: 'refundAmount',
        })
      ));
    }

    if (refundAmount > originalPayment.amount.amount) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Refund amount cannot exceed original payment amount',
          field: 'refundAmount',
        })
      ));
    }

    // Determine if refund requires approval based on policy
    const requiresApproval = policy.requireRefundApproval &&
      refundAmount > policy.refundApprovalThreshold;

    // Mark original payment as refunded (creates new SCD2 version)
    const refundedPayment = yield* _(originalPayment.refund());

    // Create refund payment record (negative amount for accounting)
    const refundNotes = [
      `Refund for payment ${originalPayment.businessKey}`,
      `Reason: ${command.reason}`,
      command.notes ? `Notes: ${command.notes}` : null,
    ].filter(Boolean).join(' | ');

    const refundId = randomUUID();
    const refundBusinessKey = randomUUID();

    const refundPayment = yield* _(Payment.create({
      id: refundId,
      businessKey: refundBusinessKey,
      caseId: originalPayment.caseId,
      amount: refundAmount,
      method: originalPayment.method,
      notes: refundNotes,
      createdBy: command.processedBy,
    }));

    // Mark refund payment status based on approval requirement
    let finalRefund: Payment;
    if (requiresApproval) {
      // Leave as pending if approval required
      finalRefund = refundPayment;
    } else {
      // Auto-approve if below threshold: pending → processing → succeeded
      const processingRefund = yield* _(refundPayment.transitionStatus('processing'));
      finalRefund = yield* _(processingRefund.transitionStatus('succeeded'));
    }

    // Save both payments (SCD2: creates new versions)
    yield* _(paymentRepo.save(refundedPayment));
    yield* _(paymentRepo.save(finalRefund));

    return {
      originalPayment: refundedPayment,
      refundPayment: finalRefund,
      requiresApproval,
    };
  });
