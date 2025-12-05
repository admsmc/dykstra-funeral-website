import { Effect } from "effect";
import { ValidationError } from "../errors";
import { PaymentPort, type PaymentPortService, type PaymentProcessingError } from '../ports/payment-port';

interface ProcessACHPaymentInput {
  caseId: string;
  amount: number;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  accountType: "checking" | "savings";
  userId: string;
}

interface ProcessACHPaymentResult {
  success: boolean;
  paymentId: string;
  status: "pending" | "processing";
}

/**
 * Process an ACH (bank transfer) payment
 * In production, this would integrate with Stripe or Plaid for ACH verification
 */
export const processACHPayment = ({
  caseId,
  amount,
  accountNumber,
  routingNumber,
  accountHolderName,
  accountType,
  userId,
}: ProcessACHPaymentInput): Effect.Effect<
  ProcessACHPaymentResult,
  ValidationError | PaymentProcessingError,
  PaymentPortService
> =>
  Effect.gen(function* (_) {
    // Validate amount
    if (amount <= 0) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Payment amount must be greater than 0" }))
      );
    }

    if (amount > 999999.99) {
      return yield* _(
        Effect.fail(
          new ValidationError({ message: "Payment amount exceeds maximum allowed" })
        )
      );
    }

    // Validate routing number (9 digits)
    if (!/^\d{9}$/.test(routingNumber)) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Invalid routing number format" }))
      );
    }

    // Validate account number (4-17 digits)
    if (!/^\d{4,17}$/.test(accountNumber)) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Invalid account number format" }))
      );
    }

    // Validate account holder name
    if (!accountHolderName || accountHolderName.trim().length === 0) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Account holder name is required" }))
      );
    }

    // Get payment port
    const paymentPort = yield* _(PaymentPort);

    // Create Stripe customer for ACH
    const customer = yield* _(paymentPort.createCustomer(
      `ach-${accountNumber.slice(-4)}@temp.example.com`,
      accountHolderName
    ));

    // TODO: In production, create Stripe ACH payment intent or Plaid transfer
    // For now, we create a basic payment intent as a placeholder
    const paymentIntent = yield* _(paymentPort.createPaymentIntent(amount, {
      caseId,
      userId,
      customerId: customer.customerId,
      accountType,
      accountLast4: accountNumber.slice(-4),
      method: 'ACH',
    }));

    return {
      success: true,
      paymentId: paymentIntent.paymentIntentId,
      status: "pending" as const,
    } satisfies ProcessACHPaymentResult;
  });
