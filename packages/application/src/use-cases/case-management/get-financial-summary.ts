import { Effect } from 'effect';
import { ContractRepository } from '../../ports/contract-repository';
import { PaymentRepository } from '../../ports/payment-repository';

export interface GetFinancialSummaryQuery {
  caseId: string;
}

export interface GetFinancialSummaryResult {
  contractTotal: string;
  paidToDate: string;
  outstanding: string;
  hasContract: boolean;
}

/**
 * Get financial summary for a case
 * Calculates contract total, payments made, and outstanding balance
 */
export const getFinancialSummary = (
  query: GetFinancialSummaryQuery
): Effect.Effect<GetFinancialSummaryResult, never, ContractRepository | PaymentRepository> =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const paymentRepo = yield* PaymentRepository;

    // Get current contract (if exists)
    const contract = yield* contractRepo.findCurrentByCase(query.caseId);

    // Get sum of successful payments
    const payments = yield* paymentRepo.findByCase(query.caseId);
    const successfulPayments = payments.filter((p) => p.status === 'SUCCEEDED');
    const paidToDate = successfulPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const contractTotal = contract ? Number(contract.totalAmount) : 0;
    const outstanding = contractTotal - paidToDate;

    return {
      contractTotal: contractTotal.toString(),
      paidToDate: paidToDate.toString(),
      outstanding: outstanding.toString(),
      hasContract: !!contract,
    };
  });
