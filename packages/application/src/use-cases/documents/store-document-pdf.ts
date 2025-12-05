import { Effect } from 'effect';
import { StoragePort } from '../../ports/storage-port';

/**
 * Stored document result
 */
export interface StoredDocumentResult {
  readonly documentId: string;
  readonly documentNumber: string;
  readonly url: string;
  readonly storageKey: string;
  readonly sizeBytes: number;
}

/**
 * Store Document PDF Use Case
 *
 * Generic helper that wraps any document generation use case with storage.
 * 
 * Data flow:
 * 1. Generate PDF via provided generator function
 * 2. Upload PDF to storage (S3/Vercel Blob)
 * 3. Return URL and metadata
 *
 * Performance target: <500ms total (300ms generation + 200ms upload)
 *
 * Error handling:
 * - NotFoundError: Source document doesn't exist
 * - NetworkError: Go backend communication failure
 * - DocumentGenerationError: PDF generation failure
 * - StorageError: Upload failure
 *
 * Dependencies:
 * - StoragePort: Upload PDF to cloud storage
 * - Generator dependencies (passed through)
 */
export const storeDocumentPdf = <E, R>(
  generator: Effect.Effect<
    { pdfBuffer: Buffer; documentId: string; documentNumber: string },
    E,
    R
  >,
  folder: string,
  filenamePrefix: string
) =>
  Effect.gen(function* (_) {
    // Generate PDF
    const result = yield* _(generator);

    // Upload to storage
    const storage = yield* _(StoragePort);
    const filename = `${filenamePrefix}-${result.documentNumber}.pdf`;
    
    const uploadResult = yield* _(
      storage.upload({
        data: result.pdfBuffer,
        name: filename,
        folder,
        mimeType: 'application/pdf',
      })
    );

    // Return result with storage metadata
    return {
      documentId: result.documentId,
      documentNumber: result.documentNumber,
      url: uploadResult.url,
      storageKey: uploadResult.key,
      sizeBytes: result.pdfBuffer.length,
    } satisfies StoredDocumentResult;
  });

/**
 * Helper: Store invoice PDF
 * 
 * Generates invoice PDF and uploads to storage under "invoices/" folder
 */
export const storeInvoicePdf = (invoiceId: string, paymentUrl?: string) =>
  Effect.gen(function* (_) {
    const { generateInvoicePdf } = yield* _(
      Effect.promise(() => import('./generate-invoice-pdf'))
    );
    
    const generator = generateInvoicePdf({ invoiceId, paymentUrl }).pipe(
      Effect.map(result => ({
        pdfBuffer: result.pdfBuffer,
        documentId: result.invoiceId,
        documentNumber: result.invoiceNumber,
      }))
    );

    return yield* _(storeDocumentPdf(generator, 'invoices', 'invoice'));
  });

/**
 * Helper: Store purchase order PDF
 * 
 * Generates PO PDF and uploads to storage under "purchase-orders/" folder
 */
export const storePurchaseOrderPdf = (poId: string) =>
  Effect.gen(function* (_) {
    const { generatePurchaseOrderPdf } = yield* _(
      Effect.promise(() => import('./generate-purchase-order-pdf'))
    );
    
    const generator = generatePurchaseOrderPdf({ poId }).pipe(
      Effect.map(result => ({
        pdfBuffer: result.pdfBuffer,
        documentId: result.poId,
        documentNumber: result.poNumber,
      }))
    );

    return yield* _(storeDocumentPdf(generator, 'purchase-orders', 'po'));
  });

/**
 * Helper: Store payment receipt PDF
 * 
 * Generates payment receipt PDF and uploads to storage under "payment-receipts/" folder
 */
export const storePaymentReceiptPdf = (
  invoiceId: string,
  paymentData: {
    paymentId: string;
    paymentNumber: string;
    paymentDate: Date;
    paymentMethod: 'cash' | 'check' | 'credit_card' | 'ach' | 'wire';
    amount: number;
    referenceNumber?: string;
  }
) =>
  Effect.gen(function* (_) {
    const { generatePaymentReceiptPdf } = yield* _(
      Effect.promise(() => import('./generate-payment-receipt-pdf'))
    );
    
    const generator = generatePaymentReceiptPdf({ invoiceId, paymentData }).pipe(
      Effect.map(result => ({
        pdfBuffer: result.pdfBuffer,
        documentId: result.paymentId,
        documentNumber: result.receiptNumber,
      }))
    );

    return yield* _(storeDocumentPdf(generator, 'payment-receipts', 'receipt'));
  });

