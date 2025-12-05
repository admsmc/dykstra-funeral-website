import { Effect } from 'effect';
import Stripe from 'stripe';
import type { PaymentPortService, PaymentProcessingError } from '@dykstra/application';

/**
 * Lazy Stripe client singleton
 * Initialized on first use to avoid module-load side effects
 */
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const apiKey = process.env['STRIPE_SECRET_KEY'];
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }

  stripeInstance = new Stripe(apiKey, {
    apiVersion: '2025-11-17.clover',
  });

  return stripeInstance;
}

/**
 * Stripe implementation of PaymentPort
 * Object-based adapter (NOT class-based)
 */
export const StripePaymentAdapter: PaymentPortService = {

  /**
   * Create a payment intent
   */
  createPaymentIntent: (amount: number, metadata: Record<string, string>) =>
    Effect.tryPromise({
      try: async () => {
        const paymentIntent = await getStripe().paymentIntents.create({
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
    }),

  /**
   * Confirm a payment intent
   */
  confirmPayment: (paymentIntentId: string) =>
    Effect.tryPromise({
      try: async () => {
        await getStripe().paymentIntents.confirm(paymentIntentId);
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
    }),

  /**
   * Create a customer
   */
  createCustomer: (email: string, name: string) =>
    Effect.tryPromise({
      try: async () => {
        const customer = await getStripe().customers.create({
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
    }),

  /**
   * Refund a payment
   */
  refundPayment: (paymentIntentId: string, amount?: number) =>
    Effect.tryPromise({
      try: async () => {
        const refundParams: Stripe.RefundCreateParams = {
          payment_intent: paymentIntentId,
        };

        if (amount !== undefined) {
          refundParams.amount = Math.round(amount * 100); // Convert to cents
        }

        await getStripe().refunds.create(refundParams);
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
    }),
};

/**
 * Create Stripe Payment Adapter instance
 */
export function createStripePaymentAdapter(): PaymentPortService {
  return StripePaymentAdapter;
}
