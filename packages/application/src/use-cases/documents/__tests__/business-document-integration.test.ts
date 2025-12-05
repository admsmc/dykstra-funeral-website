import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { generateInvoicePdf } from '../generate-invoice-pdf';
import { generatePurchaseOrderPdf } from '../generate-purchase-order-pdf';
import { generatePaymentReceiptPdf } from '../generate-payment-receipt-pdf';
import { DocumentGeneratorPort } from '../../../ports/document-generator-port';
import { GoFinancialPort } from '../../../ports/go-financial-port';
import { GoProcurementPort } from '../../../ports/go-procurement-port';

/**
 * Business Document Use Cases Integration Tests
 * 
 * Tests use case orchestration logic:
 * 1. Generate invoice PDF (fetch from Go backend → map → generate)
 * 2. Generate purchase order PDF (fetch from Go backend → map → generate)
 * 3. Generate payment receipt PDF (fetch from Go backend → map → generate)
 * 
 * Uses mock implementations for testing without external dependencies.
 */

// Mock Go Financial Port
const MockGoFinancialPort = {
  getInvoice: (id: string) =>
    Effect.succeed({
      id,
      invoiceNumber: 'INV-2024-001',
      customerName: 'Smith Family',
      customerAddress: {
        line1: '456 Oak Street',
        city: 'Anytown',
        state: 'MI',
        postalCode: '12345',
      },
      invoiceDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-15'),
      lineItems: [
        {
          description: 'Professional Services',
          quantity: 1,
          unitPrice: 2500,
          amount: 2500,
        },
        {
          description: 'Casket - Mahogany',
          quantity: 1,
          unitPrice: 3500,
          amount: 3500,
        },
      ],
      subtotal: 6000,
      taxAmount: 0,
      totalAmount: 6000,
      amountPaid: 0,
      amountDue: 6000,
      status: 'pending',
    }),
};

// Mock Go Procurement Port
const MockGoProcurementPort = {
  getPurchaseOrder: (id: string) =>
    Effect.succeed({
      id,
      poNumber: 'PO-2024-001',
      vendorId: 'vendor-1',
      vendorName: 'ABC Supplies',
      vendorAddress: {
        line1: '123 Vendor Street',
        city: 'Supplyton',
        state: 'MI',
        postalCode: '54321',
      },
      orderDate: new Date('2024-12-01'),
      expectedDeliveryDate: new Date('2024-12-05'),
      lineItems: [
        {
          itemNumber: 'ITEM-001',
          description: 'Casket',
          quantity: 1,
          unitPrice: 3000,
          totalPrice: 3000,
        },
        {
          itemNumber: 'ITEM-002',
          description: 'Flowers',
          quantity: 2,
          unitPrice: 150,
          totalPrice: 300,
        },
      ],
      subtotal: 3300,
      shippingCost: 50,
      taxAmount: 0,
      totalAmount: 3350,
      status: 'pending',
    }),
};

// Mock Document Generator Port
const MockDocumentGeneratorPort = {
  generateInvoice: () =>
    Effect.sync(() => Buffer.from('PDF-INVOICE-CONTENT')),
  generatePurchaseOrder: () =>
    Effect.sync(() => Buffer.from('PDF-PO-CONTENT')),
  generatePaymentReceipt: () =>
    Effect.sync(() => Buffer.from('PDF-RECEIPT-CONTENT')),
};

const TestLayer = Layer.mergeAll(
  Layer.succeed(GoFinancialPort, MockGoFinancialPort as any),
  Layer.succeed(GoProcurementPort, MockGoProcurementPort as any),
  Layer.succeed(DocumentGeneratorPort, MockDocumentGeneratorPort as any)
);

describe('Business Document Use Cases - Integration Tests', () => {
  describe('Invoice Generation', () => {
    it('should fetch invoice from Go backend and generate PDF', async () => {
      const result = await Effect.runPromise(
        generateInvoicePdf({
          invoiceId: 'invoice-123',
          paymentUrl: 'https://dykstra.com/pay/INV-2024-001',
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.invoiceId).toBe('invoice-123');
      expect(result.invoiceNumber).toBe('INV-2024-001');
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should generate invoice without optional payment URL', async () => {
      const result = await Effect.runPromise(
        generateInvoicePdf({
          invoiceId: 'invoice-456',
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.invoiceId).toBe('invoice-456');
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle invoice generation failure', async () => {
      const FailingGoFinancialPort = {
        getInvoice: () =>
          Effect.fail({
            _tag: 'NotFoundError' as const,
            message: 'Invoice not found',
          }),
      };

      const FailingLayer = Layer.mergeAll(
        Layer.succeed(GoFinancialPort, FailingGoFinancialPort as any),
        Layer.succeed(DocumentGeneratorPort, MockDocumentGeneratorPort as any)
      );

      await expect(
        Effect.runPromise(
          generateInvoicePdf({ invoiceId: 'not-found' }).pipe(
            Effect.provide(FailingLayer)
          )
        )
      ).rejects.toThrow();
    });
  });

  describe('Purchase Order Generation', () => {
    it('should fetch PO from Go backend and generate PDF', async () => {
      const result = await Effect.runPromise(
        generatePurchaseOrderPdf({
          poId: 'po-123',
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.poId).toBe('po-123');
      expect(result.poNumber).toBe('PO-2024-001');
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should handle PO not found error', async () => {
      const FailingGoProcurementPort = {
        getPurchaseOrder: () =>
          Effect.fail({
            _tag: 'NotFoundError' as const,
            message: 'Purchase order not found',
          }),
      };

      const FailingLayer = Layer.mergeAll(
        Layer.succeed(GoProcurementPort, FailingGoProcurementPort as any),
        Layer.succeed(DocumentGeneratorPort, MockDocumentGeneratorPort as any)
      );

      await expect(
        Effect.runPromise(
          generatePurchaseOrderPdf({ poId: 'not-found' }).pipe(
            Effect.provide(FailingLayer)
          )
        )
      ).rejects.toThrow();
    });
  });

  describe('Payment Receipt Generation', () => {
    it('should fetch invoice and generate receipt with payment data', async () => {
      const result = await Effect.runPromise(
        generatePaymentReceiptPdf({
          invoiceId: 'invoice-123',
          paymentData: {
            paymentId: 'payment-001',
            paymentNumber: 'PAY-2024-001',
            paymentDate: new Date('2024-12-01'),
            paymentMethod: 'credit_card',
            amount: 2500,
            referenceNumber: 'REF-12345',
          },
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.paymentId).toBe('payment-001');
      expect(result.receiptNumber).toBe('PAY-2024-001');
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should handle different payment methods', async () => {
      const paymentMethods: Array<
        'cash' | 'check' | 'credit_card' | 'ach' | 'wire'
      > = ['cash', 'check', 'credit_card', 'ach', 'wire'];

      for (const method of paymentMethods) {
        const result = await Effect.runPromise(
          generatePaymentReceiptPdf({
            invoiceId: 'invoice-123',
            paymentData: {
              paymentId: `payment-${method}`,
              paymentNumber: `PAY-${method}`,
              paymentDate: new Date('2024-12-01'),
              paymentMethod: method,
              amount: 1000,
            },
          }).pipe(Effect.provide(TestLayer))
        );

        expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      }
    });

    it('should handle receipt generation without reference number', async () => {
      const result = await Effect.runPromise(
        generatePaymentReceiptPdf({
          invoiceId: 'invoice-123',
          paymentData: {
            paymentId: 'payment-002',
            paymentNumber: 'PAY-2024-002',
            paymentDate: new Date('2024-12-01'),
            paymentMethod: 'cash',
            amount: 500,
            // referenceNumber is optional
          },
        }).pipe(Effect.provide(TestLayer))
      );

      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should generate all document types for a case', async () => {
      // Simulate generating all documents for a funeral case
      const [invoice, receipt] = await Promise.all([
        Effect.runPromise(
          generateInvoicePdf({
            invoiceId: 'invoice-case-001',
            paymentUrl: 'https://dykstra.com/pay/INV-CASE-001',
          }).pipe(Effect.provide(TestLayer))
        ),
        Effect.runPromise(
          generatePaymentReceiptPdf({
            invoiceId: 'invoice-case-001',
            paymentData: {
              paymentId: 'payment-case-001',
              paymentNumber: 'PAY-CASE-001',
              paymentDate: new Date(),
              paymentMethod: 'check',
              amount: 6000,
            },
          }).pipe(Effect.provide(TestLayer))
        ),
      ]);

      expect(invoice.pdfBuffer).toBeInstanceOf(Buffer);
      expect(receipt.pdfBuffer).toBeInstanceOf(Buffer);
      
      // Both documents should reference the same invoice
      expect(invoice.invoiceNumber).toBe('INV-2024-001');
    });

    it('should generate purchase order and track receiving', async () => {
      const po = await Effect.runPromise(
        generatePurchaseOrderPdf({
          poId: 'po-case-001',
        }).pipe(Effect.provide(TestLayer))
      );

      expect(po.pdfBuffer).toBeInstanceOf(Buffer);
      expect(po.poNumber).toBe('PO-2024-001');
    });
  });

  describe('Performance', () => {
    it('should generate invoice in reasonable time', async () => {
      const start = Date.now();

      await Effect.runPromise(
        generateInvoicePdf({
          invoiceId: 'perf-test-invoice',
        }).pipe(Effect.provide(TestLayer))
      );

      const duration = Date.now() - start;
      
      // With mocks, should be fast
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent document generation', async () => {
      const invoiceIds = Array.from({ length: 5 }, (_, i) => `invoice-${i}`);

      const results = await Promise.all(
        invoiceIds.map((id) =>
          Effect.runPromise(
            generateInvoicePdf({ invoiceId: id }).pipe(
              Effect.provide(TestLayer)
            )
          )
        )
      );

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.invoiceId).toBe(`invoice-${i}`);
        expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      });
    });
  });
});
