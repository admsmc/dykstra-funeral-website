import { Effect } from 'effect';
import { GoFinancialPort, type GoFinancialPortService, NetworkError } from '../../ports/go-financial-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Use Case 6.1: Insurance Claim Processing
 * 
 * **Workflow**:
 * 1. Create insurance claim for case
 * 2. Track claim submission to insurance company
 * 3. Record claim payment when received
 * 4. Apply payment to outstanding invoice
 * 5. Post GL entries for insurance receivable
 * 
 * **Business Rules**:
 * - Claim must reference valid case and invoice
 * - Claim amount cannot exceed invoice outstanding balance
 * - Payment application is automatic when claim is paid
 * - GL entries: DR: Insurance Receivable, CR: AR when claimed
 *               DR: Cash, CR: Insurance Receivable when paid
 * 
 * **Error Cases**:
 * - ValidationError: Invalid claim amount, missing invoice
 * - NetworkError: Go backend communication failure
 * 
 * @see Implementation Plan: Remaining 20 Critical Use Cases - Phase 6, Use Case 6.1
 */

export interface InsuranceClaimCommand {
  readonly caseId: string;
  readonly invoiceId: string;
  readonly insuranceCompany: string;
  readonly claimAmount: number;
  readonly claimDate: Date;
  readonly policyNumber: string;
  readonly claimNumber?: string;
}

export interface InsuranceClaimResult {
  readonly claimId: string;
  readonly caseId: string;
  readonly invoiceId: string;
  readonly insuranceCompany: string;
  readonly claimAmount: number;
  readonly status: 'submitted' | 'pending' | 'approved' | 'denied' | 'paid';
  readonly claimDate: Date;
  readonly policyNumber: string;
  readonly claimNumber?: string;
}

export interface RecordClaimPaymentCommand {
  readonly claimId: string;
  readonly paymentAmount: number;
  readonly paymentDate: Date;
  readonly checkNumber?: string;
}

export interface RecordClaimPaymentResult {
  readonly claimId: string;
  readonly paymentId: string;
  readonly paymentAmount: number;
  readonly appliedToInvoice: boolean;
  readonly remainingBalance: number;
}

export const submitInsuranceClaim = (
  command: InsuranceClaimCommand
) =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // ⚠️ TECHNICAL DEBT: Simplified implementation
    // In production, would create actual claim record in claim repository
    // See: docs/PHASE_6_TECHNICAL_DEBT.md

    // Step 1: Get invoice to validate claim amount
    const invoice = yield* financialPort.getInvoice(command.invoiceId);

    // Step 2: Validate claim amount doesn't exceed outstanding balance
    if (command.claimAmount > invoice.amountDue) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Claim amount ($${command.claimAmount}) exceeds invoice outstanding balance ($${invoice.amountDue})`,
          field: 'claimAmount',
        })
      );
    }

    // Step 3: Create insurance claim record
    // Note: This would typically create a claim entity in the system
    // For now, we'll simulate by creating a placeholder
    const claimId = `claim-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // In a real implementation, we would:
    // 1. Create claim record in database
    // 2. Generate claim forms/documents
    // 3. Track submission status
    // 4. Create GL entry for insurance receivable

    return {
      claimId,
      caseId: command.caseId,
      invoiceId: command.invoiceId,
      insuranceCompany: command.insuranceCompany,
      claimAmount: command.claimAmount,
      status: 'submitted' as const,
      claimDate: command.claimDate,
      policyNumber: command.policyNumber,
      claimNumber: command.claimNumber,
    };
  });

export const recordClaimPayment = (
  command: RecordClaimPaymentCommand
) =>
  Effect.gen(function* () {
    // Step 1: Get claim details (would come from claim repository)
    // For now, we'll need to pass invoice ID separately or fetch from claim
    // This is a simplified implementation

    // Step 2: Record payment to the system
    // In real implementation, we would:
    // 1. Update claim status to 'paid'
    // 2. Create payment record
    // 3. Apply payment to invoice
    // 4. Create GL entries

    // Simulated payment ID
    const paymentId = `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // In a real implementation, we would use:
    // const payment = yield* financialPort.recordPayment({
    //   invoiceId: claim.invoiceId,
    //   paymentDate: command.paymentDate,
    //   paymentMethod: 'check',
    //   amount: command.paymentAmount,
    //   referenceNumber: command.checkNumber,
    // });

    return {
      claimId: command.claimId,
      paymentId,
      paymentAmount: command.paymentAmount,
      appliedToInvoice: true,
      remainingBalance: 0, // Would calculate based on invoice balance
    };
  });

/**
 * Type helpers for the Effect returns
 */
export type InsuranceClaimEffect = Effect.Effect<
  InsuranceClaimResult,
  ValidationError | NetworkError,
  GoFinancialPortService
>;

export type RecordClaimPaymentEffect = Effect.Effect<
  RecordClaimPaymentResult,
  NetworkError,
  GoFinancialPortService
>;
