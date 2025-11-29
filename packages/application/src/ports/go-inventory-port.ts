import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NotFoundError, NetworkError };

/**
 * Go Inventory domain types
 * Multi-location inventory with WAC costing and reservations
 */
export interface GoInventoryItem {
  readonly id: string;
  readonly sku: string;
  readonly description: string;
  readonly category: string;
  readonly unitOfMeasure: string;
  readonly currentCost: number;
  readonly retailPrice: number;
  readonly isSerialTracked: boolean;
  readonly reorderPoint: number;
  readonly reorderQuantity: number;
  readonly status: 'active' | 'discontinued' | 'inactive';
  readonly glAccountId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GoInventoryBalance {
  readonly itemId: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly quantityOnHand: number;
  readonly quantityReserved: number;
  readonly quantityAvailable: number;
  readonly weightedAverageCost: number;
  readonly totalValue: number;
}

export interface GoInventoryReservation {
  readonly id: string;
  readonly itemId: string;
  readonly quantity: number;
  readonly locationId: string;
  readonly caseId: string;
  readonly contractId: string;
  readonly reservedAt: Date;
  readonly expiresAt?: Date;
  readonly status: 'active' | 'committed' | 'released' | 'expired';
}

export interface GoInventoryTransaction {
  readonly id: string;
  readonly itemId: string;
  readonly locationId: string;
  readonly transactionType: 'receive' | 'reserve' | 'commit' | 'adjust' | 'transfer_out' | 'transfer_in';
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalCost: number;
  readonly referenceType?: string;
  readonly referenceId?: string;
  readonly notes?: string;
  readonly postedAt: Date;
  readonly createdBy: string;
}

export interface CreateInventoryItemCommand {
  readonly sku: string;
  readonly description: string;
  readonly category: string;
  readonly unitOfMeasure: string;
  readonly retailPrice: number;
  readonly isSerialTracked: boolean;
  readonly reorderPoint: number;
  readonly reorderQuantity: number;
  readonly glAccountId: string;
}

export interface ReserveInventoryCommand {
  readonly itemId: string;
  readonly quantity: number;
  readonly locationId: string;
  readonly caseId: string;
  readonly contractId: string;
  readonly expiresInDays?: number;
}

export interface ReceiveInventoryCommand {
  readonly itemId: string;
  readonly quantity: number;
  readonly locationId: string;
  readonly unitCost: number;
  readonly purchaseOrderId?: string;
  readonly notes?: string;
}

export interface AdjustInventoryCommand {
  readonly itemId: string;
  readonly locationId: string;
  readonly quantity: number;
  readonly reason: string;
  readonly notes?: string;
}

export interface TransferInventoryCommand {
  readonly itemId: string;
  readonly fromLocationId: string;
  readonly toLocationId: string;
  readonly quantity: number;
  readonly notes?: string;
}

/**
 * Go Inventory Port
 * 
 * Defines interface for multi-location inventory management with WAC costing.
 * Supports reservations, transfers, cycle counts, and real-time availability.
 * 
 * Features:
 * - Multi-location inventory tracking
 * - Weighted average cost (WAC) calculation
 * - Reservation system for case items
 * - Transfer orders between locations
 * - Cycle count adjustments
 * - Network availability lookup
 * 
 * Backend: Go ERP with event sourcing and TigerBeetle inventory valuation
 */
export interface GoInventoryPortService {
  /**
   * Create a new inventory item
   */
  readonly createItem: (
    command: CreateInventoryItemCommand
  ) => Effect.Effect<GoInventoryItem, NetworkError>;
  
  /**
   * Get inventory item by ID
   */
  readonly getItem: (
    id: string
  ) => Effect.Effect<GoInventoryItem, NotFoundError | NetworkError>;
  
  /**
   * Get inventory item by SKU
   */
  readonly getItemBySku: (
    sku: string
  ) => Effect.Effect<GoInventoryItem, NotFoundError | NetworkError>;
  
  /**
   * List inventory items with optional filters
   */
  readonly listItems: (
    filters?: {
      category?: string;
      status?: GoInventoryItem['status'];
      search?: string;
    }
  ) => Effect.Effect<readonly GoInventoryItem[], NetworkError>;
  
  /**
   * Get inventory balance at a specific location
   */
  readonly getBalance: (
    itemId: string,
    locationId: string
  ) => Effect.Effect<GoInventoryBalance, NetworkError>;
  
  /**
   * Get inventory balances across all locations for an item
   */
  readonly getBalancesAcrossLocations: (
    itemId: string
  ) => Effect.Effect<readonly GoInventoryBalance[], NetworkError>;
  
  /**
   * Check network availability (all locations combined)
   */
  readonly checkNetworkAvailability: (
    itemId: string
  ) => Effect.Effect<number, NetworkError>;
  
  /**
   * Reserve inventory for a case/contract
   * 
   * Backend operation:
   * 1. Validates availability at location
   * 2. Creates reservation
   * 3. Emits InventoryReserved event
   * 4. Updates quantity reserved
   */
  readonly reserveInventory: (
    command: ReserveInventoryCommand
  ) => Effect.Effect<GoInventoryReservation, NetworkError>;
  
  /**
   * Commit reserved inventory (casket delivered)
   * 
   * Backend operation:
   * 1. Validates reservation exists
   * 2. Commits inventory
   * 3. Emits InventoryCommitted event
   * 4. Updates quantity on hand (reduces)
   * 5. Posts to TigerBeetle (COGS)
   */
  readonly commitReservation: (
    reservationId: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Release reservation (case cancelled)
   */
  readonly releaseReservation: (
    reservationId: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Receive inventory (purchase order receipt)
   * 
   * Backend operation:
   * 1. Validates item exists
   * 2. Receives inventory
   * 3. Emits InventoryReceived event
   * 4. Updates WAC cost
   * 5. Increases quantity on hand
   */
  readonly receiveInventory: (
    command: ReceiveInventoryCommand
  ) => Effect.Effect<GoInventoryTransaction, NetworkError>;
  
  /**
   * Adjust inventory (cycle count)
   * 
   * Backend operation:
   * 1. Creates adjustment transaction
   * 2. Emits InventoryAdjusted event
   * 3. Updates quantity on hand
   * 4. Posts variance to GL
   */
  readonly adjustInventory: (
    command: AdjustInventoryCommand
  ) => Effect.Effect<GoInventoryTransaction, NetworkError>;
  
  /**
   * Transfer inventory between locations
   * 
   * Backend operation:
   * 1. Validates availability at source location
   * 2. Creates transfer order
   * 3. Emits InventoryTransferCreated event
   * 4. Reduces source location quantity
   * 5. Increases destination location quantity
   */
  readonly transferInventory: (
    command: TransferInventoryCommand
  ) => Effect.Effect<GoInventoryTransaction, NetworkError>;
  
  /**
   * Get reservation history for a case
   */
  readonly getReservationsByCase: (
    caseId: string
  ) => Effect.Effect<readonly GoInventoryReservation[], NetworkError>;
  
  /**
   * Get transaction history for an item
   */
  readonly getTransactionHistory: (
    itemId: string,
    startDate?: Date,
    endDate?: Date
  ) => Effect.Effect<readonly GoInventoryTransaction[], NetworkError>;
  
  /**
   * Get items below reorder point
   */
  readonly getItemsBelowReorderPoint: (
    locationId?: string
  ) => Effect.Effect<readonly GoInventoryItem[], NetworkError>;
}

/**
 * Go Inventory Port service tag for dependency injection
 */
export const GoInventoryPort = Context.GenericTag<GoInventoryPortService>(
  '@dykstra/GoInventoryPort'
);
