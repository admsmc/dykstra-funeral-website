import { Effect, Layer } from 'effect';
import { Lead, type LeadId, type LeadStatus, type LeadSource, type LeadType, NotFoundError } from '@dykstra/domain';
import { LeadRepository, type LeadRepositoryService, PersistenceError } from '@dykstra/application';
import { LeadStatus as PrismaLeadStatus, LeadSource as PrismaLeadSource, LeadType as PrismaLeadType } from '@prisma/client';
import { prisma } from './prisma-client';

/**
 * Map Prisma lead to domain Lead entity
 */
const toDomain = (prismaLead: any): Lead => {
  return new Lead({
    id: prismaLead.id as LeadId,
    businessKey: prismaLead.businessKey,
    version: prismaLead.version,
    funeralHomeId: prismaLead.funeralHomeId,
    firstName: prismaLead.firstName,
    lastName: prismaLead.lastName,
    email: prismaLead.email,
    phone: prismaLead.phone,
    status: prismaLead.status.toLowerCase() as LeadStatus,
    source: prismaLead.source.toLowerCase() as LeadSource,
    type: prismaLead.type.toLowerCase() as LeadType,
    score: prismaLead.score,
    assignedTo: prismaLead.assignedTo,
    referralSourceId: prismaLead.referralSourceId,
    notes: prismaLead.notes,
    lastContactedAt: prismaLead.lastContactedAt,
    convertedToCaseId: prismaLead.convertedToCaseId,
    createdAt: prismaLead.createdAt,
    updatedAt: prismaLead.updatedAt,
    createdBy: prismaLead.createdBy,
  });
};

/**
 * Map domain Lead to Prisma format
 */
const toPrisma = (lead: Lead, validFrom: Date = new Date()) => {
  return {
    id: lead.id,
    businessKey: lead.businessKey,
    version: lead.version,
    validFrom,
    validTo: null,
    isCurrent: true,
    funeralHomeId: lead.funeralHomeId,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    status: lead.status.toUpperCase() as PrismaLeadStatus,
    source: lead.source.toUpperCase() as PrismaLeadSource,
    type: lead.type.toUpperCase() as PrismaLeadType,
    score: lead.score,
    assignedTo: lead.assignedTo,
    referralSourceId: lead.referralSourceId,
    notes: lead.notes,
    lastContactedAt: lead.lastContactedAt,
    convertedToCaseId: lead.convertedToCaseId,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    createdBy: lead.createdBy,
  };
};

/**
 * Prisma implementation of LeadRepository with SCD Type 2 temporal support
 */
export const PrismaLeadRepository: LeadRepositoryService = {
  findById: (id: LeadId) =>
    Effect.tryPromise({
      try: async () => {
        const lead = await prisma.lead.findFirst({
          where: {
            OR: [
              { id },
              { businessKey: id, isCurrent: true },
            ],
          },
        });

        if (!lead) {
          throw new NotFoundError({
            message: `Lead with ID ${id} not found`,
            entityType: 'Lead',
            entityId: id,
          });
        }

        return toDomain(lead);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find lead', error);
      },
    }),

  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const lead = await prisma.lead.findFirst({
          where: { businessKey, isCurrent: true },
        });
        return lead ? toDomain(lead) : null;
      },
      catch: (error) => new PersistenceError('Failed to find lead by business key', error),
    }),

  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const leads = await prisma.lead.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        if (leads.length === 0) {
          throw new NotFoundError({
            message: `Lead ${businessKey} not found`,
            entityType: 'Lead',
            entityId: businessKey,
          });
        }

        return leads.map(toDomain);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find lead history', error);
      },
    }),

  findByFuneralHome: (funeralHomeId: string, filters = {}) =>
    Effect.tryPromise({
      try: async () => {
        const leads = await prisma.lead.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            ...(filters.status && { status: filters.status.toUpperCase() as PrismaLeadStatus }),
            ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
            ...(filters.minScore !== undefined && { score: { gte: filters.minScore } }),
          },
          orderBy: { score: 'desc' },
        });

        return leads.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find leads by funeral home', error),
    }),

  findHotLeads: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const leads = await prisma.lead.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            score: { gte: 70 },
            status: { notIn: ['CONVERTED', 'LOST', 'ARCHIVED'] },
          },
          orderBy: { score: 'desc' },
        });

        return leads.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find hot leads', error),
    }),

  findNeedingFollowUp: (funeralHomeId: string, daysThreshold: number) =>
    Effect.tryPromise({
      try: async () => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const leads = await prisma.lead.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            status: { notIn: ['CONVERTED', 'LOST', 'ARCHIVED'] },
            OR: [
              { lastContactedAt: null },
              { lastContactedAt: { lt: cutoffDate } },
            ],
          },
          orderBy: [
            { lastContactedAt: 'asc' },
            { score: 'desc' },
          ],
        });

        return leads.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find leads needing follow-up', error),
    }),

  findByReferralSource: (referralSourceId: string) =>
    Effect.tryPromise({
      try: async () => {
        const leads = await prisma.lead.findMany({
          where: {
            referralSourceId,
            isCurrent: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return leads.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find leads by referral source', error),
    }),

  save: (lead: Lead) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        if (lead.version === 1) {
          // Initial save
          await prisma.lead.create({
            data: toPrisma(lead, now),
          });
        } else {
          // SCD2 update
          await prisma.$transaction(async (tx) => {
            // Close current version
            await tx.lead.updateMany({
              where: { businessKey: lead.businessKey, isCurrent: true },
              data: { validTo: now, isCurrent: false },
            });

            // Insert new version
            await tx.lead.create({
              data: {
                ...toPrisma(lead, now),
                createdAt: lead.createdAt, // Preserve original
              },
            });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save lead', error),
    }),

  update: (lead: Lead) =>
    Effect.gen(function* () {
      yield* PrismaLeadRepository.save(lead);
      return lead;
    }),

  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const result = await prisma.lead.updateMany({
          where: { businessKey, isCurrent: true },
          data: { validTo: now, isCurrent: false },
        });

        if (result.count === 0) {
          throw new NotFoundError({
            message: `Lead ${businessKey} not found`,
            entityType: 'Lead',
            entityId: businessKey,
          });
        }
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to delete lead', error);
      },
    }),
};

/**
 * Layer for dependency injection
 */
export const PrismaLeadRepositoryLive = Layer.succeed(
  LeadRepository,
  PrismaLeadRepository
);
