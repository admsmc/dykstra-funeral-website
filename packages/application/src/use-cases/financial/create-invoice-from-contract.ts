import { Effect } from 'effect';
import { CaseRepository as CaseRepositoryTag, type CaseRepository as CaseRepositoryService, type PersistenceError } from '../../ports/case-repository';
import { GoContractPort, type GoContractPortService, type NetworkError, NotFoundError } from '../../ports/go-contract-port';
import { 
  GoFinancialPort,
  type GoFinancialPortService,
  type CreateInvoiceCommand
} from '../../ports/go-financial-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Command to create an invoice from a contract
 */
/**
 * Create Invoice From Contract
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface CreateInvoiceFromContractCommand {
  readonly contractId: string;
  readonly caseBusinessKey: string;
  readonly invoiceDate?: Date;
  readonly dueDate?: Date;
  readonly paymentTermsDays?: number; // Default: 30 days
}

/**
 * Result of creating an invoice from contract
 */
export interface CreateInvoiceFromContractResult {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly caseId: string;
  readonly totalAmount: number;
  readonly dueDate: Date;
  readonly createdAt: Date;
}

/**
 * Default payment terms (days)
 */
const DEFAULT_PAYMENT_TERMS_DAYS = 30;

/**
 * Create Invoice from Contract
 * 
 * This use case converts an approved contract into an AR invoice in the
 * Go backend's Financial module, then links the invoice back to the TypeScript case.
 * 
 * **Business Rules**:
 * 1. Contract must be approved or active status
 * 2. Contract must be fully signed
 * 3. Case must exist and have the contract linked
 * 4. Invoice line items mirror contract line items
 * 5. Invoice due date calculated from payment terms (default 30 days)
 * 
 * **Workflow**:
 * 1. Validate contract exists and is approved/signed
 * 2. Load case and validate it owns this contract
 * 3. Extract contract line items with GL account assignments
 * 4. Create AR invoice in Go backend
 * 5. Link invoice ID to case metadata
 * 6. Update case outstanding balance
 * 
 * **Financial Impact**:
 * - Creates AR invoice (not yet posted to GL)
 * - Invoice can later be paid via recordPayment use case
 * - GL posting happens at payment or finalization
 * 
 * @param command - Invoice creation command
 * @returns Effect with invoice creation result or errors
 * 
 * @example
 * ```typescript
 * const result = yield* createInvoiceFromContract({
 *   contractId: 'contract-123',
 *   caseBusinessKey: 'case-2024-001',
 *   paymentTermsDays: 30
 * });
 * 
 * console.log(`Invoice ${result.invoiceNumber} created for $${result.totalAmount}`);
 * console.log(`Due date: ${result.dueDate}`);
 * ```
 */
export const createInvoiceFromContract = (
  command: CreateInvoiceFromContractCommand
): Effect.Effect<
  CreateInvoiceFromContractResult,
  NotFoundError | ValidationError | NetworkError | PersistenceError,
  CaseRepositoryService | GoContractPortService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepositoryTag;
    const contractPort = yield* GoContractPort;
    const financialPort = yield* GoFinancialPort;

    // Step 1: Fetch contract from Go backend
    const contract = yield* contractPort.getContract(command.contractId);

    // Step 2: Validate contract status
    if (contract.status !== 'approved' && contract.status !== 'active' && contract.status !== 'completed') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Contract must be approved or active. Current status: ${contract.status}`,
          field: 'contractStatus'
        })
      );
    }

    // Step 3: Validate contract is signed
    if (contract.signedBy.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Contract must be signed before creating an invoice',
          field: 'contractSignatures'
        })
      );
    }

    // Step 4: Load case and validate it exists
    const currentCase = yield* caseRepo.findByBusinessKey(command.caseBusinessKey);
    
    if (!currentCase) {
      return yield* Effect.fail(
        new NotFoundError({
          message: `Case not found: ${command.caseBusinessKey}`,
          entityType: 'Case',
          entityId: command.caseBusinessKey
        })
      );
    }

    // Step 5: Validate case owns this contract
    if (currentCase.goContractId !== command.contractId) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Contract ${command.contractId} is not associated with case ${command.caseBusinessKey}`,
          field: 'contractId'
        })
      );
    }

    // Step 6: Calculate invoice dates
    const invoiceDate = command.invoiceDate || new Date();
    const paymentTermsDays = command.paymentTermsDays ?? DEFAULT_PAYMENT_TERMS_DAYS;
    const dueDate = command.dueDate || new Date(
      invoiceDate.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000
    );

    // Step 7: Extract customer ID from case
    // For funeral homes, the customer is tied to the case
    const customerId = currentCase.businessKey;

    // Step 8: Build invoice line items from contract
    const lineItems = [
      // Service line items
      ...contract.services.map(service => ({
        description: service.description,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        totalPrice: service.totalPrice,
        glAccountId: service.glAccountId || '' // GL account assigned by contract
      })),
      // Product/merchandise line items
      ...contract.products.map(product => ({
        description: product.description,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.totalPrice,
        glAccountId: product.glAccountId || ''
      }))
    ];

    // Step 9: Create invoice command
    const createInvoiceCommand: CreateInvoiceCommand = {
      caseId: currentCase.businessKey,
      contractId: contract.id,
      customerId: customerId,
      invoiceDate: invoiceDate,
      dueDate: dueDate,
      lineItems: lineItems
    };

    // Step 10: Create invoice in Go backend
    const invoice = yield* financialPort.createInvoice(createInvoiceCommand);

    // Step 11: Invoice is created and linked via caseId in the invoice itself
    // No need to update case entity - invoice reference stored in Go backend

    // Step 12: Return result
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      caseId: currentCase.businessKey,
      totalAmount: invoice.totalAmount,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt
    };
  });

/**
 * Validate invoice can be created for contract
 * 
 * Helper function to check if a contract is ready for invoicing.
 * Can be used by UI to enable/disable invoice creation button.
 * 
 * @param contractId - Contract to validate
 * @returns Effect with boolean result
 */
export const canCreateInvoice = (
  contractId: string
): Effect.Effect<
  boolean,
  NetworkError,
  GoContractPortService
> =>
  Effect.gen(function* () {
    const contractPort = yield* GoContractPort;
    
    const contract = yield* Effect.either(contractPort.getContract(contractId));
    
    if (contract._tag === 'Left') {
      return false;
    }
    
    const contractData = contract.right;
    
    // Contract must be approved/active/completed and signed
    return (
      (contractData.status === 'approved' || 
       contractData.status === 'active' || 
       contractData.status === 'completed') &&
      contractData.signedBy.length > 0
    );
  });
