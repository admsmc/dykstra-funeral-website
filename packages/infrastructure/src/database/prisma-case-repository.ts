import { Effect, Layer } from 'effect';
import { Case, Arrangements, type CaseId, NotFoundError } from '@dykstra/domain';
import type { CaseRepository } from '@dykstra/application';
import { PersistenceError } from '@dykstra/application';
import type { CaseType, CaseStatus, ServiceType } from '@dykstra/shared';
import { prisma } from './prisma-client';

/**
 * Map Prisma case to domain Case entity
 * SCD Type 2: Maps temporal fields to domain model
 */
const toDomain = async (prismaCase: any): Promise<Case> => {
  // Parse arrangements from JSON
  let arrangements: Arrangements | null = null;
  if (prismaCase.arrangements) {
    arrangements = await Effect.runPromise(
      Arrangements.fromJSON(prismaCase.arrangements)
    );
  }
  
  return new Case({
    id: prismaCase.id as CaseId,
    businessKey: prismaCase.businessKey,
    version: prismaCase.version,
    funeralHomeId: prismaCase.funeralHomeId,
    decedentName: prismaCase.decedentName,
    decedentDateOfBirth: prismaCase.decedentDateOfBirth,
    decedentDateOfDeath: prismaCase.decedentDateOfDeath,
    type: prismaCase.type.toLowerCase() as CaseType,
    status: prismaCase.status.toLowerCase() as CaseStatus,
    serviceType: prismaCase.serviceType?.toLowerCase() as ServiceType | null,
    serviceDate: prismaCase.serviceDate,
    arrangements,
    createdAt: prismaCase.createdAt,
    updatedAt: prismaCase.updatedAt,
    createdBy: prismaCase.createdBy,
  });
};

/**
 * Map domain Case to Prisma format
 * SCD Type 2: Includes temporal fields for versioning
 */
const toPrisma = (case_: Case, validFrom: Date = new Date()) => {
  return {
    id: case_.id,
    businessKey: case_.businessKey,
    version: case_.version,
    validFrom,
    validTo: null,                                  // New version is always current
    isCurrent: true,
    funeralHomeId: case_.funeralHomeId,
    decedentName: case_.decedentName,
    decedentDateOfBirth: case_.decedentDateOfBirth,
    decedentDateOfDeath: case_.decedentDateOfDeath,
    type: case_.type.toUpperCase(),
    status: case_.status.toUpperCase(),
    serviceType: case_.serviceType?.toUpperCase() ?? null,
    serviceDate: case_.serviceDate,
    arrangements: case_.arrangements ? case_.arrangements.toJSON() : null,
    createdAt: case_.createdAt,
    updatedAt: case_.updatedAt,
    createdBy: case_.createdBy,
  };
};

/**
 * Prisma implementation of CaseRepository with SCD Type 2 temporal support
 */
export const PrismaCaseRepository: CaseRepository = {
  /**
   * Find current version of case by business key
   * For backward compatibility, also accepts technical ID
   */
  findById: (id: CaseId) =>
    Effect.tryPromise({
      try: async () => {
        // Try to find by technical ID first (for backward compatibility)
        let prismaCase = await prisma.case.findUnique({
          where: { id },
        });
        
        // If not found by technical ID, try business key with isCurrent=true
        if (!prismaCase) {
          prismaCase = await prisma.case.findFirst({
            where: {
              businessKey: id,
              isCurrent: true,
            },
          });
        }

        if (!prismaCase) {
          throw new NotFoundError({
            message: `Case with ID ${id} not found`,
            entityType: 'Case',
            entityId: id,
          });
        }

        return toDomain(prismaCase);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find case', error);
      },
    }),
  
  /**
   * Find case as it existed at a specific point in time
   */
  findByIdAtTime: (businessKey: string, asOf: Date) =>
    Effect.tryPromise({
      try: async () => {
        const prismaCase = await prisma.case.findFirst({
          where: {
            businessKey,
            validFrom: { lte: asOf },
            OR: [
              { validTo: { gt: asOf } },
              { validTo: null },
            ],
          },
        });

        if (!prismaCase) {
          throw new NotFoundError({
            message: `Case ${businessKey} not found at ${asOf.toISOString()}`,
            entityType: 'Case',
            entityId: businessKey,
          });
        }

        return toDomain(prismaCase);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find case at time', error);
      },
    }),
  
  /**
   * Find complete version history of a case
   */
  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaCases = await prisma.case.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        if (prismaCases.length === 0) {
          throw new NotFoundError({
            message: `Case ${businessKey} not found`,
            entityType: 'Case',
            entityId: businessKey,
          });
        }

        return Promise.all(prismaCases.map(toDomain));
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find case history', error);
      },
    }),
  
  /**
   * Find changes between two points in time
   */
  findChangesBetween: (businessKey: string, from: Date, to: Date) =>
    Effect.tryPromise({
      try: async () => {
        const prismaCases = await prisma.case.findMany({
          where: {
            businessKey,
            validFrom: { gte: from, lte: to },
          },
          orderBy: { version: 'asc' },
        });

        return Promise.all(prismaCases.map(toDomain));
      },
      catch: (error) => new PersistenceError('Failed to find case changes', error),
    }),

  /**
   * Find current versions of cases by funeral home
   */
  findByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaCases = await prisma.case.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,                        // Only current versions
          },
          orderBy: { createdAt: 'desc' },
        });

        return Promise.all(prismaCases.map(toDomain));
      },
      catch: (error) => new PersistenceError('Failed to find cases by funeral home', error),
    }),

  /**
   * Find current versions of cases by family member
   */
  findByFamilyMember: (userId: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaCases = await prisma.case.findMany({
          where: {
            members: {
              some: {
                userId,
              },
            },
            isCurrent: true,                        // Only current versions
          },
          orderBy: { createdAt: 'desc' },
        });

        return Promise.all(prismaCases.map(toDomain));
      },
      catch: (error) => new PersistenceError('Failed to find cases by family member', error),
    }),

  /**
   * Find current version of case by business key (string identifier)
   * Convenience method for when you only have the business key string
   */
  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaCase = await prisma.case.findFirst({
          where: {
            businessKey,
            isCurrent: true,                        // Only current version
          },
        });

        if (!prismaCase) {
          return null;
        }

        return toDomain(prismaCase);
      },
      catch: (error) => new PersistenceError('Failed to find case by business key', error),
    }),

  /**
   * Save case - SCD Type 2 implementation
   * Creates new version instead of updating existing
   */
  save: (case_: Case) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        // Check if this is a new case (version 1) or an update
        if (case_.version === 1) {
          // New case - simple insert
          const data = toPrisma(case_, now);
          await prisma.case.create({ data });
        } else {
          // Update - SCD Type 2 transaction
          await prisma.$transaction(async (tx: typeof prisma) => {
            // Step 1: Close current version
            await tx.case.updateMany({
              where: {
                businessKey: case_.businessKey,
                isCurrent: true,
              },
              data: {
                validTo: now,
                isCurrent: false,
              },
            });
            
            // Step 2: Insert new version
            const data = toPrisma(case_, now);
            await tx.case.create({ data });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save case', error),
    }),

  /**
   * Update case - convenience method that wraps save for SCD2 updates
   * Creates new version of existing case
   */
  update: (case_: Case) =>
    Effect.gen(function* () {
      // Save creates a new version (SCD2 pattern)
      yield* PrismaCaseRepository.save(case_);
      // Return the updated case
      return case_;
    }),

  /**
   * Delete case - SCD Type 2 soft delete
   * Closes current version instead of physical deletion
   */
  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        // Close current version (soft delete)
        const result = await prisma.case.updateMany({
          where: {
            businessKey,
            isCurrent: true,
          },
          data: {
            validTo: now,
            isCurrent: false,
          },
        });
        
        // Check if any record was updated
        if (result.count === 0) {
          throw new NotFoundError({
            message: `Case ${businessKey} not found`,
            entityType: 'Case',
            entityId: businessKey,
          });
        }
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to delete case', error);
      },
    }),
};

/**
 * Effect Layer to provide CaseRepository
 * Note: Layer creation should be done asynchronously where needed
 */
export const createPrismaCaseRepositoryLive = async () => {
  const { CaseRepository } = await import('@dykstra/application');
  return Layer.succeed(CaseRepository, PrismaCaseRepository);
};
