import { Effect } from "effect";
import { type NotFoundError, ValidationError } from "../errors";
import { PaymentRepository, type PersistenceError } from '../ports/payment-repository';
import { CaseRepository } from '../ports/case-repository';

interface GetPaymentReceiptInput {
  paymentId: string;
}

interface PaymentReceipt {
  receiptNumber: string;
  paymentId: string;
  amount: number;
  method: string;
  status: string;
  paidDate: Date;
  caseInfo: {
    caseNumber: string;
    decedentName: string;
  };
  payer: {
    name: string;
    email: string;
  };
  funeralHome: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
    email: string | null;
  };
}

/**
 * Get payment receipt data
 * In production, this would generate a PDF receipt using a library like pdfkit or puppeteer
 */
export const getPaymentReceipt = ({ paymentId }: GetPaymentReceiptInput): Effect.Effect<
  PaymentReceipt,
  NotFoundError | ValidationError | PersistenceError,
  PaymentRepository | CaseRepository
> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    const caseRepo = yield* _(CaseRepository);
    
    // Fetch payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Branded type conversion
    const payment = yield* _(paymentRepo.findById(paymentId as any));

    // Only generate receipts for succeeded payments
    if (payment.status !== "succeeded") {
      return yield* _(
        Effect.fail(
          new ValidationError({
            message: "Receipt only available for completed payments",
            field: 'status'
          })
        )
      );
    }
    
    // Fetch case details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type conversion for branded CaseId
    const caseEntity = yield* _(caseRepo.findById(payment.caseId as any));

    const receipt: PaymentReceipt = {
      receiptNumber: `RCP-${payment.businessKey.replace("payment_", "")}`,
      paymentId: payment.id,
      amount: payment.amount.amount,
      method: payment.method,
      status: payment.status,
      paidDate: payment.createdAt,
      caseInfo: {
        caseNumber: caseEntity.businessKey,
        decedentName: caseEntity.decedentName,
      },
      payer: {
        name: payment.createdBy || 'Unknown',
        email: 'unknown@example.com', // TODO: fetch user details
      },
      funeralHome: {
        name: caseEntity.funeralHomeId, // TODO: fetch funeral home details
        address: null,
        city: null,
        state: null,
        zip: null,
        phone: null,
        email: null,
      },
    };

    return receipt;
  });
