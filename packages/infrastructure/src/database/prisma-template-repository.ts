import { Effect } from 'effect';
import { prisma } from './prisma-client';
import {
  type TemplateRepositoryPortService,
  PersistenceError,
} from '@dykstra/application';
import { MemorialTemplate } from '@dykstra/domain';

/**
 * Map Prisma MemorialTemplate to Domain MemorialTemplate
 */
const toDomain = (
  prismaTemplate: any // Prisma MemorialTemplate type
): MemorialTemplate => {
  // Use factory method if version 1, otherwise reconstitute from DB
  if (prismaTemplate.version === 1) {
    return MemorialTemplate.create(
      {
        id: prismaTemplate.id,
        businessKey: prismaTemplate.businessKey,
        name: prismaTemplate.name,
        category: prismaTemplate.category as any,
        status: prismaTemplate.status as any,
        createdBy: prismaTemplate.createdBy,
        funeralHomeId: prismaTemplate.funeralHomeId,
      },
      {
        htmlTemplate: prismaTemplate.htmlTemplate,
        cssStyles: prismaTemplate.cssStyles,
        previewImageUrl: prismaTemplate.previewImageUrl,
      },
      {
        pageSize: prismaTemplate.pageSize as any,
        orientation: prismaTemplate.orientation as any,
        margins: {
          top: prismaTemplate.marginTop,
          right: prismaTemplate.marginRight,
          bottom: prismaTemplate.marginBottom,
          left: prismaTemplate.marginLeft,
        },
        printQuality: prismaTemplate.printQuality as any,
      }
    );
  }

  // For versions > 1, we need to manually construct since it came from createNewVersion
  // This is a limitation - we'll create v1 and then recreate the version chain
  // In production, you might want a reconstitution factory method in the domain
  const base = MemorialTemplate.create(
    {
      id: prismaTemplate.id,
      businessKey: prismaTemplate.businessKey,
      name: prismaTemplate.name,
      category: prismaTemplate.category as any,
      status: prismaTemplate.status as any,
      createdBy: prismaTemplate.createdBy,
      funeralHomeId: prismaTemplate.funeralHomeId,
    },
    {
      htmlTemplate: prismaTemplate.htmlTemplate,
      cssStyles: prismaTemplate.cssStyles,
      previewImageUrl: prismaTemplate.previewImageUrl,
    },
    {
      pageSize: prismaTemplate.pageSize as any,
      orientation: prismaTemplate.orientation as any,
      margins: {
        top: prismaTemplate.marginTop,
        right: prismaTemplate.marginRight,
        bottom: prismaTemplate.marginBottom,
        left: prismaTemplate.marginLeft,
      },
      printQuality: prismaTemplate.printQuality as any,
    }
  );

  // Monkey-patch the temporal data for reconstitution
  // In production, add a proper reconstitution factory to MemorialTemplate
  return Object.assign(base, {
    temporal: {
      validFrom: prismaTemplate.validFrom,
      validTo: prismaTemplate.validTo,
      version: prismaTemplate.version,
      changeReason: prismaTemplate.changeReason,
    },
  });
};

/**
 * Map Domain MemorialTemplate to Prisma create/update data
 */
const toPrisma = (template: MemorialTemplate) => {
  return {
    id: template.metadata.id,
    businessKey: template.metadata.businessKey,
    version: template.temporal.version,
    validFrom: template.temporal.validFrom,
    validTo: template.temporal.validTo,
    isCurrent: template.temporal.validTo === null,
    funeralHomeId: template.metadata.funeralHomeId,
    name: template.metadata.name,
    category: template.metadata.category,
    status: template.metadata.status,
    createdBy: template.metadata.createdBy,
    htmlTemplate: template.content.htmlTemplate,
    cssStyles: template.content.cssStyles,
    previewImageUrl: template.content.previewImageUrl,
    pageSize: template.settings.pageSize,
    orientation: template.settings.orientation,
    marginTop: template.settings.margins.top,
    marginRight: template.settings.margins.right,
    marginBottom: template.settings.margins.bottom,
    marginLeft: template.settings.margins.left,
    printQuality: template.settings.printQuality,
    changeReason: template.temporal.changeReason,
  };
};

/**
 * Prisma Template Repository
 *
 * Implements TemplateRepositoryPort with SCD2 pattern for template versioning.
 *
 * Architecture notes:
 * - Object-based implementation (NOT class-based) per ARCHITECTURE.md
 * - Uses Prisma ORM for database access
 * - All SCD2 operations maintain temporal integrity
 *
 * SCD2 Pattern:
 * - Current version: isCurrent = true, validTo = null
 * - Historical versions: isCurrent = false, validTo = timestamp
 * - businessKey links all versions together
 * - version increments with each change
 */
export const PrismaTemplateRepository: TemplateRepositoryPortService = {
  findCurrentByBusinessKey: (businessKey) =>
    Effect.tryPromise({
      try: async () => {
        const prismaTemplate = await prisma.memorialTemplate.findFirst({
          where: {
            businessKey,
            isCurrent: true,
          },
        });

        return prismaTemplate ? toDomain(prismaTemplate) : null;
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find template by business key: ${businessKey}`,
          error
        ),
    }),

  findCurrentByFuneralHome: (funeralHomeId, category) =>
    Effect.tryPromise({
      try: async () => {
        // Find both system templates (funeralHomeId = null) and custom templates
        const prismaTemplates = await prisma.memorialTemplate.findMany({
          where: {
            OR: [
              { funeralHomeId: null }, // System templates
              { funeralHomeId }, // Custom templates for this funeral home
            ],
            category,
            isCurrent: true,
            status: {
              in: ['active', 'draft'], // Exclude deprecated
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        return prismaTemplates.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find templates for funeral home: ${funeralHomeId}`,
          error
        ),
    }),

  save: (template) =>
    Effect.tryPromise({
      try: async () => {
        const prismaData = toPrisma(template);

        // Check if this is a new version (version > 1)
        if (template.temporal.version > 1) {
          // SCD2 Update: Close old version, insert new version
          await prisma.$transaction(async (tx) => {
            // 1. Update old version: set validTo and isCurrent = false
            await tx.memorialTemplate.updateMany({
              where: {
                businessKey: template.metadata.businessKey,
                isCurrent: true,
              },
              data: {
                validTo: template.temporal.validFrom,
                isCurrent: false,
              },
            });

            // 2. Insert new version
            await tx.memorialTemplate.create({
              data: prismaData,
            });
          });
        } else {
          // Version 1: Simple insert
          await prisma.memorialTemplate.create({
            data: prismaData,
          });
        }
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to save template: ${template.metadata.businessKey}`,
          error
        ),
    }),

  getHistory: (businessKey) =>
    Effect.tryPromise({
      try: async () => {
        const prismaTemplates = await prisma.memorialTemplate.findMany({
          where: {
            businessKey,
          },
          orderBy: {
            version: 'asc',
          },
        });

        return prismaTemplates.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to get template history: ${businessKey}`,
          error
        ),
    }),

  findById: (id) =>
    Effect.tryPromise({
      try: async () => {
        const prismaTemplate = await prisma.memorialTemplate.findUnique({
          where: { id },
        });

        return prismaTemplate ? toDomain(prismaTemplate) : null;
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find template by ID: ${id}`,
          error
        ),
    }),

  findSystemTemplates: (category) =>
    Effect.tryPromise({
      try: async () => {
        const prismaTemplates = await prisma.memorialTemplate.findMany({
          where: {
            funeralHomeId: null, // System templates only
            ...(category && { category }), // Optional category filter
            isCurrent: true,
            status: 'active',
          },
          orderBy: {
            name: 'asc',
          },
        });

        return prismaTemplates.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find system templates`,
          error
        ),
    }),
};
