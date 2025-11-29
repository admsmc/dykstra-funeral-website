import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NotFoundError, NetworkError };

/**
 * Go Procurement domain types
 * Procure-to-Pay (P2P) process with approval workflows
 */
export interface GoPurchaseRequisition {
  readonly id: string;
  readonly requisitionNumber: string;
  readonly requestedBy: string;
  readonly department: string;
  readonly requestDate: Date;
  readonly status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_po' | 'cancelled';
  readonly lineItems: readonly GoPRLineItem[];
  readonly totalAmount: number;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly rejectionReason?: string;
  readonly purchaseOrderId?: string;
  readonly createdAt: Date;
}

export interface GoPRLineItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly estimatedUnitPrice: number;
  readonly estimatedTotal: number;
  readonly glAccountId: string;
  readonly needByDate?: Date;
}

export interface GoPurchaseOrder {
  readonly id: string;
  readonly poNumber: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly orderDate: Date;
  readonly expectedDeliveryDate?: Date;
  readonly status: 'draft' | 'sent' | 'acknowledged' | 'partial' | 'received' | 'closed' | 'cancelled';
  readonly lineItems: readonly GoPOLineItem[];
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly shippingAmount: number;
  readonly totalAmount: number;
  readonly requisitionId?: string;
  readonly sentAt?: Date;
  readonly acknowledgedAt?: Date;
  readonly createdAt: Date;
}

export interface GoPOLineItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly quantityReceived: number;
  readonly quantityBilled: number;
  readonly glAccountId: string;
}

export interface GoReceipt {
  readonly id: string;
  readonly receiptNumber: string;
  readonly purchaseOrderId: string;
  readonly poNumber: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly receivedDate: Date;
  readonly receivedBy: string;
  readonly lineItems: readonly GoReceiptLineItem[];
  readonly status: 'draft' | 'completed';
  readonly notes?: string;
  readonly createdAt: Date;
}

export interface GoReceiptLineItem {
  readonly id: string;
  readonly poLineItemId: string;
  readonly description: string;
  readonly quantityOrdered: number;
  readonly quantityReceived: number;
  readonly quantityRejected: number;
  readonly rejectionReason?: string;
}

export interface GoVendor {
  readonly id: string;
  readonly vendorNumber: string;
  readonly name: string;
  readonly contactName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address: GoAddress;
  readonly paymentTerms: string;
  readonly status: 'active' | 'inactive' | 'suspended';
  readonly taxId?: string;
  readonly createdAt: Date;
}

export interface GoAddress {
  readonly street1: string;
  readonly street2?: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
  readonly country: string;
}

// Commands
export interface CreatePurchaseRequisitionCommand {
  readonly requestedBy: string;
  readonly department: string;
  readonly lineItems: readonly Omit<GoPRLineItem, 'id'>[];
  readonly notes?: string;
}

export interface CreatePurchaseOrderCommand {
  readonly vendorId: string;
  readonly orderDate: Date;
  readonly expectedDeliveryDate?: Date;
  readonly lineItems: readonly Omit<GoPOLineItem, 'id' | 'quantityReceived' | 'quantityBilled'>[];
  readonly requisitionId?: string;
  readonly shippingAmount?: number;
  readonly taxAmount?: number;
}

export interface CreateReceiptCommand {
  readonly purchaseOrderId: string;
  readonly receivedDate: Date;
  readonly receivedBy: string;
  readonly lineItems: readonly {
    readonly poLineItemId: string;
    readonly quantityReceived: number;
    readonly quantityRejected?: number;
    readonly rejectionReason?: string;
  }[];
  readonly notes?: string;
}

export interface CreateVendorCommand {
  readonly name: string;
  readonly contactName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address: GoAddress;
  readonly paymentTerms: string;
  readonly taxId?: string;
}

/**
 * Go Procurement Port
 * 
 * Procure-to-Pay (P2P) process with approval workflows.
 * Integrates with inventory receiving and AP invoice matching.
 * 
 * Features:
 * - Purchase requisition creation and approval
 * - Purchase order generation and vendor management
 * - Goods receipt recording
 * - 3-way match integration (PO, Receipt, Invoice)
 * - Vendor performance tracking
 * 
 * Backend: Go ERP with event sourcing
 */
export interface GoProcurementPortService {
  // Purchase Requisition Operations
  
  /**
   * Create purchase requisition
   * 
   * Backend operation:
   * 1. Creates requisition
   * 2. Emits PurchaseRequisitionCreated event
   * 3. Triggers approval workflow
   */
  readonly createPurchaseRequisition: (
    command: CreatePurchaseRequisitionCommand
  ) => Effect.Effect<GoPurchaseRequisition, NetworkError>;
  
  /**
   * Get purchase requisition by ID
   */
  readonly getPurchaseRequisition: (
    id: string
  ) => Effect.Effect<GoPurchaseRequisition, NotFoundError | NetworkError>;
  
  /**
   * List purchase requisitions
   */
  readonly listPurchaseRequisitions: (
    filters?: {
      status?: GoPurchaseRequisition['status'];
      requestedBy?: string;
      department?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) => Effect.Effect<readonly GoPurchaseRequisition[], NetworkError>;
  
  /**
   * Approve purchase requisition
   * 
   * Backend operation:
   * 1. Validates requisition is pending
   * 2. Records approval
   * 3. Emits PurchaseRequisitionApproved event
   */
  readonly approvePurchaseRequisition: (
    id: string,
    approvedBy: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Reject purchase requisition
   */
  readonly rejectPurchaseRequisition: (
    id: string,
    rejectedBy: string,
    reason: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Convert requisition to purchase order
   * 
   * Backend operation:
   * 1. Validates requisition is approved
   * 2. Creates PO from requisition line items
   * 3. Links requisition to PO
   * 4. Emits PurchaseOrderCreated event
   */
  readonly convertRequisitionToPO: (
    requisitionId: string,
    vendorId: string
  ) => Effect.Effect<GoPurchaseOrder, NetworkError>;
  
  // Purchase Order Operations
  
  /**
   * Create purchase order
   */
  readonly createPurchaseOrder: (
    command: CreatePurchaseOrderCommand
  ) => Effect.Effect<GoPurchaseOrder, NetworkError>;
  
  /**
   * Get purchase order by ID
   */
  readonly getPurchaseOrder: (
    id: string
  ) => Effect.Effect<GoPurchaseOrder, NotFoundError | NetworkError>;
  
  /**
   * List purchase orders
   */
  readonly listPurchaseOrders: (
    filters?: {
      vendorId?: string;
      status?: GoPurchaseOrder['status'];
      startDate?: Date;
      endDate?: Date;
    }
  ) => Effect.Effect<readonly GoPurchaseOrder[], NetworkError>;
  
  /**
   * Approve purchase order
   * 
   * Backend operation:
   * 1. Validates PO is pending approval
   * 2. Records approval
   * 3. Emits PurchaseOrderApproved event
   * 4. Transitions to approved status
   */
  readonly approvePurchaseOrder: (
    id: string,
    approvedBy: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Send purchase order to vendor
   * 
   * Backend operation:
   * 1. Generates PO PDF
   * 2. Sends via email to vendor
   * 3. Emits PurchaseOrderSent event
   * 4. Updates status to 'sent'
   */
  readonly sendPurchaseOrder: (
    id: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Acknowledge purchase order (vendor confirmation)
   */
  readonly acknowledgePurchaseOrder: (
    id: string,
    expectedDeliveryDate?: Date
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Cancel purchase order
   */
  readonly cancelPurchaseOrder: (
    id: string,
    reason: string
  ) => Effect.Effect<void, NetworkError>;
  
  // Receipt Operations
  
  /**
   * Create goods receipt
   * 
   * Backend operation:
   * 1. Validates PO exists
   * 2. Records receipt
   * 3. Emits GoodsReceived event
   * 4. Updates PO line item quantities received
   * 5. Triggers inventory receive (if inventory item)
   * 6. Updates PO status (partial/received)
   */
  readonly createReceipt: (
    command: CreateReceiptCommand
  ) => Effect.Effect<GoReceipt, NetworkError>;
  
  /**
   * Get receipt by ID
   */
  readonly getReceipt: (
    id: string
  ) => Effect.Effect<GoReceipt, NotFoundError | NetworkError>;
  
  /**
   * List receipts
   */
  readonly listReceipts: (
    filters?: {
      purchaseOrderId?: string;
      vendorId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) => Effect.Effect<readonly GoReceipt[], NetworkError>;
  
  /**
   * Get receipts for purchase order
   */
  readonly getReceiptsByPurchaseOrder: (
    poId: string
  ) => Effect.Effect<readonly GoReceipt[], NetworkError>;
  
  // Vendor Operations
  
  /**
   * Create vendor
   */
  readonly createVendor: (
    command: CreateVendorCommand
  ) => Effect.Effect<GoVendor, NetworkError>;
  
  /**
   * Get vendor by ID
   */
  readonly getVendor: (
    id: string
  ) => Effect.Effect<GoVendor, NotFoundError | NetworkError>;
  
  /**
   * List vendors
   */
  readonly listVendors: (
    filters?: {
      status?: GoVendor['status'];
      search?: string;
    }
  ) => Effect.Effect<readonly GoVendor[], NetworkError>;
  
  /**
   * Update vendor
   */
  readonly updateVendor: (
    id: string,
    updates: Partial<CreateVendorCommand>
  ) => Effect.Effect<GoVendor, NetworkError>;
  
  /**
   * Suspend vendor
   */
  readonly suspendVendor: (
    id: string,
    reason: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Get vendor performance metrics
   */
  readonly getVendorPerformance: (
    vendorId: string,
    startDate?: Date,
    endDate?: Date
  ) => Effect.Effect<GoVendorPerformance, NetworkError>;
}

export interface GoVendorPerformance {
  readonly vendorId: string;
  readonly vendorName: string;
  readonly totalOrders: number;
  readonly totalSpend: number;
  readonly onTimeDeliveryRate: number;
  readonly qualityRate: number;
  readonly averageLeadTime: number;
}

/**
 * Go Procurement Port service tag for dependency injection
 */
export const GoProcurementPort = Context.GenericTag<GoProcurementPortService>(
  '@dykstra/GoProcurementPort'
);
