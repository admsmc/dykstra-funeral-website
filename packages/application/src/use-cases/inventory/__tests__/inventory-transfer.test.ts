import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer, Context } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  transferInventory,
  type TransferInventoryCommand,
} from '../inventory-transfer';
import {
  GoInventoryPort,
  type GoInventoryPortService,
  type GoInventoryBalance,
  type GoInventoryTransaction,
  NetworkError,
} from '../../../ports/go-inventory-port';

describe('Use Case 6.5: Inventory Transfer Between Locations', () => {
  // Mock data
  const mockBalances: GoInventoryBalance[] = [
    {
      itemId: 'item-123',
      locationId: 'location-main',
      locationName: 'Main Funeral Home',
      quantityOnHand: 10,
      quantityReserved: 2,
      quantityAvailable: 8, // 10 - 2
      weightedAverageCost: 500,
      totalValue: 5000,
    },
    {
      itemId: 'item-123',
      locationId: 'location-north',
      locationName: 'North Branch',
      quantityOnHand: 5,
      quantityReserved: 0,
      quantityAvailable: 5,
      weightedAverageCost: 500,
      totalValue: 2500,
    },
  ];

  const mockTransaction: GoInventoryTransaction = {
    id: 'txn-001',
    itemId: 'item-123',
    locationId: 'location-main',
    transactionType: 'transfer_out',
    quantity: 3,
    unitCost: 500,
    totalCost: 1500,
    referenceType: 'transfer',
    referenceId: 'transfer-001',
    notes: 'Transfer for upcoming service',
    postedAt: new Date('2025-11-30T10:00:00Z'),
    createdBy: 'user-456',
  };

  const mockUpdatedBalances: GoInventoryBalance[] = [
    {
      ...mockBalances[0],
      quantityOnHand: 7, // Reduced by 3
      quantityAvailable: 5, // 7 - 2
      totalValue: 3500,
    },
    {
      ...mockBalances[1],
      quantityOnHand: 8, // Increased by 3
      quantityAvailable: 8,
      totalValue: 4000,
    },
  ];

  let mockInventoryPort: GoInventoryPortService;

  beforeEach(() => {
    mockInventoryPort = {
      getBalancesAcrossLocations: vi.fn((itemId: string) =>
        Effect.succeed(mockBalances)
      ),
      transferInventory: vi.fn(() => Effect.succeed(mockTransaction)),
      // Stubs for other methods (not used in this use case)
      createItem: vi.fn(),
      getItem: vi.fn(),
      getItemBySku: vi.fn(),
      listItems: vi.fn(),
      getBalance: vi.fn(),
      checkNetworkAvailability: vi.fn(),
      reserveInventory: vi.fn(),
      commitReservation: vi.fn(),
      releaseReservation: vi.fn(),
      receiveInventory: vi.fn(),
      adjustInventory: vi.fn(),
      getReservationsByCase: vi.fn(),
      getTransactionHistory: vi.fn(),
      getItemsBelowReorderPoint: vi.fn(),
    } as GoInventoryPortService;
  });

  const runTest = <A, E>(effect: Effect.Effect<A, E, GoInventoryPort>) =>
    Effect.runPromise(
      Effect.provide(
        effect,
        Layer.succeed(GoInventoryPort, mockInventoryPort)
      )
    );

  describe('Happy Path', () => {
    it('should transfer inventory between locations successfully', async () => {
      // Setup: Mock updated balances after transfer
      (mockInventoryPort.getBalancesAcrossLocations as any)
        .mockReturnValueOnce(Effect.succeed(mockBalances)) // Initial check
        .mockReturnValueOnce(Effect.succeed(mockUpdatedBalances)); // After transfer

      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        notes: 'Transfer for upcoming service',
        initiatedBy: 'user-456',
      };

      const result = await runTest(transferInventory(command));

      // Verify result
      expect(result.transaction).toEqual(mockTransaction);
      expect(result.sourceBalance.quantityOnHand).toBe(7);
      expect(result.sourceBalance.quantityAvailable).toBe(5);
      expect(result.destinationBalance.quantityOnHand).toBe(8);
      expect(result.destinationBalance.quantityAvailable).toBe(8);
      expect(result.allBalances).toHaveLength(2);

      // Verify port method calls
      expect(mockInventoryPort.getBalancesAcrossLocations).toHaveBeenCalledWith(
        'item-123'
      );
      expect(mockInventoryPort.getBalancesAcrossLocations).toHaveBeenCalledTimes(
        2
      ); // Once before, once after
      expect(mockInventoryPort.transferInventory).toHaveBeenCalledWith({
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        notes: 'Transfer for upcoming service',
      });
    });

    it('should handle transfer without notes', async () => {
      (mockInventoryPort.getBalancesAcrossLocations as any)
        .mockReturnValueOnce(Effect.succeed(mockBalances))
        .mockReturnValueOnce(Effect.succeed(mockUpdatedBalances));

      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      const result = await runTest(transferInventory(command));

      expect(result.transaction).toBeDefined();
      expect(mockInventoryPort.transferInventory).toHaveBeenCalledWith({
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        notes: undefined,
      });
    });
  });

  describe('Validation Errors', () => {
    it('should fail if item ID is missing', async () => {
      const command: TransferInventoryCommand = {
        itemId: '',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Item ID is required'
      );
    });

    it('should fail if source location ID is missing', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: '',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Source location ID is required'
      );
    });

    it('should fail if destination location ID is missing', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: '',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Destination location ID is required'
      );
    });

    it('should fail if source and destination are the same', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-main',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Source and destination locations must be different'
      );
    });

    it('should fail if quantity is zero', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 0,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Transfer quantity must be positive'
      );
    });

    it('should fail if quantity is negative', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: -5,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Transfer quantity must be positive'
      );
    });

    it('should fail if quantity is not a whole number', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3.5,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Transfer quantity must be a whole number'
      );
    });

    it('should fail if initiated by is missing', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: '',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Initiated by (user ID) is required'
      );
    });
  });

  describe('Business Rule Validation', () => {
    it('should fail if source location does not exist', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-nonexistent',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Source location location-nonexistent not found'
      );
    });

    it('should fail if destination location does not exist', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-nonexistent',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Destination location location-nonexistent not found'
      );
    });

    it('should fail if source location has insufficient available quantity', async () => {
      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 10, // Available is only 8 (10 on hand - 2 reserved)
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Insufficient available quantity at source location'
      );
      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Available: 8'
      );
      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Requested: 10'
      );
    });

    it('should allow transfer of exact available quantity', async () => {
      (mockInventoryPort.getBalancesAcrossLocations as any)
        .mockReturnValueOnce(Effect.succeed(mockBalances))
        .mockReturnValueOnce(Effect.succeed(mockUpdatedBalances));

      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 8, // Exactly the available quantity
        initiatedBy: 'user-456',
      };

      const result = await runTest(transferInventory(command));

      expect(result.transaction).toBeDefined();
    });
  });

  describe('Network Errors', () => {
    it('should propagate network error from getBalancesAcrossLocations', async () => {
      const networkError = new NetworkError('Backend unavailable');
      (mockInventoryPort.getBalancesAcrossLocations as any).mockReturnValueOnce(
        Effect.fail(networkError)
      );

      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Backend unavailable'
      );
    });

    it('should propagate network error from transferInventory', async () => {
      const networkError = new NetworkError('Transfer failed');
      (mockInventoryPort.transferInventory as any).mockReturnValueOnce(
        Effect.fail(networkError)
      );

      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Transfer failed'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle transfer with only 1 unit available', async () => {
      const balancesWithLowQuantity: GoInventoryBalance[] = [
        {
          ...mockBalances[0],
          quantityOnHand: 1,
          quantityReserved: 0,
          quantityAvailable: 1,
        },
        mockBalances[1],
      ];

      (mockInventoryPort.getBalancesAcrossLocations as any)
        .mockReturnValueOnce(Effect.succeed(balancesWithLowQuantity))
        .mockReturnValueOnce(Effect.succeed(mockUpdatedBalances));

      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 1,
        initiatedBy: 'user-456',
      };

      const result = await runTest(transferInventory(command));

      expect(result.transaction).toBeDefined();
    });

    it('should fail gracefully if updated balances are missing source location', async () => {
      const incompleteUpdatedBalances: GoInventoryBalance[] = [
        // Only destination, no source
        mockUpdatedBalances[1],
      ];

      (mockInventoryPort.getBalancesAcrossLocations as any)
        .mockReturnValueOnce(Effect.succeed(mockBalances))
        .mockReturnValueOnce(Effect.succeed(incompleteUpdatedBalances));

      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      await expect(runTest(transferInventory(command))).rejects.toThrow(
        'Transfer completed but failed to retrieve updated balances'
      );
    });

    it('should handle transfer with reserved quantity at destination', async () => {
      const balancesWithDestinationReserved: GoInventoryBalance[] = [
        mockBalances[0],
        {
          ...mockBalances[1],
          quantityReserved: 3, // Some reserved at destination
          quantityAvailable: 2, // 5 - 3
        },
      ];

      (mockInventoryPort.getBalancesAcrossLocations as any)
        .mockReturnValueOnce(Effect.succeed(balancesWithDestinationReserved))
        .mockReturnValueOnce(Effect.succeed(mockUpdatedBalances));

      const command: TransferInventoryCommand = {
        itemId: 'item-123',
        fromLocationId: 'location-main',
        toLocationId: 'location-north',
        quantity: 3,
        initiatedBy: 'user-456',
      };

      // Should still succeed - destination having reservations doesn't block incoming transfers
      const result = await runTest(transferInventory(command));

      expect(result.transaction).toBeDefined();
    });
  });
});
