import { Effect } from 'effect';
import { PaymentPort, type PaymentPortService, PaymentProcessingError } from '../../ports/payment-port';

/**
 * Create Payment Intent Command
 */
export interface CreatePaymentIntentCommand {
  readonly caseId: string;
  readonly amount: number;
  readonly currency?: string;
  readonly description?: string;
  readonly userId: string;
}

/**
 * Create Payment Intent Result
 */
export interface CreatePaymentIntentResult {
  readonly success: boolean;
  readonly clientSecret: string;
  readonly paymentIntentId: string;
  readonly amount: number;
}

/**
 * Create Payment Intent Use Case
 * 
 * Creates a Stripe PaymentIntent for processing card payments.
 * Returns the clientSecret needed for Stripe Elements integration on the frontend.
 * 
 * @param command - Payment intent creation parameters
 * @returns Effect with payment intent details
 */
export const createPaymentIntent = (
  command: CreatePaymentIntentCommand
): Effect.Effect<CreatePaymentIntentResult, PaymentProcessingError, PaymentPortService> =>
  Effect.gen(function* (_) {
    // Get payment port service
    const paymentPort = yield* _(PaymentPort);

    // Validate amount
    if (command.amount <= 0) {
      return yield* _(
        Effect.fail(
          new PaymentProcessingError('Payment amount must be greater than zero')
        )
      );
    }

    // Create metadata for tracking
    const metadata = {
      caseId: command.caseId,
      userId: command.userId,
      description: command.description || `Payment for case ${command.caseId}`,
    };

    // Create payment intent via payment port (Stripe/Go backend)
    const result = yield* _(
      paymentPort.createPaymentIntent(command.amount, metadata)
    );

    return {
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: result.amount,
    };
  });
