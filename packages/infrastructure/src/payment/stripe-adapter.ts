import { Effect, Layer } from 'effect';
import { PaymentPort, type PaymentIntentResult, type CustomerResult, PaymentProcessingError } from '@dykstra/application';

/**
 * Stripe adapter implementation
 * 
 * Note: This is a type-safe wrapper around Stripe SDK
 * Actual Stripe import would be: import Stripe from 'stripe'
 * 
 * For now, we'll create the interface. Install Stripe with:
 * npm install stripe @types/stripe
 */

/**
 * Stripe client singleton (lazy initialization)
 */
let stripeClient: any = null;

const getStripeClient = () => {
  if (!stripeClient) {
    // In production: const Stripe = require('stripe');
    // stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    // For now, mock for type safety
    stripeClient = {
      paymentIntents: {
        create: async (params: any) => ({
          id: 'pi_mock',
          client_secret: 'secret_mock',
          amount: params.amount,
        }),
        confirm: async (id: string) => ({ id }),
        list: async () => ({ data: [] }),
      },
      customers: {
        create: async (params: any) => ({
          id: 'cus_mock',
          email: params.email,
        }),
      },
      refunds: {
        create: async (params: any) => ({
          id: 'ref_mock',
          amount: params.amount,
        }),
      },
    };
  }
  return stripeClient;
};

/**
 * Stripe adapter implementation
 */
export const StripeAdapter: PaymentPort = {
  /**
   * Create a payment intent
   */
  createPaymentIntent: (amount: number, metadata: Record<string, string>) =>
    Effect.tryPromise({
      try: async () => {
        const stripe = getStripeClient();
        
        // Convert dollars to cents (Stripe expects cents)
        const amountInCents = Math.round(amount * 100);
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata,
        });
        
        return {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount / 100, // Convert back to dollars
        } as PaymentIntentResult;
      },
      catch: (error) => new PaymentProcessingError('Failed to create payment intent', error),
    }),
  
  /**
   * Confirm a payment intent
   */
  confirmPayment: (paymentIntentId: string) =>
    Effect.tryPromise({
      try: async () => {
        const stripe = getStripeClient();
        
        await stripe.paymentIntents.confirm(paymentIntentId);
      },
      catch: (error) => new PaymentProcessingError('Failed to confirm payment', error),
    }),
  
  /**
   * Create a customer
   */
  createCustomer: (email: string, name: string) =>
    Effect.tryPromise({
      try: async () => {
        const stripe = getStripeClient();
        
        const customer = await stripe.customers.create({
          email,
          name,
        });
        
        return {
          customerId: customer.id,
          email: customer.email,
        } as CustomerResult;
      },
      catch: (error) => new PaymentProcessingError('Failed to create customer', error),
    }),
  
  /**
   * Refund a payment
   */
  refundPayment: (paymentIntentId: string, amount?: number) =>
    Effect.tryPromise({
      try: async () => {
        const stripe = getStripeClient();
        
        const refundParams: any = {
          payment_intent: paymentIntentId,
        };
        
        // Partial refund if amount specified
        if (amount !== undefined) {
          refundParams.amount = Math.round(amount * 100); // Convert to cents
        }
        
        await stripe.refunds.create(refundParams);
      },
      catch: (error) => new PaymentProcessingError('Failed to refund payment', error),
    }),
};

/**
 * Effect Layer to provide PaymentPort with Stripe implementation
 */
export const StripeAdapterLive = Layer.succeed(
  PaymentPort,
  StripeAdapter
);
