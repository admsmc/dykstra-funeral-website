import { type Effect, Context, Data } from 'effect';
import type { InvoiceData, ServiceProgramData } from '@dykstra/domain';

/**
 * Document Generator Port
 * 
 * Abstraction for generating business documents (React-PDF) and memorial materials (Puppeteer).
 * Implementations must handle PDF generation with appropriate quality and performance targets.
 */

/**
 * Error class for document generation failures
 */
export class DocumentGenerationError extends Data.TaggedError('DocumentGenerationError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Result type for memorial document generation
 * Contains URLs to generated files and metadata
 */
export interface MemorialDocument {
  readonly documentId: string;
  readonly pdfUrl: string;         // URL to final PDF
  readonly printFileUrl: string;   // URL to 300 DPI print-ready file
  readonly previewUrl: string;     // URL to thumbnail/preview image
}

/**
 * Purchase order data structure
 */
export interface PurchaseOrderData {
  readonly poNumber: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly orderDate: Date;
  readonly deliveryDate: Date;
  readonly lineItems: ReadonlyArray<{
    readonly description: string;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly totalPrice: number;
    readonly glAccountId: string;
  }>;
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
  readonly notes?: string;
}

/**
 * Payment Receipt data structure
 * Customer-facing proof of payment document
 */
export interface PaymentReceiptData {
  readonly receiptNumber: string;
  readonly paymentId: string;
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly customerName: string;
  readonly paymentDate: Date;
  readonly paymentMethod: 'cash' | 'check' | 'credit_card' | 'ach' | 'wire';
  readonly amount: number;
  readonly referenceNumber?: string; // Check number, transaction ID, etc.
  readonly appliedToInvoices: ReadonlyArray<{
    readonly invoiceNumber: string;
    readonly amountApplied: number;
  }>;
}

/**
 * Prayer card data structure
 */
export interface PrayerCardData {
  readonly caseId: string;
  readonly decedentName: string;
  readonly birthDate: Date;
  readonly deathDate: Date;
  readonly photoUrl?: string;
  readonly prayerText: string;
  readonly format: '2.5x4.25' | '3x5';
}

/**
 * Document Generator Port Service Interface
 * 
 * Defines methods for generating various document types.
 * Performance targets:
 * - Business documents (React-PDF): <200ms
 * - Memorial materials (Puppeteer): <2s
 */
export interface DocumentGeneratorPortService {
  /**
   * Generate invoice PDF
   * 
   * Backend operation:
   * 1. Receives InvoiceData with pre-calculated amounts from Go ERP
   * 2. Applies React-PDF template
   * 3. Smart rendering (electronic vs. printed context)
   * 4. Returns PDF buffer
   * 
   * Performance target: <200ms
   */
  readonly generateInvoice: (
    data: InvoiceData
  ) => Effect.Effect<Buffer, DocumentGenerationError>;

  /**
   * Generate purchase order PDF
   * 
   * Backend operation:
   * 1. Receives PO data from procurement system
   * 2. Applies React-PDF template
   * 3. Returns PDF buffer
   * 
   * Performance target: <200ms
   */
  readonly generatePurchaseOrder: (
    data: PurchaseOrderData
  ) => Effect.Effect<Buffer, DocumentGenerationError>;

  /**
   * Generate payment receipt PDF
   * 
   * Backend operation:
   * 1. Receives payment data from Go Financial system
   * 2. Applies React-PDF template with Dykstra branding
   * 3. Returns PDF buffer for customer
   * 
   * Performance target: <200ms
   */
  readonly generatePaymentReceipt: (
    data: PaymentReceiptData
  ) => Effect.Effect<Buffer, DocumentGenerationError>;

  /**
   * Generate service program PDF
   * 
   * Backend operation:
   * 1. Receives ServiceProgramData with family/service details
   * 2. Applies Handlebars template to HTML
   * 3. Renders via Puppeteer (300 DPI)
   * 4. Uploads to storage
   * 5. Returns document metadata with URLs
   * 
   * Performance target: <2s
   */
  readonly generateServiceProgram: (
    data: ServiceProgramData
  ) => Effect.Effect<MemorialDocument, DocumentGenerationError>;

  /**
   * Generate prayer card PDF
   * 
   * Backend operation:
   * 1. Receives prayer card data
   * 2. Applies Handlebars template (small format)
   * 3. Renders via Puppeteer (300 DPI)
   * 4. Uploads to storage
   * 5. Returns document metadata with URLs
   * 
   * Performance target: <2s
   */
  readonly generatePrayerCard: (
    data: PrayerCardData
  ) => Effect.Effect<MemorialDocument, DocumentGenerationError>;
}

/**
 * Document Generator Port Context Tag
 * 
 * Usage in use cases:
 * ```typescript
 * const docGenerator = yield* DocumentGeneratorPort;
 * const pdfBuffer = yield* docGenerator.generateInvoice(invoiceData);
 * ```
 */
export const DocumentGeneratorPort = Context.GenericTag<DocumentGeneratorPortService>(
  '@dykstra/DocumentGeneratorPort'
);
