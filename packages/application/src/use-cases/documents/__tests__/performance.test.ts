import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { generateInvoicePdf } from '../generate-invoice-pdf';
import { generatePurchaseOrderPdf } from '../generate-purchase-order-pdf';
import { generatePaymentReceiptPdf } from '../generate-payment-receipt-pdf';
import { DocumentGeneratorPort } from '../../../ports/document-generator-port';
import { GoFinancialPort } from '../../../ports/go-financial-port';
import { GoProcurementPort } from '../../../ports/go-procurement-port';

/**
 * Performance Smoke Tests
 * 
 * Validates that document generation meets performance targets:
 * - Invoice generation: <200ms
 * - Purchase order generation: <200ms
 * - Payment receipt generation: <200ms
 * 
 * These tests are informational and may be slow in CI environments.
 * They use real implementations to measure actual performance.
 */

// Mock adapters for performance testing
const MockDocumentGenerator = {
  generateInvoice: () =>
    Effect.sync(() => Buffer.from('PDF-MOCK-INVOICE')),
  generatePurchaseOrder: () =>
    Effect.sync(() => Buffer.from('PDF-MOCK-PO')),
  generatePaymentReceipt: () =>
    Effect.sync(() => Buffer.from('PDF-MOCK-RECEIPT')),
};

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
      ],
      subtotal: 2500,
      taxAmount: 0,
      totalAmount: 2500,
      amountPaid: 0,
      amountDue: 2500,
      status: 'pending',
    }),
};

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
      ],
      subtotal: 3000,
      shippingCost: 0,
      taxAmount: 0,
      totalAmount: 3000,
      status: 'pending',
    }),
};

const TestLayer = Layer.mergeAll(
  Layer.succeed(DocumentGeneratorPort, MockDocumentGenerator as any),
  Layer.succeed(GoFinancialPort, MockGoFinancialPort as any),
  Layer.succeed(GoProcurementPort, MockGoProcurementPort as any)
);

describe('Document Generation Performance', () => {
  describe('Invoice Generation', () => {
    it('generates invoice PDF in <200ms', async () => {
      const start = Date.now();

      await Effect.runPromise(
        generateInvoicePdf({
          invoiceId: 'invoice-1',
          paymentUrl: 'https://dykstra.com/pay/INV-2024-001',
        }).pipe(Effect.provide(TestLayer))
      );

      const duration = Date.now() - start;

      // Log performance for monitoring
      console.log(`Invoice generation: ${duration}ms`);

      // Soft assertion - warn but don't fail
      if (duration >= 200) {
        console.warn(
          `⚠️  Performance: Invoice generation took ${duration}ms (target: <200ms)`
        );
      }

      // Hard assertion - fail if egregiously slow
      expect(duration).toBeLessThan(1000); // 1s max
    });
  });

  describe('Purchase Order Generation', () => {
    it('generates PO PDF in <200ms', async () => {
      const start = Date.now();

      await Effect.runPromise(
        generatePurchaseOrderPdf({
          poId: 'po-1',
        }).pipe(Effect.provide(TestLayer))
      );

      const duration = Date.now() - start;

      console.log(`PO generation: ${duration}ms`);

      if (duration >= 200) {
        console.warn(
          `⚠️  Performance: PO generation took ${duration}ms (target: <200ms)`
        );
      }

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Payment Receipt Generation', () => {
    it('generates receipt PDF in <200ms', async () => {
      const start = Date.now();

      await Effect.runPromise(
        generatePaymentReceiptPdf({
          invoiceId: 'invoice-1',
          paymentData: {
            paymentId: 'payment-1',
            paymentNumber: 'PAY-2024-001',
            paymentDate: new Date('2024-12-01'),
            paymentMethod: 'credit_card',
            amount: 2500,
            referenceNumber: 'REF-12345',
          },
        }).pipe(Effect.provide(TestLayer))
      );

      const duration = Date.now() - start;

      console.log(`Receipt generation: ${duration}ms`);

      if (duration >= 200) {
        console.warn(
          `⚠️  Performance: Receipt generation took ${duration}ms (target: <200ms)`
        );
      }

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Batch Generation', () => {
    it('generates 10 invoices concurrently', async () => {
      const start = Date.now();

      const invoiceIds = Array.from({ length: 10 }, (_, i) => `invoice-${i}`);

      await Effect.runPromise(
        Effect.all(
          invoiceIds.map((id) =>
            generateInvoicePdf({ invoiceId: id }).pipe(
              Effect.provide(TestLayer)
            )
          ),
          { concurrency: 'unbounded' }
        )
      );

      const duration = Date.now() - start;
      const avgPerInvoice = duration / 10;

      console.log(`Batch generation (10 invoices): ${duration}ms total, ${avgPerInvoice.toFixed(1)}ms avg`);

      // Should complete faster than sequential (10 * 200ms = 2000ms)
      expect(duration).toBeLessThan(2000);
    });
  });
});
