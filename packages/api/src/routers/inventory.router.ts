import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Inventory router
 * Multi-location inventory management (Use Cases 5.7, 6.5, 5.4)
 */
export const inventoryRouter = router({
  /**
   * List inventory items across all locations
   */
  list: staffProcedure
    .input(
      z.object({
        category: z.string().optional(),
        locationId: z.string().optional(),
        lowStockOnly: z.boolean().default(false),
        searchQuery: z.string().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock inventory data - will be replaced with Go backend integration
      const allItems = [
        {
          id: 'item-1',
          sku: 'CASKET-OAK-001',
          description: 'Oak Casket - Traditional',
          category: 'Caskets',
          retailPrice: 4500.0,
          reorderPoint: 2,
          locations: [
            {
              locationId: 'loc-main',
              locationName: 'Main Chapel',
              quantityOnHand: 5,
              quantityReserved: 1,
              quantityAvailable: 4,
            },
            {
              locationId: 'loc-north',
              locationName: 'North Location',
              quantityOnHand: 2,
              quantityReserved: 0,
              quantityAvailable: 2,
            },
          ],
        },
        {
          id: 'item-2',
          sku: 'URN-CERAMIC-002',
          description: 'Ceramic Urn - Blue',
          category: 'Urns',
          retailPrice: 250.0,
          reorderPoint: 3,
          locations: [
            {
              locationId: 'loc-main',
              locationName: 'Main Chapel',
              quantityOnHand: 1,
              quantityReserved: 0,
              quantityAvailable: 1,
            },
            {
              locationId: 'loc-north',
              locationName: 'North Location',
              quantityOnHand: 1,
              quantityReserved: 1,
              quantityAvailable: 0,
            },
          ],
        },
        {
          id: 'item-3',
          sku: 'VAULT-STEEL-003',
          description: 'Steel Burial Vault',
          category: 'Vaults',
          retailPrice: 1800.0,
          reorderPoint: 1,
          locations: [
            {
              locationId: 'loc-main',
              locationName: 'Main Chapel',
              quantityOnHand: 3,
              quantityReserved: 0,
              quantityAvailable: 3,
            },
          ],
        },
      ];

      let filtered = allItems;

      // Filter by category
      if (input.category) {
        filtered = filtered.filter((item) => item.category === input.category);
      }

      // Filter by location
      if (input.locationId) {
        filtered = filtered.filter((item) =>
          item.locations.some((loc) => loc.locationId === input.locationId)
        );
      }

      // Filter by search query
      if (input.searchQuery) {
        const query = input.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.description.toLowerCase().includes(query) ||
            item.sku.toLowerCase().includes(query)
        );
      }

      // Filter by low stock
      if (input.lowStockOnly) {
        filtered = filtered.filter((item) => {
          const totalAvailable = item.locations.reduce(
            (sum, loc) => sum + loc.quantityAvailable,
            0
          );
          return totalAvailable <= item.reorderPoint;
        });
      }

      return filtered;
    }),

  /**
   * Transfer inventory between locations (Use Case 6.5)
   */
  transfer: staffProcedure
    .input(
      z.object({
        itemId: z.string(),
        fromLocationId: z.string(),
        toLocationId: z.string(),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        transferId: `TRF-${Date.now()}`,
        ...input,
        status: 'completed' as const,
        transferredBy: ctx.user.id,
        transferredAt: new Date(),
      };
    }),

  /**
   * Adjust inventory (cycle count) (Use Case 5.4)
   */
  adjust: staffProcedure
    .input(
      z.object({
        itemId: z.string(),
        locationId: z.string(),
        newQuantity: z.number().min(0),
        reason: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        adjustmentId: `ADJ-${Date.now()}`,
        ...input,
        adjustedBy: ctx.user.id,
        adjustedAt: new Date(),
      };
    }),

  /**
   * Get item by ID
   */
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Mock implementation
      return {
        id: input.id,
        sku: 'CASKET-OAK-001',
        description: 'Oak Casket - Traditional',
        category: 'Caskets',
        retailPrice: 4500.0,
        reorderPoint: 2,
        locations: [
          {
            locationId: 'loc-main',
            locationName: 'Main Chapel',
            quantityOnHand: 5,
            quantityReserved: 1,
            quantityAvailable: 4,
          },
        ],
      };
    }),

  /**
   * List all locations
   */
  listLocations: staffProcedure.query(async () => {
    // Mock implementation - will be replaced with Go backend integration
    return [
      { id: 'loc-main', name: 'Main Chapel', type: 'funeral_home' },
      { id: 'loc-north', name: 'North Location', type: 'funeral_home' },
      { id: 'loc-warehouse', name: 'Central Warehouse', type: 'warehouse' },
    ];
  }),

  /**
   * List items with availability across locations
   */
  listItems: staffProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        locationId: z.string().optional(),
      })
    )
    .query(async () => {
      // Mock implementation - will be replaced with Go backend integration
      return [
        {
          id: 'item-1',
          name: 'Oak Casket - Traditional',
          sku: 'CASKET-OAK-001',
          category: 'Caskets',
          availability: {
            'loc-main': 5,
            'loc-north': 2,
          },
        },
        {
          id: 'item-2',
          name: 'Ceramic Urn - Blue',
          sku: 'URN-CERAMIC-002',
          category: 'Urns',
          availability: {
            'loc-main': 1,
            'loc-north': 1,
          },
        },
      ];
    }),

  /**
   * Create new inventory item
   */
  create: staffProcedure
    .input(
      z.object({
        sku: z.string(),
        description: z.string(),
        category: z.string(),
        retailPrice: z.number(),
        reorderPoint: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `item-${Date.now()}`,
        ...input,
        locations: [],
        createdAt: new Date(),
      };
    }),
});
