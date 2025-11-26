import { Effect } from 'effect';
import type { Payment, NotFoundError } from '@dykstra/domain';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';

/**
 * Get payment by ID query
 */
export interface GetPaymentByIdQuery {
  readonly paymentId: string;
  readonly includeHistory?: boolean;
}

/**
 * Get payment by ID result
 * Returns current payment version and optionally full history
 */
export interface GetPaymentByIdResult {
  readonly payment: Payment;
  readonly history?: readonly Payment[];
}

/**
 * Get payment by ID use case
 * Retrieves a payment by its business key or technical ID
 * Optionally includes full SCD2 version history
 * 
 * Clean Architecture:
 * - Read-only operation
 * - Depends only on PaymentRepository port
 * - Returns Effect for composition
 */
export const getPaymentById = (
  query: GetPaymentByIdQuery
): Effect.Effect<GetPaymentByIdResult, NotFoundError | PersistenceError, PaymentRepository> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    
    // Get current payment version
    const payment = yield* _(paymentRepo.findById(query.paymentId as any));
    
    // Optionally fetch version history
    let history: readonly Payment[] | undefined;
    if (query.includeHistory) {
      // Use business key to fetch all versions
      history = yield* _(paymentRepo.findHistory(payment.businessKey));
    }
    
    return {
      payment,
      history,
    };
  });
