/**
 * Use Case 2.2: Receive Inventory from Purchase Order
 * 
 * Implements the receiving workflow with 3-way match (PO → Receipt → Invoice):
 * 1. Retrieve open purchase order
 * 2. Record receipt of goods (quantities, condition, date)
 * 3. Update inventory balances (increase on-hand quantities)
 * 4. Update PO status (partially/fully received)
 * 5. Create AP bill if fully received (3-way match)
 * 
 * Business Value:
 * - Accurate inventory tracking for $2K-$15K caskets
 * - Proper cost basis for COGS calculations
 * - 3-way match reduces payment fraud
 * - Automated AP bill creation saves time
 * - Variance tracking (ordered vs. received quantities)
 */

import { Effect } from 'effect';
import {
  GoInventoryPort,
  type GoInventoryPortService,
  GoProcurementPort,
  type GoProcurementPortService,
  GoFinancialPort,
  type GoFinancialPortService,
  type GoReceipt,
  type CreateReceiptCommand,
  type GoPOLineItem,
  type NetworkError,
} from '@dykstra/application';
import { ValidationError, type NotFoundError } from '@dykstra/domain';

// ============================================================================
// Command & Result Types
// ============================================================================

/**
 * Receive Inventory From Po
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface ReceiveInventoryFromPOCommand {
  readonly purchaseOrderId: string;
  readonly receivedBy: string;
  readonly receivedDate: string; // ISO 8601
  readonly locationId: string;
  readonly lineItems: ReadonlyArray<{
    readonly poLineItemId: string;
    readonly quantityReceived: number;
    readonly quantityRejected?: number;
    readonly rejectionReason?: string;
    readonly notes?: string;
  }>;
  readonly notes?: string;
  readonly autoCreateAPBill?: boolean; // If true and fully received, create AP bill
}

export interface ReceivedLineItem {
  readonly poLineItemId: string;
  readonly itemId: string;
  readonly itemSku: string;
  readonly quantityOrdered: number;
  readonly quantityReceived: number;
  readonly quantityRejected: number;
  readonly variance: number; // received - ordered
  readonly unitPrice: number;
  readonly lineTotal: number;
}

export interface ReceiveInventoryFromPOResult {
  readonly receiptId: string;
  readonly receiptNumber: string;
  readonly purchaseOrderId: string;
  readonly poNumber: string;
  readonly poStatus: 'partial' | 'received' | 'closed';
  readonly itemsReceived: ReadonlyArray<ReceivedLineItem>;
  readonly totalItemsReceived: number;
  readonly apBillId?: string;
  readonly matchStatus: '2-way' | '3-way' | 'pending';
  readonly totalAmount: number;
  readonly receivedDate: string;
  readonly createdAt?: string;
}

// ============================================================================
// Port Dependencies
// ============================================================================

export interface ReceiveInventoryFromPODeps {
  readonly GoInventoryPort: GoInventoryPortService;
  readonly GoProcurementPort: GoProcurementPortService;
  readonly GoFinancialPort: GoFinancialPortService;
}

// ============================================================================
// Use Case Implementation
// ============================================================================

/**
 * Receive Inventory from PO Use Case
 * 
 * Orchestrates the receiving workflow from PO retrieval through
 * inventory updates and optional AP bill creation.
 */
export const receiveInventoryFromPO = (
  command: ReceiveInventoryFromPOCommand
): Effect.Effect<
  ReceiveInventoryFromPOResult,
  ValidationError | NotFoundError | NetworkError,
  GoInventoryPortService | GoProcurementPortService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    // Get dependencies
    const inventoryPort = yield* GoInventoryPort;
    const procurementPort = yield* GoProcurementPort;
    const financialPort = yield* GoFinancialPort;
    
    // Step 1: Get open purchase order
    const po = yield* procurementPort.getPurchaseOrder(command.purchaseOrderId);
    
    // Validate PO status (must be 'sent' or 'acknowledged' to receive)
    if (!['sent', 'acknowledged', 'partial'].includes(po.status)) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Cannot receive from PO in ${po.status} status`,
          field: 'poStatus'
        })
      );
    }
    
    // Step 2: Validate received quantities
    const receivedLineItems: ReceivedLineItem[] = [];
    let totalQuantityReceived = 0;
    
    for (const receivedLine of command.lineItems) {
      // Find corresponding PO line item
      const poLine = po.lineItems.find((line: GoPOLineItem) => line.id === receivedLine.poLineItemId);
      
      if (!poLine) {
        return yield* Effect.fail(
          new ValidationError({
            message: `PO line item ${receivedLine.poLineItemId} not found`,
            field: 'poLineItemId'
          })
        );
      }
      
      // Calculate variance
      const quantityReceived = receivedLine.quantityReceived;
      const quantityRejected = receivedLine.quantityRejected || 0;
      const quantityOrdered = poLine.quantity;
      const variance = quantityReceived - quantityOrdered;
      
      // Validate: cannot receive more than 10% over ordered without approval
      if (variance > quantityOrdered * 0.1) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Cannot receive ${quantityReceived} (>10% over ordered ${quantityOrdered})`,
            field: 'quantityReceived'
          })
        );
      }
      
      receivedLineItems.push({
        poLineItemId: receivedLine.poLineItemId,
        itemId: poLine.description, // Assuming description contains item ID (adjust as needed)
        itemSku: poLine.description,
        quantityOrdered,
        quantityReceived,
        quantityRejected,
        variance,
        unitPrice: poLine.unitPrice,
        lineTotal: quantityReceived * poLine.unitPrice,
      });
      
      totalQuantityReceived += quantityReceived;
    }
    
    const totalAmount = receivedLineItems.reduce((sum, line) => sum + line.lineTotal, 0);
    
    // Step 3: Record receipt in procurement system
    const receiptCommand: CreateReceiptCommand = {
      purchaseOrderId: command.purchaseOrderId,
      receivedDate: new Date(command.receivedDate),
      receivedBy: command.receivedBy,
      lineItems: command.lineItems.map(line => ({
        poLineItemId: line.poLineItemId,
        quantityReceived: line.quantityReceived,
        quantityRejected: line.quantityRejected,
        rejectionReason: line.rejectionReason,
      })),
      notes: command.notes,
    };
    
    const receipt = yield* procurementPort.createReceipt(receiptCommand);
    
    // Step 4: Update inventory quantities for each received item
    for (const receivedLine of receivedLineItems) {
      if (receivedLine.quantityReceived > 0) {
        yield* inventoryPort.receiveInventory({
          itemId: receivedLine.itemId,
          locationId: command.locationId,
          quantity: receivedLine.quantityReceived,
          unitCost: receivedLine.unitPrice,
          purchaseOrderId: command.purchaseOrderId,
          notes: `Received from PO ${po.poNumber}`,
        });
      }
    }
    
    // Step 5: Determine PO status after receipt
    // Get updated PO to check if fully received
    const updatedPO = yield* procurementPort.getPurchaseOrder(command.purchaseOrderId);
    
    const isFullyReceived = updatedPO.lineItems.every(
      (line: GoPOLineItem) => line.quantityReceived >= line.quantity
    );
    
    const poStatus: 'partial' | 'received' | 'closed' = isFullyReceived ? 'received' : 'partial';
    
    // Step 6: Create AP bill if fully received and auto-create enabled
    let apBillId: string | undefined;
    let matchStatus: '2-way' | '3-way' | 'pending' = '2-way'; // Receipt created, PO exists = 2-way match
    
    if (isFullyReceived && command.autoCreateAPBill) {
      // Get 3-way match status from Go backend
      const threeWayMatch = yield* financialPort.getThreeWayMatchStatus(command.purchaseOrderId);
      
      // Check if 3-way match is complete (PO matched + receipt matched)
      if (threeWayMatch.fullyMatched) {
        // Create AP bill (this completes the 3-way match: PO → Receipt → Bill)
        const apBill = yield* financialPort.createVendorBill({
          vendorId: po.vendorId,
          billDate: new Date(command.receivedDate),
          dueDate: new Date(calculateDueDate(command.receivedDate, 30)),
          lineItems: receivedLineItems.map(line => ({
            description: line.itemSku,
            quantity: line.quantityReceived,
            unitPrice: line.unitPrice,
            totalPrice: line.lineTotal,
            glAccountId: '5001',
          })),
          purchaseOrderId: command.purchaseOrderId,
        });
        
        apBillId = apBill.id;
        matchStatus = '3-way';
      }
    }
    
    return {
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      poStatus,
      itemsReceived: receivedLineItems,
      totalItemsReceived: totalQuantityReceived,
      apBillId,
      matchStatus: apBillId ? '3-way' : matchStatus,
      totalAmount,
      receivedDate: command.receivedDate,
      createdAt: receipt.createdAt?.toISOString(),
    };
  });

/**
 * Get Receipts by Purchase Order
 * 
 * Helper use case to retrieve all receipts for a PO
 * (useful for tracking partial receipts)
 */
export const getReceiptsByPO = (
  poId: string
): Effect.Effect<
  ReadonlyArray<GoReceipt>,
  NotFoundError | NetworkError,
  GoProcurementPortService
> =>
  Effect.gen(function* () {
    const procurementPort = yield* GoProcurementPort;
    
    return yield* procurementPort.getReceiptsByPurchaseOrder(poId);
  });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate due date based on payment terms
 * @param billDate - The bill/receipt date
 * @param termDays - Payment terms in days (e.g., 30 for Net 30)
 */
function calculateDueDate(billDate: string, termDays: number): Date {
  const date = new Date(billDate);
  date.setDate(date.getDate() + termDays);
  return date;
}
