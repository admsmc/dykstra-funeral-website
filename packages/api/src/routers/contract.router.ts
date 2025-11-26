import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import {
  getProductCatalog,
  getServiceCatalog,
  getTemplates,
  getDefaultTemplate,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  calculateContractTotal,
  substituteVariables,
  createContract,
  listContracts,
  getContractDetails,
  updateContractStatus,
} from '@dykstra/application';

/**
 * Contract Builder Router
 * 
 * Handles contract creation from templates with product/service catalogs
 * Includes variable substitution and PDF generation capabilities
 */

const ProductCategoryEnum = z.enum([
  'CASKET',
  'URN',
  'VAULT',
  'FLOWERS',
  'MEMORIAL_CARDS',
  'GUEST_BOOK',
  'JEWELRY',
  'KEEPSAKE',
  'MISCELLANEOUS',
]);

const ServiceTypeEnum = z.enum([
  'TRADITIONAL_BURIAL',
  'TRADITIONAL_CREMATION',
  'MEMORIAL_SERVICE',
  'DIRECT_BURIAL',
  'DIRECT_CREMATION',
  'CELEBRATION_OF_LIFE',
]);

const ContractStatusEnum = z.enum([
  'draft',
  'pending_review',
  'pending_signatures',
  'fully_signed',
  'cancelled',
]);

export const contractRouter = router({
  /**
   * Get product catalog with optional filters
   */
  getProductCatalog: staffProcedure
    .input(
      z.object({
        category: ProductCategoryEnum.optional(),
        search: z.string().optional(),
        availableOnly: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        getProductCatalog({
          category: input.category,
          search: input.search,
          availableOnly: input.availableOnly,
        })
      );
    }),

  /**
   * Get service catalog filtered by service type
   */
  getServiceCatalog: staffProcedure
    .input(
      z.object({
        serviceType: ServiceTypeEnum.optional(),
        availableOnly: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        getServiceCatalog({
          serviceType: input.serviceType,
          availableOnly: input.availableOnly,
        })
      );
    }),

  /**
   * Get contract templates
   */
  getTemplates: staffProcedure
    .input(
      z.object({
        serviceType: ServiceTypeEnum.optional(),
        activeOnly: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        getTemplates({
          serviceType: input.serviceType,
          activeOnly: input.activeOnly,
        })
      );
    }),

  /**
   * Get default template for service type
   */
  getDefaultTemplate: staffProcedure
    .input(
      z.object({
        serviceType: ServiceTypeEnum,
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        getDefaultTemplate(input.serviceType)
      );
    }),

  /**
   * Calculate contract total with tax
   */
  calculateTotal: staffProcedure
    .input(
      z.object({
        services: z.array(
          z.object({
            id: z.string(),
            quantity: z.number().int().min(1),
            price: z.number(),
          })
        ),
        products: z.array(
          z.object({
            id: z.string(),
            quantity: z.number().int().min(1),
            price: z.number(),
          })
        ),
        taxRate: z.number().default(0.06), // 6% default tax rate
      })
    )
    .mutation(async ({ input }) => {
      return calculateContractTotal({
        services: input.services,
        products: input.products,
        taxRate: input.taxRate,
      });
    }),

  /**
   * Substitute variables in template content
   */
  substituteVariables: staffProcedure
    .input(
      z.object({
        content: z.string(),
        variables: z.record(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return substituteVariables(input.content, input.variables);
    }),

  /**
   * Create contract from builder
   */
  createContract: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        templateId: z.string().optional(),
        services: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            quantity: z.number().int().min(1),
            price: z.number(),
          })
        ),
        products: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            quantity: z.number().int().min(1),
            price: z.number(),
          })
        ),
        subtotal: z.number(),
        tax: z.number(),
        totalAmount: z.number(),
        termsAndConditions: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        createContract({
          caseId: input.caseId,
          templateId: input.templateId,
          services: input.services,
          products: input.products,
          subtotal: input.subtotal,
          tax: input.tax,
          totalAmount: input.totalAmount,
          termsAndConditions: input.termsAndConditions,
          createdBy: ctx.user.id,
        })
      );
    }),

  /**
   * List contracts with filters
   */
  listContracts: staffProcedure
    .input(
      z.object({
        status: ContractStatusEnum.optional(),
        caseId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        listContracts({
          status: input.status,
          caseId: input.caseId,
          limit: input.limit,
          cursor: input.cursor,
        })
      );
    }),

  /**
   * Get contract details
   */
  getContractDetails: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        getContractDetails(input.contractId)
      );
    }),

  /**
   * Update contract status (SCD2)
   */
  updateStatus: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
        status: ContractStatusEnum,
      })
    )
    .mutation(async ({ input }) => {
      return await runEffect(
        updateContractStatus({
          businessKey: input.businessKey,
          status: input.status,
        })
      );
    }),

  /**
   * Save contract template
   */
  saveTemplate: staffProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        serviceType: ServiceTypeEnum.optional(),
        content: z.string().min(1),
        variables: z.array(z.string()).default([]),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        saveTemplate({
          name: input.name,
          description: input.description,
          serviceType: input.serviceType,
          content: input.content,
          variables: input.variables,
          isDefault: input.isDefault,
          createdBy: ctx.user.id,
        })
      );
    }),

  /**
   * Update contract template
   */
  updateTemplate: staffProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        content: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      return await runEffect(
        updateTemplate(id, updateData)
      );
    }),

  /**
   * Delete contract template
   */
  deleteTemplate: staffProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await runEffect(deleteTemplate(input.id));
      return {
        success: true,
        message: 'Template deleted successfully',
      };
    }),
});
