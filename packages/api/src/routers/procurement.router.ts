import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';
import { GoProcurementPort } from '@dykstra/application';

/**
 * Procurement Router
 * Handles vendor management and purchase order operations
 */
export const procurementRouter = router({
  /**
   * Vendor Management
   */
  vendors: router({
    /**
     * Create new vendor/supplier
     */
    create: staffProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          contactName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.object({
            street1: z.string().min(1),
            street2: z.string().optional(),
            city: z.string().min(1),
            state: z.string().length(2),
            zip: z.string().min(5),
            country: z.string().default('US'),
          }),
          paymentTerms: z.string().min(1), // e.g., "Net 30", "Due on Receipt"
          taxId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          Effect.gen(function* () {
            const procurementPort = yield* GoProcurementPort;
            
            return yield* procurementPort.createVendor({
              name: input.name,
              contactName: input.contactName,
              email: input.email,
              phone: input.phone,
              address: {
                street1: input.address.street1,
                street2: input.address.street2,
                city: input.address.city,
                state: input.address.state,
                zip: input.address.zip,
                country: input.address.country,
              },
              paymentTerms: input.paymentTerms,
              taxId: input.taxId,
            });
          })
        );
      }),

    /**
     * List all vendors with optional filters
     */
    list: staffProcedure
      .input(
        z.object({
          status: z.enum(['active', 'inactive', 'all']).default('active'),
          search: z.string().optional(),
        })
      )
      .query(async () => {
        // Mock implementation - will be replaced with Go backend integration
        return [
          {
            id: 'vendor-1',
            name: 'Batesville Casket Company',
            contactName: 'John Smith',
            email: 'john@batesville.com',
            phone: '(800) 622-8373',
            paymentTerms: 'Net 30',
            status: 'active' as const,
          },
          {
            id: 'vendor-2',
            name: 'Matthews International',
            contactName: 'Sarah Johnson',
            email: 'sarah@matthews.com',
            phone: '(800) 666-4898',
            paymentTerms: 'Net 45',
            status: 'active' as const,
          },
          {
            id: 'vendor-3',
            name: 'American Wilbert Vault',
            contactName: 'Mike Davis',
            email: 'mike@wilbert.com',
            phone: '(800) 289-6358',
            paymentTerms: 'Due on Receipt',
            status: 'active' as const,
          },
        ];
      }),
  }),

  /**
   * Purchase Order Management
   */
  purchaseOrders: router({
    /**
     * Create new purchase order
     */
    create: staffProcedure
      .input(
        z.object({
          vendorId: z.string().min(1),
          orderDate: z.date(),
          expectedDeliveryDate: z.date().optional(),
          lineItems: z.array(
            z.object({
              description: z.string(),
              quantity: z.number().positive(),
              unitPrice: z.number().positive(),
              totalPrice: z.number().positive(),
              glAccountId: z.string(),
            })
          ).min(1),
          shippingAmount: z.number().nonnegative().optional(),
          taxAmount: z.number().nonnegative().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await runEffect(
          Effect.gen(function* () {
            const procurementPort = yield* GoProcurementPort;
            
            return yield* procurementPort.createPurchaseOrder({
              vendorId: input.vendorId,
              orderDate: input.orderDate,
              expectedDeliveryDate: input.expectedDeliveryDate,
              lineItems: input.lineItems,
              shippingAmount: input.shippingAmount,
              taxAmount: input.taxAmount,
            });
          })
        );
      }),

    /**
     * List purchase orders with filters
     */
    list: staffProcedure
      .input(
        z.object({
          vendorId: z.string().optional(),
          status: z.enum(['all', 'draft', 'pending_approval', 'approved', 'sent', 'received', 'cancelled']).default('all'),
        })
      )
      .query(async () => {
        // Mock implementation
        return [];
      }),
  }),
});
