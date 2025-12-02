import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  performInventoryCycleCount,
  type InventoryCycleCountCommand,
} from '../inventory-cycle-count';
import {
  GoInventoryPort,
  type GoInventoryPortService,
  NetworkError,
} from '../../../ports/go-inventory-port';

const baseCommand: InventoryCycleCountCommand = {
  itemId: 'item-123',
  locationId: 'loc-main',
  physicalQuantity: 50,
  countedBy: 'employee-456',
  countDate: new Date('2024-01-15T10:00:00Z'),
  varianceReason: 'Monthly cycle count',
  notes: 'Count performed during slow period',
};

describe('Use Case 7.2: Inventory Cycle Count', () => {
  describe('Happy Paths', () => {
    it('should perform cycle count with no variance', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () =>
          Effect.succeed({
            itemId: 'item-123',
            locationId: 'loc-main',
            locationName: 'Main Warehouse',
            quantityOnHand: 50,
            quantityReserved: 5,
            quantityAvailable: 45,
            weightedAverageCost: 1500,
            totalValue: 75000,
          }),
        adjustInventory: () =>
          Effect.fail(new NetworkError('Should not be called')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        performInventoryCycleCount(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.count.systemQuantity).toBe(50);
      expect(result.count.physicalQuantity).toBe(50);
      expect(result.count.variance).toBe(0);
      expect(result.count.variancePercentage).toBe(0);
      expect(result.count.adjustmentRequired).toBe(false);
      expect(result.count.adjustmentId).toBeUndefined();
      // Verify item details from getItem()
      expect(result.item.id).toBe('item-123');
      expect(result.item.name).toBe('Casket Model A');
      expect(result.item.sku).toBe('CASK-001');
      expect(result.location.name).toBe('Main Warehouse');
    });

    it('should create adjustment for positive variance (overage)', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () =>
          Effect.succeed({
            itemId: 'item-123',
            locationId: 'loc-main',
            locationName: 'Main Warehouse',
            quantityOnHand: 45,
            quantityReserved: 5,
            quantityAvailable: 40,
            weightedAverageCost: 1500,
            totalValue: 67500,
          }),
        adjustInventory: (cmd) => {
          expect(cmd.quantity).toBe(5); // 50 - 45 = +5
          expect(cmd.itemId).toBe('item-123');
          expect(cmd.locationId).toBe('loc-main');
          return Effect.succeed({
            id: 'adj-001',
            itemId: cmd.itemId,
            locationId: cmd.locationId,
            quantity: cmd.quantity,
            transactionType: 'adjust',
            unitCost: 0,
            totalCost: 0,
            postedAt: new Date(),
            createdBy: 'system',
            referenceType: 'cycle_count',
            notes: cmd.notes,
          });
        },
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        performInventoryCycleCount(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.count.systemQuantity).toBe(45);
      expect(result.count.physicalQuantity).toBe(50);
      expect(result.count.variance).toBe(5);
      expect(result.count.variancePercentage).toBe(11.11); // (5/45)*100 rounded
      expect(result.count.adjustmentRequired).toBe(true);
      expect(result.count.adjustmentId).toBe('adj-001');
    });

    it('should create adjustment for negative variance (shortage)', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () =>
          Effect.succeed({
            itemId: 'item-123',
            locationId: 'loc-main',
            locationName: 'Main Warehouse',
            quantityOnHand: 55,
            quantityReserved: 5,
            quantityAvailable: 50,
            weightedAverageCost: 1500,
            totalValue: 82500,
          }),
        adjustInventory: (cmd) => {
          expect(cmd.quantity).toBe(-5); // 50 - 55 = -5
          expect(cmd.itemId).toBe('item-123');
          return Effect.succeed({
            id: 'adj-002',
            itemId: cmd.itemId,
            locationId: cmd.locationId,
            quantity: cmd.quantity,
            transactionType: 'adjust',
            unitCost: 0,
            totalCost: 0,
            postedAt: new Date(),
            createdBy: 'system',
            referenceType: 'cycle_count',
            notes: cmd.notes,
          });
        },
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        performInventoryCycleCount(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.count.systemQuantity).toBe(55);
      expect(result.count.physicalQuantity).toBe(50);
      expect(result.count.variance).toBe(-5);
      expect(result.count.variancePercentage).toBe(-9.09); // (-5/55)*100 rounded
      expect(result.count.adjustmentRequired).toBe(true);
      expect(result.count.adjustmentId).toBe('adj-002');
    });

    it('should handle lot-tracked inventory', async () => {
      const commandWithLot = {
        ...baseCommand,
        lotNumber: 'LOT-2024-001',
      };

      const mockInventoryPort: GoInventoryPortService = {
        getBalance: (itemId, locationId) => {
          // Note: lotNumber is in command but not passed to getBalance per port interface
          expect(itemId).toBe('item-123');
          expect(locationId).toBe('loc-main');
          return Effect.succeed({
            itemId: 'item-123',
            locationId: 'loc-main',
            locationName: 'Main Warehouse',
            quantityOnHand: 50,
            quantityReserved: 0,
            quantityAvailable: 50,
            weightedAverageCost: 1500,
            totalValue: 75000,
          });
        },
        adjustInventory: () => Effect.fail(new NetworkError('Should not be called')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        performInventoryCycleCount(commandWithLot).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.count.variance).toBe(0);
      expect(result.count.adjustmentRequired).toBe(false);
    });
  });

  describe('Validation Errors', () => {
    it('should fail when item ID is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        itemId: '',
      };

      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        adjustInventory: () => Effect.fail(new NetworkError('Should not be called')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        performInventoryCycleCount(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Item ID is required');
    });

    it('should fail when location ID is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        locationId: '',
      };

      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        adjustInventory: () => Effect.fail(new NetworkError('Should not be called')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        performInventoryCycleCount(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Location ID is required');
    });

    it('should fail when physical quantity is negative', async () => {
      const invalidCommand = {
        ...baseCommand,
        physicalQuantity: -5,
      };

      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        adjustInventory: () => Effect.fail(new NetworkError('Should not be called')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        performInventoryCycleCount(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Physical quantity cannot be negative');
    });

    it('should fail when countedBy is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        countedBy: '',
      };

      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        adjustInventory: () => Effect.fail(new NetworkError('Should not be called')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        performInventoryCycleCount(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Counted by user is required');
    });

    it('should fail when count date is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const invalidCommand = {
        ...baseCommand,
        countDate: futureDate,
      };

      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        adjustInventory: () => Effect.fail(new NetworkError('Should not be called')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        performInventoryCycleCount(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Count date cannot be in the future');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero system quantity with positive physical count', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () =>
          Effect.succeed({
            itemId: 'item-123',
            locationId: 'loc-main',
            locationName: 'Main Warehouse',
            quantityOnHand: 0,
            quantityReserved: 0,
            quantityAvailable: 0,
            weightedAverageCost: 1000,
            totalValue: 0,
          }),
        adjustInventory: (cmd) => {
          expect(cmd.quantity).toBe(50);
          return Effect.succeed({
            id: 'adj-003',
            itemId: cmd.itemId,
            locationId: cmd.locationId,
            quantity: cmd.quantity,
            transactionType: 'adjust',
            unitCost: 0,
            totalCost: 0,
            postedAt: new Date(),
            createdBy: 'system',
            referenceType: 'cycle_count',
            notes: cmd.notes,
          });
        },
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        performInventoryCycleCount(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.count.systemQuantity).toBe(0);
      expect(result.count.physicalQuantity).toBe(50);
      expect(result.count.variance).toBe(50);
      expect(result.count.variancePercentage).toBe(100); // Special case: 0 to positive
      expect(result.count.adjustmentRequired).toBe(true);
    });

    it('should handle zero physical count (stockout)', async () => {
      const zeroCountCommand = {
        ...baseCommand,
        physicalQuantity: 0,
      };

      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () =>
          Effect.succeed({
            itemId: 'item-123',
            locationId: 'loc-main',
            locationName: 'Main Warehouse',
            quantityOnHand: 10,
            quantityReserved: 0,
            quantityAvailable: 10,
            weightedAverageCost: 1500,
            totalValue: 15000,
          }),
        adjustInventory: (cmd) => {
          expect(cmd.quantity).toBe(-10); // 0 - 10 = -10
          return Effect.succeed({
            id: 'adj-004',
            itemId: cmd.itemId,
            locationId: cmd.locationId,
            quantity: cmd.quantity,
            transactionType: 'adjust',
            unitCost: 0,
            totalCost: 0,
            postedAt: new Date(),
            createdBy: 'system',
            referenceType: 'cycle_count',
            notes: cmd.notes,
          });
        },
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        performInventoryCycleCount(zeroCountCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.count.systemQuantity).toBe(10);
      expect(result.count.physicalQuantity).toBe(0);
      expect(result.count.variance).toBe(-10);
      expect(result.count.variancePercentage).toBe(-100);
      expect(result.count.adjustmentRequired).toBe(true);
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from getBalance', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () => Effect.fail(new NetworkError('Network failure')),
        adjustInventory: () => Effect.fail(new NetworkError('Should not be called')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        performInventoryCycleCount(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Network failure');
    });

    it('should handle network error from adjustInventory', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        getBalance: () =>
          Effect.succeed({
            itemId: 'item-123',
            locationId: 'loc-main',
            locationName: 'Main Warehouse',
            quantityOnHand: 45,
            quantityReserved: 5,
            quantityAvailable: 40,
            weightedAverageCost: 1500,
            totalValue: 67500,
          }),
        adjustInventory: () => Effect.fail(new NetworkError('Adjustment failed')),
        listItems: () => Effect.succeed([]),
        getItem: () => Effect.succeed({
          id: 'item-123',
          sku: 'CASK-001',
          description: 'Casket Model A',
          category: 'Caskets',
          unitOfMeasure: 'each',
          currentCost: 1500,
          retailPrice: 3000,
          isSerialTracked: false,
          reorderPoint: 5,
          reorderQuantity: 10,
          status: 'active',
          glAccountId: 'gl-inventory',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        performInventoryCycleCount(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Adjustment failed');
    });
  });
});
