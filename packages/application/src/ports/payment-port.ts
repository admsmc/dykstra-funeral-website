import { type Effect, Context } from 'effect';

/**
 * Payment processing error
 */
export class PaymentProcessingError extends Error {
  readonly _tag = 'PaymentProcessingError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * Payment intent result
 */
export interface PaymentIntentResult {
  readonly paymentIntentId: string;
  readonly clientSecret: string;
  readonly amount: number;
}

/**
 * Customer result
 */
export interface CustomerResult {
  readonly customerId: string;
  readonly email: string;
}

/**
 * Payment Port
 * Abstraction for payment processing (Stripe)
 */
export interface PaymentPort {
  /**
   * Create a payment intent
   */
  readonly createPaymentIntent: (
    amount: number,
    metadata: Record<string, string>
  ) => Effect.Effect<PaymentIntentResult, PaymentProcessingError>;
  
  /**
   * Confirm a payment intent
   */
  readonly confirmPayment: (
    paymentIntentId: string
  ) => Effect.Effect<void, PaymentProcessingError>;
  
  /**
   * Create a customer
   */
  readonly createCustomer: (
    email: string,
    name: string
  ) => Effect.Effect<CustomerResult, PaymentProcessingError>;
  
  /**
   * Refund a payment
   */
  readonly refundPayment: (
    paymentIntentId: string,
    amount?: number
  ) => Effect.Effect<void, PaymentProcessingError>;
}

/**
 * Payment Port service tag for dependency injection
 */
export const PaymentPort = Context.GenericTag<PaymentPort>('@dykstra/PaymentPort');
