import type { PurchaseOrderData } from '../ports/document-generator-port';
import type { GoPurchaseOrder } from '../ports/go-procurement-port';

/**
 * Maps Go backend purchase order data to PurchaseOrderData for PDF generation
 * 
 * Data flow: Go ERP → GoProcurementAdapter → GoPurchaseOrder → PurchaseOrderData → ReactPDFAdapter → PDF
 * 
 * Key mappings:
 * - GoPurchaseOrder has pre-calculated amounts (subtotal, taxAmount, totalAmount)
 * - Line items map directly with quantity * unitPrice = totalPrice
 * - Delivery date is optional (some POs don't have expected delivery)
 * 
 * @param goPO - Purchase order data from Go ERP backend
 * @returns PurchaseOrderData ready for PDF generation
 */
export function mapGoPurchaseOrderToData(
  goPO: GoPurchaseOrder
): PurchaseOrderData {
  return {
    poNumber: goPO.poNumber,
    vendorId: goPO.vendorId,
    vendorName: goPO.vendorName,
    orderDate: goPO.orderDate,
    deliveryDate: goPO.expectedDeliveryDate ?? new Date(goPO.orderDate.getTime() + 14 * 24 * 60 * 60 * 1000), // Default 14 days if not specified
    lineItems: goPO.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      glAccountId: item.glAccountId,
    })),
    subtotal: goPO.subtotal,
    tax: goPO.taxAmount,
    total: goPO.totalAmount,
    notes: undefined, // Go backend doesn't expose notes on PO, only on receipts
  };
}
