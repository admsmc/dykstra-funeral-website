import { Effect } from 'effect';
import Stripe from 'stripe';
import type { PaymentPort, PaymentIntentResult, CustomerResult, PaymentProcessingError } from '@dykstra/application';

/**
 * Stripe implementation of PaymentPort
 */
export class StripePaymentAdapter implements PaymentPort {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env['STRIPE_SECRET_KEY'];
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-11-17.clover',
    });
  }

  /**
   * Create a payment intent
   */
  readonly createPaymentIntent = (
    amount: number,
    metadata: Record<string, string>
  ): Effect.Effect<PaymentIntentResult, PaymentProcessingError> =>
    Effect.tryPromise({
      try: async () => {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata,
          automatic_payment_methods: {
            enabled: true,
          },
        });

        return {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret || '',
          amount: paymentIntent.amount / 100, // Convert back to dollars
        };
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to create payment intent';
        return new (class extends Error implements PaymentProcessingError {
          readonly _tag = 'PaymentProcessingError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });

  /**
   * Confirm a payment intent
   */
  readonly confirmPayment = (paymentIntentId: string): Effect.Effect<void, PaymentProcessingError> =>
    Effect.tryPromise({
      try: async () => {
        await this.stripe.paymentIntents.confirm(paymentIntentId);
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to confirm payment';
        return new (class extends Error implements PaymentProcessingError {
          readonly _tag = 'PaymentProcessingError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });

  /**
   * Create a customer
   */
  readonly createCustomer = (email: string, name: string): Effect.Effect<CustomerResult, PaymentProcessingError> =>
    Effect.tryPromise({
      try: async () => {
        const customer = await this.stripe.customers.create({
          email,
          name,
        });

        return {
          customerId: customer.id,
          email: customer.email || email,
        };
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to create customer';
        return new (class extends Error implements PaymentProcessingError {
          readonly _tag = 'PaymentProcessingError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });

  /**
   * Refund a payment
   */
  readonly refundPayment = (paymentIntentId: string, amount?: number): Effect.Effect<void, PaymentProcessingError> =>
    Effect.tryPromise({
      try: async () => {
        const refundParams: Stripe.RefundCreateParams = {
          payment_intent: paymentIntentId,
        };

        if (amount !== undefined) {
          refundParams.amount = Math.round(amount * 100); // Convert to cents
        }

        await this.stripe.refunds.create(refundParams);
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to refund payment';
        return new (class extends Error implements PaymentProcessingError {
          readonly _tag = 'PaymentProcessingError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });
}

/**
 * Create Stripe Payment Adapter instance
 */
export function createStripePaymentAdapter(): PaymentPort {
  return new StripePaymentAdapter();
}
