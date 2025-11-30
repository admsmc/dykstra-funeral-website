import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoProcurementPortService,
  GoPurchaseRequisition,
  GoPurchaseOrder,
  GoReceipt,
  GoVendor,
  GoVendorPerformance,
  CreatePurchaseRequisitionCommand,
  CreatePurchaseOrderCommand,
  CreateReceiptCommand,
  CreateVendorCommand,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Go Procurement Adapter
 * 
 * Purchase-to-Pay (P2P) workflow implementation.
 * Handles requisitions, POs, receiving, and vendor management.
 */
export const GoProcurementAdapter: GoProcurementPortService = {
  // Purchase Requisition Operations
  
  createPurchaseRequisition: (command: CreatePurchaseRequisitionCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/requisitions', {
          body: {
            requested_by: command.requestedBy,
            department: command.department,
            line_items: command.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              estimated_unit_price: item.estimatedUnitPrice,
              estimated_total: item.estimatedTotal,
              gl_account_id: item.glAccountId,
              need_by_date: item.needByDate?.toISOString(),
            })),
            notes: command.notes,
          }
        });
        
        return mapToGoPurchaseRequisition(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create purchase requisition', error as Error)
    }),
  
  getPurchaseRequisition: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/requisitions/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Purchase requisition not found', entityType: 'PurchaseRequisition', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoPurchaseRequisition(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get purchase requisition', error as Error);
      }
    }),
  
  listPurchaseRequisitions: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/requisitions', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.requisitions || []).map(mapToGoPurchaseRequisition);
      },
      catch: (error) => new NetworkError('Failed to list purchase requisitions', error as Error)
    }),
  
  approvePurchaseRequisition: (id: string, approvedBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/requisitions/{id}/approve', {
          params: { path: { id } },
          body: { approved_by: approvedBy }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve purchase requisition', error as Error)
    }),
  
  rejectPurchaseRequisition: (id: string, rejectedBy: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/requisitions/{id}/reject', {
          params: { path: { id } },
          body: {
            rejected_by: rejectedBy,
            reason,
          }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to reject purchase requisition', error as Error)
    }),
  
  convertRequisitionToPO: (requisitionId: string, vendorId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/requisitions/{id}/convert', {
          params: { path: { id: requisitionId } },
          body: { vendor_id: vendorId }
        });
        
        return mapToGoPurchaseOrder(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to convert requisition to PO', error as Error)
    }),
  
  // Purchase Order Operations
  
  createPurchaseOrder: (command: CreatePurchaseOrderCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/pos', {
          body: {
            vendor_id: command.vendorId,
            order_date: command.orderDate.toISOString(),
            expected_delivery_date: command.expectedDeliveryDate?.toISOString(),
            line_items: command.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.totalPrice,
              gl_account_id: item.glAccountId,
            })),
            requisition_id: command.requisitionId,
            shipping_amount: command.shippingAmount,
            tax_amount: command.taxAmount,
          }
        });
        
        return mapToGoPurchaseOrder(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create purchase order', error as Error)
    }),
  
  getPurchaseOrder: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/pos/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Purchase order not found', entityType: 'PurchaseOrder', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoPurchaseOrder(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get purchase order', error as Error);
      }
    }),
  
  listPurchaseOrders: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/pos', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.pos || []).map(mapToGoPurchaseOrder);
      },
      catch: (error) => new NetworkError('Failed to list purchase orders', error as Error)
    }),
  
  approvePurchaseOrder: (id: string, approvedBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/pos/{id}/approve', {
          params: { path: { id } },
          body: { approved_by: approvedBy }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve purchase order', error as Error)
    }),
  
  sendPurchaseOrder: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/pos/{id}/send', {
          params: { path: { id } }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to send purchase order', error as Error)
    }),
  
  acknowledgePurchaseOrder: (id: string, expectedDeliveryDate?: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/pos/{id}/acknowledge', {
          params: { path: { id } },
          body: { expected_delivery_date: expectedDeliveryDate?.toISOString() }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to acknowledge purchase order', error as Error)
    }),
  
  cancelPurchaseOrder: (id: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/pos/{id}/cancel', {
          params: { path: { id } },
          body: { reason }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to cancel purchase order', error as Error)
    }),
  
  // Receipt Operations
  
  createReceipt: (command: CreateReceiptCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/receipts', {
          body: {
            purchase_order_id: command.purchaseOrderId,
            received_date: command.receivedDate.toISOString(),
            received_by: command.receivedBy,
            line_items: command.lineItems.map(item => ({
              po_line_item_id: item.poLineItemId,
              quantity_received: item.quantityReceived,
              quantity_rejected: item.quantityRejected,
              rejection_reason: item.rejectionReason,
            })),
            notes: command.notes,
          }
        });
        
        return mapToGoReceipt(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create receipt', error as Error)
    }),
  
  getReceipt: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/receipts/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Receipt not found', entityType: 'Receipt', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoReceipt(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get receipt', error as Error);
      }
    }),
  
  listReceipts: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/receipts', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.receipts || []).map(mapToGoReceipt);
      },
      catch: (error) => new NetworkError('Failed to list receipts', error as Error)
    }),
  
  getReceiptsByPurchaseOrder: (poId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/receipts', {
          params: { query: { purchase_order_id: poId } }
        });
        
        const data = unwrapResponse(res);
        return (data.receipts || []).map(mapToGoReceipt);
      },
      catch: (error) => new NetworkError('Failed to get receipts by PO', error as Error)
    }),
  
  // Vendor Operations
  
  createVendor: (command: CreateVendorCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/vendors', {
          body: {
            name: command.name,
            contact_name: command.contactName,
            email: command.email,
            phone: command.phone,
            address: {
              street1: command.address.street1,
              street2: command.address.street2,
              city: command.address.city,
              state: command.address.state,
              zip: command.address.zip,
              country: command.address.country,
            },
            payment_terms: command.paymentTerms,
            tax_id: command.taxId,
          }
        });
        
        return mapToGoVendor(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create vendor', error as Error)
    }),
  
  getVendor: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/vendors/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Vendor not found', entityType: 'Vendor', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoVendor(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get vendor', error as Error);
      }
    }),
  
  listVendors: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/vendors', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.vendors || []).map(mapToGoVendor);
      },
      catch: (error) => new NetworkError('Failed to list vendors', error as Error)
    }),
  
  updateVendor: (id: string, updates: Partial<CreateVendorCommand>) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PATCH('/v1/procurement/vendors/{id}', {
          params: { path: { id } },
          body: {
            name: updates.name,
            contact_name: updates.contactName,
            email: updates.email,
            phone: updates.phone,
            address: updates.address ? {
              street1: updates.address.street1,
              street2: updates.address.street2,
              city: updates.address.city,
              state: updates.address.state,
              zip: updates.address.zip,
              country: updates.address.country,
            } : undefined,
            payment_terms: updates.paymentTerms,
            tax_id: updates.taxId,
          }
        });
        
        return mapToGoVendor(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to update vendor', error as Error)
    }),
  
  suspendVendor: (id: string, reason: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/procurement/vendors/{id}/suspend', {
          params: { path: { id } },
          body: { reason }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to suspend vendor', error as Error)
    }),
  
  getVendorPerformance: (vendorId: string, startDate?: Date, endDate?: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/procurement/vendors/{id}/performance', {
          params: {
            path: { id: vendorId },
            query: {
              start_date: startDate?.toISOString(),
              end_date: endDate?.toISOString(),
            }
          }
        });
        
        const data = unwrapResponse(res);
        return mapToGoVendorPerformance(data);
      },
      catch: (error) => new NetworkError('Failed to get vendor performance', error as Error)
    }),
};

// Mapper functions

function mapToGoPurchaseRequisition(data: any): GoPurchaseRequisition {
  return {
    id: data.id,
    requisitionNumber: data.requisition_number,
    requestedBy: data.requested_by,
    department: data.department,
    requestDate: new Date(data.request_date),
    status: data.status,
    lineItems: (data.line_items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      estimatedUnitPrice: item.estimated_unit_price,
      estimatedTotal: item.estimated_total,
      glAccountId: item.gl_account_id,
      needByDate: item.need_by_date ? new Date(item.need_by_date) : undefined,
    })),
    totalAmount: data.total_amount,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
    rejectionReason: data.rejection_reason,
    purchaseOrderId: data.purchase_order_id,
    createdAt: new Date(data.created_at),
  };
}

function mapToGoPurchaseOrder(data: any): GoPurchaseOrder {
  return {
    id: data.id,
    poNumber: data.po_number,
    vendorId: data.vendor_id,
    vendorName: data.vendor_name,
    orderDate: new Date(data.order_date),
    expectedDeliveryDate: data.expected_delivery_date ? new Date(data.expected_delivery_date) : undefined,
    status: data.status,
    lineItems: (data.line_items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      quantityReceived: item.quantity_received,
      quantityBilled: item.quantity_billed,
      glAccountId: item.gl_account_id,
    })),
    subtotal: data.subtotal,
    taxAmount: data.tax_amount,
    shippingAmount: data.shipping_amount,
    totalAmount: data.total_amount,
    requisitionId: data.requisition_id,
    sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
    acknowledgedAt: data.acknowledged_at ? new Date(data.acknowledged_at) : undefined,
    createdAt: new Date(data.created_at),
  };
}

function mapToGoReceipt(data: any): GoReceipt {
  return {
    id: data.id,
    receiptNumber: data.receipt_number,
    purchaseOrderId: data.purchase_order_id,
    poNumber: data.po_number,
    vendorId: data.vendor_id,
    vendorName: data.vendor_name,
    receivedDate: new Date(data.received_date),
    receivedBy: data.received_by,
    lineItems: (data.line_items || []).map((item: any) => ({
      id: item.id,
      poLineItemId: item.po_line_item_id,
      description: item.description,
      quantityOrdered: item.quantity_ordered,
      quantityReceived: item.quantity_received,
      quantityRejected: item.quantity_rejected,
      rejectionReason: item.rejection_reason,
    })),
    status: data.status,
    notes: data.notes,
    createdAt: new Date(data.created_at),
  };
}

function mapToGoVendor(data: any): GoVendor {
  return {
    id: data.id,
    vendorNumber: data.vendor_number,
    name: data.name,
    contactName: data.contact_name,
    email: data.email,
    phone: data.phone,
    address: {
      street1: data.address.street1,
      street2: data.address.street2,
      city: data.address.city,
      state: data.address.state,
      zip: data.address.zip,
      country: data.address.country,
    },
    paymentTerms: data.payment_terms,
    status: data.status,
    taxId: data.tax_id,
    createdAt: new Date(data.created_at),
  };
}

function mapToGoVendorPerformance(data: any): GoVendorPerformance {
  return {
    vendorId: data.vendor_id,
    vendorName: data.vendor_name,
    totalOrders: data.total_orders,
    totalSpend: data.total_spend,
    onTimeDeliveryRate: data.on_time_delivery_rate,
    qualityRate: data.quality_rate,
    averageLeadTime: data.average_lead_time,
  };
}
