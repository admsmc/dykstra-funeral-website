import { Effect } from 'effect';
import { Payment, ValidationError, BusinessRuleViolationError, InvalidStateTransitionError } from '@dykstra/domain';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';
import type { PaymentMethod } from '@dykstra/shared';
import { randomUUID } from 'crypto';

/**
 * Record manual payment command
 * Used for recording cash, check, or ACH payments that occur outside Stripe
 */
export interface RecordManualPaymentCommand {
  readonly caseId: string;
  readonly amount: number;
  readonly method: Extract<PaymentMethod, 'cash' | 'check' | 'ach'>;
  readonly checkNumber?: string;
  readonly paymentDate?: Date;
  readonly notes?: string;
  readonly recordedBy: string;
}

/**
 * Record manual payment use case
 * Creates a new payment record for manual payments
 * 
 * Business rules:
 * - Amount must be positive
 * - Check payments should include check number in notes
 * - Payment is marked as 'succeeded' immediately (manual verification)
 * - Creates SCD2 version 1 record
 * 
 * Clean Architecture:
 * - Depends only on PaymentRepository port
 * - Business logic in domain entity (Payment.create)
 * - Returns Effect for error handling
 */
export const recordManualPayment = (
  command: RecordManualPaymentCommand
): Effect.Effect<Payment, ValidationError | BusinessRuleViolationError | InvalidStateTransitionError | PersistenceError, PaymentRepository> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    
    // Validate method is manual type
    const validMethods: PaymentMethod[] = ['cash', 'check', 'ach'];
    if (!validMethods.includes(command.method)) {
      return yield* _(Effect.fail(
        new ValidationError({
          message: 'Invalid payment method for manual recording. Use cash, check, or ACH.',
          field: 'method'
        })
      ));
    }
    
    // Build notes with check number if applicable
    let notes = command.notes ?? '';
    if (command.method === 'check' && command.checkNumber) {
      notes = `Check #${command.checkNumber}${notes ? ` - ${notes}` : ''}`;
    }
    
    const businessKey = randomUUID();
    const id = randomUUID();
    
    // Create payment using domain logic
    const payment = yield* _(Payment.create({
      id,
      businessKey,
      caseId: command.caseId,
      amount: command.amount,
      method: command.method,
      notes,
      createdBy: command.recordedBy,
    }));
    
    // Manual payments are immediately marked as succeeded
    // (staff has verified the payment offline)
    const succeededPayment = yield* _(payment.markSucceeded('manual_payment'));
    
    // Save to repository (SCD2: creates version 1 then version 2)
    // First save creates pending payment
    yield* _(paymentRepo.save(payment));
    // Second save creates succeeded version
    yield* _(paymentRepo.save(succeededPayment));
    
    return succeededPayment;
  });
