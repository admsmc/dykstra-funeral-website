/**
 * Integration Tests: Receive Inventory from PO
 * 
 * Tests the complete inventory receiving workflow:
 * - Validate PO status and received quantities
 * - Record receipt in procurement system
 * - Update inventory with WAC costing
 * - Perform 3-way matching (PO → Receipt → Invoice)
 * - Auto-create AP bills when fully matched
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { receiveInventoryFromPO, getReceiptsByPO } from '../receive-inventory-from-po';
import { ValidationError } from '@dykstra/domain';
import { 
  GoInventoryPort,
  GoProcurementPort,
  GoFinancialPort,
  type GoInventoryPortService,
  type GoProcurementPortService,
  type GoFinancialPortService,
} from '@dykstra/application';

describe('Receive Inventory from PO Integration Tests', () => {
  const mockInventoryPort: GoInventoryPortService = {
    receiveInventory: vi.fn(),
  } as any;

  const mockProcurementPort: GoProcurementPortService = {
    getPurchaseOrder: vi.fn(),
    createReceipt: vi.fn(),
  } as any;

  const mockFinancialPort: GoFinancialPortService = {
    getThreeWayMatchStatus: vi.fn(),
    createVendorBill: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path: Full Receipt with 3-Way Match', () => {
    it('should receive inventory, create receipt, and auto-create AP bill', async () => {
      // Arrange: Open PO ready for receipt
      const mockPO = {
        id: 'po-001',
        poNumber: 'PO-2025-001',
        vendorId: 'vendor-1',
        vendorName: 'Casket Supplier Inc',
        orderDate: new Date(),
        status: 'sent' as const,
        lineItems: [
          {
            id: 'line-1',
            description: 'Oak Casket',
            quantity: 5,
            unitPrice: 1200,
            totalPrice: 6000,
            quantityReceived: 0,
            quantityBilled: 0,
            glAccountId: '1300',
          },
        ],
        subtotal: 6000,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 6000,
        createdAt: new Date(),
      };

      const mockReceipt = {
        id: 'receipt-001',
        receiptNumber: 'REC-2025-001',
        purchaseOrderId: 'po-001',
        poNumber: 'PO-2025-001',
        vendorId: 'vendor-1',
        vendorName: 'Casket Supplier Inc',
        receivedDate: new Date(),
        receivedBy: 'user-1',
        lineItems: [],
        status: 'completed' as const,
        createdAt: new Date(),
      };

      const mockUpdatedPO = {
        ...mockPO,
        lineItems: [
          {
            ...mockPO.lineItems[0],
            quantityReceived: 5, // Fully received
          },
        ],
      };

      const mockThreeWayMatch = {
        billId: '',
        purchaseOrderId: 'po-001',
        receiptId: 'receipt-001',
        poMatched: true,
        receiptMatched: true,
        fullyMatched: true,
        variances: [],
      };

      const mockAPBill = {
        id: 'bill-001',
        billNumber: 'BILL-2025-001',
        vendorId: 'vendor-1',
        vendorName: 'Casket Supplier Inc',
        billDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'approved' as const,
        lineItems: [],
        subtotal: 6000,
        taxAmount: 0,
        totalAmount: 6000,
        amountPaid: 0,
        amountDue: 6000,
        purchaseOrderId: 'po-001',
        ocrExtracted: false,
        createdAt: new Date(),
      };

      vi.mocked(mockProcurementPort.getPurchaseOrder)
        .mockReturnValueOnce(Effect.succeed(mockPO))
        .mockReturnValueOnce(Effect.succeed(mockUpdatedPO));

      vi.mocked(mockProcurementPort.createReceipt).mockReturnValue(
        Effect.succeed(mockReceipt)
      );

      vi.mocked(mockInventoryPort.receiveInventory).mockReturnValue(
        Effect.succeed({} as any)
      );

      vi.mocked(mockFinancialPort.getThreeWayMatchStatus).mockReturnValue(
        Effect.succeed(mockThreeWayMatch)
      );

      vi.mocked(mockFinancialPort.createVendorBill).mockReturnValue(
        Effect.succeed(mockAPBill)
      );

      const command = {
        purchaseOrderId: 'po-001',
        receivedBy: 'user-1',
        receivedDate: new Date().toISOString(),
        locationId: 'main',
        lineItems: [
          {
            poLineItemId: 'line-1',
            quantityReceived: 5,
          },
        ],
        autoCreateAPBill: true,
      };

      // Act
      const program = receiveInventoryFromPO(command);
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(GoInventoryPort, mockInventoryPort),
          Effect.provideService(GoProcurementPort, mockProcurementPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert
      expect(result.receiptId).toBe('receipt-001');
      expect(result.poStatus).toBe('received');
      expect(result.apBillId).toBe('bill-001');
      expect(result.matchStatus).toBe('3-way');
      expect(result.totalItemsReceived).toBe(5);

      // Verify workflow execution
      expect(mockProcurementPort.createReceipt).toHaveBeenCalled();
      expect(mockInventoryPort.receiveInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          locationId: 'main',
          quantity: 5,
          purchaseOrderId: 'po-001',
        })
      );
      expect(mockFinancialPort.getThreeWayMatchStatus).toHaveBeenCalledWith('po-001');
      expect(mockFinancialPort.createVendorBill).toHaveBeenCalled();
    });
  });

  describe('Partial Receipt Workflow', () => {
    it('should handle partial receipt and update PO status to partial', async () => {
      // Arrange: PO with 10 units, receiving only 6
      const mockPO = {
        id: 'po-002',
        poNumber: 'PO-2025-002',
        vendorId: 'vendor-1',
        vendorName: 'Test Vendor',
        orderDate: new Date(),
        status: 'sent' as const,
        lineItems: [
          {
            id: 'line-1',
            description: 'Urn',
            quantity: 10,
            unitPrice: 200,
            totalPrice: 2000,
            quantityReceived: 0,
            quantityBilled: 0,
            glAccountId: '1310',
          },
        ],
        subtotal: 2000,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 2000,
        createdAt: new Date(),
      };

      const mockUpdatedPO = {
        ...mockPO,
        status: 'partial' as const,
        lineItems: [
          {
            ...mockPO.lineItems[0],
            quantityReceived: 6, // Partially received
          },
        ],
      };

      vi.mocked(mockProcurementPort.getPurchaseOrder)
        .mockReturnValueOnce(Effect.succeed(mockPO))
        .mockReturnValueOnce(Effect.succeed(mockUpdatedPO));

      vi.mocked(mockProcurementPort.createReceipt).mockReturnValue(
        Effect.succeed({ id: 'receipt-002', receiptNumber: 'REC-2025-002' } as any)
      );

      vi.mocked(mockInventoryPort.receiveInventory).mockReturnValue(
        Effect.succeed({} as any)
      );

      const command = {
        purchaseOrderId: 'po-002',
        receivedBy: 'user-1',
        receivedDate: new Date().toISOString(),
        locationId: 'main',
        lineItems: [
          {
            poLineItemId: 'line-1',
            quantityReceived: 6, // Only 6 of 10
          },
        ],
        autoCreateAPBill: false,
      };

      // Act
      const program = receiveInventoryFromPO(command);
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(GoInventoryPort, mockInventoryPort),
          Effect.provideService(GoProcurementPort, mockProcurementPort),
          Effect.provideService(GoFinancialPort, mockFinancialPort)
        )
      );

      // Assert
      expect(result.poStatus).toBe('partial');
      expect(result.apBillId).toBeUndefined(); // No bill for partial receipt
      expect(mockFinancialPort.createVendorBill).not.toHaveBeenCalled();
    });
  });

  describe('Validation Rules', () => {
    it('should reject receipt if PO is not in valid status', async () => {
      // Arrange: Closed PO that cannot be received
      vi.mocked(mockProcurementPort.getPurchaseOrder).mockReturnValue(
        Effect.succeed({
          id: 'po-003',
          poNumber: 'PO-2025-003',
          status: 'closed' as const,
          lineItems: [],
        } as any)
      );

      const command = {
        purchaseOrderId: 'po-003',
        receivedBy: 'user-1',
        receivedDate: new Date().toISOString(),
        locationId: 'main',
        lineItems: [],
      };

      // Act & Assert
      const program = receiveInventoryFromPO(command);
      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(GoInventoryPort, mockInventoryPort),
            Effect.provideService(GoProcurementPort, mockProcurementPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });

    it('should reject over-receipt beyond 10% tolerance', async () => {
      // Arrange: Attempt to receive 12 when only 10 ordered (20% over)
      const mockPO = {
        id: 'po-004',
        poNumber: 'PO-2025-004',
        status: 'sent' as const,
        lineItems: [
          {
            id: 'line-1',
            description: 'Item',
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000,
            quantityReceived: 0,
            quantityBilled: 0,
            glAccountId: '1300',
          },
        ],
      } as any;

      vi.mocked(mockProcurementPort.getPurchaseOrder).mockReturnValue(
        Effect.succeed(mockPO)
      );

      const command = {
        purchaseOrderId: 'po-004',
        receivedBy: 'user-1',
        receivedDate: new Date().toISOString(),
        locationId: 'main',
        lineItems: [
          {
            poLineItemId: 'line-1',
            quantityReceived: 12, // 20% over (exceeds 10% tolerance)
          },
        ],
      };

      // Act & Assert
      const program = receiveInventoryFromPO(command);
      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(GoInventoryPort, mockInventoryPort),
            Effect.provideService(GoProcurementPort, mockProcurementPort),
            Effect.provideService(GoFinancialPort, mockFinancialPort)
          )
        )
      ).rejects.toThrow();
    });
  });

  describe('Get Receipts by PO', () => {
    it('should retrieve all receipts for a purchase order', async () => {
      // Arrange
      const mockReceipts = [
        { id: 'receipt-001', receiptNumber: 'REC-2025-001' },
        { id: 'receipt-002', receiptNumber: 'REC-2025-002' },
      ];

      vi.mocked(mockProcurementPort.getReceiptsByPurchaseOrder = vi.fn()).mockReturnValue(
        Effect.succeed(mockReceipts as any)
      );

      // Act
      const program = getReceiptsByPO('po-001');
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(GoProcurementPort, mockProcurementPort)
        )
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('receipt-001');
      expect(mockProcurementPort.getReceiptsByPurchaseOrder).toHaveBeenCalledWith('po-001');
    });
  });
});
