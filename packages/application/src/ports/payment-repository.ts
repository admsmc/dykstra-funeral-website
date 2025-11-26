import { Effect, Context } from 'effect';
import { Payment, type PaymentId, NotFoundError } from '@dykstra/domain';
import type { PersistenceError } from './case-repository';

export type { PersistenceError } from './case-repository';

/**
 * Payment Repository port
 * Defines interface for payment persistence with SCD Type 2 temporal support
 */
export interface PaymentRepository {
  /**
   * Find current version of payment by business key
   */
  readonly findById: (id: PaymentId) => Effect.Effect<Payment, NotFoundError | PersistenceError>;
  
  /**
   * Find payment as it existed at a specific point in time
   * Critical for accounting - "how much was paid as of month-end?"
   */
  readonly findByIdAtTime: (
    businessKey: string,
    asOf: Date
  ) => Effect.Effect<Payment, NotFoundError | PersistenceError>;
  
  /**
   * Find complete version history of a payment
   * Tracks status changes: pending→processing→succeeded/failed
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly Payment[], NotFoundError | PersistenceError>;
  
  /**
   * Find current versions of payments by case
   */
  readonly findByCase: (
    caseId: string
  ) => Effect.Effect<readonly Payment[], PersistenceError>;
  
  /**
   * Save payment - creates new version (SCD2)
   * Amounts are immutable, only status can change
   */
  readonly save: (payment: Payment) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Delete payment (soft delete by closing current version)
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Payment Repository service tag for dependency injection
 */
export const PaymentRepository = Context.GenericTag<PaymentRepository>('@dykstra/PaymentRepository');
