import { Effect } from 'effect';
import { InteractionManagementPolicy, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from '@dykstra/application';
import { type InteractionManagementPolicyRepositoryService } from '@dykstra/application';
import { prisma } from '../database/prisma-client';

/**
 * Object-based adapter for Interaction Management Policy repository
 * Implements port interface using Prisma for persistence
 */
export const InteractionManagementPolicyAdapter: InteractionManagementPolicyRepositoryService = {
  findByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const policy = await prisma.interactionManagementPolicy.findFirst({
          where: {
            funeralHomeId,
            isCurrent: true,
          },
        });

        if (!policy) {
          throw new NotFoundError({
            message: `No active policy found for funeral home: ${funeralHomeId}`,
            entityType: 'InteractionManagementPolicy',
          });
        }

        return mapToDomain(policy);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError({
          message: 'Failed to find policy by funeral home',
          originalError: error,
        });
      },
    }),

  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const policy = await prisma.interactionManagementPolicy.findFirst({
          where: {
            businessKey,
            isCurrent: true,
          },
        });

        if (!policy) {
          throw new NotFoundError({
            message: `No policy found with business key: ${businessKey}`,
            entityType: 'InteractionManagementPolicy',
          });
        }

        return mapToDomain(policy);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError({
          message: 'Failed to find policy by business key',
          originalError: error,
        });
      },
    }),

  findAllVersions: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const policies = await prisma.interactionManagementPolicy.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        return policies.map(mapToDomain);
      },
      catch: (error) =>
        new PersistenceError({
          message: 'Failed to find policy versions',
          originalError: error,
        }),
    }),

  findAll: () =>
    Effect.tryPromise({
      try: async () => {
        const policies = await prisma.interactionManagementPolicy.findMany({
          where: { isCurrent: true },
          orderBy: { createdAt: 'desc' },
        });

        return policies.map(mapToDomain);
      },
      catch: (error) =>
        new PersistenceError({
          message: 'Failed to find all policies',
          originalError: error,
        }),
    }),

  save: (policy: InteractionManagementPolicy) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.interactionManagementPolicy.create({
          data: {
            id: policy.id,
            businessKey: policy.businessKey,
            version: policy.version,
            validFrom: policy.validFrom,
            validTo: policy.validTo,
            isCurrent: policy.isCurrent,
            funeralHomeId: policy.funeralHomeId,
            maxSubjectLength: policy.maxSubjectLength,
            minSubjectLength: policy.minSubjectLength,
            maxOutcomeLength: policy.maxOutcomeLength,
            maxDurationMinutes: policy.maxDurationMinutes,
            requireAssociation: policy.requireAssociation,
            allowScheduledInteractions: policy.allowScheduledInteractions,
            autoCompleteUncompletedAfterDays: policy.autoCompleteUncompletedAfterDays,
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt,
            createdBy: policy.createdBy,
            updatedBy: policy.updatedBy,
            reason: policy.reason,
          },
        });
      },
      catch: (error) =>
        new PersistenceError({
          message: 'Failed to save policy',
          originalError: error,
        }),
    }),

  update: (policy: InteractionManagementPolicy) =>
    Effect.tryPromise({
      try: async () => {
        // Close previous version
        await prisma.interactionManagementPolicy.updateMany({
          where: {
            businessKey: policy.businessKey,
            isCurrent: true,
            id: { not: policy.id },
          },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        // Save new version
        const updated = await prisma.interactionManagementPolicy.upsert({
          where: { id: policy.id },
          create: {
            id: policy.id,
            businessKey: policy.businessKey,
            version: policy.version,
            validFrom: policy.validFrom,
            validTo: policy.validTo,
            isCurrent: policy.isCurrent,
            funeralHomeId: policy.funeralHomeId,
            maxSubjectLength: policy.maxSubjectLength,
            minSubjectLength: policy.minSubjectLength,
            maxOutcomeLength: policy.maxOutcomeLength,
            maxDurationMinutes: policy.maxDurationMinutes,
            requireAssociation: policy.requireAssociation,
            allowScheduledInteractions: policy.allowScheduledInteractions,
            autoCompleteUncompletedAfterDays: policy.autoCompleteUncompletedAfterDays,
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt,
            createdBy: policy.createdBy,
            updatedBy: policy.updatedBy,
            reason: policy.reason,
          },
          update: {
            maxSubjectLength: policy.maxSubjectLength,
            minSubjectLength: policy.minSubjectLength,
            maxOutcomeLength: policy.maxOutcomeLength,
            maxDurationMinutes: policy.maxDurationMinutes,
            requireAssociation: policy.requireAssociation,
            allowScheduledInteractions: policy.allowScheduledInteractions,
            autoCompleteUncompletedAfterDays: policy.autoCompleteUncompletedAfterDays,
            updatedAt: policy.updatedAt,
            updatedBy: policy.updatedBy,
          },
        });

        return mapToDomain(updated);
      },
      catch: (error) =>
        new PersistenceError({
          message: 'Failed to update policy',
          originalError: error,
        }),
    }),

  delete: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const policy = await prisma.interactionManagementPolicy.findUnique({
          where: { id },
        });

        if (!policy) {
          throw new NotFoundError({
            message: `Policy not found: ${id}`,
            entityType: 'InteractionManagementPolicy',
          });
        }

        await prisma.interactionManagementPolicy.delete({
          where: { id },
        });
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError({
          message: 'Failed to delete policy',
          originalError: error,
        });
      },
    }),
};

/**
 * Map Prisma record to domain entity
 */
function mapToDomain(record: any): InteractionManagementPolicy {
  return new InteractionManagementPolicy({
    id: record.id,
    businessKey: record.businessKey,
    version: record.version,
    validFrom: record.validFrom,
    validTo: record.validTo,
    isCurrent: record.isCurrent,
    funeralHomeId: record.funeralHomeId,
    maxSubjectLength: record.maxSubjectLength,
    minSubjectLength: record.minSubjectLength,
    maxOutcomeLength: record.maxOutcomeLength,
    maxDurationMinutes: record.maxDurationMinutes,
    requireAssociation: record.requireAssociation,
    allowScheduledInteractions: record.allowScheduledInteractions,
    autoCompleteUncompletedAfterDays: record.autoCompleteUncompletedAfterDays,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    reason: record.reason,
  });
}
