import { InvoiceData } from '@dykstra/domain';
import type { GoInvoice } from '../ports/go-financial-port';

/**
 * Maps Go backend invoice data to domain InvoiceData entity
 * 
 * Data flow: Go ERP → GoFinancialAdapter → GoInvoice → InvoiceData → ReactPDFAdapter → PDF
 * 
 * Key mappings:
 * - GoInvoice has pre-calculated amounts (subtotal, taxAmount, totalAmount, amountPaid, amountDue)
 * - InvoiceData receives these via InvoiceAmounts interface (no client-side calculation)
 * - Line items map directly with quantity * unitPrice = totalPrice
 * - Status values align between Go and domain enums
 * 
 * @param goInvoice - Invoice data from Go ERP backend
 * @param billFromAddress - Funeral home address for payment instructions
 * @param paymentUrl - Optional payment portal URL for electronic delivery
 * @returns InvoiceData domain entity ready for PDF generation
 */
export function mapGoInvoiceToInvoiceData(
  goInvoice: GoInvoice,
  billFromAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  },
  paymentUrl?: string
): InvoiceData {
  // Build metadata with full GoInvoice fields
  const metadata = {
    id: goInvoice.id,
    invoiceNumber: goInvoice.invoiceNumber,
    invoiceDate: goInvoice.invoiceDate,
    dueDate: goInvoice.dueDate,
    status: mapGoInvoiceStatus(goInvoice.status),
    caseId: goInvoice.caseId,
    contractId: goInvoice.contractId,
    customerId: goInvoice.customerId,
    customerName: goInvoice.customerName,
    paymentUrl,
    createdAt: goInvoice.createdAt,
  };

  // Build parties
  const parties = {
    billFrom: billFromAddress,
    billTo: {
      name: goInvoice.customerName,
      line1: '', // TODO: Add customer address to GoInvoice or fetch separately
      city: '',
      state: '',
      postalCode: '',
    },
  };

  // Map amounts (backend-calculated)
  const amounts = {
    subtotal: goInvoice.subtotal,
    taxAmount: goInvoice.taxAmount,
    totalAmount: goInvoice.totalAmount,
    amountPaid: goInvoice.amountPaid,
    amountDue: goInvoice.amountDue,
  };

  // Map line items with generated IDs
  const lineItems = goInvoice.lineItems.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    glAccountId: item.glAccountId,
  }));

  // Create InvoiceData with proper parameter order
  return InvoiceData.create(metadata, parties, amounts, lineItems);
}

/**
 * Maps Go invoice status to domain invoice status
 * 
 * Mapping logic:
 * - draft → draft
 * - sent → sent
 * - partial → partial_paid
 * - paid → paid
 * - overdue → overdue
 * - cancelled → cancelled
 */
function mapGoInvoiceStatus(
  goStatus: GoInvoice['status']
): InvoiceData['metadata']['status'] {
  switch (goStatus) {
    case 'draft':
      return 'draft';
    case 'sent':
      return 'sent';
    case 'partial':
      return 'partial'; // Matches domain entity status type
    case 'paid':
      return 'paid';
    case 'overdue':
      return 'overdue';
    case 'cancelled':
      return 'cancelled';
  }
}
