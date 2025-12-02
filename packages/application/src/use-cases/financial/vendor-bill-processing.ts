/**
 * Vendor Bill Processing (AP) Use Case
 * 
 * Handles accounts payable bill processing with 3-way match validation and OCR support.
 * 
 * Common scenarios:
 * - Manual bill entry with PO validation
 * - OCR bill scanning from PDF/image
 * - 3-way match: PO → Receipt → Bill
 * - Bill approval workflow
 * 
 * Business Rules:
 * - 3-way match validation: Bill must match PO and receipt (quantity, price)
 * - Bills require approval before payment
 * - OCR extraction requires manual review/correction
 * - GL entries created on approval
 * - Variance tolerance: ±5% for price differences
 * 
 * GL Entries (on approval):
 * - DR: Expense account (from PO line items)
 * - CR: Accounts Payable (vendor liability)
 * 
 * @module use-cases/financial/vendor-bill-processing
 */

import { Effect, Context } from 'effect';
import type {
  GoFinancialPortService,
  GoProcurementPortService,
} from '@dykstra/application';
import { ValidationError, type NotFoundError } from '@dykstra/domain';
import { type NetworkError } from '../../ports/go-contract-port';

/**
 * Command to create vendor bill from PO
 */
/**
 * Vendor Bill Processing
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

export interface CreateVendorBillCommand {
  /** Vendor ID */
  vendorId: string;
  /** Purchase Order ID for 3-way match */
  purchaseOrderId?: string;
  /** Bill date */
  billDate: Date;
  /** Due date */
  dueDate: Date;
  /** Bill number from vendor */
  billNumber: string;
  /** Line items */
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    glAccountId: string;
    poLineItemId?: string; // For 3-way match
  }>;
  /** Notes */
  notes?: string;
  /** Created by user ID */
  createdBy: string;
}

/**
 * Command to process OCR bill
 */
export interface ProcessOCRBillCommand {
  /** Vendor ID */
  vendorId: string;
  /** Storage key or URL for bill document */
  documentUrl: string;
  /** User who uploaded */
  uploadedBy: string;
}

/**
 * Result of OCR extraction
 */
export interface OCRExtractionResult {
  /** Extracted vendor name */
  vendorName?: string;
  /** Extracted bill number */
  billNumber?: string;
  /** Extracted bill date */
  billDate?: Date;
  /** Extracted due date */
  dueDate?: Date;
  /** Extracted line items */
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  /** Extracted total */
  totalAmount?: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Requires manual review */
  requiresReview: boolean;
}

/**
 * Result of vendor bill creation
 */
export interface CreateVendorBillResult {
  /** Bill ID */
  billId: string;
  /** Bill number */
  billNumber: string;
  /** Total amount */
  totalAmount: number;
  /** 3-way match status */
  matchStatus: '3-way-match' | '2-way-match' | 'no-match' | 'not-applicable';
  /** Variance details if any */
  variance?: {
    priceVariance: number;
    quantityVariance: number;
  };
  /** Approval status */
  approvalStatus: 'pending_approval' | 'auto-approved';
  /** Created at */
  createdAt: Date;
}

/**
 * GoFinancialPort tag for dependency injection
 */
export const GoFinancialPort = Context.GenericTag<GoFinancialPortService>(
  '@dykstra/GoFinancialPort'
);

/**
 * GoProcurementPort tag for dependency injection
 */
export const GoProcurementPort = Context.GenericTag<GoProcurementPortService>(
  '@dykstra/GoProcurementPort'
);

/**
 * Create vendor bill with optional 3-way match validation
 * 
 * This use case:
 * 1. Validates bill line items
 * 2. Performs 3-way match if PO provided (PO → Receipt → Bill)
 * 3. Creates vendor bill in Go backend
 * 4. Determines approval requirement based on match status
 * 
 * @param command - Vendor bill creation command
 * @returns Effect with bill creation result
 */
export const createVendorBill = (
  command: CreateVendorBillCommand
): Effect.Effect<CreateVendorBillResult, ValidationError | NotFoundError | NetworkError, GoFinancialPortService | GoProcurementPortService> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;
    const procurementPort = yield* GoProcurementPort;

    // 1. Validate line items
    if (command.lineItems.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Vendor bill must have at least one line item',
          field: 'lineItems',
        })
      );
    }

    // Validate amounts are positive
    for (const item of command.lineItems) {
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Line item quantity and price must be positive',
            field: 'lineItems',
          })
        );
      }
    }

    // 2. Calculate total
    const totalAmount = command.lineItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );

    // 3. Perform 3-way match if PO provided
    let matchStatus: '3-way-match' | '2-way-match' | 'no-match' | 'not-applicable' = 'not-applicable';
    let variance: { priceVariance: number; quantityVariance: number } | undefined;
    
    if (command.purchaseOrderId) {
      // Fetch PO with line items and receipts
      const po = yield* procurementPort.getPurchaseOrder(command.purchaseOrderId);
      const receipts = yield* procurementPort.getReceiptsByPurchaseOrder(command.purchaseOrderId);
      
      // Perform 3-way match validation
      const matchResult = yield* validate3WayMatch(command.purchaseOrderId, command.lineItems, po, receipts);
      
      matchStatus = matchResult.isValid ? '3-way-match' : 'no-match';
      variance = {
        priceVariance: matchResult.priceVariance,
        quantityVariance: matchResult.quantityVariance,
      };
    }

    // 4. Create vendor bill via Go backend
    const vendorBill = yield* financialPort.createVendorBill({
      vendorId: command.vendorId,
      billDate: command.billDate,
      dueDate: command.dueDate,
      billNumber: command.billNumber,
      purchaseOrderId: command.purchaseOrderId,
      lineItems: command.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        glAccountId: item.glAccountId,
      })),
    });

    // 5. Determine approval status
    // Auto-approve if 3-way match within tolerance
    const approvalStatus: 'pending_approval' | 'auto-approved' = 
      matchStatus === '3-way-match' ? 'auto-approved' : 'pending_approval';

    return {
      billId: vendorBill.id,
      billNumber: vendorBill.billNumber,
      totalAmount,
      matchStatus,
      variance,
      approvalStatus,
      createdAt: new Date(),
    };
  });

/**
 * Process vendor bill with OCR extraction
 * 
 * This use case:
 * 1. Uploads bill document to storage
 * 2. Calls OCR service (e.g., Azure Form Recognizer)
 * 3. Extracts bill data (vendor, date, items, total)
 * 4. Creates draft bill for manual review
 * 
 * @param command - OCR bill processing command
 * @returns Effect with extraction result
 */
export const processOCRBill = (
  _command: ProcessOCRBillCommand
): Effect.Effect<OCRExtractionResult, ValidationError | NetworkError, GoFinancialPortService> =>
  Effect.gen(function* () {
    // ⚠️ TECHNICAL DEBT: Simplified implementation - financialPort not yet used
    // const financialPort = yield* GoFinancialPort;

    // ⚠️ TECHNICAL DEBT: Simplified implementation for Phase 6
    // Missing Go backend methods: uploadAndScanBill() with OCR integration
    // See: docs/PHASE_6_TECHNICAL_DEBT.md
    // In production, would:
    // 1. Upload document to storage
    // 2. Call Azure Form Recognizer or similar OCR service
    // 3. Parse extracted fields
    // 4. Calculate confidence scores
    // 5. Create draft bill with extracted data

    // Simplified: Return placeholder OCR result
    // In production, this would call the actual OCR service
    return {
      vendorName: undefined,
      billNumber: undefined,
      billDate: undefined,
      dueDate: undefined,
      lineItems: [],
      totalAmount: undefined,
      confidence: 0,
      requiresReview: true,
    };
  });

/**
 * Validate 3-way match between PO, Receipt, and Bill
 * 
 * Production-grade 3-way match validation with variance tolerance checking.
 * 
 * Matching Rules:
 * - Quantity: Bill qty must not exceed received qty
 * - Price: Bill price must be within ±5% of PO price
 * - Receipt: Goods must be received before bill can be approved
 * 
 * Variance Calculation:
 * - Price variance: ((billPrice - poPrice) / poPrice) * 100
 * - Quantity variance: billQty - receivedQty
 * 
 * Tolerance:
 * - Price: ±5% tolerance (auto-approve within range)
 * - Quantity: No tolerance (bill qty <= received qty)
 * 
 * @param poId - Purchase Order ID
 * @param billLineItems - Bill line items to validate
 * @param po - Purchase order from Go backend
 * @param receipts - Receipts for this PO
 * @returns Effect with match validation result
 */
export const validate3WayMatch = (
  _poId: string,
  billLineItems: Array<{ quantity: number; unitPrice: number; poLineItemId?: string; description: string }>,
  po: import('@dykstra/application').GoPurchaseOrder,
  receipts: readonly import('@dykstra/application').GoReceipt[]
): Effect.Effect<
  { isValid: boolean; priceVariance: number; quantityVariance: number },
  NotFoundError | NetworkError,
  never
> =>
  Effect.gen(function* () {
    const PRICE_TOLERANCE_PERCENT = 5; // ±5% tolerance
    
    let totalPriceVariance = 0;
    let totalQuantityVariance = 0;
    let isValid = true;

    // Build receipt quantity map (sum all receipts per PO line item)
    const receivedQtyMap = new Map<string, number>();
    for (const receipt of receipts) {
      for (const receiptItem of receipt.lineItems) {
        const currentQty = receivedQtyMap.get(receiptItem.poLineItemId) || 0;
        receivedQtyMap.set(receiptItem.poLineItemId, currentQty + receiptItem.quantityReceived);
      }
    }

    // Validate each bill line item
    for (const billItem of billLineItems) {
      if (!billItem.poLineItemId) {
        // No PO line item reference - cannot validate
        isValid = false;
        continue;
      }

      // Find matching PO line item
      const poLine = po.lineItems.find(line => line.id === billItem.poLineItemId);
      if (!poLine) {
        // PO line item not found
        isValid = false;
        continue;
      }

      // Get received quantity for this PO line
      const receivedQty = receivedQtyMap.get(billItem.poLineItemId) || 0;

      // Validate quantity: bill qty cannot exceed received qty
      if (billItem.quantity > receivedQty) {
        isValid = false;
        totalQuantityVariance += billItem.quantity - receivedQty;
      }

      // Validate price: within ±5% tolerance
      const poUnitPrice = poLine.unitPrice;
      const billUnitPrice = billItem.unitPrice;
      
      // Calculate price variance as percentage
      const priceVariancePercent = ((billUnitPrice - poUnitPrice) / poUnitPrice) * 100;
      
      // Check if within tolerance
      if (Math.abs(priceVariancePercent) > PRICE_TOLERANCE_PERCENT) {
        isValid = false;
      }
      
      // Accumulate total variance (absolute difference * quantity)
      totalPriceVariance += (billUnitPrice - poUnitPrice) * billItem.quantity;
    }

    return {
      isValid,
      priceVariance: Math.round(totalPriceVariance), // Rounded to cents
      quantityVariance: totalQuantityVariance,
    };
  });
