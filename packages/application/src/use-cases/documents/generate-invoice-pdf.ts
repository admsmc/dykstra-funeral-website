import { Effect } from 'effect';
import type { DocumentGenerationError } from '../../ports/document-generator-port';
import { DocumentGeneratorPort } from '../../ports/document-generator-port';
import { GoFinancialPort } from '../../ports/go-financial-port';
import type { NotFoundError, NetworkError } from '../../ports/go-financial-port';
import { mapGoInvoiceToInvoiceData } from '../../mappers/go-to-invoice-data-mapper';

/**
 * Configuration for funeral home billing address
 * TODO: Move to configuration service in Week 6
 */
const FUNERAL_HOME_ADDRESS = {
  name: 'Dykstra Funeral Home',
  line1: '123 Main Street',
  city: 'Anytown',
  state: 'MI',
  postalCode: '12345',
};

/**
 * Command to generate invoice PDF
 */
export interface GenerateInvoicePdfCommand {
  readonly invoiceId: string;
  readonly paymentUrl?: string; // Optional payment portal URL for electronic delivery
}

/**
 * Result of invoice PDF generation
 */
export interface GenerateInvoicePdfResult {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly pdfBuffer: Buffer;
  readonly sizeBytes: number;
}

/**
 * Generate Invoice PDF Use Case
 *
 * Data flow:
 * 1. Fetch GoInvoice from Go ERP backend via GoFinancialPort
 * 2. Map GoInvoice → InvoiceData domain entity
 * 3. Generate PDF via DocumentGeneratorPort (ReactPDFAdapter)
 * 4. Return PDF buffer with metadata
 *
 * Performance target: <300ms total (100ms fetch + 200ms generation)
 *
 * Error handling:
 * - NotFoundError: Invoice doesn't exist in Go backend
 * - NetworkError: Go backend communication failure
 * - DocumentGenerationError: PDF generation failure
 *
 * Dependencies:
 * - GoFinancialPort: Fetches invoice data from Go ERP
 * - DocumentGeneratorPort: Generates PDF from domain entity
 */
export const generateInvoicePdf = (command: GenerateInvoicePdfCommand) =>
  Effect.gen(function* (_) {
    // Fetch invoice from Go backend
    const goFinancial = yield* _(GoFinancialPort);
    const goInvoice = yield* _(goFinancial.getInvoice(command.invoiceId));

    // Map Go invoice to domain entity
    const invoiceData = mapGoInvoiceToInvoiceData(
      goInvoice,
      FUNERAL_HOME_ADDRESS,
      command.paymentUrl
    );

    // Generate PDF
    const docGenerator = yield* _(DocumentGeneratorPort);
    const pdfBuffer = yield* _(docGenerator.generateInvoice(invoiceData));

    // Return result with metadata
    return {
      invoiceId: goInvoice.id,
      invoiceNumber: goInvoice.invoiceNumber,
      pdfBuffer,
      sizeBytes: pdfBuffer.length,
    } satisfies GenerateInvoicePdfResult;
  });

/**
 * Generate Invoice PDF Use Case (with dependencies)
 *
 * Type signature shows all required dependencies via Effect Context:
 * - GoFinancialPortService: Fetch invoice from Go backend
 * - DocumentGeneratorPortService: Generate PDF
 *
 * Possible errors:
 * - NotFoundError: Invoice not found
 * - NetworkError: Backend communication failure
 * - DocumentGenerationError: PDF generation failure
 *
 * Note: Effect Context tags are accessed directly, not via .Tag property
 */
export type GenerateInvoicePdf = Effect.Effect<
  GenerateInvoicePdfResult,
  NotFoundError | NetworkError | DocumentGenerationError,
  typeof GoFinancialPort | typeof DocumentGeneratorPort
>;
