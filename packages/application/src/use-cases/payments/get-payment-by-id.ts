import { Effect } from 'effect';
import type { Payment, NotFoundError } from '@dykstra/domain';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';
import { PaymentManagementPolicyRepository, type PaymentManagementPolicyRepositoryService } from '../../ports/payment-management-policy-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * Get Payment By Id
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: PaymentManagementPolicy
 * Persisted In: PaymentManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 2+ tests
 * Last Updated: Phase 2.3
 */

export interface GetPaymentByIdQuery {
  readonly paymentId: string;
  readonly funeralHomeId: string;
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
): Effect.Effect<GetPaymentByIdResult, NotFoundError | PersistenceError | ValidationError, PaymentRepository | PaymentManagementPolicyRepositoryService> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    const policyRepo = yield* _(PaymentManagementPolicyRepository);
    
    // Load policy for this funeral home
    const policy = yield* _(policyRepo.findByFuneralHome(query.funeralHomeId));
    
    // Validate policy is active
    if (!policy.isCurrent) {
      return yield* _(
        Effect.fail(
          new ValidationError({
            message: 'Payment policy is not active',
            field: 'policy',
          })
        )
      );
    }
    
    // Get current payment version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Branded type conversion
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
