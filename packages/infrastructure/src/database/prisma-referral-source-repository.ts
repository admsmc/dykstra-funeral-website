import { Effect, Layer } from 'effect';
import { ReferralSource, type ReferralSourceId, type ReferralSourceType, NotFoundError } from '@dykstra/domain';
import { ReferralSourceRepository, type ReferralSourceRepositoryService, PersistenceError } from '@dykstra/application';
import { type ReferralSourceType as PrismaReferralSourceType } from '@prisma/client';
import { prisma } from './prisma-client';

/**
 * Map Prisma referral source to domain ReferralSource entity
 */
const toDomain = (prismaSource: any): ReferralSource => {
  return new ReferralSource({
    id: prismaSource.id as ReferralSourceId,
    businessKey: prismaSource.businessKey,
    version: prismaSource.version,
    funeralHomeId: prismaSource.funeralHomeId,
    name: prismaSource.name,
    type: prismaSource.type.toLowerCase() as ReferralSourceType,
    contactPerson: prismaSource.contactPerson,
    email: prismaSource.email,
    phone: prismaSource.phone,
    address: prismaSource.address,
    notes: prismaSource.notes,
    isActive: prismaSource.isActive,
    totalReferrals: prismaSource.totalReferrals,
    convertedReferrals: prismaSource.convertedReferrals,
    createdAt: prismaSource.createdAt,
    updatedAt: prismaSource.updatedAt,
    createdBy: prismaSource.createdBy,
  });
};

/**
 * Map domain ReferralSource to Prisma format
 */
const toPrisma = (source: ReferralSource, validFrom: Date = new Date()) => {
  return {
    id: source.id,
    businessKey: source.businessKey,
    version: source.version,
    validFrom,
    validTo: null,
    isCurrent: true,
    funeralHomeId: source.funeralHomeId,
    name: source.name,
    type: source.type.toUpperCase() as PrismaReferralSourceType,
    contactPerson: source.contactPerson,
    email: source.email,
    phone: source.phone,
    address: source.address,
    notes: source.notes,
    isActive: source.isActive,
    totalReferrals: source.totalReferrals,
    convertedReferrals: source.convertedReferrals,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    createdBy: source.createdBy,
  };
};

/**
 * Prisma implementation of ReferralSourceRepository with SCD Type 2 temporal support
 */
export const PrismaReferralSourceRepository: ReferralSourceRepositoryService = {
  findById: (id: ReferralSourceId) =>
    Effect.tryPromise({
      try: async () => {
        const source = await prisma.referralSource.findFirst({
          where: {
            OR: [
              { id },
              { businessKey: id, isCurrent: true },
            ],
          },
        });

        if (!source) {
          throw new NotFoundError({
            message: `Referral source with ID ${id} not found`,
            entityType: 'ReferralSource',
            entityId: id,
          });
        }

        return toDomain(source);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find referral source', error);
      },
    }),

  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const source = await prisma.referralSource.findFirst({
          where: { businessKey, isCurrent: true },
        });
        return source ? toDomain(source) : null;
      },
      catch: (error) => new PersistenceError('Failed to find referral source by business key', error),
    }),

  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const sources = await prisma.referralSource.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        if (sources.length === 0) {
          throw new NotFoundError({
            message: `Referral source ${businessKey} not found`,
            entityType: 'ReferralSource',
            entityId: businessKey,
          });
        }

        return sources.map(toDomain);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find referral source history', error);
      },
    }),

  findByFuneralHome: (funeralHomeId: string, activeOnly = false) =>
    Effect.tryPromise({
      try: async () => {
        const sources = await prisma.referralSource.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            ...(activeOnly && { isActive: true }),
          },
          orderBy: [
            { totalReferrals: 'desc' },
            { name: 'asc' },
          ],
        });

        return sources.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find referral sources by funeral home', error),
    }),

  findHighPerformers: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        // High performers: >50% conversion rate with 10+ referrals
        const sources = await prisma.referralSource.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            isActive: true,
            totalReferrals: { gte: 10 },
          },
        });

        // Filter in-memory for conversion rate (Prisma doesn't support computed columns easily)
        const highPerformers = sources
          .filter(source => {
            if (source.totalReferrals === 0) return false;
            const conversionRate = (source.convertedReferrals / source.totalReferrals) * 100;
            return conversionRate >= 50;
          })
          .map(toDomain);

        // Sort by conversion rate descending
        return highPerformers.sort((a, b) => b.conversionRate - a.conversionRate);
      },
      catch: (error) => new PersistenceError('Failed to find high performing referral sources', error),
    }),

  findUnderPerformers: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        // Underperformers: <20% conversion rate with 20+ referrals
        const sources = await prisma.referralSource.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            totalReferrals: { gte: 20 },
          },
        });

        // Filter in-memory for conversion rate
        const underPerformers = sources
          .filter(source => {
            if (source.totalReferrals === 0) return false;
            const conversionRate = (source.convertedReferrals / source.totalReferrals) * 100;
            return conversionRate < 20;
          })
          .map(toDomain);

        // Sort by conversion rate ascending (worst first)
        return underPerformers.sort((a, b) => a.conversionRate - b.conversionRate);
      },
      catch: (error) => new PersistenceError('Failed to find underperforming referral sources', error),
    }),

  findByType: (funeralHomeId: string, type: string) =>
    Effect.tryPromise({
      try: async () => {
        const sources = await prisma.referralSource.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            type: type.toUpperCase() as PrismaReferralSourceType,
          },
          orderBy: [
            { totalReferrals: 'desc' },
            { name: 'asc' },
          ],
        });

        return sources.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find referral sources by type', error),
    }),

  save: (source: ReferralSource) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        if (source.version === 1) {
          // Initial save
          await prisma.referralSource.create({
            data: toPrisma(source, now),
          });
        } else {
          // SCD2 update
          await prisma.$transaction(async (tx) => {
            // Close current version
            await tx.referralSource.updateMany({
              where: { businessKey: source.businessKey, isCurrent: true },
              data: { validTo: now, isCurrent: false },
            });

            // Insert new version
            await tx.referralSource.create({
              data: {
                ...toPrisma(source, now),
                createdAt: source.createdAt, // Preserve original
              },
            });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save referral source', error),
    }),

  update: (source: ReferralSource) =>
    Effect.gen(function* () {
      yield* PrismaReferralSourceRepository.save(source);
      return source;
    }),

  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const result = await prisma.referralSource.updateMany({
          where: { businessKey, isCurrent: true },
          data: { validTo: now, isCurrent: false },
        });

        if (result.count === 0) {
          throw new NotFoundError({
            message: `Referral source ${businessKey} not found`,
            entityType: 'ReferralSource',
            entityId: businessKey,
          });
        }
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to delete referral source', error);
      },
    }),
};

/**
 * Layer for dependency injection
 */
export const PrismaReferralSourceRepositoryLive = Layer.succeed(
  ReferralSourceRepository,
  PrismaReferralSourceRepository
);
