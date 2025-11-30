import { Effect } from 'effect';
import { Case, ValidationError } from '@dykstra/domain';
import { 
  CaseRepository, 
  type CaseRepository as CaseRepositoryService,
  NotFoundError,
  PersistenceError,
} from '../../ports/case-repository';
import {
  PaymentRepository,
  type PaymentRepositoryService,
} from '../../ports/payment-repository';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  type RecordPaymentCommand,
  type GoPayment,
  NetworkError,
} from '../../ports/go-financial-port';

/**
 * Command for processing case payment
 */
export interface ProcessCasePaymentCommand {
  readonly caseBusinessKey: string;
  readonly amountCents: number;
  readonly paymentMethod: 'cash' | 'check' | 'credit_card' | 'insurance' | 'bank_transfer';
  readonly reference?: string;  // Check number, transaction ID, etc.
  readonly paidBy: string;       // Customer name
  readonly receivedBy: string;   // Staff member
  readonly notes?: string;
}

/**
 * Result of case payment processing
 */
export interface ProcessCasePaymentResult {
  readonly case: Case;
  readonly tsPayment: any;         // TypeScript payment record
  readonly goPayment: GoPayment;   // Go AR payment record
  readonly remainingBalance: number;
}

/**
 * Process Case Payment (Cross-Domain Orchestration)
 * 
 * This use case orchestrates payment across TypeScript and Go domains:
 * 1. TypeScript Domain: Load case and validate
 * 2. TypeScript Domain: Create payment record in CRM
 * 3. Go Domain: Record payment in AR (via GoFinancialPort)
 * 4. TypeScript Domain: Update case with payment link
 * 5. TypeScript Domain: Update case balance
 * 
 * Use Case: Family makes a payment at arrangement meeting or after service.
 * Payment is recorded in both CRM (for case tracking) and AR (for accounting).
 * 
 * @example
 * ```typescript
 * const result = pipe(
 *   processCasePayment({
 *     caseBusinessKey: 'case-789',
 *     amountCents: 500000,  // $5,000.00
 *     paymentMethod: 'check',
 *     reference: 'CHECK-12345',
 *     paidBy: 'John Johnson',
 *     receivedBy: 'staff-user-1',
 *     notes: 'Deposit payment'
 *   }),
 *   Effect.provide(InfrastructureLayer),
 *   Effect.runPromise
 * );
 * ```
 */
export const processCasePayment = (
  command: ProcessCasePaymentCommand
): Effect.Effect<
  ProcessCasePaymentResult,
  NotFoundError | ValidationError | PersistenceError | NetworkError,
  CaseRepositoryService | PaymentRepositoryService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;
    const paymentRepo = yield* PaymentRepository;
    const goFinancialPort = yield* GoFinancialPort;
    
    // Step 1: Load and validate case (TypeScript domain)
    const case_ = yield* caseRepo.findByBusinessKey(command.caseBusinessKey);
    
    if (!case_) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Case not found',
          entityType: 'Case',
          entityId: command.caseBusinessKey,
        })
      );
    }
    
    // Validate amount
    if (command.amountCents <= 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Payment amount must be greater than zero',
          field: 'amountCents',
          value: command.amountCents,
        })
      );
    }
    
    // Get case contract ID from metadata
    const contractId = case_.metadata?.goContractId as string | undefined;
    
    if (!contractId) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Case must have an associated contract to process payments',
          field: 'goContractId',
        })
      );
    }
    
    // Step 2: Create payment record in CRM (TypeScript domain)
    const tsPayment = yield* paymentRepo.create({
      caseId: case_.id,
      amount: command.amountCents,
      paymentMethod: command.paymentMethod,
      reference: command.reference,
      paidBy: command.paidBy,
      receivedBy: command.receivedBy,
      notes: command.notes,
      status: 'pending',
    });
    
    // Step 3: Record payment in AR (Go domain via port)
    const recordPaymentCommand: RecordPaymentCommand = {
      invoiceId: contractId,  // Using contract ID as invoice reference
      amountCents: command.amountCents,
      paymentMethod: command.paymentMethod,
      reference: command.reference || tsPayment.id,
      receivedDate: new Date(),
      notes: command.notes,
    };
    
    const goPayment = yield* goFinancialPort.recordPayment(recordPaymentCommand);
    
    // Step 4: Update CRM payment with Go payment link (TypeScript domain)
    const linkedPayment = yield* paymentRepo.update({
      ...tsPayment,
      status: 'completed',
      metadata: {
        goPaymentId: goPayment.id,
        goInvoiceId: contractId,
      },
    });
    
    // Step 5: Update case balance (TypeScript domain)
    const currentBalance = (case_.metadata?.balance as number) || 0;
    const newBalance = currentBalance - command.amountCents;
    
    const caseWithPayment = {
      ...case_,
      metadata: {
        ...case_.metadata,
        balance: newBalance,
        payments: [
          ...((case_.metadata?.payments as any[]) || []),
          {
            tsPaymentId: linkedPayment.id,
            goPaymentId: goPayment.id,
            amountCents: command.amountCents,
            paidAt: new Date(),
          },
        ],
      },
    };
    
    yield* caseRepo.update(caseWithPayment);
    
    return {
      case: caseWithPayment,
      tsPayment: linkedPayment,
      goPayment,
      remainingBalance: newBalance,
    };
  });

/**
 * Get Case Balance (Query use case)
 * 
 * Retrieves current balance for a case by reconciling:
 * - Contract total (from Go)
 * - Payments received (from TypeScript + Go AR)
 */
export interface GetCaseBalanceCommand {
  readonly caseBusinessKey: string;
}

export interface GetCaseBalanceResult {
  readonly contractTotalCents: number;
  readonly paymentsTotalCents: number;
  readonly balanceDueCents: number;
  readonly payments: readonly {
    readonly id: string;
    readonly amountCents: number;
    readonly paidAt: Date;
    readonly paymentMethod: string;
  }[];
}

export const getCaseBalance = (
  command: GetCaseBalanceCommand
): Effect.Effect<
  GetCaseBalanceResult,
  NotFoundError | ValidationError | NetworkError,
  CaseRepositoryService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;
    const goFinancialPort = yield* GoFinancialPort;
    
    // Load case
    const case_ = yield* caseRepo.findByBusinessKey(command.caseBusinessKey);
    
    if (!case_) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Case not found',
          entityType: 'Case',
          entityId: command.caseBusinessKey,
        })
      );
    }
    
    // Get contract ID
    const contractId = case_.metadata?.goContractId as string | undefined;
    
    if (!contractId) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Case does not have an associated contract',
          field: 'goContractId',
        })
      );
    }
    
    // Get invoice (contract) from Go to get total
    const invoice = yield* goFinancialPort.getInvoice(contractId);
    
    // Get payments from case metadata
    const payments = (case_.metadata?.payments as any[]) || [];
    const paymentsTotalCents = payments.reduce(
      (sum, p) => sum + p.amountCents,
      0
    );
    
    return {
      contractTotalCents: invoice.totalAmountCents,
      paymentsTotalCents,
      balanceDueCents: invoice.totalAmountCents - paymentsTotalCents,
      payments: payments.map(p => ({
        id: p.tsPaymentId,
        amountCents: p.amountCents,
        paidAt: new Date(p.paidAt),
        paymentMethod: p.paymentMethod || 'unknown',
      })),
    };
  });
