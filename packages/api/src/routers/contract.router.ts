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

  /**
   * Create contract from template
   * Loads template and pre-fills with case data
   */
  createFromTemplate: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        templateId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with ContractService.createFromTemplate
      // For now, return mock contract creation result
      return {
        contractId: `contract_${crypto.randomUUID()}`,
        caseId: input.caseId,
        templateId: input.templateId,
        status: 'draft' as const,
        services: [],
        products: [],
        subtotal: 0,
        tax: 0,
        totalAmount: 0,
        createdBy: ctx.user.id,
        createdAt: new Date(),
        message: 'Contract created from template successfully',
      };
    }),

  /**
   * Add line item to contract
   * Supports both services and products
   */
  addLineItem: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
        type: z.enum(['service', 'product']),
        itemId: z.string(),
        name: z.string(),
        quantity: z.number().int().min(1),
        price: z.number().min(0),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with ContractRepository.addLineItem
      // For now, return mock line item result
      return {
        lineItemId: `line_${crypto.randomUUID()}`,
        contractId: input.contractId,
        type: input.type,
        itemId: input.itemId,
        name: input.name,
        quantity: input.quantity,
        price: input.price,
        lineTotal: input.quantity * input.price,
        description: input.description,
        addedBy: ctx.user.id,
        addedAt: new Date(),
        message: `${input.type === 'service' ? 'Service' : 'Product'} added to contract`,
      };
    }),

  /**
   * Remove line item from contract
   */
  removeLineItem: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
        lineItemId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with ContractRepository.removeLineItem
      // For now, return mock removal result
      return {
        contractId: input.contractId,
        lineItemId: input.lineItemId,
        removedBy: ctx.user.id,
        removedAt: new Date(),
        message: 'Line item removed from contract',
      };
    }),

  /**
   * Update contract pricing
   * Recalculates totals based on line items and tax rate
   */
  updatePricing: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
        discountAmount: z.number().min(0).optional(),
        discountPercentage: z.number().min(0).max(100).optional(),
        taxRate: z.number().min(0).max(1).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with ContractService.updatePricing
      // For now, return mock pricing update result
      const subtotal = 8500.00; // Mock subtotal
      const discountAmount = input.discountAmount ?? 
        (input.discountPercentage ? subtotal * (input.discountPercentage / 100) : 0);
      const discountedSubtotal = subtotal - discountAmount;
      const taxRate = input.taxRate ?? 0.06;
      const tax = discountedSubtotal * taxRate;
      const totalAmount = discountedSubtotal + tax;

      return {
        contractId: input.contractId,
        subtotal,
        discountAmount,
        discountPercentage: input.discountPercentage,
        discountedSubtotal,
        tax,
        taxRate,
        totalAmount,
        updatedBy: ctx.user.id,
        updatedAt: new Date(),
        message: 'Contract pricing updated successfully',
      };
    }),

  /**
   * Send contract for signature
   * Triggers e-signature workflow (DocuSign, HelloSign, etc.)
   */
  sendForSignature: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
        signers: z.array(
          z.object({
            name: z.string(),
            email: z.string().email(),
            role: z.enum(['primary_family', 'co_signer', 'witness', 'director']),
            order: z.number().int().min(1), // Signing order
          })
        ),
        message: z.string().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with e-signature provider (DocuSign, HelloSign)
      // For now, return mock signature request result
      const envelopeId = `env_${crypto.randomUUID()}`;
      
      return {
        contractId: input.contractId,
        envelopeId,
        signers: input.signers.map((signer) => ({
          ...signer,
          signerId: `signer_${crypto.randomUUID()}`,
          status: 'pending' as const,
          sentAt: new Date(),
        })),
        status: 'pending_signatures' as const,
        sentBy: ctx.user.id,
        sentAt: new Date(),
        dueDate: input.dueDate,
        message: `Contract sent for signature to ${input.signers.length} signer(s)`,
      };
    }),

  /**
   * Record signature on contract
   * Webhook handler for e-signature provider events
   */
  recordSignature: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
        signerId: z.string(),
        signerName: z.string(),
        signerEmail: z.string().email(),
        signedAt: z.date(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Integrate with ContractRepository.recordSignature
      // For now, return mock signature record result
      return {
        contractId: input.contractId,
        signatureId: `sig_${crypto.randomUUID()}`,
        signerId: input.signerId,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signedAt: input.signedAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        status: 'signed' as const,
        message: `Signature recorded for ${input.signerName}`,
      };
    }),

  /**
   * Generate contract PDF
   * Creates PDF with all line items, signatures, and terms
   */
  generatePDF: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
        includeSignatures: z.boolean().default(true),
        includeLineItems: z.boolean().default(true),
        includeTerms: z.boolean().default(true),
        watermark: z.enum(['none', 'draft', 'copy', 'final']).default('none'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with PDF generation service (Puppeteer, PDFKit)
      // For now, return mock PDF generation result
      return {
        contractId: input.contractId,
        pdfUrl: `/api/contracts/${input.contractId}/document.pdf`,
        pdfSize: 245632, // bytes
        pageCount: 5,
        watermark: input.watermark,
        generatedBy: ctx.user.id,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        message: 'Contract PDF generated successfully',
      };
    }),

  /**
   * Renew contract
   * Creates new version of pre-need contract with updated pricing
   */
  renew: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
        newExpirationDate: z.date(),
        priceAdjustmentPercentage: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with ContractService.renew (Use Case 6.6)
      // For now, return mock renewal result
      const priceAdjustment = input.priceAdjustmentPercentage ?? 0;
      const originalAmount = 8500.00; // Mock
      const newAmount = originalAmount * (1 + priceAdjustment / 100);

      return {
        originalContractId: input.contractId,
        renewedContractId: `contract_${crypto.randomUUID()}`,
        originalExpirationDate: new Date('2025-12-31'),
        newExpirationDate: input.newExpirationDate,
        originalAmount,
        priceAdjustmentPercentage: priceAdjustment,
        newAmount,
        status: 'draft' as const,
        renewedBy: ctx.user.id,
        renewedAt: new Date(),
        notes: input.notes,
        message: `Contract renewed with ${priceAdjustment}% price adjustment`,
      };
    }),

  /**
   * Cancel contract
   * Marks contract as cancelled and triggers refund processing if applicable
   */
  cancel: staffProcedure
    .input(
      z.object({
        contractId: z.string(),
        reason: z.enum(['customer_request', 'duplicate', 'error', 'non_payment', 'other']),
        notes: z.string().optional(),
        issueRefund: z.boolean().default(false),
        refundAmount: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with ContractService.cancel and RefundService
      // For now, return mock cancellation result
      return {
        contractId: input.contractId,
        previousStatus: 'pending_signatures' as const,
        newStatus: 'cancelled' as const,
        reason: input.reason,
        notes: input.notes,
        cancelledBy: ctx.user.id,
        cancelledAt: new Date(),
        refund: input.issueRefund ? {
          refundId: `refund_${crypto.randomUUID()}`,
          amount: input.refundAmount ?? 0,
          status: 'pending' as const,
          initiatedAt: new Date(),
        } : null,
        message: `Contract cancelled. ${input.issueRefund ? 'Refund initiated.' : ''}`,
      };
    }),
});
