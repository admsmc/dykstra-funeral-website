import { Effect } from 'effect';
import { LeadScoringPolicy } from '@dykstra/domain';
import {
  LeadScoringPolicyRepository,
  NotFoundError,
  PersistenceError,
} from '@dykstra/application';
import { prisma } from './prisma-client';

/**
 * Domain to Prisma mappers
 * Convert between domain entities and database records
 */
const toDomain = (row: any): LeadScoringPolicy => {
  return new LeadScoringPolicy({
    id: row.id,
    businessKey: row.businessKey,
    version: row.version,
    validFrom: row.validFrom,
    validTo: row.validTo,
    isCurrent: row.isCurrent,
    funeralHomeId: row.funeralHomeId,
    atNeedInitialScore: row.atNeedInitialScore,
    preNeedInitialScore: row.preNeedInitialScore,
    generalInquiryScore: row.generalInquiryScore,
    hotLeadThreshold: row.hotLeadThreshold,
    warmLeadThreshold: row.warmLeadThreshold,
    coldLeadThreshold: row.coldLeadThreshold,
    inactiveThresholdDays: row.inactiveThresholdDays,
    enableAutoArchive: row.enableAutoArchive,
    archiveAfterDays: row.archiveAfterDays,
    contactMethodBonus: row.contactMethodBonus,
    referralSourceBonus: row.referralSourceBonus,
    emailEngagementBonus: row.emailEngagementBonus,
    phoneEngagementBonus: row.phoneEngagementBonus,
    requirePhoneOrEmail: row.requirePhoneOrEmail,
    requireFirstName: row.requireFirstName,
    requireLastName: row.requireLastName,
    preferredSources: row.preferredSources || [],
    disallowedSources: row.disallowedSources || [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    reason: row.reason,
  });
};

const toPrisma = (policy: LeadScoringPolicy) => {
  return {
    id: policy.id,
    businessKey: policy.businessKey,
    version: policy.version,
    validFrom: policy.validFrom,
    validTo: policy.validTo,
    isCurrent: policy.isCurrent,
    funeralHomeId: policy.funeralHomeId,
    atNeedInitialScore: policy.atNeedInitialScore,
    preNeedInitialScore: policy.preNeedInitialScore,
    generalInquiryScore: policy.generalInquiryScore,
    hotLeadThreshold: policy.hotLeadThreshold,
    warmLeadThreshold: policy.warmLeadThreshold,
    coldLeadThreshold: policy.coldLeadThreshold,
    inactiveThresholdDays: policy.inactiveThresholdDays,
    enableAutoArchive: policy.enableAutoArchive,
    archiveAfterDays: policy.archiveAfterDays,
    contactMethodBonus: policy.contactMethodBonus,
    referralSourceBonus: policy.referralSourceBonus,
    emailEngagementBonus: policy.emailEngagementBonus,
    phoneEngagementBonus: policy.phoneEngagementBonus,
    requirePhoneOrEmail: policy.requirePhoneOrEmail,
    requireFirstName: policy.requireFirstName,
    requireLastName: policy.requireLastName,
    preferredSources: policy.preferredSources,
    disallowedSources: policy.disallowedSources,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
    createdBy: policy.createdBy,
    updatedBy: policy.updatedBy,
    reason: policy.reason,
  };
};

/**
 * Object-based Prisma adapter for LeadScoringPolicyRepository
 * Implements SCD Type 2 temporal versioning
 */
export const PrismaLeadScoringPolicyRepository: LeadScoringPolicyRepository = {
  findCurrentByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const row = await prisma.leadScoringPolicy.findFirst({
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
            `No current lead scoring policy found for funeral home ${funeralHomeId}`,
            'LeadScoringPolicy',
            funeralHomeId
          );
        }

        return toDomain(row);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to find current lead scoring policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),

  getHistory: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await prisma.leadScoringPolicy.findMany({
          where: {
            funeralHomeId,
          },
          orderBy: [{ businessKey: 'asc' }, { version: 'desc' }],
        });

        return rows.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to get lead scoring policy history: ${error instanceof Error ? error.message : String(error)}`,
          error
        ),
    }),

  getByVersion: (businessKey: string, version: number) =>
    Effect.tryPromise({
      try: async () => {
        const row = await prisma.leadScoringPolicy.findFirst({
          where: {
            businessKey,
            version,
          },
        });

        if (!row) {
          throw new NotFoundError(
            `Lead scoring policy version ${version} not found for business key ${businessKey}`,
            'LeadScoringPolicy',
            businessKey
          );
        }

        return toDomain(row);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to get lead scoring policy version: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),

  save: (policy: LeadScoringPolicy) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        await prisma.$transaction(async (tx) => {
          // Close current version (SCD2)
          if (policy.version > 1) {
            await tx.leadScoringPolicy.updateMany({
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
          await tx.leadScoringPolicy.create({
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
          `Failed to save lead scoring policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        ),
    }),

  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        const result = await prisma.leadScoringPolicy.updateMany({
          where: {
            businessKey,
          },
          data: {
            validTo: now,
            isCurrent: false,
          },
        });

        if (result.count === 0) {
          throw new NotFoundError(
            `Lead scoring policy with business key ${businessKey} not found`,
            'LeadScoringPolicy',
            businessKey
          );
        }

        return undefined;
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to delete lead scoring policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),
};
