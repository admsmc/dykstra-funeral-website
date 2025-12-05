import { pdf } from '@react-pdf/renderer';
import { Effect } from 'effect';
import { DocumentGenerationError } from '@dykstra/application';
import type {
  DocumentGeneratorPortService,
  PurchaseOrderData,
  PaymentReceiptData,
} from '@dykstra/application';
import { InvoiceData } from '@dykstra/domain';
import { InvoiceTemplate } from './templates/business/invoice-template';
import { PurchaseOrderTemplate } from './templates/business/purchase-order-template';
import { PaymentReceiptTemplate } from './templates/business/payment-receipt-template';

/**
 * React-PDF Adapter
 *
 * Object-based implementation of DocumentGeneratorPort for business documents.
 * Uses React-PDF to generate PDFs from React components.
 *
 * Performance target: <200ms per document
 *
 * Architecture:
 * - Implements 3 of 5 DocumentGeneratorPort methods (memorial docs in Week 8)
 * - All methods return Effect<Buffer, DocumentGenerationError>
 * - Zero business logic - delegates to domain entities via templates
 * - Object-based pattern (NOT class-based) per Clean Architecture guidelines
 */
export const ReactPDFAdapter: Pick<
  DocumentGeneratorPortService,
  'generateInvoice' | 'generatePurchaseOrder' | 'generatePaymentReceipt'
> = {
  /**
   * Generate invoice PDF
   *
   * Backend operation:
   * 1. Creates React component with InvoiceData
   * 2. Renders to PDF via @react-pdf/renderer
   * 3. Converts blob to Buffer
   * 4. Returns Buffer for storage/delivery
   *
   * Smart features:
   * - Conditional payment link (electronic vs. printed)
   * - Dynamic status color
   * - Backend-calculated amounts from InvoiceData.amounts
   *
   * @param data - Invoice domain entity with pre-calculated amounts
   * @returns Effect yielding PDF Buffer or DocumentGenerationError
   */
  generateInvoice: (data: InvoiceData) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <InvoiceTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) =>
        new DocumentGenerationError({
          message: 'Invoice PDF generation failed',
          cause: error,
        }),
    }),

  /**
   * Generate purchase order PDF
   *
   * Backend operation:
   * 1. Creates React component with PurchaseOrderData
   * 2. Renders to PDF via @react-pdf/renderer
   * 3. Converts blob to Buffer
   * 4. Returns Buffer for storage/delivery
   *
   * Note: Template is skeleton in Week 4, full implementation in Week 5
   *
   * @param data - Purchase order data
   * @returns Effect yielding PDF Buffer or DocumentGenerationError
   */
  generatePurchaseOrder: (data: PurchaseOrderData) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <PurchaseOrderTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) =>
        new DocumentGenerationError({
          message: 'Purchase order PDF generation failed',
          cause: error,
        }),
    }),

  /**
   * Generate payment receipt PDF
   *
   * Backend operation:
   * 1. Creates React component with PaymentReceiptData
   * 2. Renders to PDF via @react-pdf/renderer
   * 3. Converts blob to Buffer
   * 4. Returns Buffer for customer delivery
   *
   * @param data - Payment receipt data (customer-facing)
   * @returns Effect yielding PDF Buffer or DocumentGenerationError
   */
  generatePaymentReceipt: (data: PaymentReceiptData) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <PaymentReceiptTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) =>
        new DocumentGenerationError({
          message: 'Payment receipt PDF generation failed',
          cause: error,
        }),
    }),
};
