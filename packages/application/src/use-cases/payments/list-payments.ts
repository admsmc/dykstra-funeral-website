import { Effect } from 'effect';
import type { Payment } from '@dykstra/domain';
import { PaymentRepository, type PersistenceError } from '../../ports/payment-repository';
import type { PaymentStatus, PaymentMethod } from '@dykstra/shared';

/**
 * List payments query parameters
 */
/**
 * List Payments
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface ListPaymentsQuery {
  readonly funeralHomeId: string;
  readonly status?: PaymentStatus;
  readonly method?: PaymentMethod;
  readonly caseId?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * List payments result
 */
export interface ListPaymentsResult {
  readonly payments: readonly Payment[];
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * List payments use case
 * Query payments with filters - read-only operation
 * 
 * Clean Architecture:
 * - Depends only on PaymentRepository port
 * - Returns Effect for composition
 * - No infrastructure dependencies
 */
export const listPayments = (
  query: ListPaymentsQuery
): Effect.Effect<ListPaymentsResult, PersistenceError, PaymentRepository> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    
    // For now, we'll implement basic filtering in the repository layer
    // In a production system, this would use a proper query builder or read model
    
    // TODO: This is a simplified implementation
    // Proper implementation would have a dedicated read model for complex queries
    
    const allPayments = yield* _(paymentRepo.findByCase(query.caseId ?? 'all'));
    
    // Apply filters in memory (not ideal for production, but works for MVP)
    const filtered = allPayments.filter((payment) => {
      if (query.status && payment.status !== query.status) return false;
      if (query.method && payment.method !== query.method) return false;
      if (query.dateFrom && payment.createdAt < query.dateFrom) return false;
      if (query.dateTo && payment.createdAt > query.dateTo) return false;
      return true;
    });
    
    const total = filtered.length;
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    
    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    
    return {
      payments: paginated,
      total,
      hasMore,
    };
  });
