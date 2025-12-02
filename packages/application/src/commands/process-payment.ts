import { Effect } from 'effect';
import { Payment, PaymentReceived, type ValidationError, type NotFoundError, type BusinessRuleViolationError, type InvalidStateTransitionError } from '@dykstra/domain';
import type { PaymentMethod } from '@dykstra/shared';
import { PaymentRepository, type PersistenceError } from '../ports/payment-repository';
import { PaymentPort, type PaymentProcessingError } from '../ports/payment-port';
import { EventPublisher, type EventPublishError } from '../ports/event-publisher';

/**
 * Process Payment command
 */
export interface ProcessPaymentCommand {
  readonly id: string;
  readonly caseId: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly stripePaymentIntentId?: string;
  readonly notes?: string;
  readonly createdBy: string;
}

/**
 * Process Payment command handler
 * 
 * Flow:
 * 1. Create payment entity (pending status)
 * 2. Create Stripe payment intent
 * 3. Return payment intent to client for confirmation
 * 4. Client confirms with Stripe Elements
 * 5. Webhook updates payment status to succeeded/failed
 */
export const processPayment = (
  command: ProcessPaymentCommand
): Effect.Effect<
  { payment: Payment; clientSecret: string },
  ValidationError | PersistenceError | PaymentProcessingError | EventPublishError,
  PaymentRepository | PaymentPort | EventPublisher
> =>
  Effect.gen(function* (_) {
    // Get dependencies
    const paymentRepo = yield* _(PaymentRepository);
    const paymentPort = yield* _(PaymentPort);
    const eventPublisher = yield* _(EventPublisher);
    
    // Create payment entity
    const businessKey = command.id; // Same as ID for initial version
    const payment = yield* _(
      Payment.create({
        id: command.id,
        businessKey,
        caseId: command.caseId,
        amount: command.amount,
        method: command.method,
        notes: command.notes,
        createdBy: command.createdBy,
      })
    );
    
    // Create Stripe payment intent
    const paymentIntent = yield* _(
      paymentPort.createPaymentIntent(command.amount, {
        caseId: command.caseId,
        paymentId: payment.id,
      })
    );
    
    // Update payment with Stripe payment intent ID
    const updatedPayment = new Payment({
      ...payment,
      stripePaymentIntentId: paymentIntent.paymentIntentId,
    });
    
    // Persist payment (version 1)
    yield* _(paymentRepo.save(updatedPayment));
    
    // Publish domain event
    yield* _(
      eventPublisher.publish(
        new PaymentReceived({
          occurredAt: new Date(),
          aggregateId: updatedPayment.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type conversion for branded CaseId
          caseId: updatedPayment.caseId as any,
          amount: updatedPayment.amount.amount,
          paymentMethod: updatedPayment.method,
          paidBy: command.createdBy,
        })
      )
    );
    
    return {
      payment: updatedPayment,
      clientSecret: paymentIntent.clientSecret,
    };
  });

/**
 * Confirm Payment command
 * Called after client confirms payment with Stripe
 */
export interface ConfirmPaymentCommand {
  readonly paymentId: string;
  readonly receiptUrl: string;
}

export const confirmPayment = (
  command: ConfirmPaymentCommand
): Effect.Effect<
  Payment,
  NotFoundError | BusinessRuleViolationError | InvalidStateTransitionError | PersistenceError,
  PaymentRepository
> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    
    // Load payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type conversion for branded PaymentId
    const payment = yield* _(paymentRepo.findById(command.paymentId as any));
    
    // Mark as succeeded
    const succeededPayment = yield* _(payment.markSucceeded(command.receiptUrl));
    
    // Persist (creates version 2 with succeeded status)
    yield* _(paymentRepo.save(succeededPayment));
    
    return succeededPayment;
  });

/**
 * Fail Payment command
 * Called when payment processing fails
 */
export interface FailPaymentCommand {
  readonly paymentId: string;
  readonly failureReason: string;
}

export const failPayment = (
  command: FailPaymentCommand
): Effect.Effect<
  Payment,
  NotFoundError | BusinessRuleViolationError | InvalidStateTransitionError | PersistenceError,
  PaymentRepository
> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    
    // Load payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type conversion for branded PaymentId
    const payment = yield* _(paymentRepo.findById(command.paymentId as any));
    
    // Mark as failed
    const failedPayment = yield* _(payment.markFailed(command.failureReason));
    
    // Persist (creates new version with failed status)
    yield* _(paymentRepo.save(failedPayment));
    
    return failedPayment;
  });
