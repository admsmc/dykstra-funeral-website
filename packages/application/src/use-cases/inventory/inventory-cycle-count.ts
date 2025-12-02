import { Effect } from 'effect';
import { ValidationError } from '@dykstra/domain';
import type { GoInventoryPortService } from '../../ports/go-inventory-port';
import { GoInventoryPort, type NetworkError } from '../../ports/go-inventory-port';

/**
 * Use Case 7.2: Inventory Cycle Count
 * 
 * Performs physical inventory counts and reconciles variances between
 * system and physical counts. Generates adjustment entries for discrepancies.
 * 
 * Business Logic:
 * - Validates count data (item ID, location, quantities)
 * - Retrieves current system balance
 * - Calculates variance (physical - system)
 * - Creates adjustment entry if variance exists
 * - Provides audit trail and reason codes
 * 
 * Typical Use: Monthly cycle counts, annual inventory audits
 */

/**
 * Inventory Cycle Count
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

export interface InventoryCycleCountCommand {
  /** Item being counted */
  itemId: string;
  
  /** Location where count performed */
  locationId: string;
  
  /** Physical quantity counted */
  physicalQuantity: number;
  
  /** User/employee who performed count */
  countedBy: string;
  
  /** Date/time of count */
  countDate: Date;
  
  /** Reason for variance if known (optional) */
  varianceReason?: string;
  
  /** Lot/batch number if applicable */
  lotNumber?: string;
  
  /** Additional notes (optional) */
  notes?: string;
}

export interface InventoryCycleCountResult {
  /** Unique ID for this count record */
  countId: string;
  
  /** Item details */
  item: {
    id: string;
    name: string;
    sku: string;
  };
  
  /** Location details */
  location: {
    id: string;
    name: string;
  };
  
  /** Count details */
  count: {
    /** System quantity before count */
    systemQuantity: number;
    
    /** Physical quantity counted */
    physicalQuantity: number;
    
    /** Variance (physical - system) */
    variance: number;
    
    /** Percentage variance */
    variancePercentage: number;
    
    /** Whether adjustment was needed */
    adjustmentRequired: boolean;
    
    /** Adjustment entry ID if created */
    adjustmentId?: string;
  };
  
  /** Audit trail */
  audit: {
    countedBy: string;
    countDate: Date;
    varianceReason?: string;
    notes?: string;
  };
}

function validateCommand(command: InventoryCycleCountCommand): Effect.Effect<void, ValidationError> {
  return Effect.gen(function* () {
    const errors: string[] = [];
    
    if (!command.itemId || command.itemId.trim() === '') {
      errors.push('Item ID is required');
    }
    
    if (!command.locationId || command.locationId.trim() === '') {
      errors.push('Location ID is required');
    }
    
    if (command.physicalQuantity < 0) {
      errors.push('Physical quantity cannot be negative');
    }
    
    if (!command.countedBy || command.countedBy.trim() === '') {
      errors.push('Counted by user is required');
    }
    
    if (!command.countDate) {
      errors.push('Count date is required');
    }
    
    if (command.countDate && command.countDate > new Date()) {
      errors.push('Count date cannot be in the future');
    }
    
    if (errors.length > 0) {
      return yield* Effect.fail(new ValidationError({ message: errors.join('; ') }));
    }
  });
}

function calculateVariance(systemQty: number, physicalQty: number): {
  variance: number;
  variancePercentage: number;
} {
  const variance = physicalQty - systemQty;
  
  // Avoid division by zero
  const variancePercentage = systemQty === 0 
    ? (physicalQty > 0 ? 100 : 0)
    : (variance / systemQty) * 100;
  
  return {
    variance,
    variancePercentage: Math.round(variancePercentage * 100) / 100, // 2 decimal places
  };
}

export function performInventoryCycleCount(
  command: InventoryCycleCountCommand
): Effect.Effect<
  InventoryCycleCountResult,
  ValidationError | NetworkError,
  GoInventoryPortService
> {
  return Effect.gen(function* () {
    // Step 1: Validate command
    yield* validateCommand(command);
    
    const inventoryPort = yield* GoInventoryPort;
    
    // Step 2: Get current system balance
    const balance = yield* inventoryPort.getBalance(
      command.itemId,
      command.locationId
    );
    
    const systemQuantity = balance.quantityOnHand;
    
    // Step 3: Calculate variance
    const { variance, variancePercentage } = calculateVariance(
      systemQuantity,
      command.physicalQuantity
    );
    
    const adjustmentRequired = variance !== 0;
    
    // Step 4: Create adjustment if variance exists
    let adjustmentId: string | undefined = undefined;
    
    if (adjustmentRequired) {
      const adjustment = yield* inventoryPort.adjustInventory({
        itemId: command.itemId,
        locationId: command.locationId,
        quantity: variance, // Can be positive or negative
        reason: command.varianceReason || 'Cycle count adjustment',
        notes: `Physical count: ${command.physicalQuantity}, System count: ${systemQuantity}. ${command.notes || ''}`,
      });
      
      adjustmentId = adjustment.id;
    }
    
    // Step 5: Generate unique count ID (simplified - production would use UUID)
    const countId = `COUNT-${Date.now()}-${command.itemId.substring(0, 8)}`;
    
    // Step 6: Build result
    const result: InventoryCycleCountResult = {
      countId,
      item: {
        id: balance.itemId,
        name: balance.itemId, // Backend returns balance only, item name not available
        sku: balance.itemId,  // Using itemId as fallback SKU
      },
      location: {
        id: 'Unknown',        // Location details not available from balance
        name: 'Unknown Location',
      },
      count: {
        systemQuantity,
        physicalQuantity: command.physicalQuantity,
        variance,
        variancePercentage,
        adjustmentRequired,
        adjustmentId,
      },
      audit: {
        countedBy: command.countedBy,
        countDate: command.countDate,
        varianceReason: command.varianceReason,
        notes: command.notes,
      },
    };
    
    return result;
  });
}
