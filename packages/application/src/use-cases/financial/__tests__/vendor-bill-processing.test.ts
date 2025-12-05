/**
 * Vendor Bill Processing Use Case Tests
 * 
 * Tests for AP bill processing, 3-way match validation, and OCR scanning.
 */

import { describe, it, expect } from 'vitest';
import { Effect, Either, Layer } from 'effect';
import {
  createVendorBill,
  processOCRBill,
  validate3WayMatch,
  type CreateVendorBillCommand,
  type ProcessOCRBillCommand,
} from '../vendor-bill-processing';
import { GoFinancialPort, type GoFinancialPortService } from '../../../ports/go-financial-port';
import { GoProcurementPort, type GoProcurementPortService } from '../../../ports/go-procurement-port';
import type {
  GoPurchaseOrder,
  GoReceipt,
  GoVendorBill,
  CreateVendorBillCommand as GoCreateVendorBillCommand,
} from '@dykstra/application';
import { ValidationError } from '@dykstra/domain';

describe('Vendor Bill Processing', () => {
  describe('createVendorBill', () => {
    it('should create vendor bill without PO (no 3-way match)', async () => {
      const command: CreateVendorBillCommand = {
        vendorId: 'vendor-001',
        billDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        billNumber: 'INV-2025-001',
        lineItems: [
          {
            description: 'Office supplies',
            quantity: 5,
            unitPrice: 20.00,
            glAccountId: 'gl-office-supplies',
          },
          {
            description: 'Cleaning services',
            quantity: 1,
            unitPrice: 150.00,
            glAccountId: 'gl-cleaning',
          },
        ],
        notes: 'Monthly office supplies and cleaning',
        createdBy: 'user-001',
      };

      // Mock port
      const mockFinancialPort: GoFinancialPortService = {
        createVendorBill: (cmd: GoCreateVendorBillCommand) =>
          Effect.succeed({
            id: 'bill-001',
            billNumber: cmd.billNumber || 'INV-2025-001',
            vendorId: cmd.vendorId,
            vendorName: 'ABC Supplies Inc',
            billDate: cmd.billDate,
            dueDate: cmd.dueDate,
            status: 'pending_approval',
            lineItems: cmd.lineItems.map((item, idx) => ({
              id: `line-${idx}`,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              glAccountId: item.glAccountId,
              matchedToPO: false,
            })),
            subtotal: 250.00,
            taxAmount: 0,
            totalAmount: 250.00,
            amountPaid: 0,
            amountDue: 250.00,
            purchaseOrderId: cmd.purchaseOrderId,
            ocrExtracted: false,
            createdAt: new Date(),
          } as GoVendorBill),
      } as GoFinancialPortService;

      // Mock procurement port (not needed for bills without PO)
      const mockProcurementPort: GoProcurementPortService = {} as GoProcurementPortService;

      // Execute
      const program = createVendorBill(command);
      const testLayer = Layer.merge(
        Layer.succeed(GoFinancialPort, mockFinancialPort),
        Layer.succeed(GoProcurementPort, mockProcurementPort)
      );
      const result = await Effect.runPromise(
        Effect.provide(program, testLayer)
      );

      // Verify
      expect(result).toBeDefined();
      expect(result.billId).toBe('bill-001');
      expect(result.billNumber).toBe('INV-2025-001');
      expect(result.totalAmount).toBe(250.00); // 5*20 + 1*150
      expect(result.matchStatus).toBe('not-applicable'); // No PO
      expect(result.approvalStatus).toBe('pending_approval'); // No 3-way match
    });

    it('should create vendor bill with PO (3-way match)', async () => {
      const command: CreateVendorBillCommand = {
        vendorId: 'vendor-001',
        purchaseOrderId: 'po-001', // With PO
        billDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        billNumber: 'INV-2025-002',
        lineItems: [
          {
            description: 'Caskets (model X)',
            quantity: 2,
            unitPrice: 1500.00,
            glAccountId: 'gl-inventory',
            poLineItemId: 'po-line-001',
          },
        ],
        notes: 'Casket order matching PO-001',
        createdBy: 'user-001',
      };

      // Mock port
      const mockFinancialPort: GoFinancialPortService = {
        createVendorBill: (cmd: GoCreateVendorBillCommand) =>
          Effect.succeed({
            id: 'bill-002',
            billNumber: cmd.billNumber || 'INV-2025-002',
            vendorId: cmd.vendorId,
            vendorName: 'Premium Caskets LLC',
            billDate: cmd.billDate,
            dueDate: cmd.dueDate,
            status: 'approved', // Auto-approved due to 3-way match
            lineItems: cmd.lineItems.map((item, idx) => ({
              id: `line-${idx}`,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              glAccountId: item.glAccountId,
              matchedToPO: true,
            })),
            subtotal: 3000.00,
            taxAmount: 0,
            totalAmount: 3000.00,
            amountPaid: 0,
            amountDue: 3000.00,
            purchaseOrderId: cmd.purchaseOrderId,
            ocrExtracted: false,
            createdAt: new Date(),
          } as GoVendorBill),
      } as GoFinancialPortService;

      // Mock procurement port with PO and receipt data
      const mockPO: GoPurchaseOrder = {
        id: 'po-001',
        poNumber: 'PO-2025-001',
        vendorId: 'vendor-001',
        vendorName: 'Premium Caskets LLC',
        orderDate: new Date('2025-01-10'),
        status: 'received',
        lineItems: [
          {
            id: 'po-line-001',
            description: 'Caskets (model X)',
            quantity: 2,
            unitPrice: 1500.00,
            totalPrice: 3000.00,
            quantityReceived: 2, // Fully received
            quantityBilled: 0,
            glAccountId: 'gl-inventory',
          },
        ],
        subtotal: 3000.00,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 3000.00,
        createdAt: new Date(),
      };

      const mockReceipts: GoReceipt[] = [
        {
          id: 'receipt-001',
          receiptNumber: 'RCV-2025-001',
          purchaseOrderId: 'po-001',
          poNumber: 'PO-2025-001',
          vendorId: 'vendor-001',
          vendorName: 'Premium Caskets LLC',
          receivedDate: new Date('2025-01-12'),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-001',
              poLineItemId: 'po-line-001',
              description: 'Caskets (model X)',
              quantityOrdered: 2,
              quantityReceived: 2,
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      const mockProcurementPort: GoProcurementPortService = {
        getPurchaseOrder: () => Effect.succeed(mockPO),
        getReceiptsByPurchaseOrder: () => Effect.succeed(mockReceipts),
      } as GoProcurementPortService;

      // Execute
      const program = createVendorBill(command);
      const testLayer = Layer.merge(
        Layer.succeed(GoFinancialPort, mockFinancialPort),
        Layer.succeed(GoProcurementPort, mockProcurementPort)
      );
      const result = await Effect.runPromise(
        Effect.provide(program, testLayer)
      );

      // Verify
      expect(result).toBeDefined();
      expect(result.billId).toBe('bill-002');
      expect(result.totalAmount).toBe(3000.00); // 2*1500
      expect(result.matchStatus).toBe('3-way-match'); // Has PO
      expect(result.approvalStatus).toBe('auto-approved'); // Simplified: auto-approve if PO
    });

    it('should fail if line items are empty', async () => {
      const command: CreateVendorBillCommand = {
        vendorId: 'vendor-001',
        billDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        billNumber: 'INV-2025-003',
        lineItems: [], // Empty!
        createdBy: 'user-001',
      };

      // Mock port (should not be called)
      const mockFinancialPort: GoFinancialPortService = {
        createVendorBill: () => Effect.succeed({} as GoVendorBill),
      } as GoFinancialPortService;

      // Mock procurement port
      const mockProcurementPort: GoProcurementPortService = {} as GoProcurementPortService;

      // Execute
      const program = createVendorBill(command);
      const testLayer = Layer.merge(
        Layer.succeed(GoFinancialPort, mockFinancialPort),
        Layer.succeed(GoProcurementPort, mockProcurementPort)
      );
      const result = await Effect.runPromise(
        Effect.either(
          Effect.provide(program, testLayer)
        )
      );

      // Verify failure
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toContain('at least one line item');
      }
    });

    it('should fail if line item has negative quantity', async () => {
      const command: CreateVendorBillCommand = {
        vendorId: 'vendor-001',
        billDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        billNumber: 'INV-2025-004',
        lineItems: [
          {
            description: 'Invalid item',
            quantity: -5, // Negative!
            unitPrice: 20.00,
            glAccountId: 'gl-misc',
          },
        ],
        createdBy: 'user-001',
      };

      // Mock port
      const mockFinancialPort: GoFinancialPortService = {
        createVendorBill: () => Effect.succeed({} as GoVendorBill),
      } as GoFinancialPortService;

      // Mock procurement port
      const mockProcurementPort: GoProcurementPortService = {} as GoProcurementPortService;

      // Execute
      const program = createVendorBill(command);
      const testLayer = Layer.merge(
        Layer.succeed(GoFinancialPort, mockFinancialPort),
        Layer.succeed(GoProcurementPort, mockProcurementPort)
      );
      const result = await Effect.runPromise(
        Effect.either(
          Effect.provide(program, testLayer)
        )
      );

      // Verify failure
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toContain('positive');
      }
    });

    it('should fail if line item has zero unit price', async () => {
      const command: CreateVendorBillCommand = {
        vendorId: 'vendor-001',
        billDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        billNumber: 'INV-2025-005',
        lineItems: [
          {
            description: 'Free item?',
            quantity: 5,
            unitPrice: 0, // Zero!
            glAccountId: 'gl-misc',
          },
        ],
        createdBy: 'user-001',
      };

      // Mock port
      const mockFinancialPort: GoFinancialPortService = {
        createVendorBill: () => Effect.succeed({} as GoVendorBill),
      } as GoFinancialPortService;

      // Mock procurement port
      const mockProcurementPort: GoProcurementPortService = {} as GoProcurementPortService;

      // Execute
      const program = createVendorBill(command);
      const testLayer = Layer.merge(
        Layer.succeed(GoFinancialPort, mockFinancialPort),
        Layer.succeed(GoProcurementPort, mockProcurementPort)
      );
      const result = await Effect.runPromise(
        Effect.either(
          Effect.provide(program, testLayer)
        )
      );

      // Verify failure
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toContain('positive');
      }
    });

    it('should calculate total amount correctly for multiple line items', async () => {
      const command: CreateVendorBillCommand = {
        vendorId: 'vendor-001',
        billDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        billNumber: 'INV-2025-006',
        lineItems: [
          {
            description: 'Item A',
            quantity: 3,
            unitPrice: 10.50,
            glAccountId: 'gl-001',
          },
          {
            description: 'Item B',
            quantity: 2,
            unitPrice: 25.75,
            glAccountId: 'gl-002',
          },
          {
            description: 'Item C',
            quantity: 1,
            unitPrice: 100.00,
            glAccountId: 'gl-003',
          },
        ],
        createdBy: 'user-001',
      };

      // Mock port
      const mockFinancialPort: GoFinancialPortService = {
        createVendorBill: (cmd: GoCreateVendorBillCommand) =>
          Effect.succeed({
            id: 'bill-006',
            billNumber: cmd.billNumber || 'INV-2025-006',
            vendorId: cmd.vendorId,
            vendorName: 'Multi-Item Supplier',
            billDate: cmd.billDate,
            dueDate: cmd.dueDate,
            status: 'pending_approval',
            lineItems: cmd.lineItems.map((item, idx) => ({
              id: `line-${idx}`,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              glAccountId: item.glAccountId,
              matchedToPO: false,
            })),
            subtotal: 183.00,
            taxAmount: 0,
            totalAmount: 183.00,
            amountPaid: 0,
            amountDue: 183.00,
            ocrExtracted: false,
            createdAt: new Date(),
          } as GoVendorBill),
      } as GoFinancialPortService;

      // Mock procurement port
      const mockProcurementPort: GoProcurementPortService = {} as GoProcurementPortService;

      // Execute
      const program = createVendorBill(command);
      const testLayer = Layer.merge(
        Layer.succeed(GoFinancialPort, mockFinancialPort),
        Layer.succeed(GoProcurementPort, mockProcurementPort)
      );
      const result = await Effect.runPromise(
        Effect.provide(program, testLayer)
      );

      // Verify
      expect(result.totalAmount).toBe(183.00); // 3*10.50 + 2*25.75 + 1*100.00
    });
  });

  describe('processOCRBill', () => {
    it('should return placeholder OCR result (simplified implementation)', async () => {
      const command: ProcessOCRBillCommand = {
        vendorId: 'vendor-001',
        documentUrl: 'https://storage.example.com/bills/bill-001.pdf',
        uploadedBy: 'user-001',
      };

      // Mock port (not used in simplified implementation)
      const mockFinancialPort: GoFinancialPortService = {} as GoFinancialPortService;

      // Execute
      const program = processOCRBill(command);
      const result = await Effect.runPromise(
        Effect.provide(program, Layer.succeed(GoFinancialPort, mockFinancialPort))
      );

      // Verify simplified result
      expect(result).toBeDefined();
      expect(result.confidence).toBe(0);
      expect(result.requiresReview).toBe(true);
      expect(result.lineItems).toEqual([]);
    });
  });

  describe('validate3WayMatch', () => {
    it('should return valid match (simplified implementation)', async () => {
      // Mock port (not used in simplified implementation)
      const mockFinancialPort: GoFinancialPortService = {} as GoFinancialPortService;

      // Mock PO and receipts for validation
      const mockPO: GoPurchaseOrder = {
        id: 'po-001',
        poNumber: 'PO-001',
        vendorId: 'vendor-001',
        vendorName: 'Test Vendor',
        orderDate: new Date(),
        status: 'received',
        lineItems: [
          {
            id: 'po-line-001',
            description: 'Test Item',
            quantity: 2,
            unitPrice: 100.00,
            totalPrice: 200.00,
            quantityReceived: 2,
            quantityBilled: 0,
            glAccountId: 'gl-001',
          },
        ],
        subtotal: 200.00,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 200.00,
        createdAt: new Date(),
      };

      const mockReceipts: GoReceipt[] = [
        {
          id: 'receipt-001',
          receiptNumber: 'RCV-001',
          purchaseOrderId: 'po-001',
          poNumber: 'PO-001',
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          receivedDate: new Date(),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-001',
              poLineItemId: 'po-line-001',
              description: 'Test Item',
              quantityOrdered: 2,
              quantityReceived: 2,
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      // Execute
      const program = validate3WayMatch('po-001', [
        { quantity: 2, unitPrice: 100.00, poLineItemId: 'po-line-001', description: 'Test Item' },
      ], mockPO, mockReceipts);
      const result = await Effect.runPromise(program);

      // Verify: Exact match
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.priceVariance).toBe(0);
      expect(result.quantityVariance).toBe(0);
    });

    it('should accept price variance within +5% tolerance', async () => {
      const mockPO: GoPurchaseOrder = {
        id: 'po-002',
        poNumber: 'PO-002',
        vendorId: 'vendor-001',
        vendorName: 'Test Vendor',
        orderDate: new Date(),
        status: 'received',
        lineItems: [
          {
            id: 'po-line-002',
            description: 'Item with slight price increase',
            quantity: 10,
            unitPrice: 100.00, // PO price
            totalPrice: 1000.00,
            quantityReceived: 10,
            quantityBilled: 0,
            glAccountId: 'gl-001',
          },
        ],
        subtotal: 1000.00,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 1000.00,
        createdAt: new Date(),
      };

      const mockReceipts: GoReceipt[] = [
        {
          id: 'receipt-002',
          receiptNumber: 'RCV-002',
          purchaseOrderId: 'po-002',
          poNumber: 'PO-002',
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          receivedDate: new Date(),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-002',
              poLineItemId: 'po-line-002',
              description: 'Item with slight price increase',
              quantityOrdered: 10,
              quantityReceived: 10,
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      // Bill: $104.00 per unit (+4% variance, within ±5% tolerance)
      const program = validate3WayMatch('po-002', [
        { quantity: 10, unitPrice: 104.00, poLineItemId: 'po-line-002', description: 'Item with slight price increase' },
      ], mockPO, mockReceipts);
      const result = await Effect.runPromise(program);

      // Verify: Within tolerance
      expect(result.isValid).toBe(true);
      expect(result.priceVariance).toBe(40); // 10 units * $4.00 variance = $40
      expect(result.quantityVariance).toBe(0);
    });

    it('should reject price variance exceeding +5% tolerance', async () => {
      const mockPO: GoPurchaseOrder = {
        id: 'po-003',
        poNumber: 'PO-003',
        vendorId: 'vendor-001',
        vendorName: 'Test Vendor',
        orderDate: new Date(),
        status: 'received',
        lineItems: [
          {
            id: 'po-line-003',
            description: 'Item with excessive price increase',
            quantity: 10,
            unitPrice: 100.00, // PO price
            totalPrice: 1000.00,
            quantityReceived: 10,
            quantityBilled: 0,
            glAccountId: 'gl-001',
          },
        ],
        subtotal: 1000.00,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 1000.00,
        createdAt: new Date(),
      };

      const mockReceipts: GoReceipt[] = [
        {
          id: 'receipt-003',
          receiptNumber: 'RCV-003',
          purchaseOrderId: 'po-003',
          poNumber: 'PO-003',
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          receivedDate: new Date(),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-003',
              poLineItemId: 'po-line-003',
              description: 'Item with excessive price increase',
              quantityOrdered: 10,
              quantityReceived: 10,
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      // Bill: $110.00 per unit (+10% variance, exceeds ±5% tolerance)
      const program = validate3WayMatch('po-003', [
        { quantity: 10, unitPrice: 110.00, poLineItemId: 'po-line-003', description: 'Item with excessive price increase' },
      ], mockPO, mockReceipts);
      const result = await Effect.runPromise(program);

      // Verify: Outside tolerance - requires manual approval
      expect(result.isValid).toBe(false);
      expect(result.priceVariance).toBe(100); // 10 units * $10.00 variance = $100
      expect(result.quantityVariance).toBe(0);
    });

    it('should reject bill quantity exceeding received quantity', async () => {
      const mockPO: GoPurchaseOrder = {
        id: 'po-004',
        poNumber: 'PO-004',
        vendorId: 'vendor-001',
        vendorName: 'Test Vendor',
        orderDate: new Date(),
        status: 'partial',
        lineItems: [
          {
            id: 'po-line-004',
            description: 'Partially received item',
            quantity: 10,
            unitPrice: 50.00,
            totalPrice: 500.00,
            quantityReceived: 8, // Only 8 received
            quantityBilled: 0,
            glAccountId: 'gl-001',
          },
        ],
        subtotal: 500.00,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 500.00,
        createdAt: new Date(),
      };

      // Receipt: Only 8 units received
      const mockReceipts: GoReceipt[] = [
        {
          id: 'receipt-004',
          receiptNumber: 'RCV-004',
          purchaseOrderId: 'po-004',
          poNumber: 'PO-004',
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          receivedDate: new Date(),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-004',
              poLineItemId: 'po-line-004',
              description: 'Partially received item',
              quantityOrdered: 10,
              quantityReceived: 8, // Short shipment
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      // Bill: Trying to bill for 10 units (2 more than received)
      const program = validate3WayMatch('po-004', [
        { quantity: 10, unitPrice: 50.00, poLineItemId: 'po-line-004', description: 'Partially received item' },
      ], mockPO, mockReceipts);
      const result = await Effect.runPromise(program);

      // Verify: Quantity mismatch - cannot bill more than received
      expect(result.isValid).toBe(false);
      expect(result.priceVariance).toBe(0);
      expect(result.quantityVariance).toBe(2); // Billed 10 - received 8 = 2
    });

    it('should handle multiple receipts for same PO line', async () => {
      const mockPO: GoPurchaseOrder = {
        id: 'po-005',
        poNumber: 'PO-005',
        vendorId: 'vendor-001',
        vendorName: 'Test Vendor',
        orderDate: new Date(),
        status: 'received',
        lineItems: [
          {
            id: 'po-line-005',
            description: 'Item delivered in 3 shipments',
            quantity: 100,
            unitPrice: 25.00,
            totalPrice: 2500.00,
            quantityReceived: 100,
            quantityBilled: 0,
            glAccountId: 'gl-001',
          },
        ],
        subtotal: 2500.00,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 2500.00,
        createdAt: new Date(),
      };

      // Receipts: 3 partial shipments (60 + 30 + 10 = 100 total)
      const mockReceipts: GoReceipt[] = [
        {
          id: 'receipt-005a',
          receiptNumber: 'RCV-005A',
          purchaseOrderId: 'po-005',
          poNumber: 'PO-005',
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          receivedDate: new Date('2025-01-10'),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-005a',
              poLineItemId: 'po-line-005',
              description: 'Item delivered in 3 shipments',
              quantityOrdered: 100,
              quantityReceived: 60,
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date('2025-01-10'),
        },
        {
          id: 'receipt-005b',
          receiptNumber: 'RCV-005B',
          purchaseOrderId: 'po-005',
          poNumber: 'PO-005',
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          receivedDate: new Date('2025-01-15'),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-005b',
              poLineItemId: 'po-line-005',
              description: 'Item delivered in 3 shipments',
              quantityOrdered: 100,
              quantityReceived: 30,
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date('2025-01-15'),
        },
        {
          id: 'receipt-005c',
          receiptNumber: 'RCV-005C',
          purchaseOrderId: 'po-005',
          poNumber: 'PO-005',
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          receivedDate: new Date('2025-01-20'),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-005c',
              poLineItemId: 'po-line-005',
              description: 'Item delivered in 3 shipments',
              quantityOrdered: 100,
              quantityReceived: 10,
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date('2025-01-20'),
        },
      ];

      // Bill: 100 units (matches total received across all shipments)
      const program = validate3WayMatch('po-005', [
        { quantity: 100, unitPrice: 25.00, poLineItemId: 'po-line-005', description: 'Item delivered in 3 shipments' },
      ], mockPO, mockReceipts);
      const result = await Effect.runPromise(program);

      // Verify: Valid (sums all receipts)
      expect(result.isValid).toBe(true);
      expect(result.priceVariance).toBe(0);
      expect(result.quantityVariance).toBe(0);
    });

    it('should reject when both price and quantity variances exist', async () => {
      const mockPO: GoPurchaseOrder = {
        id: 'po-006',
        poNumber: 'PO-006',
        vendorId: 'vendor-001',
        vendorName: 'Test Vendor',
        orderDate: new Date(),
        status: 'partial',
        lineItems: [
          {
            id: 'po-line-006',
            description: 'Item with multiple variances',
            quantity: 50,
            unitPrice: 20.00, // PO price
            totalPrice: 1000.00,
            quantityReceived: 45,
            quantityBilled: 0,
            glAccountId: 'gl-001',
          },
        ],
        subtotal: 1000.00,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 1000.00,
        createdAt: new Date(),
      };

      // Receipt: 45 units received (short shipment)
      const mockReceipts: GoReceipt[] = [
        {
          id: 'receipt-006',
          receiptNumber: 'RCV-006',
          purchaseOrderId: 'po-006',
          poNumber: 'PO-006',
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          receivedDate: new Date(),
          receivedBy: 'user-001',
          lineItems: [
            {
              id: 'receipt-line-006',
              poLineItemId: 'po-line-006',
              description: 'Item with multiple variances',
              quantityOrdered: 50,
              quantityReceived: 45,
              quantityRejected: 0,
            },
          ],
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      // Bill: 50 units @ $22.00 (qty exceeds received + price exceeds tolerance)
      const program = validate3WayMatch('po-006', [
        { quantity: 50, unitPrice: 22.00, poLineItemId: 'po-line-006', description: 'Item with multiple variances' },
      ], mockPO, mockReceipts);
      const result = await Effect.runPromise(program);

      // Verify: Both variances detected
      expect(result.isValid).toBe(false);
      expect(result.priceVariance).toBe(100); // 50 * ($22 - $20) = $100
      expect(result.quantityVariance).toBe(5); // Billed 50 - received 45 = 5
    });
  });
});
