import { Effect, Data } from 'effect';
import type { PaymentMethod, PaymentStatus } from '@dykstra/shared';
import { ValidationError, InvalidStateTransitionError, BusinessRuleViolationError } from '../errors/domain-errors';
import { Money } from '../value-objects/money';

/**
 * Payment ID branded type
 */
export type PaymentId = string & { readonly _brand: 'PaymentId' };

/**
 * Payment entity
 * Represents a payment transaction
 * SCD Type 2: Immutable amounts for accounting/audit compliance
 */
export class Payment extends Data.Class<{
  readonly id: PaymentId;
  readonly businessKey: string;              // Immutable business identifier
  readonly version: number;                   // SCD2 version number
  readonly caseId: string;
  readonly amount: Money;                     // Immutable after creation
  readonly method: PaymentMethod;             // Immutable after creation
  readonly status: PaymentStatus;             // Can change (pending→succeeded/failed)
  readonly stripePaymentIntentId: string | null;
  readonly stripePaymentMethodId: string | null;
  readonly receiptUrl: string | null;
  readonly failureReason: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Valid status transitions
   */
  private static readonly STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['succeeded', 'failed'],
    succeeded: ['refunded'],                    // Can only refund successful payments
    failed: [],                                 // Terminal state
    cancelled: [],                              // Terminal state
    refunded: [],                               // Terminal state
  };
  
  /**
   * Create a new Payment
   */
  static create(params: {
    id: string;
    businessKey: string;
    caseId: string;
    amount: number;
    method: PaymentMethod;
    stripePaymentIntentId?: string;
    notes?: string;
    createdBy: string;
  }): Effect.Effect<Payment, ValidationError> {
    return Effect.gen(function* (_) {
      // Validate amount
      if (params.amount <= 0) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Payment amount must be positive', field: 'amount' })
        ));
      }
      
      if (params.amount > 1000000) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Payment amount exceeds maximum allowed', field: 'amount' })
        ));
      }
      
      const now = new Date();
      const moneyAmount = yield* _(Money.create(params.amount, 'USD'));
      
      return new Payment({
        id: params.id as PaymentId,
        businessKey: params.businessKey,
        version: 1,                             // Initial version
        caseId: params.caseId,
        amount: moneyAmount,
        method: params.method,
        status: 'pending',
        stripePaymentIntentId: params.stripePaymentIntentId ?? null,
        stripePaymentMethodId: null,
        receiptUrl: null,
        failureReason: null,
        notes: params.notes ?? null,
        createdAt: now,
        updatedAt: now,
        createdBy: params.createdBy,
      });
    });
  }
  
  /**
   * Transition to a new status
   */
  transitionStatus(
    newStatus: PaymentStatus,
    metadata?: {
      stripePaymentMethodId?: string;
      receiptUrl?: string;
      failureReason?: string;
    }
  ): Effect.Effect<Payment, InvalidStateTransitionError | BusinessRuleViolationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Check if transition is valid
      const validTransitions = Payment.STATUS_TRANSITIONS[self.status];
      
      if (!validTransitions?.includes(newStatus)) {
        return yield* _(Effect.fail(
          new InvalidStateTransitionError({
            message: `Cannot transition payment from ${self.status} to ${newStatus}`,
            fromState: self.status,
            toState: newStatus,
          })
        ));
      }
      
      // Amounts are immutable (accounting requirement)
      // Only status and metadata can change
      
      return new Payment({
        ...self,
        version: self.version + 1,              // Increment version on change
        status: newStatus,
        stripePaymentMethodId: metadata?.stripePaymentMethodId ?? self.stripePaymentMethodId,
        receiptUrl: metadata?.receiptUrl ?? self.receiptUrl,
        failureReason: metadata?.failureReason ?? self.failureReason,
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Mark as processing
   */
  markProcessing(): Effect.Effect<Payment, InvalidStateTransitionError | BusinessRuleViolationError> {
    return this.transitionStatus('processing');
  }
  
  /**
   * Mark as succeeded
   */
  markSucceeded(receiptUrl: string): Effect.Effect<Payment, InvalidStateTransitionError | BusinessRuleViolationError> {
    return this.transitionStatus('succeeded', { receiptUrl });
  }
  
  /**
   * Mark as failed
   */
  markFailed(failureReason: string): Effect.Effect<Payment, InvalidStateTransitionError | BusinessRuleViolationError> {
    return this.transitionStatus('failed', { failureReason });
  }
  
  /**
   * Refund payment
   */
  refund(): Effect.Effect<Payment, InvalidStateTransitionError | BusinessRuleViolationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Can only refund succeeded payments
      if (self.status !== 'succeeded') {
        return yield* _(Effect.fail(
          new BusinessRuleViolationError({
            message: 'Can only refund succeeded payments',
            rule: 'refund_succeeded_only',
          })
        ));
      }
      
      return yield* _(self.transitionStatus('refunded'));
    });
  }
  
  /**
   * Cancel payment
   */
  cancel(): Effect.Effect<Payment, InvalidStateTransitionError | BusinessRuleViolationError> {
    return this.transitionStatus('cancelled');
  }
  
  /**
   * Check if payment is pending
   */
  get isPending(): boolean {
    return this.status === 'pending';
  }
  
  /**
   * Check if payment is successful
   */
  get isSuccessful(): boolean {
    return this.status === 'succeeded';
  }
  
  /**
   * Check if payment can be refunded
   */
  get canBeRefunded(): boolean {
    return this.status === 'succeeded';
  }
  
  /**
   * Check if payment is final (cannot be modified)
   */
  get isFinal(): boolean {
    return ['succeeded', 'failed', 'cancelled', 'refunded'].includes(this.status);
  }
}
