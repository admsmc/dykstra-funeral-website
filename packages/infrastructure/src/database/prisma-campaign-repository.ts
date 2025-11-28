import { Effect, Layer } from 'effect';
import { Campaign, type CampaignId, type CampaignStatus, type CampaignType, NotFoundError } from '@dykstra/domain';
import { CampaignRepository, type CampaignRepositoryService, PersistenceError } from '@dykstra/application';
import { CampaignStatus as PrismaCampaignStatus, CampaignType as PrismaCampaignType } from '@prisma/client';
import { prisma } from './prisma-client';

/**
 * Map Prisma campaign to domain Campaign entity
 */
const toDomain = (prismaCampaign: any): Campaign => {
  return new Campaign({
    id: prismaCampaign.id as CampaignId,
    businessKey: prismaCampaign.businessKey,
    version: prismaCampaign.version,
    funeralHomeId: prismaCampaign.funeralHomeId,
    name: prismaCampaign.name,
    description: prismaCampaign.description,
    type: prismaCampaign.type.toLowerCase() as CampaignType,
    status: prismaCampaign.status.toLowerCase() as CampaignStatus,
    subject: prismaCampaign.subject,
    content: prismaCampaign.content,
    segmentTags: prismaCampaign.segmentTags,
    scheduledFor: prismaCampaign.scheduledFor,
    sentAt: prismaCampaign.sentAt,
    targetCount: prismaCampaign.targetCount,
    sentCount: prismaCampaign.sentCount,
    openedCount: prismaCampaign.openedCount,
    clickedCount: prismaCampaign.clickedCount,
    convertedCount: prismaCampaign.convertedCount,
    createdAt: prismaCampaign.createdAt,
    updatedAt: prismaCampaign.updatedAt,
    createdBy: prismaCampaign.createdBy,
  });
};

/**
 * Map domain Campaign to Prisma format
 */
const toPrisma = (campaign: Campaign, validFrom: Date = new Date()) => {
  return {
    id: campaign.id,
    businessKey: campaign.businessKey,
    version: campaign.version,
    validFrom,
    validTo: null,
    isCurrent: true,
    funeralHomeId: campaign.funeralHomeId,
    name: campaign.name,
    description: campaign.description,
    type: campaign.type.toUpperCase() as PrismaCampaignType,
    status: campaign.status.toUpperCase() as PrismaCampaignStatus,
    subject: campaign.subject,
    content: campaign.content,
    segmentTags: [...campaign.segmentTags],
    scheduledFor: campaign.scheduledFor,
    sentAt: campaign.sentAt,
    targetCount: campaign.targetCount,
    sentCount: campaign.sentCount,
    openedCount: campaign.openedCount,
    clickedCount: campaign.clickedCount,
    convertedCount: campaign.convertedCount,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    createdBy: campaign.createdBy,
  };
};

/**
 * Prisma implementation of CampaignRepository with SCD Type 2 temporal support
 */
export const PrismaCampaignRepository: CampaignRepositoryService = {
  findById: (id: CampaignId) =>
    Effect.tryPromise({
      try: async () => {
        const campaign = await prisma.campaign.findFirst({
          where: {
            OR: [
              { id },
              { businessKey: id, isCurrent: true },
            ],
          },
        });

        if (!campaign) {
          throw new NotFoundError({
            message: `Campaign with ID ${id} not found`,
            entityType: 'Campaign',
            entityId: id,
          });
        }

        return toDomain(campaign);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find campaign', error);
      },
    }),

  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const campaign = await prisma.campaign.findFirst({
          where: { businessKey, isCurrent: true },
        });
        return campaign ? toDomain(campaign) : null;
      },
      catch: (error) => new PersistenceError('Failed to find campaign by business key', error),
    }),

  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const campaigns = await prisma.campaign.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        if (campaigns.length === 0) {
          throw new NotFoundError({
            message: `Campaign ${businessKey} not found`,
            entityType: 'Campaign',
            entityId: businessKey,
          });
        }

        return campaigns.map(toDomain);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find campaign history', error);
      },
    }),

  findByFuneralHome: (funeralHomeId: string, filters = {}) =>
    Effect.tryPromise({
      try: async () => {
        const campaigns = await prisma.campaign.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            ...(filters.status && { status: filters.status.toUpperCase() as PrismaCampaignStatus }),
            ...(filters.type && { type: filters.type.toUpperCase() as PrismaCampaignType }),
          },
          orderBy: [
            { createdAt: 'desc' },
          ],
        });

        return campaigns.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find campaigns by funeral home', error),
    }),

  findScheduledCampaigns: (beforeDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const campaigns = await prisma.campaign.findMany({
          where: {
            isCurrent: true,
            status: 'SCHEDULED',
            scheduledFor: { lte: beforeDate },
          },
          orderBy: { scheduledFor: 'asc' },
        });

        return campaigns.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find scheduled campaigns', error),
    }),

  findTopPerforming: (funeralHomeId: string, limit: number) =>
    Effect.tryPromise({
      try: async () => {
        // Find campaigns with sent status that have metrics
        const campaigns = await prisma.campaign.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            status: 'SENT',
            sentCount: { gt: 0 },
          },
          orderBy: [
            // Order by conversion rate (computed via raw SQL would be better, but this works)
            { convertedCount: 'desc' },
            { openedCount: 'desc' },
            { clickedCount: 'desc' },
          ],
          take: limit,
        });

        return campaigns.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find top performing campaigns', error),
    }),

  save: (campaign: Campaign) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        if (campaign.version === 1) {
          // Initial save
          await prisma.campaign.create({
            data: toPrisma(campaign, now),
          });
        } else {
          // SCD2 update
          await prisma.$transaction(async (tx) => {
            // Close current version
            await tx.campaign.updateMany({
              where: { businessKey: campaign.businessKey, isCurrent: true },
              data: { validTo: now, isCurrent: false },
            });

            // Insert new version
            await tx.campaign.create({
              data: {
                ...toPrisma(campaign, now),
                createdAt: campaign.createdAt, // Preserve original
              },
            });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save campaign', error),
    }),

  update: (campaign: Campaign) =>
    Effect.gen(function* () {
      yield* PrismaCampaignRepository.save(campaign);
      return campaign;
    }),

  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const result = await prisma.campaign.updateMany({
          where: { businessKey, isCurrent: true },
          data: { validTo: now, isCurrent: false },
        });

        if (result.count === 0) {
          throw new NotFoundError({
            message: `Campaign ${businessKey} not found`,
            entityType: 'Campaign',
            entityId: businessKey,
          });
        }
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to delete campaign', error);
      },
    }),
};

/**
 * Layer for dependency injection
 */
export const PrismaCampaignRepositoryLive = Layer.succeed(
  CampaignRepository,
  PrismaCampaignRepository
);
