import { type Effect, Context } from 'effect';

/**
 * Payment plan error
 */
export class PaymentPlanError extends Error {
  readonly _tag = 'PaymentPlanError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * Payment frequency
 */
export type PaymentFrequency = 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY';

/**
 * Installment details
 */
export interface Installment {
  readonly installmentNumber: number;
  readonly amount: number;
  readonly dueDate: Date;
  readonly status?: string;
}

/**
 * Payment plan result
 */
export interface PaymentPlanResult {
  readonly paymentPlanId: string;
  readonly installments: Installment[];
}

/**
 * Payment Plan Port
 * Abstraction for payment plan management
 */
export interface PaymentPlanPort {
  /**
   * Create a payment plan
   */
  readonly createPlan: (params: {
    caseId: string;
    totalAmount: number;
    downPayment: number;
    numberOfInstallments: number;
    frequency: PaymentFrequency;
    startDate: Date;
    userId: string;
  }) => Effect.Effect<PaymentPlanResult, PaymentPlanError>;

  /**
   * Get payment plan details
   */
  readonly getPlan: (
    planId: string
  ) => Effect.Effect<{
    id: string;
    caseId: string;
    totalAmount: number;
    remainingBalance: number;
    installments: Installment[];
    status: string;
  }, PaymentPlanError>;

  /**
   * Process an installment payment
   */
  readonly processInstallment: (params: {
    planId: string;
    installmentNumber: number;
    amount: number;
    paymentMethod: string;
  }) => Effect.Effect<void, PaymentPlanError>;

  /**
   * Cancel a payment plan
   */
  readonly cancelPlan: (
    planId: string,
    reason: string
  ) => Effect.Effect<void, PaymentPlanError>;
}

/**
 * Payment Plan Port service tag for dependency injection
 */
export const PaymentPlanPort = Context.GenericTag<PaymentPlanPort>('@dykstra/PaymentPlanPort');
