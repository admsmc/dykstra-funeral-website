import { Effect } from 'effect';
import { InvitationManagementPolicy, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from '@dykstra/application';
import { type InvitationManagementPolicyRepositoryService } from '@dykstra/application';
import { prisma } from '../database/prisma-client';

/**
 * Object-based adapter for Invitation Management Policy repository
 * Implements port interface using Prisma for persistence
 */
export const InvitationManagementPolicyAdapter: InvitationManagementPolicyRepositoryService = {
  findByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const policy = await prisma.invitationManagementPolicy.findFirst({
          where: { funeralHomeId, isCurrent: true },
        });

        if (!policy) {
          throw new NotFoundError({
            message: `No active policy found for funeral home: ${funeralHomeId}`,
            entityType: 'InvitationManagementPolicy',
            entityId: funeralHomeId,
          });
        }

        return mapToDomain(policy);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find policy by funeral home', error);
      },
    }),

  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const policy = await prisma.invitationManagementPolicy.findFirst({
          where: { businessKey, isCurrent: true },
        });

        if (!policy) {
          throw new NotFoundError({
            message: `No policy found with business key: ${businessKey}`,
            entityType: 'InvitationManagementPolicy',
            entityId: businessKey,
          });
        }

        return mapToDomain(policy);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find policy by business key', error);
      },
    }),

  findAllVersions: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const policies = await prisma.invitationManagementPolicy.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });
        return policies.map(mapToDomain);
      },
      catch: (error) => new PersistenceError('Failed to find policy versions', error),
    }),

  findAll: () =>
    Effect.tryPromise({
      try: async () => {
        const policies = await prisma.invitationManagementPolicy.findMany({
          where: { isCurrent: true },
          orderBy: { createdAt: 'desc' },
        });
        return policies.map(mapToDomain);
      },
      catch: (error) => new PersistenceError('Failed to find all policies', error),
    }),

  save: (policy: InvitationManagementPolicy) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.invitationManagementPolicy.create({
          data: {
            id: policy.id,
            businessKey: policy.businessKey,
            version: policy.version,
            validFrom: policy.validFrom,
            validTo: policy.validTo,
            isCurrent: policy.isCurrent,
            funeralHomeId: policy.funeralHomeId,
            tokenLengthBytes: policy.tokenLengthBytes,
            expirationDays: policy.expirationDays,
            requireStrictEmailValidation: policy.requireStrictEmailValidation,
            allowMultipleInvitationsPerEmail: policy.allowMultipleInvitationsPerEmail,
            autoRevokeExpiredAfterDays: policy.autoRevokeExpiredAfterDays,
            requirePhoneNumber: policy.requirePhoneNumber,
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt,
            createdBy: policy.createdBy,
            updatedBy: policy.updatedBy,
            reason: policy.reason,
          },
        });
      },
      catch: (error) => new PersistenceError('Failed to save policy', error),
    }),

  update: (policy: InvitationManagementPolicy) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.invitationManagementPolicy.updateMany({
          where: { businessKey: policy.businessKey, isCurrent: true, id: { not: policy.id } },
          data: { isCurrent: false, validTo: new Date() },
        });

        const updated = await prisma.invitationManagementPolicy.upsert({
          where: { id: policy.id },
          create: {
            id: policy.id,
            businessKey: policy.businessKey,
            version: policy.version,
            validFrom: policy.validFrom,
            validTo: policy.validTo,
            isCurrent: policy.isCurrent,
            funeralHomeId: policy.funeralHomeId,
            tokenLengthBytes: policy.tokenLengthBytes,
            expirationDays: policy.expirationDays,
            requireStrictEmailValidation: policy.requireStrictEmailValidation,
            allowMultipleInvitationsPerEmail: policy.allowMultipleInvitationsPerEmail,
            autoRevokeExpiredAfterDays: policy.autoRevokeExpiredAfterDays,
            requirePhoneNumber: policy.requirePhoneNumber,
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt,
            createdBy: policy.createdBy,
            updatedBy: policy.updatedBy,
            reason: policy.reason,
          },
          update: {
            tokenLengthBytes: policy.tokenLengthBytes,
            expirationDays: policy.expirationDays,
            requireStrictEmailValidation: policy.requireStrictEmailValidation,
            allowMultipleInvitationsPerEmail: policy.allowMultipleInvitationsPerEmail,
            autoRevokeExpiredAfterDays: policy.autoRevokeExpiredAfterDays,
            requirePhoneNumber: policy.requirePhoneNumber,
            updatedAt: policy.updatedAt,
            updatedBy: policy.updatedBy,
          },
        });

        return mapToDomain(updated);
      },
      catch: (error) => new PersistenceError('Failed to update policy', error),
    }),

  delete: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const policy = await prisma.invitationManagementPolicy.findUnique({ where: { id } });

        if (!policy) {
          throw new NotFoundError({
            message: `Policy not found: ${id}`,
            entityType: 'InvitationManagementPolicy',
            entityId: id,
          });
        }

        await prisma.invitationManagementPolicy.delete({ where: { id } });
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to delete policy', error);
      },
    }),
};

function mapToDomain(record: any): InvitationManagementPolicy {
  return new InvitationManagementPolicy({
    id: record.id,
    businessKey: record.businessKey,
    version: record.version,
    validFrom: record.validFrom,
    validTo: record.validTo,
    isCurrent: record.isCurrent,
    funeralHomeId: record.funeralHomeId,
    tokenLengthBytes: record.tokenLengthBytes,
    expirationDays: record.expirationDays,
    requireStrictEmailValidation: record.requireStrictEmailValidation,
    allowMultipleInvitationsPerEmail: record.allowMultipleInvitationsPerEmail,
    autoRevokeExpiredAfterDays: record.autoRevokeExpiredAfterDays,
    requirePhoneNumber: record.requirePhoneNumber,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    reason: record.reason,
  });
}
