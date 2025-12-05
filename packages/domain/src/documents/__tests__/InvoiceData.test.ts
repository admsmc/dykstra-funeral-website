import { describe, it, expect } from 'vitest';
import {
  InvoiceData,
  type InvoiceMetadata,
  type InvoiceParties,
  type InvoiceLineItem,
  type InvoiceAmounts,
} from '../InvoiceData';

describe('InvoiceData', () => {
  const mockMetadata: InvoiceMetadata = {
    id: 'invoice-123',
    invoiceNumber: 'INV-2024-001',
    invoiceDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-31'),
    status: 'sent',
    caseId: 'case-2024-001',
    contractId: 'contract-123',
    customerId: 'customer-456',
    customerName: 'John Smith Family',
    paymentUrl: 'https://pay.example.com/inv123',
    createdAt: new Date('2024-01-01'),
  };

  const mockParties: InvoiceParties = {
    billTo: {
      name: 'John Smith Family',
      line1: '123 Main St',
      city: 'Grand Rapids',
      state: 'MI',
      postalCode: '49503',
    },
    billFrom: {
      name: 'Dykstra Funeral Home',
      line1: '456 Oak Ave',
      city: 'Grand Rapids',
      state: 'MI',
      postalCode: '49504',
    },
  };

  const mockLineItems: InvoiceLineItem[] = [
    {
      id: 'line-1',
      description: 'Professional Services',
      quantity: 1,
      unitPrice: 2500.0,
      totalPrice: 2500.0,
      glAccountId: 'gl-4000',
    },
    {
      id: 'line-2',
      description: 'Casket - Oak',
      quantity: 1,
      unitPrice: 3500.0,
      totalPrice: 3500.0,
      glAccountId: 'gl-4100',
    },
  ];

  const mockAmounts: InvoiceAmounts = {
    subtotal: 6000.0,
    taxAmount: 210.0,
    totalAmount: 6210.0,
    amountPaid: 0.0,
    amountDue: 6210.0,
  };

  describe('create', () => {
    it('should create a valid invoice with backend-calculated amounts', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);

      expect(invoice.metadata.invoiceNumber).toBe('INV-2024-001');
      expect(invoice.lineItems).toHaveLength(2);
      expect(invoice.getSubtotal()).toBe(6000.0);
      expect(invoice.getTotalAmount()).toBe(6210.0);
    });

    it('should throw error if no line items', () => {
      expect(() => {
        InvoiceData.create(mockMetadata, mockParties, mockAmounts, []);
      }).toThrow('Invoice must have at least one line item');
    });

    it('should throw error if due date before invoice date', () => {
      const badMetadata = { ...mockMetadata, dueDate: new Date('2023-12-01') };

      expect(() => {
        InvoiceData.create(badMetadata, mockParties, mockAmounts, mockLineItems);
      }).toThrow('Due date cannot be before invoice date');
    });

    it('should throw error if amounts are negative', () => {
      const badAmounts = { ...mockAmounts, subtotal: -100 };

      expect(() => {
        InvoiceData.create(mockMetadata, mockParties, badAmounts, mockLineItems);
      }).toThrow('Subtotal cannot be negative');
    });

    it('should throw error if total does not match subtotal + tax', () => {
      const badAmounts = { ...mockAmounts, totalAmount: 9999.0 };

      expect(() => {
        InvoiceData.create(mockMetadata, mockParties, badAmounts, mockLineItems);
      }).toThrow('Total amount');
    });
  });

  describe('shouldShowPaymentLink', () => {
    it('should show link for electronic delivery of unpaid invoice', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);

      expect(invoice.shouldShowPaymentLink('electronic')).toBe(true);
    });

    it('should NOT show link for printed delivery', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);

      expect(invoice.shouldShowPaymentLink('printed')).toBe(false);
    });

    it('should NOT show link for paid invoice', () => {
      const paidMetadata = { ...mockMetadata, status: 'paid' as const };
      const invoice = InvoiceData.create(paidMetadata, mockParties, mockAmounts, mockLineItems);

      expect(invoice.shouldShowPaymentLink('electronic')).toBe(false);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for each status', () => {
      const statuses = {
        draft: '#6B7280',
        sent: '#3B82F6',
        partial: '#F59E0B',
        paid: '#10B981',
        overdue: '#EF4444',
        cancelled: '#6B7280',
      };

      Object.entries(statuses).forEach(([status, expectedColor]) => {
        const metadata = { ...mockMetadata, status: status as any };
        const invoice = InvoiceData.create(metadata, mockParties, mockAmounts, mockLineItems);

        expect(invoice.getStatusColor()).toBe(expectedColor);
      });
    });
  });

  describe('backend-calculated amounts', () => {
    it('should return subtotal from backend', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);
      expect(invoice.getSubtotal()).toBe(6000.0);
    });

    it('should return tax amount from backend', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);
      expect(invoice.getTaxAmount()).toBe(210.0);
    });

    it('should return total amount from backend', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);
      expect(invoice.getTotalAmount()).toBe(6210.0);
    });
  });

  describe('payment status', () => {
    it('should detect fully paid invoice', () => {
      const paidAmounts = { ...mockAmounts, amountPaid: 6210.0, amountDue: 0.0 };
      const invoice = InvoiceData.create(mockMetadata, mockParties, paidAmounts, mockLineItems);

      expect(invoice.isFullyPaid()).toBe(true);
    });

    it('should detect partially paid invoice', () => {
      const partialAmounts = { ...mockAmounts, amountPaid: 3000.0, amountDue: 3210.0 };
      const invoice = InvoiceData.create(mockMetadata, mockParties, partialAmounts, mockLineItems);

      expect(invoice.isPartiallyPaid()).toBe(true);
    });
  });

  describe('isOverdue', () => {
    it('should return true if past due date and not paid', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);

      const laterDate = new Date('2024-02-15');
      expect(invoice.isOverdue(laterDate)).toBe(true);
    });

    it('should return false if before due date', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);

      const earlierDate = new Date('2024-01-15');
      expect(invoice.isOverdue(earlierDate)).toBe(false);
    });
  });

  describe('getDaysUntilDue', () => {
    it('should return positive days if before due date', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);

      const checkDate = new Date('2024-01-20');
      expect(invoice.getDaysUntilDue(checkDate)).toBe(11);
    });

    it('should return negative days if past due date', () => {
      const invoice = InvoiceData.create(mockMetadata, mockParties, mockAmounts, mockLineItems);

      const checkDate = new Date('2024-02-10');
      expect(invoice.getDaysUntilDue(checkDate)).toBe(-10);
    });
  });

  describe('formatCurrency', () => {
    it('should format with 2 decimal places', () => {
      expect(InvoiceData.formatCurrency(1234.5)).toBe('1234.50');
      expect(InvoiceData.formatCurrency(1234.567)).toBe('1234.57');
      expect(InvoiceData.formatCurrency(1234)).toBe('1234.00');
    });
  });
});
