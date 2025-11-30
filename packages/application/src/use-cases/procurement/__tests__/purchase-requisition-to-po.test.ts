/**
 * Integration Tests: Purchase Requisition to PO
 * 
 * Tests the complete purchase requisition workflow:
 * - Auto-detect items below reorder point
 * - Create purchase requisition
 * - Route through approval workflow
 * - Convert to purchase order
 * - Send to vendor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect, Context } from 'effect';
import { purchaseRequisitionToPO, approveAndConvertRequisitionToPO } from '../purchase-requisition-to-po';
import { ValidationError } from '@dykstra/domain';
import { 
  GoInventoryPort,
  GoProcurementPort,
  GoApprovalWorkflowPort,
  type GoInventoryPortService,
  type GoProcurementPortService,
  type GoApprovalWorkflowPortService,
} from '@dykstra/application';

describe('Purchase Requisition to PO Integration Tests', () => {
  // Mock port implementations
  const mockInventoryPort: GoInventoryPortService = {
    getItemsBelowReorderPoint: vi.fn(),
    getBalance: vi.fn(),
    // ... other methods stubbed
  } as any;

  const mockProcurementPort: GoProcurementPortService = {
    createPurchaseRequisition: vi.fn(),
    approvePurchaseRequisition: vi.fn(),
    convertRequisitionToPO: vi.fn(),
    sendPurchaseOrder: vi.fn(),
    // ... other methods stubbed
  } as any;

  const mockApprovalPort: GoApprovalWorkflowPortService = {
    createApprovalRequest: vi.fn(),
    // ... other methods stubbed
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path: High-Value Approval Workflow', () => {
    it('should route high-value requisition through approval workflow', async () => {
      // Arrange: Items below reorder point (total will be $12k)
      const mockItems = [
        {
          id: 'item-1',
          sku: 'CASKET-001',
          description: 'Oak Casket',
          category: 'casket',
          currentCost: 1200,
          retailPrice: 3500,
          reorderPoint: 5,
          reorderQuantity: 10,
          glAccountId: '1300',
          status: 'active' as const,
          unitOfMeasure: 'each',
          isSerialTracked: false,
        },
      ];

      const mockBalance = {
        itemId: 'item-1',
        locationId: 'main',
        quantityOnHand: 2,
        quantityReserved: 0,
        quantityAvailable: 2,
        weightedAverageCost: 1200,
      };

      const mockRequisition = {
        id: 'pr-001',
        requisitionNumber: 'PR-2025-001',
        requestedBy: 'user-1',
        department: 'dept-1',
        requestDate: new Date(),
        status: 'draft' as const,
        lineItems: [],
        totalAmount: 3600,
        createdAt: new Date(),
      };

      const mockPO = {
        id: 'po-001',
        poNumber: 'PO-2025-001',
        vendorId: 'vendor-1',
        vendorName: 'Casket Supplier Inc',
        orderDate: new Date(),
        status: 'draft' as const,
        lineItems: [],
        subtotal: 3600,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 3600,
        createdAt: new Date(),
      };

      vi.mocked(mockInventoryPort.getItemsBelowReorderPoint).mockReturnValue(
        Effect.succeed(mockItems)
      );

      vi.mocked(mockInventoryPort.getBalance).mockReturnValue(
        Effect.succeed(mockBalance)
      );

      vi.mocked(mockProcurementPort.createPurchaseRequisition).mockReturnValue(
        Effect.succeed(mockRequisition)
      );

      vi.mocked(mockProcurementPort.approvePurchaseRequisition).mockReturnValue(
        Effect.succeed(void 0)
      );

      vi.mocked(mockProcurementPort.convertRequisitionToPO).mockReturnValue(
        Effect.succeed(mockPO)
      );

      vi.mocked(mockProcurementPort.sendPurchaseOrder).mockReturnValue(
        Effect.succeed(void 0)
      );

      // Mock approval port (needed because calculated total will be $12,000)
      vi.mocked(mockApprovalPort.createApprovalRequest).mockReturnValue(
        Effect.succeed({ id: 'approval-1' } as any)
      );

      const command = {
        requestorId: 'user-1',
        departmentId: 'dept-1',
        vendorId: 'vendor-1',
        locationId: 'main',
        autoApprove: true, // Will be ignored due to high value
      };

      // Act
      const program = purchaseRequisitionToPO(command);
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(GoInventoryPort, mockInventoryPort),
          Effect.provideService(GoProcurementPort, mockProcurementPort),
          Effect.provideService(GoApprovalWorkflowPort, mockApprovalPort)
        )
      );

      // Assert
      // Note: Calculated total is $12,000 (10 units × $1,200), which exceeds $5k threshold
      // So this will require approval even with autoApprove=true
      expect(result.requisitionId).toBe('pr-001');
      expect(result.poId).toBeUndefined(); // No PO created (needs approval)
      expect(result.approvalStatus).toBe('pending_approval');
      expect(result.requiresApproval).toBe(true);
      expect(result.totalAmount).toBe(12000); // 10 × $1,200

      // Verify workflow execution
      expect(mockInventoryPort.getItemsBelowReorderPoint).toHaveBeenCalledTimes(1);
      expect(mockInventoryPort.getBalance).toHaveBeenCalled();
      expect(mockProcurementPort.createPurchaseRequisition).toHaveBeenCalled();
      expect(mockApprovalPort.createApprovalRequest).toHaveBeenCalledWith(
        'purchase_requisition',
        'pr-001',
        'user-1'
      );
      // Should NOT auto-approve due to high value
      expect(mockProcurementPort.approvePurchaseRequisition).not.toHaveBeenCalled();
      expect(mockProcurementPort.convertRequisitionToPO).not.toHaveBeenCalled();
      expect(mockProcurementPort.sendPurchaseOrder).not.toHaveBeenCalled();
    });

    it('should calculate correct reorder quantities based on current balance', async () => {
      // Arrange: Item significantly below reorder point
      const mockItem = {
        id: 'item-1',
        sku: 'URN-001',
        description: 'Brass Urn',
        category: 'urn',
        currentCost: 200,
        retailPrice: 600,
        reorderPoint: 10,
        reorderQuantity: 20,
        glAccountId: '1310',
        status: 'active' as const,
        unitOfMeasure: 'each',
        isSerialTracked: false,
      };

      const mockBalance = {
        itemId: 'item-1',
        locationId: 'main',
        quantityOnHand: 3, // Far below reorder point of 10
        quantityReserved: 0,
        quantityAvailable: 3,
        weightedAverageCost: 200,
      };

      vi.mocked(mockInventoryPort.getItemsBelowReorderPoint).mockReturnValue(
        Effect.succeed([mockItem])
      );

      vi.mocked(mockInventoryPort.getBalance).mockReturnValue(
        Effect.succeed(mockBalance)
      );

      let capturedRequisitionCommand: any;
      vi.mocked(mockProcurementPort.createPurchaseRequisition).mockImplementation((cmd) => {
        capturedRequisitionCommand = cmd;
        return Effect.succeed({
          id: 'pr-002',
          requisitionNumber: 'PR-2025-002',
          requestedBy: cmd.requestedBy,
          department: cmd.department,
          requestDate: new Date(),
          status: 'draft' as const,
          lineItems: [],
          totalAmount: 0,
          createdAt: new Date(),
        });
      });

      vi.mocked(mockProcurementPort.approvePurchaseRequisition).mockReturnValue(Effect.succeed(void 0));
      vi.mocked(mockProcurementPort.convertRequisitionToPO).mockReturnValue(Effect.succeed({} as any));
      vi.mocked(mockProcurementPort.sendPurchaseOrder).mockReturnValue(Effect.succeed(void 0));

      const command = {
        requestorId: 'user-1',
        departmentId: 'dept-1',
        vendorId: 'vendor-1',
        locationId: 'main',
        autoApprove: true,
      };

      // Act
      const program = purchaseRequisitionToPO(command);
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(GoInventoryPort, mockInventoryPort),
          Effect.provideService(GoProcurementPort, mockProcurementPort),
          Effect.provideService(GoApprovalWorkflowPort, mockApprovalPort)
        )
      );

      // Assert
      // Reorder calculation: suggestedQty = max(ceil((10 * 1.5) - 3), 20) = max(ceil(12), 20) = 20
      expect(capturedRequisitionCommand).toBeDefined();
      expect(capturedRequisitionCommand.lineItems[0].quantity).toBe(20);
      expect(result.totalAmount).toBe(4000); // 20 × $200
      expect(result.approvalStatus).toBe('converted_to_po'); // Auto-approved (< $5k)
    });
  });

  describe('Approval Workflow Path', () => {
    it('should route high-value requisition through approval workflow', async () => {
      // Arrange: High-value items requiring approval
      const mockItem = {
        id: 'item-1',
        sku: 'VAULT-001',
        description: 'Premium Burial Vault',
        category: 'vault',
        currentCost: 2500,
        retailPrice: 5000,
        reorderPoint: 3,
        reorderQuantity: 5,
        glAccountId: '1320',
        status: 'active' as const,
        unitOfMeasure: 'each',
        isSerialTracked: false,
      };

      const mockBalance = {
        itemId: 'item-1',
        locationId: 'main',
        quantityOnHand: 1,
        quantityReserved: 0,
        quantityAvailable: 1,
        weightedAverageCost: 2500,
      };

      vi.mocked(mockInventoryPort.getItemsBelowReorderPoint).mockReturnValue(
        Effect.succeed([mockItem])
      );

      vi.mocked(mockInventoryPort.getBalance).mockReturnValue(
        Effect.succeed(mockBalance)
      );

      vi.mocked(mockProcurementPort.createPurchaseRequisition).mockReturnValue(
        Effect.succeed({
          id: 'pr-003',
          requisitionNumber: 'PR-2025-003',
          requestedBy: 'user-1',
          department: 'dept-1',
          requestDate: new Date(),
          status: 'pending_approval' as const,
          lineItems: [],
          totalAmount: 12500, // 5 units * $2500 = $12,500 (exceeds $5k threshold)
          createdAt: new Date(),
        })
      );

      vi.mocked(mockApprovalPort.createApprovalRequest).mockReturnValue(
        Effect.succeed({ id: 'approval-1' } as any)
      );

      const command = {
        requestorId: 'user-1',
        departmentId: 'dept-1',
        vendorId: 'vendor-1',
        locationId: 'main',
        autoApprove: false, // No auto-approval for high values
      };

      // Act
      const program = purchaseRequisitionToPO(command);
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(GoInventoryPort, mockInventoryPort),
          Effect.provideService(GoProcurementPort, mockProcurementPort),
          Effect.provideService(GoApprovalWorkflowPort, mockApprovalPort)
        )
      );

      // Assert
      expect(result.approvalStatus).toBe('pending_approval');
      expect(result.requiresApproval).toBe(true);
      expect(result.poId).toBeUndefined(); // No PO created yet
      expect(mockApprovalPort.createApprovalRequest).toHaveBeenCalledWith(
        'purchase_requisition',
        'pr-003',
        'user-1'
      );
    });
  });

  describe('Error Handling', () => {
    it('should fail gracefully when no items below reorder point', async () => {
      // Arrange
      vi.mocked(mockInventoryPort.getItemsBelowReorderPoint).mockReturnValue(
        Effect.succeed([])
      );

      const command = {
        requestorId: 'user-1',
        departmentId: 'dept-1',
        vendorId: 'vendor-1',
        autoApprove: true,
      };

      // Act & Assert
      const program = purchaseRequisitionToPO(command);
      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(GoInventoryPort, mockInventoryPort),
            Effect.provideService(GoProcurementPort, mockProcurementPort),
            Effect.provideService(GoApprovalWorkflowPort, mockApprovalPort)
          )
        )
      ).rejects.toThrow();
    });

    it('should handle network errors from Go backend gracefully', async () => {
      // Arrange: Simulate network failure
      const networkError: NetworkError = {
        _tag: 'NetworkError',
        message: 'Connection timeout to Go ERP backend',
        name: 'NetworkError',
      };

      vi.mocked(mockInventoryPort.getItemsBelowReorderPoint).mockReturnValue(
        Effect.fail(networkError)
      );

      const command = {
        requestorId: 'user-1',
        departmentId: 'dept-1',
        vendorId: 'vendor-1',
        autoApprove: true,
      };

      // Act & Assert
      const program = purchaseRequisitionToPO(command);
      
      // Verify that network errors propagate correctly
      await expect(
        Effect.runPromise(
          program.pipe(
            Effect.provideService(GoInventoryPort, mockInventoryPort),
            Effect.provideService(GoProcurementPort, mockProcurementPort),
            Effect.provideService(GoApprovalWorkflowPort, mockApprovalPort)
          )
        )
      ).rejects.toThrow(); // Any error throw is fine - Effect wraps errors
    });
  });

  describe('Approve and Convert Workflow', () => {
    it('should approve requisition and convert to PO', async () => {
      // Arrange
      vi.mocked(mockProcurementPort.approvePurchaseRequisition).mockReturnValue(
        Effect.succeed(void 0)
      );

      vi.mocked(mockProcurementPort.convertRequisitionToPO).mockReturnValue(
        Effect.succeed({
          id: 'po-004',
          poNumber: 'PO-2025-004',
          vendorId: 'vendor-1',
          vendorName: 'Test Vendor',
          orderDate: new Date(),
          status: 'sent' as const,
          lineItems: [],
          subtotal: 5000,
          taxAmount: 0,
          shippingAmount: 0,
          totalAmount: 5000,
          createdAt: new Date(),
        })
      );

      vi.mocked(mockProcurementPort.sendPurchaseOrder).mockReturnValue(
        Effect.succeed(void 0)
      );

      // Act
      const program = approveAndConvertRequisitionToPO('pr-003', 'manager-1', 'vendor-1');
      const result = await Effect.runPromise(
        program.pipe(
          Effect.provideService(GoProcurementPort, mockProcurementPort)
        )
      );

      // Assert
      expect(result.poId).toBe('po-004');
      expect(result.poNumber).toBe('PO-2025-004');
      expect(mockProcurementPort.approvePurchaseRequisition).toHaveBeenCalledWith('pr-003', 'manager-1');
      expect(mockProcurementPort.sendPurchaseOrder).toHaveBeenCalledWith('po-004');
    });
  });
});
