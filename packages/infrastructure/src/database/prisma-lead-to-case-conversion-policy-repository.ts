import { Effect } from 'effect';
import { LeadToCaseConversionPolicy } from '@dykstra/domain';
import {
  LeadToCaseConversionPolicyRepository,
  NotFoundError,
  PersistenceError,
} from '@dykstra/application';
import { prisma } from './prisma-client';

/**
 * Domain to Prisma mappers
 * Convert between domain entities and database records
 */
const toDomain = (row: any): LeadToCaseConversionPolicy => {
  return new LeadToCaseConversionPolicy({
    id: row.id,
    businessKey: row.businessKey,
    version: row.version,
    validFrom: row.validFrom,
    validTo: row.validTo,
    isCurrent: row.isCurrent,
    funeralHomeId: row.funeralHomeId,
    defaultCaseStatus: row.defaultCaseStatus as 'inquiry' | 'active',
    requireDecedentName: row.requireDecedentName,
    autoAssignToLeadStaff: row.autoAssignToLeadStaff,
    preserveLeadNotes: row.preserveLeadNotes,
    createInteractionRecord: row.createInteractionRecord,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    reason: row.reason,
  });
};

const toPrisma = (policy: LeadToCaseConversionPolicy) => {
  return {
    id: policy.id,
    businessKey: policy.businessKey,
    version: policy.version,
    validFrom: policy.validFrom,
    validTo: policy.validTo,
    isCurrent: policy.isCurrent,
    funeralHomeId: policy.funeralHomeId,
    defaultCaseStatus: policy.defaultCaseStatus,
    requireDecedentName: policy.requireDecedentName,
    autoAssignToLeadStaff: policy.autoAssignToLeadStaff,
    preserveLeadNotes: policy.preserveLeadNotes,
    createInteractionRecord: policy.createInteractionRecord,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
    createdBy: policy.createdBy,
    updatedBy: policy.updatedBy,
    reason: policy.reason,
  };
};

/**
 * Object-based Prisma adapter for LeadToCaseConversionPolicyRepository
 * Implements SCD Type 2 temporal versioning
 */
export const PrismaLeadToCaseConversionPolicyRepository: LeadToCaseConversionPolicyRepository = {
  findCurrentByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const row = await prisma.leadToCaseConversionPolicy.findFirst({
          where: {
            funeralHomeId,
            isCurrent: true,
          },
          orderBy: {
            version: 'desc',
          },
        });

        if (!row) {
          throw new NotFoundError(
            `No current lead-to-case conversion policy found for funeral home ${funeralHomeId}`,
            'LeadToCaseConversionPolicy',
            funeralHomeId
          );
        }

        return toDomain(row);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to find current lead-to-case conversion policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),

  getHistory: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await prisma.leadToCaseConversionPolicy.findMany({
          where: {
            funeralHomeId,
          },
          orderBy: [{ businessKey: 'asc' }, { version: 'desc' }],
        });

        return rows.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to get lead-to-case conversion policy history: ${error instanceof Error ? error.message : String(error)}`,
          error
        ),
    }),

  getByVersion: (businessKey: string, version: number) =>
    Effect.tryPromise({
      try: async () => {
        const row = await prisma.leadToCaseConversionPolicy.findFirst({
          where: {
            businessKey,
            version,
          },
        });

        if (!row) {
          throw new NotFoundError(
            `Lead-to-case conversion policy version ${version} not found for business key ${businessKey}`,
            'LeadToCaseConversionPolicy',
            businessKey
          );
        }

        return toDomain(row);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to get lead-to-case conversion policy version: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),

  save: (policy: LeadToCaseConversionPolicy) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        await prisma.$transaction(async (tx) => {
          // Close current version (SCD2)
          if (policy.version > 1) {
            await tx.leadToCaseConversionPolicy.updateMany({
              where: {
                businessKey: policy.businessKey,
                isCurrent: true,
              },
              data: {
                validTo: now,
                isCurrent: false,
              },
            });
          }

          // Insert new version
          await tx.leadToCaseConversionPolicy.create({
            data: {
              ...toPrisma(policy),
              validFrom: now,
              isCurrent: true,
              updatedAt: now,
            },
          });
        });

        return undefined;
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to save lead-to-case conversion policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        ),
    }),

  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        const result = await prisma.leadToCaseConversionPolicy.updateMany({
          where: {
            businessKey,
            isCurrent: true,
          },
          data: {
            validTo: now,
            isCurrent: false,
          },
        });

        if (result.count === 0) {
          throw new NotFoundError(
            `Lead-to-case conversion policy ${businessKey} not found`,
            'LeadToCaseConversionPolicy',
            businessKey
          );
        }

        return undefined;
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to delete lead-to-case conversion policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),
};
