import { Effect } from 'effect';
import type {
  DocumentGenerationError,
  PaymentReceiptData,
} from '../../ports/document-generator-port';
import { DocumentGeneratorPort } from '../../ports/document-generator-port';
import { GoFinancialPort } from '../../ports/go-financial-port';
import type { NotFoundError, NetworkError } from '../../ports/go-financial-port';

/**
 * Command to generate payment receipt PDF
 * Note: Payment data must be provided directly since Go Financial Port
 * doesn't have a getPayment(id) method - payments are typically generated
 * at the time of recording and passed directly to PDF generation
 */
export interface GeneratePaymentReceiptPdfCommand {
  readonly invoiceId: string;
  readonly paymentData: {
    readonly paymentId: string;
    readonly paymentNumber: string;
    readonly paymentDate: Date;
    readonly paymentMethod: 'cash' | 'check' | 'credit_card' | 'ach' | 'wire';
    readonly amount: number;
    readonly referenceNumber?: string;
  };
}

/**
 * Result of payment receipt PDF generation
 */
export interface GeneratePaymentReceiptPdfResult {
  readonly paymentId: string;
  readonly receiptNumber: string;
  readonly pdfBuffer: Buffer;
  readonly sizeBytes: number;
}

/**
 * Generate Payment Receipt PDF Use Case
 *
 * Data flow:
 * 1. Fetch GoPayment from Go ERP backend via GoFinancialPort
 * 2. Fetch associated invoice to get invoice number and customer name
 * 3. Map GoPayment → PaymentReceiptData
 * 4. Generate PDF via DocumentGeneratorPort (ReactPDFAdapter)
 * 5. Return PDF buffer with metadata
 *
 * Performance target: <300ms total (100ms fetch + 200ms generation)
 *
 * Error handling:
 * - NotFoundError: Payment doesn't exist in Go backend
 * - NetworkError: Go backend communication failure
 * - DocumentGenerationError: PDF generation failure
 *
 * Dependencies:
 * - GoFinancialPort: Fetches payment and invoice data from Go ERP
 * - DocumentGeneratorPort: Generates PDF from mapped data
 */
export const generatePaymentReceiptPdf = (command: GeneratePaymentReceiptPdfCommand) =>
  Effect.gen(function* (_) {
    // Fetch invoice to get invoice number and customer name
    const goFinancial = yield* _(GoFinancialPort);
    const goInvoice = yield* _(goFinancial.getInvoice(command.invoiceId));

    // Build receipt data from provided payment data and fetched invoice
    const receiptData: PaymentReceiptData = {
      receiptNumber: command.paymentData.paymentNumber,
      paymentId: command.paymentData.paymentId,
      invoiceId: command.invoiceId,
      invoiceNumber: goInvoice.invoiceNumber,
      customerName: goInvoice.customerName,
      paymentDate: command.paymentData.paymentDate,
      paymentMethod: command.paymentData.paymentMethod,
      amount: command.paymentData.amount,
      referenceNumber: command.paymentData.referenceNumber,
      appliedToInvoices: [
        {
          invoiceNumber: goInvoice.invoiceNumber,
          amountApplied: command.paymentData.amount,
        },
      ],
    };

    // Generate PDF
    const docGenerator = yield* _(DocumentGeneratorPort);
    const pdfBuffer = yield* _(docGenerator.generatePaymentReceipt(receiptData));

    // Return result with metadata
    return {
      paymentId: command.paymentData.paymentId,
      receiptNumber: command.paymentData.paymentNumber,
      pdfBuffer,
      sizeBytes: pdfBuffer.length,
    } satisfies GeneratePaymentReceiptPdfResult;
  });

/**
 * Generate Payment Receipt PDF Use Case (with dependencies)
 *
 * Type signature shows all required dependencies via Effect Context:
 * - GoFinancialPortService: Fetch payment and invoice from Go backend
 * - DocumentGeneratorPortService: Generate PDF
 *
 * Possible errors:
 * - NotFoundError: Payment or invoice not found
 * - NetworkError: Backend communication failure
 * - DocumentGenerationError: PDF generation failure
 */
export type GeneratePaymentReceiptPdf = Effect.Effect<
  GeneratePaymentReceiptPdfResult,
  NotFoundError | NetworkError | DocumentGenerationError,
  typeof GoFinancialPort | typeof DocumentGeneratorPort
>;
