import { describe, it, expect } from 'vitest';
import { mapGoInvoiceToInvoiceData } from '../go-to-invoice-data-mapper';
import type { GoInvoice } from '../../ports/go-financial-port';

describe('mapGoInvoiceToInvoiceData', () => {
  const mockBillFromAddress = {
    name: 'Dykstra Funeral Home',
    line1: '123 Main Street',
    city: 'Anytown',
    state: 'MI',
    postalCode: '12345',
  };

  const createMockGoInvoice = (overrides?: Partial<GoInvoice>): GoInvoice => ({
    id: 'inv-123',
    invoiceNumber: 'INV-2024-001',
    caseId: 'case-456',
    contractId: 'contract-789',
    customerId: 'cust-001',
    customerName: 'John Smith',
    invoiceDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    status: 'sent',
    lineItems: [
      {
        id: 'line-1',
        description: 'Professional Services',
        quantity: 1,
        unitPrice: 2500.0,
        totalPrice: 2500.0,
        glAccountId: 'gl-4000',
      },
    ],
    subtotal: 2500.0,
    taxAmount: 150.0,
    totalAmount: 2650.0,
    amountPaid: 0,
    amountDue: 2650.0,
    createdAt: new Date('2024-01-15'),
    ...overrides,
  });

  describe('Basic Mapping', () => {
    it('maps GoInvoice to InvoiceData with all required fields', () => {
      const goInvoice = createMockGoInvoice();
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);

      expect(result.metadata.id).toBe('inv-123');
      expect(result.metadata.invoiceNumber).toBe('INV-2024-001');
      expect(result.metadata.caseId).toBe('case-456');
      expect(result.metadata.contractId).toBe('contract-789');
      expect(result.metadata.customerId).toBe('cust-001');
      expect(result.metadata.customerName).toBe('John Smith');
      expect(result.metadata.status).toBe('sent');
    });

    it('maps billing parties correctly', () => {
      const goInvoice = createMockGoInvoice();
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);

      expect(result.parties.billFrom).toEqual(mockBillFromAddress);
      expect(result.parties.billTo.name).toBe('John Smith');
    });

    it('maps backend-calculated amounts without recalculation', () => {
      const goInvoice = createMockGoInvoice({
        subtotal: 5000.0,
        taxAmount: 300.0,
        totalAmount: 5300.0,
        amountPaid: 1000.0,
        amountDue: 4300.0,
      });

      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);

      expect(result.amounts.subtotal).toBe(5000.0);
      expect(result.amounts.taxAmount).toBe(300.0);
      expect(result.amounts.totalAmount).toBe(5300.0);
      expect(result.amounts.amountPaid).toBe(1000.0);
      expect(result.amounts.amountDue).toBe(4300.0);
    });

    it('maps line items with IDs preserved', () => {
      const goInvoice = createMockGoInvoice({
        lineItems: [
          {
            id: 'line-1',
            description: 'Casket',
            quantity: 1,
            unitPrice: 3000.0,
            totalPrice: 3000.0,
            glAccountId: 'gl-4100',
          },
          {
            id: 'line-2',
            description: 'Service Fee',
            quantity: 1,
            unitPrice: 500.0,
            totalPrice: 500.0,
            glAccountId: 'gl-4000',
          },
        ],
      });

      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);

      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[0]?.id).toBe('line-1');
      expect(result.lineItems[0]?.description).toBe('Casket');
      expect(result.lineItems[1]?.id).toBe('line-2');
      expect(result.lineItems[1]?.description).toBe('Service Fee');
    });
  });

  describe('Status Mapping', () => {
    it('maps draft status correctly', () => {
      const goInvoice = createMockGoInvoice({ status: 'draft' });
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);
      expect(result.metadata.status).toBe('draft');
    });

    it('maps sent status correctly', () => {
      const goInvoice = createMockGoInvoice({ status: 'sent' });
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);
      expect(result.metadata.status).toBe('sent');
    });

    it('maps partial status correctly', () => {
      const goInvoice = createMockGoInvoice({ status: 'partial' });
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);
      expect(result.metadata.status).toBe('partial');
    });

    it('maps paid status correctly', () => {
      const goInvoice = createMockGoInvoice({ status: 'paid' });
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);
      expect(result.metadata.status).toBe('paid');
    });

    it('maps overdue status correctly', () => {
      const goInvoice = createMockGoInvoice({ status: 'overdue' });
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);
      expect(result.metadata.status).toBe('overdue');
    });

    it('maps cancelled status correctly', () => {
      const goInvoice = createMockGoInvoice({ status: 'cancelled' });
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);
      expect(result.metadata.status).toBe('cancelled');
    });
  });

  describe('Payment URL', () => {
    it('includes payment URL when provided', () => {
      const goInvoice = createMockGoInvoice();
      const paymentUrl = 'https://pay.stripe.com/invoice/xyz';
      const result = mapGoInvoiceToInvoiceData(
        goInvoice,
        mockBillFromAddress,
        paymentUrl
      );

      expect(result.metadata.paymentUrl).toBe(paymentUrl);
    });

    it('omits payment URL when not provided', () => {
      const goInvoice = createMockGoInvoice();
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);

      expect(result.metadata.paymentUrl).toBeUndefined();
    });
  });

  describe('Date Handling', () => {
    it('preserves invoice and due dates from Go backend', () => {
      const invoiceDate = new Date('2024-03-01');
      const dueDate = new Date('2024-03-31');
      const goInvoice = createMockGoInvoice({ invoiceDate, dueDate });

      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);

      expect(result.metadata.invoiceDate).toEqual(invoiceDate);
      expect(result.metadata.dueDate).toEqual(dueDate);
    });

    it('preserves createdAt timestamp', () => {
      const createdAt = new Date('2024-01-15T10:30:00Z');
      const goInvoice = createMockGoInvoice({ createdAt });

      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);

      expect(result.metadata.createdAt).toEqual(createdAt);
    });
  });

  describe('Domain Entity Validation', () => {
    it('creates valid InvoiceData that passes domain validation', () => {
      const goInvoice = createMockGoInvoice();
      
      // Should not throw - domain entity validates on creation
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);
      
      expect(result).toBeDefined();
      expect(result.getSubtotal()).toBe(2500.0);
      expect(result.getTaxAmount()).toBe(150.0);
      expect(result.getTotalAmount()).toBe(2650.0);
    });

    it('throws when backend amounts are inconsistent (caught by domain validation)', () => {
      const goInvoice = createMockGoInvoice({
        subtotal: 1000.0,
        taxAmount: 60.0,
        totalAmount: 2000.0, // Wrong! Should be 1060.0
        amountPaid: 0,
        amountDue: 2000.0,
      });

      expect(() => {
        mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);
      }).toThrow('Total amount');
    });
  });

  describe('Multiple Line Items', () => {
    it('handles invoices with many line items', () => {
      const lineItems = Array.from({ length: 10 }, (_, i) => ({
        id: `line-${i + 1}`,
        description: `Item ${i + 1}`,
        quantity: i + 1,
        unitPrice: 100.0,
        totalPrice: (i + 1) * 100.0,
        glAccountId: `gl-${i}`,
      }));

      const goInvoice = createMockGoInvoice({ lineItems });
      const result = mapGoInvoiceToInvoiceData(goInvoice, mockBillFromAddress);

      expect(result.lineItems).toHaveLength(10);
      expect(result.lineItems[0]?.quantity).toBe(1);
      expect(result.lineItems[9]?.quantity).toBe(10);
    });
  });

  describe('Business Rule Integration', () => {
    it('mapped data supports shouldShowPaymentLink business rule', () => {
      const goInvoice = createMockGoInvoice({ status: 'sent' });
      const paymentUrl = 'https://pay.example.com';
      const result = mapGoInvoiceToInvoiceData(
        goInvoice,
        mockBillFromAddress,
        paymentUrl
      );

      // Electronic delivery with payment URL should show link
      expect(result.shouldShowPaymentLink('electronic')).toBe(true);
      
      // Printed delivery should not show link
      expect(result.shouldShowPaymentLink('printed')).toBe(false);
    });

    it('mapped data supports getStatusColor business rule', () => {
      const sentInvoice = createMockGoInvoice({ status: 'sent' });
      const result = mapGoInvoiceToInvoiceData(sentInvoice, mockBillFromAddress);

      // Should return color code based on status
      const color = result.getStatusColor();
      expect(color).toBe('#3B82F6'); // Blue for sent status
    });
  });
});
