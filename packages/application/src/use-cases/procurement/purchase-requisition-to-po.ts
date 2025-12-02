/**
 * Use Case 2.1: Purchase Requisition to Purchase Order
 * 
 * Automates the procurement workflow for funeral home inventory replenishment:
 * 1. Identify items below reorder point
 * 2. Create purchase requisition with suggested quantities
 * 3. Route through approval workflow
 * 4. Convert approved requisition to purchase order
 * 5. Send PO to vendor
 * 
 * Business Value:
 * - Prevents stockouts of critical merchandise (caskets, urns, vaults)
 * - Automates reordering process
 * - Enforces approval workflows for purchasing compliance
 * - Maintains audit trail for procurement decisions
 */

import { Effect } from 'effect';
import {
  GoInventoryPort,
  type GoInventoryPortService,
  GoProcurementPort,
  type GoProcurementPortService,
  GoApprovalWorkflowPort,
  type GoApprovalWorkflowPortService,
  type CreatePurchaseRequisitionCommand,
  type NetworkError,
} from '@dykstra/application';
import { ValidationError, type NotFoundError } from '@dykstra/domain';

// ============================================================================
// Command & Result Types
// ============================================================================

/**
 * Purchase Requisition To Po
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

export interface PurchaseRequisitionToPOCommand {
  readonly requestorId: string;
  readonly departmentId: string;
  readonly vendorId: string;
  readonly locationId?: string; // Warehouse location ID (defaults to 'main')
  readonly requiredByDate?: string; // ISO 8601
  readonly notes?: string;
  readonly autoApprove?: boolean; // If true and amount < threshold, skip approval
}

export interface ReorderItem {
  readonly itemId: string;
  readonly itemSku: string;
  readonly currentBalance: number;
  readonly reorderPoint: number;
  readonly reorderQuantity: number;
  readonly estimatedUnitPrice: number;
  readonly estimatedTotal: number;
  readonly glAccountNumber: string;
}

export interface PurchaseRequisitionToPOResult {
  readonly requisitionId: string;
  readonly requisitionNumber: string;
  readonly poId?: string; // Only present if auto-approved
  readonly poNumber?: string; // Only present if auto-approved
  readonly vendorId: string;
  readonly totalAmount: number;
  readonly approvalStatus: 'pending_approval' | 'approved' | 'converted_to_po';
  readonly requiresApproval: boolean;
  readonly itemsOrdered: number;
  readonly createdAt: string;
}

// ============================================================================
// Port Dependencies
// ============================================================================

export interface PurchaseRequisitionToPODeps {
  readonly GoInventoryPort: GoInventoryPortService;
  readonly GoProcurementPort: GoProcurementPortService;
  readonly GoApprovalWorkflowPort: GoApprovalWorkflowPortService;
}

// ============================================================================
// Use Case Implementation
// ============================================================================

/**
 * Purchase Requisition to PO Use Case
 * 
 * Orchestrates the procurement workflow from identifying reorder needs
 * through PO creation and vendor notification.
 */
export const purchaseRequisitionToPO = (
  command: PurchaseRequisitionToPOCommand
): Effect.Effect<
  PurchaseRequisitionToPOResult,
  ValidationError | NetworkError | NotFoundError,
  GoInventoryPortService | GoProcurementPortService | GoApprovalWorkflowPortService
> =>
  Effect.gen(function* () {
    // Get dependencies
    const inventoryPort = yield* GoInventoryPort;
    const procurementPort = yield* GoProcurementPort;
    const approvalPort = yield* GoApprovalWorkflowPort;
    
    // Step 1: Get items below reorder point
    const reorderItems = yield* inventoryPort.getItemsBelowReorderPoint();
    
    if (reorderItems.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'No items below reorder point',
          field: 'reorderItems'
        })
      );
    }
    
    // Step 2: Get current balances for all reorder items
    // Note: getBalance requires (itemId, locationId) - using default 'main' warehouse
    const defaultLocationId = command.locationId || 'main';
    const itemsWithBalances = yield* Effect.all(
      reorderItems.map((item) =>
        Effect.gen(function* () {
          const balance = yield* inventoryPort.getBalance(item.id, defaultLocationId);
          return { item, balance };
        })
      )
    );
    
    // Step 3: Calculate suggested order quantities
    // Reorder Quantity = Reorder Point + Safety Stock - Current Balance
    // For simplicity, we'll use: Reorder Quantity = (Reorder Point * 1.5) - Current Balance
    const lineItems = itemsWithBalances.map(({ item, balance }) => {
      const suggestedQty = Math.max(
        Math.ceil((item.reorderPoint * 1.5) - balance.quantityOnHand),
        item.reorderQuantity || 1
      );
      
      return {
        itemId: item.id,
        quantityRequested: suggestedQty,
        estimatedUnitPrice: item.currentCost,
        justification: `Below reorder point (${balance.quantityOnHand} on hand, ${item.reorderPoint} reorder point)`,
        glAccountNumber: item.glAccountId || '1200', // Default to Inventory Asset
      };
    });
    
    const totalAmount = lineItems.reduce(
      (sum: number, item: { quantityRequested: number; estimatedUnitPrice: number }) => 
        sum + (item.quantityRequested * item.estimatedUnitPrice),
      0
    );
    
    // Step 4: Create purchase requisition
    const requisitionCommand: CreatePurchaseRequisitionCommand = {
      requestedBy: command.requestorId,
      department: command.departmentId,
      lineItems: lineItems.map((li) => ({
        description: li.justification,
        quantity: li.quantityRequested,
        estimatedUnitPrice: li.estimatedUnitPrice,
        estimatedTotal: li.quantityRequested * li.estimatedUnitPrice,
        glAccountId: li.glAccountNumber,
      })),
      notes: `Automatic reorder for ${lineItems.length} items below reorder point${command.notes ? '. ' + command.notes : ''}`,
    };
    
    const requisition = yield* procurementPort.createPurchaseRequisition(requisitionCommand);
    
    // Step 5: Determine if approval is required
    // Auto-approve if amount < $5,000 and autoApprove flag is true
    const requiresApproval = totalAmount >= 5000 || !command.autoApprove;
    
    if (!requiresApproval) {
      // Step 6a: Auto-approve and convert to PO
      yield* procurementPort.approvePurchaseRequisition(requisition.id, command.requestorId);
      
      // Step 7: Convert requisition to PO
      const po = yield* procurementPort.convertRequisitionToPO(requisition.id, command.vendorId);
      
      // Step 8: Send PO to vendor
      yield* procurementPort.sendPurchaseOrder(po.id);
      
      return {
        requisitionId: requisition.id,
        requisitionNumber: requisition.requisitionNumber,
        poId: po.id,
        poNumber: po.poNumber,
        vendorId: command.vendorId,
        totalAmount,
        approvalStatus: 'converted_to_po',
        requiresApproval: false,
        itemsOrdered: lineItems.length,
        createdAt: requisition.createdAt.toISOString(),
      };
    } else {
      // Step 6b: Submit for approval workflow
      yield* approvalPort.createApprovalRequest(
        'purchase_requisition',
        requisition.id,
        command.requestorId
      );
      
      return {
        requisitionId: requisition.id,
        requisitionNumber: requisition.requisitionNumber,
        vendorId: command.vendorId,
        totalAmount,
        approvalStatus: 'pending_approval',
        requiresApproval: true,
        itemsOrdered: lineItems.length,
        createdAt: requisition.createdAt.toISOString(),
      };
    }
  });

/**
 * Approve and Convert Requisition to PO
 * 
 * Separate use case for when manager/director approves a requisition
 * and wants to immediately convert it to a PO.
 */
export const approveAndConvertRequisitionToPO = (
  requisitionId: string,
  approverId: string,
  vendorId: string
): Effect.Effect<
  { poId: string; poNumber: string },
  ValidationError | NotFoundError | NetworkError,
  GoProcurementPortService
> =>
  Effect.gen(function* () {
    const procurementPort = yield* GoProcurementPort;
    
    // Step 1: Approve the requisition
    yield* procurementPort.approvePurchaseRequisition(requisitionId, approverId);
    
    // Step 2: Convert to PO
    const po = yield* procurementPort.convertRequisitionToPO(requisitionId, vendorId);
    
    // Step 3: Send PO to vendor
    yield* procurementPort.sendPurchaseOrder(po.id);
    
    return {
      poId: po.id,
      poNumber: po.poNumber,
    };
  });
