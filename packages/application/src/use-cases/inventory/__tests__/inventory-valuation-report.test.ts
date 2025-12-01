import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  generateInventoryValuationReport,
  type GenerateInventoryValuationReportCommand,
} from '../inventory-valuation-report';
import {
  GoInventoryPort,
  type GoInventoryPortService,
  NetworkError,
  type GoInventoryItem,
  type GoInventoryBalance,
} from '../../../ports/go-inventory-port';

const mockItems: GoInventoryItem[] = [
  {
    id: 'item-1',
    sku: 'CASK-001',
    name: 'Casket Model A',
    description: 'Premium casket',
    category: 'Caskets',
    unitOfMeasure: 'each',
    isActive: true,
    reorderPoint: 5,
    reorderQuantity: 10,
  },
  {
    id: 'item-2',
    sku: 'URN-001',
    name: 'Urn Model B',
    description: 'Bronze urn',
    category: 'Urns',
    unitOfMeasure: 'each',
    isActive: true,
    reorderPoint: 10,
    reorderQuantity: 20,
  },
  {
    id: 'item-3',
    sku: 'CASK-002',
    name: 'Casket Model C',
    description: 'Standard casket',
    category: 'Caskets',
    unitOfMeasure: 'each',
    isActive: true,
    reorderPoint: 3,
    reorderQuantity: 5,
  },
];

const baseCommand: GenerateInventoryValuationReportCommand = {
  generatedBy: 'accountant-123',
};

describe('Use Case 7.3: Inventory Valuation Report', () => {
  describe('Happy Paths', () => {
    it('should generate valuation report with multiple items and categories', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.succeed(mockItems),
        getBalance: (cmd) => {
          // Return different balances for each item
          if (cmd.itemId === 'item-1') {
            return Effect.succeed({
              itemId: 'item-1',
              itemName: 'Casket Model A',
              itemSku: 'CASK-001',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 10,
              quantityAvailable: 8,
              quantityReserved: 2,
              unitCost: 2000,
              totalValue: 20000,
            });
          } else if (cmd.itemId === 'item-2') {
            return Effect.succeed({
              itemId: 'item-2',
              itemName: 'Urn Model B',
              itemSku: 'URN-001',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 25,
              quantityAvailable: 25,
              quantityReserved: 0,
              unitCost: 500,
              totalValue: 12500,
            });
          } else {
            return Effect.succeed({
              itemId: 'item-3',
              itemName: 'Casket Model C',
              itemSku: 'CASK-002',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 5,
              quantityAvailable: 5,
              quantityReserved: 0,
              unitCost: 1500,
              totalValue: 7500,
            });
          }
        },
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateInventoryValuationReport(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      // Verify items
      expect(result.items.length).toBe(3);
      expect(result.items[0].itemId).toBe('item-1');
      expect(result.items[1].itemId).toBe('item-2');
      expect(result.items[2].itemId).toBe('item-3');

      // Verify categories
      expect(result.categories.length).toBe(2);
      const casketsCategory = result.categories.find(c => c.category === 'Caskets');
      const urnsCategory = result.categories.find(c => c.category === 'Urns');
      
      expect(casketsCategory?.itemCount).toBe(2); // item-1 and item-3
      expect(casketsCategory?.totalQuantity).toBe(15); // 10 + 5
      expect(casketsCategory?.totalValue).toBe(27500); // 20000 + 7500
      
      expect(urnsCategory?.itemCount).toBe(1);
      expect(urnsCategory?.totalQuantity).toBe(25);
      expect(urnsCategory?.totalValue).toBe(12500);

      // Verify locations
      expect(result.locations.length).toBe(1);
      expect(result.locations[0].locationName).toBe('Main Warehouse');
      expect(result.locations[0].itemCount).toBe(3);
      expect(result.locations[0].totalQuantity).toBe(40); // 10 + 25 + 5
      expect(result.locations[0].totalValue).toBe(40000); // 20000 + 12500 + 7500

      // Verify totals
      expect(result.totals.totalItems).toBe(3);
      expect(result.totals.totalQuantity).toBe(40);
      expect(result.totals.totalValue).toBe(40000);
      expect(result.totals.averageValuePerItem).toBeCloseTo(13333.33, 2);

      // Verify metadata
      expect(result.metadata.generatedBy).toBe('accountant-123');
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
    });

    it('should filter by location', async () => {
      const commandWithLocation = {
        ...baseCommand,
        locationId: 'loc-warehouse',
      };

      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.succeed([mockItems[0]]),
        getBalance: () =>
          Effect.succeed({
            itemId: 'item-1',
            itemName: 'Casket Model A',
            itemSku: 'CASK-001',
            locationId: 'loc-warehouse',
            locationName: 'Warehouse',
            quantityOnHand: 10,
            quantityAvailable: 10,
            quantityReserved: 0,
            unitCost: 2000,
            totalValue: 20000,
          }),
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateInventoryValuationReport(commandWithLocation).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.metadata.locationFilter).toBe('loc-warehouse');
      expect(result.locations.length).toBe(1);
      expect(result.locations[0].locationId).toBe('loc-warehouse');
    });

    it('should filter by category', async () => {
      const commandWithCategory = {
        ...baseCommand,
        category: 'Caskets',
      };

      const casketItems = mockItems.filter(i => i.category === 'Caskets');

      const mockInventoryPort: GoInventoryPortService = {
        listItems: (cmd) => {
          expect(cmd.category).toBe('Caskets');
          return Effect.succeed(casketItems);
        },
        getBalance: (cmd) => {
          if (cmd.itemId === 'item-1') {
            return Effect.succeed({
              itemId: 'item-1',
              itemName: 'Casket Model A',
              itemSku: 'CASK-001',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 10,
              quantityAvailable: 10,
              quantityReserved: 0,
              unitCost: 2000,
              totalValue: 20000,
            });
          } else {
            return Effect.succeed({
              itemId: 'item-3',
              itemName: 'Casket Model C',
              itemSku: 'CASK-002',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 5,
              quantityAvailable: 5,
              quantityReserved: 0,
              unitCost: 1500,
              totalValue: 7500,
            });
          }
        },
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateInventoryValuationReport(commandWithCategory).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.metadata.categoryFilter).toBe('Caskets');
      expect(result.categories.length).toBe(1);
      expect(result.categories[0].category).toBe('Caskets');
      expect(result.totals.totalItems).toBe(2);
    });

    it('should exclude zero-balance items by default', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.succeed(mockItems),
        getBalance: (cmd) => {
          if (cmd.itemId === 'item-1') {
            return Effect.succeed({
              itemId: 'item-1',
              itemName: 'Casket Model A',
              itemSku: 'CASK-001',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 10,
              quantityAvailable: 10,
              quantityReserved: 0,
              unitCost: 2000,
              totalValue: 20000,
            });
          } else if (cmd.itemId === 'item-2') {
            return Effect.succeed({
              itemId: 'item-2',
              itemName: 'Urn Model B',
              itemSku: 'URN-001',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 0, // Zero balance
              quantityAvailable: 0,
              quantityReserved: 0,
              unitCost: 500,
              totalValue: 0,
            });
          } else {
            return Effect.succeed({
              itemId: 'item-3',
              itemName: 'Casket Model C',
              itemSku: 'CASK-002',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 5,
              quantityAvailable: 5,
              quantityReserved: 0,
              unitCost: 1500,
              totalValue: 7500,
            });
          }
        },
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateInventoryValuationReport(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      // Should only have 2 items (item-2 excluded due to zero balance)
      expect(result.totals.totalItems).toBe(2);
      expect(result.items.find(i => i.itemId === 'item-2')).toBeUndefined();
    });

    it('should include zero-balance items when specified', async () => {
      const commandWithZeroBalance = {
        ...baseCommand,
        includeZeroBalance: true,
      };

      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.succeed(mockItems),
        getBalance: (cmd) => {
          if (cmd.itemId === 'item-1') {
            return Effect.succeed({
              itemId: 'item-1',
              itemName: 'Casket Model A',
              itemSku: 'CASK-001',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 10,
              quantityAvailable: 10,
              quantityReserved: 0,
              unitCost: 2000,
              totalValue: 20000,
            });
          } else if (cmd.itemId === 'item-2') {
            return Effect.succeed({
              itemId: 'item-2',
              itemName: 'Urn Model B',
              itemSku: 'URN-001',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 0, // Zero balance
              quantityAvailable: 0,
              quantityReserved: 0,
              unitCost: 500,
              totalValue: 0,
            });
          } else {
            return Effect.succeed({
              itemId: 'item-3',
              itemName: 'Casket Model C',
              itemSku: 'CASK-002',
              locationId: 'loc-main',
              locationName: 'Main Warehouse',
              quantityOnHand: 5,
              quantityAvailable: 5,
              quantityReserved: 0,
              unitCost: 1500,
              totalValue: 7500,
            });
          }
        },
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateInventoryValuationReport(commandWithZeroBalance).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      // Should have all 3 items including zero-balance item-2
      expect(result.totals.totalItems).toBe(3);
      expect(result.items.find(i => i.itemId === 'item-2')).toBeDefined();
    });
  });

  describe('Validation Errors', () => {
    it('should fail when generatedBy is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        generatedBy: '',
      };

      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.succeed([]),
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateInventoryValuationReport(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Generated by user is required');
    });

    it('should fail when asOfDate is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const invalidCommand = {
        ...baseCommand,
        asOfDate: futureDate,
      };

      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.succeed([]),
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateInventoryValuationReport(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('As-of date cannot be in the future');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty inventory', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.succeed([]),
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateInventoryValuationReport(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      expect(result.totals.totalItems).toBe(0);
      expect(result.totals.totalQuantity).toBe(0);
      expect(result.totals.totalValue).toBe(0);
      expect(result.totals.averageValuePerItem).toBe(0);
      expect(result.items).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.locations).toEqual([]);
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from listItems', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.fail(new NetworkError('Network failure')),
        getBalance: () => Effect.fail(new NetworkError('Should not be called')),
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateInventoryValuationReport(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Network failure');
    });

    it('should handle network error from getBalance', async () => {
      const mockInventoryPort: GoInventoryPortService = {
        listItems: () => Effect.succeed([mockItems[0]]),
        getBalance: () => Effect.fail(new NetworkError('Balance lookup failed')),
        getItem: () => Effect.fail(new NetworkError('Not implemented')),
        createItem: () => Effect.fail(new NetworkError('Not implemented')),
        updateItem: () => Effect.fail(new NetworkError('Not implemented')),
        adjustInventory: () => Effect.fail(new NetworkError('Not implemented')),
        reserveInventory: () => Effect.fail(new NetworkError('Not implemented')),
        releaseInventory: () => Effect.fail(new NetworkError('Not implemented')),
        commitInventory: () => Effect.fail(new NetworkError('Not implemented')),
        transferInventory: () => Effect.fail(new NetworkError('Not implemented')),
        listTransfers: () => Effect.fail(new NetworkError('Not implemented')),
        getTransfer: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateInventoryValuationReport(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoInventoryPort, mockInventoryPort))
        )
      );

      await expect(result).rejects.toThrow('Balance lookup failed');
    });
  });
});
