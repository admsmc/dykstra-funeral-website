import { Effect } from 'effect';
import type { DocumentGenerationError } from '../../ports/document-generator-port';
import { DocumentGeneratorPort } from '../../ports/document-generator-port';
import { GoProcurementPort } from '../../ports/go-procurement-port';
import type { NotFoundError, NetworkError } from '../../ports/go-procurement-port';
import { mapGoPurchaseOrderToData } from '../../mappers/go-to-purchase-order-data-mapper';

/**
 * Command to generate purchase order PDF
 */
export interface GeneratePurchaseOrderPdfCommand {
  readonly poId: string;
}

/**
 * Result of purchase order PDF generation
 */
export interface GeneratePurchaseOrderPdfResult {
  readonly poId: string;
  readonly poNumber: string;
  readonly pdfBuffer: Buffer;
  readonly sizeBytes: number;
}

/**
 * Generate Purchase Order PDF Use Case
 *
 * Data flow:
 * 1. Fetch GoPurchaseOrder from Go ERP backend via GoProcurementPort
 * 2. Map GoPurchaseOrder → PurchaseOrderData
 * 3. Generate PDF via DocumentGeneratorPort (ReactPDFAdapter)
 * 4. Return PDF buffer with metadata
 *
 * Performance target: <300ms total (100ms fetch + 200ms generation)
 *
 * Error handling:
 * - NotFoundError: PO doesn't exist in Go backend
 * - NetworkError: Go backend communication failure
 * - DocumentGenerationError: PDF generation failure
 *
 * Dependencies:
 * - GoProcurementPort: Fetches PO data from Go ERP
 * - DocumentGeneratorPort: Generates PDF from mapped data
 */
export const generatePurchaseOrderPdf = (command: GeneratePurchaseOrderPdfCommand) =>
  Effect.gen(function* (_) {
    // Fetch PO from Go backend
    const goProcurement = yield* _(GoProcurementPort);
    const goPO = yield* _(goProcurement.getPurchaseOrder(command.poId));

    // Map Go PO to document data
    const poData = mapGoPurchaseOrderToData(goPO);

    // Generate PDF
    const docGenerator = yield* _(DocumentGeneratorPort);
    const pdfBuffer = yield* _(docGenerator.generatePurchaseOrder(poData));

    // Return result with metadata
    return {
      poId: goPO.id,
      poNumber: goPO.poNumber,
      pdfBuffer,
      sizeBytes: pdfBuffer.length,
    } satisfies GeneratePurchaseOrderPdfResult;
  });

/**
 * Generate Purchase Order PDF Use Case (with dependencies)
 *
 * Type signature shows all required dependencies via Effect Context:
 * - GoProcurementPortService: Fetch PO from Go backend
 * - DocumentGeneratorPortService: Generate PDF
 *
 * Possible errors:
 * - NotFoundError: PO not found
 * - NetworkError: Backend communication failure
 * - DocumentGenerationError: PDF generation failure
 */
export type GeneratePurchaseOrderPdf = Effect.Effect<
  GeneratePurchaseOrderPdfResult,
  NotFoundError | NetworkError | DocumentGenerationError,
  typeof GoProcurementPort | typeof DocumentGeneratorPort
>;
