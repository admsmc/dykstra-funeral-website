import { Effect } from 'effect';
import { Payment, ValidationError, BusinessRuleViolationError, InvalidStateTransitionError, NotFoundError } from '@dykstra/domain';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';
import { randomUUID } from 'crypto';

/**
 * Process refund command
 */
export interface ProcessRefundCommand {
  readonly paymentBusinessKey: string;
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
}

/**
 * Process refund use case
 * Refunds a succeeded payment by:
 * 1. Marking original payment as 'refunded' (SCD2: creates new version)
 * 2. Creating a new payment record with negative amount
 * 
 * Business rules:
 * - Can only refund 'succeeded' payments
 * - Refund amount cannot exceed original amount
 * - Full refund if amount not specified
 * - Creates audit trail via SCD2 versioning
 * 
 * Clean Architecture:
 * - Depends only on PaymentRepository port
 * - Business logic in domain entity (Payment.refund)
 * - Returns Effect for composition
 */
export const processRefund = (
  command: ProcessRefundCommand
): Effect.Effect<
  ProcessRefundResult,
  ValidationError | BusinessRuleViolationError | InvalidStateTransitionError | NotFoundError | PersistenceError,
  PaymentRepository
> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    
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
          rule: 'refund_succeeded_only'
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
          field: 'refundAmount'
        })
      ));
    }
    
    if (refundAmount > originalPayment.amount.amount) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Refund amount cannot exceed original payment amount',
          field: 'refundAmount'
        })
      ));
    }
    
    // Mark original payment as refunded (creates new SCD2 version)
    const refundedPayment = yield* _(originalPayment.refund());
    
    // Create refund payment record (negative amount for accounting)
    const refundNotes = [
      `Refund for payment ${originalPayment.businessKey}`,
      `Reason: ${command.reason}`,
      command.notes ? `Notes: ${command.notes}` : null
    ].filter(Boolean).join(' | ');
    
    const refundId = randomUUID();
    const refundBusinessKey = randomUUID();
    
    const refundPayment = yield* _(Payment.create({
      id: refundId,
      businessKey: refundBusinessKey,
      caseId: originalPayment.caseId,
      amount: refundAmount,  // Store as positive, logic treats refunded status as negative
      method: originalPayment.method,
      notes: refundNotes,
      createdBy: command.processedBy,
    }));
    
    // Mark refund payment as succeeded immediately
    const succeededRefund = yield* _(refundPayment.transitionStatus('refunded'));
    
    // Save both payments (SCD2: creates new versions)
    yield* _(paymentRepo.save(refundedPayment));
    yield* _(paymentRepo.save(succeededRefund));
    
    return {
      originalPayment: refundedPayment,
      refundPayment: succeededRefund,
    };
  });
