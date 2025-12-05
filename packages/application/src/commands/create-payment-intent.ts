import { Effect } from "effect";
import { ValidationError, type NotFoundError } from "../errors";
import { PaymentPort, type PaymentPortService, type PaymentProcessingError } from '../ports/payment-port';
import { CaseRepository, type PersistenceError } from '../ports/case-repository';

interface CreatePaymentIntentInput {
  caseId: string;
  amount: number;
  currency?: string;
  description?: string;
  userId: string;
}

interface CreatePaymentIntentResult {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

/**
 * Create a Stripe PaymentIntent for card payment processing
 * Returns clientSecret for frontend Stripe Elements integration
 */
export const createPaymentIntent = ({
  caseId,
  amount,
  currency = "usd",
  description,
  userId,
}: CreatePaymentIntentInput): Effect.Effect<
  CreatePaymentIntentResult,
  ValidationError | NotFoundError | PaymentProcessingError | PersistenceError,
  PaymentPortService | CaseRepository
> =>
  Effect.gen(function* (_) {
    // Validate amount
    if (amount <= 0) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Amount must be greater than 0" }))
      );
    }

    if (amount > 999999.99) {
      return yield* _(
        Effect.fail(
          new ValidationError({ message: "Amount exceeds maximum allowed ($999,999.99)" })
        )
      );
    }

    // Validate currency
    const validCurrencies = ["usd", "cad", "eur", "gbp"];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      return yield* _(
        Effect.fail(
          new ValidationError({
            message: `Currency must be one of: ${validCurrencies.join(", ")}`,
            field: 'currency'
          })
        )
      );
    }

    // Get dependencies
    const caseRepo = yield* _(CaseRepository);
    const paymentPort = yield* _(PaymentPort);

    // Verify case exists (this will throw NotFoundError if not found)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type conversion for branded CaseId
    yield* _(caseRepo.findById(caseId as any));

    // Create Stripe PaymentIntent
    const paymentIntent = yield* _(paymentPort.createPaymentIntent(amount, {
      caseId,
      userId,
      description: description || `Payment for Case ${caseId}`,
    }));

    return {
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount,
    } satisfies CreatePaymentIntentResult;
  });
