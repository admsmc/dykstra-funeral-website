import { z } from 'zod';
import { router, familyProcedure, staffProcedure } from '../trpc';
import { saveArrangements, getArrangements, getServiceRecommendations } from '@dykstra/application';
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

  /**
   * Get personalized service arrangement recommendations
   */
  getRecommendations: staffProcedure
    .input(
      z.object({
        serviceType: z.enum([
          'TRADITIONAL_BURIAL',
          'CREMATION_WITH_MEMORIAL',
          'DIRECT_CREMATION',
          'MEMORIAL_SERVICE',
          'GRAVESIDE_SERVICE',
          'DIRECT_BURIAL',
        ]),
        budgetRange: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
          })
          .optional(),
        preferences: z
          .object({
            includeFlowers: z.boolean().optional(),
            includeMemorialCards: z.boolean().optional(),
            preferSimpleArrangement: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const result = await runEffect(
        getServiceRecommendations({
          serviceType: input.serviceType as any,
          budgetRange: input.budgetRange,
          preferences: input.preferences,
          requestedBy: ctx.user.id,
        })
      );

      return {
        primaryArrangement: result.primaryArrangement,
        alternativeArrangements: result.alternativeArrangements,
        requestedServiceType: result.requestedServiceType,
        budgetRange: result.budgetRange,
        personalization: result.personalization,
      };
    }),

  /**
   * Browse service catalog (services and products)
   */
  browseCatalog: staffProcedure
    .input(
      z.object({
        serviceType: z
          .enum([
            'TRADITIONAL_BURIAL',
            'CREMATION_WITH_MEMORIAL',
            'DIRECT_CREMATION',
            'MEMORIAL_SERVICE',
            'GRAVESIDE_SERVICE',
            'DIRECT_BURIAL',
          ])
          .optional(),
        productType: z
          .enum(['casket', 'urn', 'flowers', 'memorial_cards', 'other'])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock data for MVP - would integrate with catalog use cases in production
      const services = [
        {
          id: 'svc_1',
          name: 'Basic Services of Funeral Director and Staff',
          description: 'Consultation, coordination, and professional services',
          price: 2495,
          required: true,
          category: 'essential',
        },
        {
          id: 'svc_2',
          name: 'Embalming',
          description: 'Preparation and preservation of remains',
          price: 750,
          required: false,
          category: 'preparation',
        },
        {
          id: 'svc_3',
          name: 'Viewing/Visitation',
          description: 'Facility use for family and friends',
          price: 450,
          required: false,
          category: 'ceremony',
        },
        {
          id: 'svc_4',
          name: 'Funeral Ceremony',
          description: 'Coordination and staffing of funeral service',
          price: 550,
          required: false,
          category: 'ceremony',
        },
        {
          id: 'svc_5',
          name: 'Graveside Service',
          description: 'Coordination and staffing at cemetery',
          price: 350,
          required: false,
          category: 'ceremony',
        },
      ];

      const products = [
        {
          id: 'prod_1',
          name: 'Oak Casket - Traditional',
          description: 'Solid oak with velvet interior',
          price: 3500,
          type: 'casket',
          imageUrl: null,
        },
        {
          id: 'prod_2',
          name: 'Metal Casket - Premium',
          description: 'Stainless steel with silk interior',
          price: 4200,
          type: 'casket',
          imageUrl: null,
        },
        {
          id: 'prod_3',
          name: 'Brass Urn - Classic',
          description: 'Handcrafted brass urn',
          price: 350,
          type: 'urn',
          imageUrl: null,
        },
        {
          id: 'prod_4',
          name: 'Ceramic Urn - Floral',
          description: 'Hand-painted ceramic with floral design',
          price: 275,
          type: 'urn',
          imageUrl: null,
        },
        {
          id: 'prod_5',
          name: 'Casket Spray',
          description: 'Large floral arrangement for casket',
          price: 350,
          type: 'flowers',
          imageUrl: null,
        },
      ];

      return {
        services: input.serviceType
          ? services.filter((s) => s.category === 'essential' || s.category === 'ceremony')
          : services,
        products: input.productType
          ? products.filter((p) => p.type === input.productType)
          : products,
      };
    }),

  /**
   * Calculate pricing for selected services and products
   */
  calculatePricing: staffProcedure
    .input(
      z.object({
        serviceIds: z.array(z.string()),
        productIds: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      // Mock pricing calculation - would use actual catalog data in production
      const servicePrices: Record<string, number> = {
        svc_1: 2495,
        svc_2: 750,
        svc_3: 450,
        svc_4: 550,
        svc_5: 350,
      };

      const productPrices: Record<string, number> = {
        prod_1: 3500,
        prod_2: 4200,
        prod_3: 350,
        prod_4: 275,
        prod_5: 350,
      };

      const servicesTotal = input.serviceIds.reduce(
        (sum, id) => sum + (servicePrices[id] || 0),
        0
      );
      const productsTotal = input.productIds.reduce(
        (sum, id) => sum + (productPrices[id] || 0),
        0
      );

      const subtotal = servicesTotal + productsTotal;
      const tax = 0; // Optional: subtotal * 0.07 for 7% tax
      const total = subtotal + tax;

      return {
        servicesTotal,
        productsTotal,
        subtotal,
        tax,
        total,
        itemizedServices: input.serviceIds.map((id) => ({
          id,
          price: servicePrices[id] || 0,
        })),
        itemizedProducts: input.productIds.map((id) => ({
          id,
          price: productPrices[id] || 0,
        })),
      };
    }),
});
