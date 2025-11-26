import { z } from 'zod';
import { router, familyProcedure } from '../trpc';
import { saveArrangements, getArrangements } from '@dykstra/application';
import { ServiceTypeSchema } from '@dykstra/shared';
import { runEffect } from '../utils/effect-runner';

/**
 * Product schema
 */
const ProductSchema = z.object({
  id: z.string(),
  type: z.enum(['casket', 'urn', 'flowers', 'other']),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  imageUrl: z.string().nullable(),
  selected: z.boolean(),
});

/**
 * Ceremony details schema
 */
const CeremonyDetailsSchema = z.object({
  date: z.date().nullable().optional(),
  time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  officiant: z.string().nullable().optional(),
  musicSelections: z.array(z.string()).optional(),
  readings: z.array(z.string()).optional(),
  specialRequests: z.string().nullable().optional(),
});

/**
 * Arrangements router
 */
export const arrangementsRouter = router({
  /**
   * Get arrangements for a case
   */
  get: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const result = await runEffect(
        getArrangements({
          caseId: input.caseId as any, // CaseId brand
          requestingUserId: ctx.user.id,
        })
      );

      return {
        serviceType: result.arrangements.serviceType,
        products: result.arrangements.products,
        ceremony: {
          ...result.arrangements.ceremony,
          date: result.arrangements.ceremony.date?.toISOString(),
        },
        notes: result.arrangements.notes.map(note => ({
          ...note,
          createdAt: note.createdAt.toISOString(),
        })),
        lastModifiedBy: result.arrangements.lastModifiedBy,
        lastModifiedAt: result.arrangements.lastModifiedAt?.toISOString(),
        completionPercentage: result.completionPercentage,
        isComplete: result.isComplete,
        totalProductCost: result.totalProductCost,
        selectedProductCount: result.selectedProductCount,
      };
    }),

  /**
   * Save arrangements (incremental updates)
   */
  save: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
        serviceType: ServiceTypeSchema.optional(),
        products: z.array(ProductSchema).optional(),
        ceremony: CeremonyDetailsSchema.optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const case_ = await runEffect(
        saveArrangements({
          caseId: input.caseId as any, // CaseId brand
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          serviceType: input.serviceType,
          products: input.products,
          ceremony: input.ceremony,
          note: input.note,
        })
      );

      return {
        id: case_.id,
        businessKey: case_.businessKey,
        version: case_.version,
        updatedAt: case_.updatedAt,
        arrangmentsCompletionPercentage: case_.arrangements?.completionPercentage ?? 0,
      };
    }),
});
