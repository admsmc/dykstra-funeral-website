import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { Effect } from 'effect';
import {
  generateInvoicePdf,
  generatePurchaseOrderPdf,
  generatePaymentReceiptPdf,
  storeInvoicePdf,
  storePurchaseOrderPdf,
  storePaymentReceiptPdf,
  DocumentGeneratorPort,
  generateServiceProgram,
  generatePrayerCard,
  TemplateRepositoryPort,
  TemplateRendererPort,
  PdfGeneratorPort,
} from '@dykstra/application';
import {
  ReactPDFAdapter,
  PrismaTemplateRepository,
  HandlebarsAdapter,
  PuppeteerAdapter,
} from '@dykstra/infrastructure';
import { Layer } from 'effect';

/**
 * Document Router
 * 
 * Handles PDF generation for business documents (invoices, POs, receipts)
 * 
 * Endpoints:
 * - generateInvoice: Generate invoice PDF and return buffer
 * - storeInvoice: Generate invoice PDF and store in S3
 * - generatePurchaseOrder: Generate PO PDF and return buffer
 * - storePurchaseOrder: Generate PO PDF and store in S3
 * - generatePaymentReceipt: Generate payment receipt PDF and return buffer
 * - storePaymentReceipt: Generate payment receipt PDF and store in S3
 */
export const documentsRouter = router({
  /**
   * Generate Invoice PDF
   * 
   * Returns PDF buffer for client-side download/display
   * Performance target: <300ms
   */
  generateInvoice: publicProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        paymentUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Create layer with ReactPDFAdapter for DocumentGeneratorPort
      const DocumentGeneratorLayer = Layer.succeed(
        DocumentGeneratorPort,
        ReactPDFAdapter as any // Partial implementation OK - only needs invoice/PO/receipt methods
      );

      // Run use case with dependencies
      const result = await Effect.runPromise(
        generateInvoicePdf(input).pipe(
          Effect.provide(DocumentGeneratorLayer),
          Effect.provide(ctx.infrastructure)
        )
      );

      // Return base64-encoded PDF for JSON transport
      return {
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        pdfBase64: result.pdfBuffer.toString('base64'),
        sizeBytes: result.sizeBytes,
      };
    }),

  /**
   * Store Invoice PDF
   * 
   * Generates and uploads PDF to S3, returns URL
   * Performance target: <500ms
   */
  storeInvoice: publicProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        paymentUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const DocumentGeneratorLayer = Layer.succeed(
        DocumentGeneratorPort,
        ReactPDFAdapter as any
      );

      const result = await Effect.runPromise(
        storeInvoicePdf(input.invoiceId, input.paymentUrl).pipe(
          Effect.provide(DocumentGeneratorLayer),
          Effect.provide(ctx.infrastructure)
        )
      );

      return result;
    }),

  /**
   * Generate Purchase Order PDF
   * 
   * Returns PDF buffer for client-side download/display
   * Performance target: <300ms
   */
  generatePurchaseOrder: publicProcedure
    .input(z.object({ poId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const DocumentGeneratorLayer = Layer.succeed(
        DocumentGeneratorPort,
        ReactPDFAdapter as any
      );

      const result = await Effect.runPromise(
        generatePurchaseOrderPdf(input).pipe(
          Effect.provide(DocumentGeneratorLayer),
          Effect.provide(ctx.infrastructure)
        )
      );

      return {
        poId: result.poId,
        poNumber: result.poNumber,
        pdfBase64: result.pdfBuffer.toString('base64'),
        sizeBytes: result.sizeBytes,
      };
    }),

  /**
   * Store Purchase Order PDF
   * 
   * Generates and uploads PDF to S3, returns URL
   * Performance target: <500ms
   */
  storePurchaseOrder: publicProcedure
    .input(z.object({ poId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const DocumentGeneratorLayer = Layer.succeed(
        DocumentGeneratorPort,
        ReactPDFAdapter as any
      );

      const result = await Effect.runPromise(
        storePurchaseOrderPdf(input.poId).pipe(
          Effect.provide(DocumentGeneratorLayer),
          Effect.provide(ctx.infrastructure)
        )
      );

      return result;
    }),

  /**
   * Generate Payment Receipt PDF
   * 
   * Returns customer-facing payment receipt PDF buffer
   * Performance target: <300ms
   * 
   * NOTE: Payment data must be provided explicitly since GoFinancialPort
   * doesn't have a getPayment(id) method. Typically called immediately
   * after recording a payment in the Go backend.
   */
  generatePaymentReceipt: publicProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        paymentData: z.object({
          paymentId: z.string(),
          paymentNumber: z.string(),
          paymentDate: z.coerce.date(),
          paymentMethod: z.enum(['cash', 'check', 'credit_card', 'ach', 'wire']),
          amount: z.number(),
          referenceNumber: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const DocumentGeneratorLayer = Layer.succeed(
        DocumentGeneratorPort,
        ReactPDFAdapter as any
      );

      const result = await Effect.runPromise(
        generatePaymentReceiptPdf(input).pipe(
          Effect.provide(DocumentGeneratorLayer),
          Effect.provide(ctx.infrastructure)
        )
      );

      return {
        paymentId: result.paymentId,
        receiptNumber: result.receiptNumber,
        pdfBase64: result.pdfBuffer.toString('base64'),
        sizeBytes: result.sizeBytes,
      };
    }),

  /**
   * Store Payment Receipt PDF
   * 
   * Generates and uploads customer payment receipt to S3, returns URL
   * Performance target: <500ms
   * 
   * NOTE: Payment data must be provided explicitly since GoFinancialPort
   * doesn't have a getPayment(id) method. Typically called immediately
   * after recording a payment in the Go backend.
   */
  storePaymentReceipt: publicProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        paymentData: z.object({
          paymentId: z.string(),
          paymentNumber: z.string(),
          paymentDate: z.coerce.date(),
          paymentMethod: z.enum(['cash', 'check', 'credit_card', 'ach', 'wire']),
          amount: z.number(),
          referenceNumber: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const DocumentGeneratorLayer = Layer.succeed(
        DocumentGeneratorPort,
        ReactPDFAdapter as any
      );

      const result = await Effect.runPromise(
        storePaymentReceiptPdf(input.invoiceId, input.paymentData).pipe(
          Effect.provide(DocumentGeneratorLayer),
          Effect.provide(ctx.infrastructure)
        )
      );

      return result;
    }),

  /**
   * Generate Service Program PDF
   * 
   * Returns service program PDF buffer
   * Performance target: <1s (includes template fetch, Handlebars, Puppeteer)
   */
  generateServiceProgram: publicProcedure
    .input(
      z.object({
        templateBusinessKey: z.string(),
        data: z.object({
          deceasedName: z.string(),
          birthDate: z.string(),
          deathDate: z.string(),
          photoUrl: z.string().url().optional(),
          orderOfService: z.array(
            z.object({
              item: z.string(),
              officiant: z.string().optional(),
            })
          ),
          obituary: z.string().optional(),
          pallbearers: z.array(z.string()).optional(),
          funeralHomeName: z.string(),
          funeralHomeAddress: z.string(),
          funeralHomePhone: z.string(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Create layers for memorial generation
      const MemorialLayers = Layer.mergeAll(
        Layer.succeed(TemplateRepositoryPort, PrismaTemplateRepository),
        Layer.succeed(TemplateRendererPort, HandlebarsAdapter),
        Layer.succeed(PdfGeneratorPort, PuppeteerAdapter)
      );

      const result = await Effect.runPromise(
        generateServiceProgram(input).pipe(
          Effect.provide(MemorialLayers),
          Effect.provide(ctx.infrastructure)
        )
      );

      return {
        templateId: result.templateId,
        templateName: result.templateName,
        pdfBase64: result.pdfBuffer.toString('base64'),
        sizeBytes: result.sizeBytes,
      };
    }),

  /**
   * Generate Prayer Card PDF
   * 
   * Returns 4x6 prayer card PDF buffer
   * Performance target: <800ms (includes template fetch, Handlebars, Puppeteer)
   */
  generatePrayerCard: publicProcedure
    .input(
      z.object({
        templateBusinessKey: z.string(),
        data: z.object({
          deceasedName: z.string(),
          birthDate: z.string(),
          deathDate: z.string(),
          photoUrl: z.string().url().optional(),
          prayerTitle: z.string(),
          prayerText: z.string(),
          funeralHomeName: z.string(),
          funeralHomePhone: z.string(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Create layers for memorial generation
      const MemorialLayers = Layer.mergeAll(
        Layer.succeed(TemplateRepositoryPort, PrismaTemplateRepository),
        Layer.succeed(TemplateRendererPort, HandlebarsAdapter),
        Layer.succeed(PdfGeneratorPort, PuppeteerAdapter)
      );

      const result = await Effect.runPromise(
        generatePrayerCard(input).pipe(
          Effect.provide(MemorialLayers),
          Effect.provide(ctx.infrastructure)
        )
      );

      return {
        templateId: result.templateId,
        templateName: result.templateName,
        pdfBase64: result.pdfBuffer.toString('base64'),
        sizeBytes: result.sizeBytes,
      };
    }),
});
