import { Effect, Context } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  GoInventoryPort,
  type GoInventoryPortService,
  type NetworkError,
  type GoInventoryBalance,
  type GoInventoryTransaction,
} from '../../ports/go-inventory-port';

/**
 * Use Case 6.5: Inventory Transfer Between Locations
 * 
 * Transfers inventory items between funeral home locations with validation.
 * 
 * Business Rules:
 * 1. Source location must have sufficient available quantity (on hand - reserved)
 * 2. Transfer quantity must be positive
 * 3. Source and destination locations must be different
 * 4. Item must exist and be active
 * 5. Transfer creates two transactions: transfer_out (source) and transfer_in (destination)
 * 6. Maintains WAC (Weighted Average Cost) across locations
 * 
 * Workflow:
 * 1. Validate transfer request
 * 2. Check source location availability
 * 3. Verify destination location exists
 * 4. Execute transfer via Go backend
 * 5. Return updated balance information
 * 
 * Integration:
 * - Uses GoInventoryPort.transferInventory (verified exists)
 * - Uses GoInventoryPort.getBalancesAcrossLocations (verified exists)
 * - Go backend ensures atomic transfer (reduces source, increases destination)
 * 
 * @see Implementation Plan: docs/Implementation Plan_ Remaining 20 Critical Use Cases.md
 */

/**
 * Inventory Transfer
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

export interface TransferInventoryCommand {
  /**
   * Item to transfer
   */
  readonly itemId: string;
  
  /**
   * Source location (where item currently is)
   */
  readonly fromLocationId: string;
  
  /**
   * Destination location (where item is going)
   */
  readonly toLocationId: string;
  
  /**
   * Quantity to transfer
   */
  readonly quantity: number;
  
  /**
   * Optional transfer reason/notes
   */
  readonly notes?: string;
  
  /**
   * User initiating the transfer
   */
  readonly initiatedBy: string;
}

export interface TransferInventoryResult {
  /**
   * Transfer transaction record
   */
  readonly transaction: GoInventoryTransaction;
  
  /**
   * Updated source location balance after transfer
   */
  readonly sourceBalance: GoInventoryBalance;
  
  /**
   * Updated destination location balance after transfer
   */
  readonly destinationBalance: GoInventoryBalance;
  
  /**
   * All location balances for the item (for UI refresh)
   */
  readonly allBalances: readonly GoInventoryBalance[];
}

/**
 * Transfer inventory between locations with validation
 * 
 * @example
 * ```typescript
 * const result = yield* transferInventory({
 *   itemId: 'item-123',
 *   fromLocationId: 'location-main',
 *   toLocationId: 'location-north',
 *   quantity: 5,
 *   notes: 'Transfer for upcoming service',
 *   initiatedBy: 'user-456'
 * });
 * 
 * console.log(`Transferred ${result.transaction.quantity} units`);
 * console.log(`Source remaining: ${result.sourceBalance.quantityAvailable}`);
 * console.log(`Destination new total: ${result.destinationBalance.quantityOnHand}`);
 * ```
 */
export const transferInventory = (
  command: TransferInventoryCommand
): Effect.Effect<
  TransferInventoryResult,
  ValidationError | NetworkError,
  GoInventoryPortService
> =>
  Effect.gen(function* () {
    const inventoryPort = yield* GoInventoryPort;

    // Validate command
    yield* validateTransferCommand(command);

    // Get balances across all locations to validate source availability
    const allBalances = yield* inventoryPort.getBalancesAcrossLocations(
      command.itemId
    );

    // Find source and destination locations
    const sourceBalance = allBalances.find(
      (b) => b.locationId === command.fromLocationId
    );
    const destinationBalance = allBalances.find(
      (b) => b.locationId === command.toLocationId
    );

    // Validate source location exists and has inventory
    if (!sourceBalance) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Source location ${command.fromLocationId} not found or has no inventory for item ${command.itemId}`,
        })
      );
    }

    // Validate destination location exists
    if (!destinationBalance) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Destination location ${command.toLocationId} not found for item ${command.itemId}`,
        })
      );
    }

    // Validate sufficient available quantity at source
    // Available = On Hand - Reserved
    if (sourceBalance.quantityAvailable < command.quantity) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Insufficient available quantity at source location. ` +
            `Available: ${sourceBalance.quantityAvailable}, ` +
            `Requested: ${command.quantity}, ` +
            `(On Hand: ${sourceBalance.quantityOnHand}, Reserved: ${sourceBalance.quantityReserved})`,
        })
      );
    }

    // Execute transfer via Go backend
    // This is atomic: reduces source and increases destination in a single operation
    const transaction = yield* inventoryPort.transferInventory({
      itemId: command.itemId,
      fromLocationId: command.fromLocationId,
      toLocationId: command.toLocationId,
      quantity: command.quantity,
      notes: command.notes,
    });

    // Get updated balances after transfer
    const updatedBalances = yield* inventoryPort.getBalancesAcrossLocations(
      command.itemId
    );

    const updatedSourceBalance = updatedBalances.find(
      (b) => b.locationId === command.fromLocationId
    );
    const updatedDestinationBalance = updatedBalances.find(
      (b) => b.locationId === command.toLocationId
    );

    // These should always exist after transfer, but handle gracefully
    if (!updatedSourceBalance || !updatedDestinationBalance) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Transfer completed but failed to retrieve updated balances',
        })
      );
    }

    return {
      transaction,
      sourceBalance: updatedSourceBalance,
      destinationBalance: updatedDestinationBalance,
      allBalances: updatedBalances,
    };
  });

/**
 * Validate transfer command business rules
 */
const validateTransferCommand = (
  command: TransferInventoryCommand
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    // Validate item ID
    if (!command.itemId || command.itemId.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Item ID is required',
        })
      );
    }

    // Validate source location ID
    if (!command.fromLocationId || command.fromLocationId.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Source location ID is required',
        })
      );
    }

    // Validate destination location ID
    if (!command.toLocationId || command.toLocationId.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Destination location ID is required',
        })
      );
    }

    // Validate source and destination are different
    if (command.fromLocationId === command.toLocationId) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Source and destination locations must be different',
        })
      );
    }

    // Validate quantity is positive
    if (command.quantity <= 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Transfer quantity must be positive, got: ${command.quantity}`,
        })
      );
    }

    // Validate quantity is a whole number (no fractional units)
    if (!Number.isInteger(command.quantity)) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Transfer quantity must be a whole number, got: ${command.quantity}`,
        })
      );
    }

    // Validate initiated by
    if (!command.initiatedBy || command.initiatedBy.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Initiated by (user ID) is required',
        })
      );
    }
  });

/**
 * Service tag for dependency injection
 */
export interface TransferInventoryService {
  readonly transferInventory: typeof transferInventory;
}

export const TransferInventoryService = Context.GenericTag<TransferInventoryService>(
  '@dykstra/TransferInventoryService'
);
