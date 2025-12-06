import { z } from 'zod';

/**
 * Validation schemas for inventory operations
 */

export const transferInventorySchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  fromLocationId: z.string().min(1, "Source location is required"),
  toLocationId: z.string().min(1, "Destination location is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().min(1, "Transfer reason is required"),
  requestedBy: z.string().min(1, "Requester ID is required"),
}).refine((data) => data.fromLocationId !== data.toLocationId, {
  message: "Source and destination locations must be different",
  path: ["toLocationId"],
});

export type TransferInventoryInput = z.infer<typeof transferInventorySchema>;
