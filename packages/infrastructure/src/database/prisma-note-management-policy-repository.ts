import { Effect } from 'effect';
import { NoteManagementPolicy } from '@dykstra/domain';
import {
  NoteManagementPolicyRepository,
  NotFoundError,
  PersistenceError,
} from '@dykstra/application';
import { prisma } from './prisma-client';

const toDomain = (row: any): NoteManagementPolicy => {
  return new NoteManagementPolicy({
    id: row.id,
    businessKey: row.businessKey,
    version: row.version,
    validFrom: row.validFrom,
    validTo: row.validTo,
    isCurrent: row.isCurrent,
    funeralHomeId: row.funeralHomeId,
    maxContentLength: row.maxContentLength,
    minContentLength: row.minContentLength,
    requireContentValidation: row.requireContentValidation,
    enableAutoArchive: row.enableAutoArchive,
    autoArchiveAfterDays: row.autoArchiveAfterDays,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    reason: row.reason,
  });
};

const toPrisma = (policy: NoteManagementPolicy) => ({
  id: policy.id,
  businessKey: policy.businessKey,
  version: policy.version,
  validFrom: policy.validFrom,
  validTo: policy.validTo,
  isCurrent: policy.isCurrent,
  funeralHomeId: policy.funeralHomeId,
  maxContentLength: policy.maxContentLength,
  minContentLength: policy.minContentLength,
  requireContentValidation: policy.requireContentValidation,
  enableAutoArchive: policy.enableAutoArchive,
  autoArchiveAfterDays: policy.autoArchiveAfterDays,
  createdAt: policy.createdAt,
  updatedAt: policy.updatedAt,
  createdBy: policy.createdBy,
  updatedBy: policy.updatedBy,
  reason: policy.reason,
});

export const PrismaNoteManagementPolicyRepository: NoteManagementPolicyRepository = {
  findCurrentByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const row = await prisma.noteManagementPolicy.findFirst({
          where: { funeralHomeId, isCurrent: true },
          orderBy: { version: 'desc' },
        });
        if (!row) {
          throw new NotFoundError(
            `No current note management policy found for funeral home ${funeralHomeId}`,
            'NoteManagementPolicy',
            funeralHomeId
          );
        }
        return toDomain(row);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to find current note management policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),

  getHistory: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await prisma.noteManagementPolicy.findMany({
          where: { funeralHomeId },
          orderBy: [{ businessKey: 'asc' }, { version: 'desc' }],
        });
        return rows.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to get note management policy history: ${error instanceof Error ? error.message : String(error)}`,
          error
        ),
    }),

  getByVersion: (businessKey: string, version: number) =>
    Effect.tryPromise({
      try: async () => {
        const row = await prisma.noteManagementPolicy.findFirst({
          where: { businessKey, version },
        });
        if (!row) {
          throw new NotFoundError(
            `Note management policy version ${version} not found for business key ${businessKey}`,
            'NoteManagementPolicy',
            businessKey
          );
        }
        return toDomain(row);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to get note management policy version: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),

  save: (policy: NoteManagementPolicy) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        await prisma.$transaction(async (tx) => {
          if (policy.version > 1) {
            await tx.noteManagementPolicy.updateMany({
              where: { businessKey: policy.businessKey, isCurrent: true },
              data: { validTo: now, isCurrent: false },
            });
          }
          await tx.noteManagementPolicy.create({
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
          `Failed to save note management policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        ),
    }),

  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const result = await prisma.noteManagementPolicy.updateMany({
          where: { businessKey, isCurrent: true },
          data: { validTo: now, isCurrent: false },
        });
        if (result.count === 0) {
          throw new NotFoundError(
            `Note management policy not found for business key ${businessKey}`,
            'NoteManagementPolicy',
            businessKey
          );
        }
        return undefined;
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to delete note management policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      },
    }),
};
