import { Effect } from "effect";
import { ValidationError } from "../errors";
import { PaymentPlanPort, type PaymentPlanError, type PaymentFrequency } from '../ports/payment-plan-port';

interface CreatePaymentPlanInput {
  caseId: string;
  totalAmount: number;
  downPayment: number;
  numberOfInstallments: number;
  frequency: PaymentFrequency;
  startDate: Date;
  userId: string;
}

interface CreatePaymentPlanResult {
  success: boolean;
  paymentPlanId: string;
  installments: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: Date;
  }>;
}

/**
 * Create a payment plan with installments
 * Calculates installment amounts and due dates based on frequency
 */
export const createPaymentPlan = ({
  caseId,
  totalAmount,
  downPayment,
  numberOfInstallments,
  frequency,
  startDate,
  userId,
}: CreatePaymentPlanInput): Effect.Effect<
  CreatePaymentPlanResult,
  ValidationError | PaymentPlanError,
  PaymentPlanPort
> =>
  Effect.gen(function* (_) {
    // Validate total amount
    if (totalAmount <= 0) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Total amount must be greater than 0" }))
      );
    }

    // Validate down payment
    if (downPayment < 0 || downPayment >= totalAmount) {
      return yield* _(
        Effect.fail(
          new ValidationError({
            message: "Down payment must be between 0 and total amount"
          })
        )
      );
    }

    // Validate number of installments
    if (numberOfInstallments < 1 || numberOfInstallments > 60) {
      return yield* _(
        Effect.fail(
          new ValidationError({ message: "Number of installments must be between 1 and 60" })
        )
      );
    }

    // Validate start date (must be in the future or today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Start date cannot be in the past" }))
      );
    }

    // Get payment plan port
    const paymentPlanPort = yield* _(PaymentPlanPort);

    // Create payment plan
    const result = yield* _(paymentPlanPort.createPlan({
      caseId,
      totalAmount,
      downPayment,
      numberOfInstallments,
      frequency,
      startDate,
      userId,
    }));

    return {
      success: true,
      paymentPlanId: result.paymentPlanId,
      installments: result.installments.map((inst) => ({
        installmentNumber: inst.installmentNumber,
        amount: inst.amount,
        dueDate: inst.dueDate,
      })),
    } satisfies CreatePaymentPlanResult;
  });
