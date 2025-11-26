import { Effect } from "effect";
import { PaymentRepository, PersistenceError } from '../ports/payment-repository';

interface GetPaymentHistoryInput {
  caseId: string;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidDate: Date;
  paidBy: {
    name: string;
    email: string;
  };
  notes: string | null;
}

interface PaymentHistoryResult {
  payments: PaymentHistoryItem[];
  totalPaid: number;
  pendingAmount: number;
}

/**
 * Get payment history for a case
 * Returns all payments with summary totals
 */
export const getPaymentHistory = ({ caseId }: GetPaymentHistoryInput): Effect.Effect<
  PaymentHistoryResult,
  PersistenceError,
  PaymentRepository
> =>
  Effect.gen(function* (_) {
    const paymentRepo = yield* _(PaymentRepository);
    
    // Fetch all payments for the case
    const payments = yield* _(paymentRepo.findByCase(caseId as any));

    const paymentItems: PaymentHistoryItem[] = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount.amount,
      method: payment.method,
      status: payment.status,
      paidDate: payment.createdAt,
      paidBy: {
        name: payment.createdBy || 'Unknown',
        email: 'unknown@example.com', // TODO: fetch user details
      },
      notes: payment.notes || null,
    }));

    // Calculate totals
    const totalPaid = payments
      .filter((p) => p.status === "succeeded")
      .reduce((sum, p) => sum + p.amount.amount, 0);

    const pendingAmount = payments
      .filter((p) => ["pending", "processing"].includes(p.status))
      .reduce((sum, p) => sum + p.amount.amount, 0);

    return {
      payments: paymentItems,
      totalPaid,
      pendingAmount,
    } satisfies PaymentHistoryResult;
  });
