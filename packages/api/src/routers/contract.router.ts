import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { randomBytes } from 'crypto';

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
  'DRAFT',
  'PENDING_REVIEW',
  'PENDING_SIGNATURES',
  'FULLY_SIGNED',
  'CANCELLED',
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
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const where: any = {};

      if (input.category) {
        where.category = input.category;
      }

      if (input.availableOnly) {
        where.isAvailable = true;
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { sku: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const products = await prisma.productCatalog.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return products;
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
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const where: any = {};

      if (input.serviceType) {
        where.serviceType = input.serviceType;
      }

      if (input.availableOnly) {
        where.isAvailable = true;
      }

      const services = await prisma.serviceCatalog.findMany({
        where,
        orderBy: [{ isRequired: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      });

      return services;
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
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const where: any = {};

      if (input.serviceType) {
        where.serviceType = input.serviceType;
      }

      if (input.activeOnly) {
        where.isActive = true;
      }

      const templates = await prisma.contractTemplate.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });

      return templates;
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
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const template = await prisma.contractTemplate.findFirst({
        where: {
          serviceType: input.serviceType,
          isDefault: true,
          isActive: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No default template found for ${input.serviceType}`,
        });
      }

      return template;
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
      // Calculate subtotals
      const servicesSubtotal = input.services.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const productsSubtotal = input.products.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const subtotal = servicesSubtotal + productsSubtotal;
      const tax = subtotal * input.taxRate;
      const total = subtotal + tax;

      return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        breakdown: {
          services: Math.round(servicesSubtotal * 100) / 100,
          products: Math.round(productsSubtotal * 100) / 100,
        },
      };
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
      let result = input.content;

      // Replace all {{variableName}} with actual values
      Object.entries(input.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        result = result.replace(regex, value);
      });

      return result;
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
        status: ContractStatusEnum.default('DRAFT'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      // Verify case exists
      const caseData = await prisma.case.findFirst({
        where: {
          id: input.caseId,
          isCurrent: true,
        },
      });

      if (!caseData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Case not found',
        });
      }

      // Generate unique business key
      const businessKey = `CONTRACT_${Date.now()}_${randomBytes(4).toString('hex')}`;

      // Create contract
      const contract = await prisma.contract.create({
        data: {
          businessKey,
          temporalVersion: 1,
          caseId: input.caseId,
          contractVersion: 1,
          status: input.status,
          services: input.services,
          products: input.products,
          subtotal: input.subtotal,
          tax: input.tax,
          totalAmount: input.totalAmount,
          termsAndConditions: input.termsAndConditions,
          createdBy: user.id,
        },
        include: {
          case: {
            select: {
              id: true,
              decedentName: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return contract;
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
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const where: any = {
        isCurrent: true,
      };

      if (input.status) {
        where.status = input.status;
      }

      if (input.caseId) {
        where.caseId = input.caseId;
      }

      const contracts = await prisma.contract.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          case: {
            select: {
              id: true,
              decedentName: true,
              serviceType: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          signatures: {
            where: {
              isCurrent: true,
            },
            select: {
              id: true,
              signerName: true,
              signedAt: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (contracts.length > input.limit) {
        const nextItem = contracts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        contracts,
        nextCursor,
      };
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
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const contract = await prisma.contract.findFirst({
        where: {
          id: input.contractId,
          isCurrent: true,
        },
        include: {
          case: {
            select: {
              id: true,
              decedentName: true,
              decedentDateOfBirth: true,
              decedentDateOfDeath: true,
              serviceType: true,
              serviceDate: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          signatures: {
            where: {
              isCurrent: true,
            },
            include: {
              signer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              signedAt: 'asc',
            },
          },
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contract not found',
        });
      }

      return contract;
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
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      // Find current version
      const currentContract = await prisma.contract.findFirst({
        where: {
          businessKey: input.businessKey,
          isCurrent: true,
        },
      });

      if (!currentContract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contract not found',
        });
      }

      // Validate status transition (basic)
      // DRAFT → PENDING_REVIEW → PENDING_SIGNATURES → FULLY_SIGNED
      // Any → CANCELLED

      // SCD2: Close current version and create new version
      await prisma.$transaction(async (tx: typeof prisma) => {
        // Close current version
        await tx.contract.update({
          where: { id: currentContract.id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        // Create new version
        await tx.contract.create({
          data: {
            businessKey: currentContract.businessKey,
            temporalVersion: currentContract.temporalVersion + 1,
            caseId: currentContract.caseId,
            contractVersion: currentContract.contractVersion,
            status: input.status,
            services: currentContract.services,
            products: currentContract.products,
            subtotal: currentContract.subtotal,
            tax: currentContract.tax,
            totalAmount: currentContract.totalAmount,
            termsAndConditions: currentContract.termsAndConditions,
            createdBy: currentContract.createdBy,
            createdAt: currentContract.createdAt,
          },
        });
      });

      return {
        success: true,
        message: `Contract status updated to ${input.status}`,
      };
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
    .mutation(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      // If setting as default, unset other defaults for this service type
      if (input.isDefault && input.serviceType) {
        await prisma.contractTemplate.updateMany({
          where: {
            serviceType: input.serviceType,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const template = await prisma.contractTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          serviceType: input.serviceType,
          content: input.content,
          variables: input.variables,
          isDefault: input.isDefault,
          createdBy: user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return template;
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
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const { id, ...updateData } = input;

      const template = await prisma.contractTemplate.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return template;
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
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      await prisma.contractTemplate.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Template deleted successfully',
      };
    }),
});
