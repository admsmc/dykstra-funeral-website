import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoInventoryPortService,
  GoInventoryItem,
  GoInventoryBalance,
  GoInventoryReservation,
  GoInventoryTransaction,
  CreateInventoryItemCommand,
  ReserveInventoryCommand,
  ReceiveInventoryCommand,
  AdjustInventoryCommand,
  TransferInventoryCommand,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Go Inventory Adapter
 * 
 * Multi-location inventory with WAC costing and reservations.
 * Integrates with TigerBeetle for COGS posting.
 */
export const GoInventoryAdapter: GoInventoryPortService = {
  createItem: (command: CreateInventoryItemCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/inventory/items', {
          body: {
            sku: command.sku,
            description: command.description,
            category: command.category,
            unit_of_measure: command.unitOfMeasure,
            retail_price: command.retailPrice,
            is_serial_tracked: command.isSerialTracked,
            reorder_point: command.reorderPoint,
            reorder_quantity: command.reorderQuantity,
            gl_account_id: command.glAccountId,
          }
        });
        return mapToGoInventoryItem(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create inventory item', error as Error)
    }),
  
  getItem: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/items/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'InventoryItem not found', entityType: 'InventoryItem', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoInventoryItem(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get inventory item', error as Error);
      }
    }),
  
  getItemBySku: (sku: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/items', {
          params: { query: { sku } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'InventoryItem not found', entityType: 'InventoryItem', entityId: sku });
          }
          throw new Error(res.error.message);
        }
        
        const data = unwrapResponse(res);
        return mapToGoInventoryItem(data.items?.[0] || data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get inventory item by SKU', error as Error);
      }
    }),
  
  listItems: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/items', {
          params: { query: filters as any }
        });
        
        const data = unwrapResponse(res);
        return (data.items || []).map(mapToGoInventoryItem);
      },
      catch: (error) => new NetworkError('Failed to list inventory items', error as Error)
    }),
  
  getBalance: (itemId: string, locationId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/balances', {
          params: { query: { item_id: itemId, location_id: locationId } }
        });
        
        const data = unwrapResponse(res);
        return mapToGoInventoryBalance(data.balances?.[0] || data);
      },
      catch: (error) => new NetworkError('Failed to get inventory balance', error as Error)
    }),
  
  getBalancesAcrossLocations: (itemId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/balances', {
          params: { query: { item_id: itemId } }
        });
        
        const data = unwrapResponse(res);
        return (data.balances || []).map(mapToGoInventoryBalance);
      },
      catch: (error) => new NetworkError('Failed to get balances across locations', error as Error)
    }),
  
  checkNetworkAvailability: (itemId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/items/{id}/availability', {
          params: { path: { id: itemId } }
        });
        
        const data = unwrapResponse(res);
        return data.available_quantity || 0;
      },
      catch: (error) => new NetworkError('Failed to check network availability', error as Error)
    }),
  
  reserveInventory: (command: ReserveInventoryCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/inventory/reservations', {
          body: {
            item_id: command.itemId,
            quantity: command.quantity,
            location_id: command.locationId,
            case_id: command.caseId,
            contract_id: command.contractId,
            expires_in_days: command.expiresInDays,
          }
        });
        
        return mapToGoInventoryReservation(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to reserve inventory', error as Error)
    }),
  
  commitReservation: (reservationId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/inventory/reservations/{id}/commit', {
          params: { path: { id: reservationId } }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to commit reservation', error as Error)
    }),
  
  releaseReservation: (reservationId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/inventory/reservations/{id}/release', {
          params: { path: { id: reservationId } }
        });
        
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to release reservation', error as Error)
    }),
  
  receiveInventory: (command: ReceiveInventoryCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/inventory/receive', {
          body: {
            item_id: command.itemId,
            quantity: command.quantity,
            location_id: command.locationId,
            unit_cost: command.unitCost,
            purchase_order_id: command.purchaseOrderId,
            notes: command.notes,
          }
        });
        
        return mapToGoInventoryTransaction(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to receive inventory', error as Error)
    }),
  
  adjustInventory: (command: AdjustInventoryCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/inventory/adjust', {
          body: {
            item_id: command.itemId,
            location_id: command.locationId,
            quantity: command.quantity,
            reason: command.reason,
            notes: command.notes,
          }
        });
        
        return mapToGoInventoryTransaction(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to adjust inventory', error as Error)
    }),
  
  transferInventory: (command: TransferInventoryCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/inventory/transfer', {
          body: {
            item_id: command.itemId,
            from_location_id: command.fromLocationId,
            to_location_id: command.toLocationId,
            quantity: command.quantity,
            notes: command.notes,
          }
        });
        
        return mapToGoInventoryTransaction(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to transfer inventory', error as Error)
    }),
  
  getReservationsByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/reservations', {
          params: { query: { case_id: caseId } }
        });
        
        const data = unwrapResponse(res);
        return (data.reservations || []).map(mapToGoInventoryReservation);
      },
      catch: (error) => new NetworkError('Failed to get case reservations', error as Error)
    }),
  
  getTransactionHistory: (itemId: string, startDate?: Date, endDate?: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/transactions', {
          params: { 
            query: { 
              item_id: itemId,
              start_date: startDate?.toISOString(),
              end_date: endDate?.toISOString(),
            } 
          }
        });
        
        const data = unwrapResponse(res);
        return (data.transactions || []).map(mapToGoInventoryTransaction);
      },
      catch: (error) => new NetworkError('Failed to get transaction history', error as Error)
    }),
  
  getItemsBelowReorderPoint: (locationId?: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/inventory/items/reorder-alerts', {
          params: { query: { location_id: locationId } }
        });
        
        const data = unwrapResponse(res);
        return (data.items || []).map(mapToGoInventoryItem);
      },
      catch: (error) => new NetworkError('Failed to get reorder alerts', error as Error)
    }),
};

// Mappers
function mapToGoInventoryItem(data: any): GoInventoryItem {
  return {
    id: data.id,
    sku: data.sku,
    description: data.description,
    category: data.category,
    unitOfMeasure: data.unit_of_measure,
    currentCost: data.current_cost,
    retailPrice: data.retail_price,
    isSerialTracked: data.is_serial_tracked,
    reorderPoint: data.reorder_point,
    reorderQuantity: data.reorder_quantity,
    status: data.status,
    glAccountId: data.gl_account_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapToGoInventoryBalance(data: any): GoInventoryBalance {
  return {
    itemId: data.item_id,
    locationId: data.location_id,
    locationName: data.location_name,
    quantityOnHand: data.quantity_on_hand,
    quantityReserved: data.quantity_reserved,
    quantityAvailable: data.quantity_available,
    weightedAverageCost: data.weighted_average_cost,
    totalValue: data.total_value,
  };
}

function mapToGoInventoryReservation(data: any): GoInventoryReservation {
  return {
    id: data.id,
    itemId: data.item_id,
    quantity: data.quantity,
    locationId: data.location_id,
    caseId: data.case_id,
    contractId: data.contract_id,
    reservedAt: new Date(data.reserved_at),
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    status: data.status,
  };
}

function mapToGoInventoryTransaction(data: any): GoInventoryTransaction {
  return {
    id: data.id,
    itemId: data.item_id,
    locationId: data.location_id,
    transactionType: data.transaction_type,
    quantity: data.quantity,
    unitCost: data.unit_cost,
    totalCost: data.total_cost,
    referenceType: data.reference_type,
    referenceId: data.reference_id,
    notes: data.notes,
    postedAt: new Date(data.posted_at),
    createdBy: data.created_by,
  };
}
