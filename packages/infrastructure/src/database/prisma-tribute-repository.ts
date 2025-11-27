import { Effect, Layer } from 'effect';
import { Tribute, type TributeId, type MemorialId, NotFoundError } from '@dykstra/domain';
import { TributeRepository } from '@dykstra/application';
import { PersistenceError } from '@dykstra/application';
import { prisma } from './prisma-client';

/**
 * Map Prisma tribute to domain Tribute entity
 */
const toDomain = (prismaTribute: any): Tribute => {
  return new Tribute({
    id: prismaTribute.id as TributeId,
    memorialId: prismaTribute.memorialId as MemorialId,
    authorName: prismaTribute.authorName,
    authorEmail: prismaTribute.authorEmail,
    message: prismaTribute.message,
    isPublic: prismaTribute.isPublic,
    isApproved: prismaTribute.isApproved,
    createdAt: prismaTribute.createdAt,
  });
};

/**
 * Map domain Tribute to Prisma format
 */
const toPrisma = (tribute: Tribute) => {
  return {
    id: tribute.id,
    memorialId: tribute.memorialId,
    authorName: tribute.authorName,
    authorEmail: tribute.authorEmail,
    message: tribute.message,
    isPublic: tribute.isPublic,
    isApproved: tribute.isApproved,
    createdAt: tribute.createdAt,
  };
};

/**
 * Prisma implementation of TributeRepository
 */
export const PrismaTributeRepository: TributeRepository = {
  /**
   * Find tribute by ID
   */
  findById: (id: TributeId) =>
    Effect.tryPromise({
      try: async () => {
        const prismaTribute = await prisma.tribute.findUnique({
          where: { id },
        });

        if (!prismaTribute) {
          throw new NotFoundError({
            message: `Tribute with ID ${id} not found`,
            entityType: 'Tribute',
            entityId: id,
          });
        }

        return toDomain(prismaTribute);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find tribute', error);
      },
    }),

  /**
   * Find all tributes for a memorial
   */
  findByMemorial: (memorialId: MemorialId) =>
    Effect.tryPromise({
      try: async () => {
        const prismaTributes = await prisma.tribute.findMany({
          where: { memorialId },
          orderBy: { createdAt: 'desc' },
        });

        return prismaTributes.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find tributes by memorial', error),
    }),

  /**
   * Find approved tributes for a memorial (public view)
   */
  findApprovedByMemorial: (memorialId: MemorialId) =>
    Effect.tryPromise({
      try: async () => {
        const prismaTributes = await prisma.tribute.findMany({
          where: {
            memorialId,
            isApproved: true,
            isPublic: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return prismaTributes.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find approved tributes', error),
    }),

  /**
   * Find pending tributes (awaiting moderation)
   */
  findPendingByMemorial: (memorialId: MemorialId) =>
    Effect.tryPromise({
      try: async () => {
        const prismaTributes = await prisma.tribute.findMany({
          where: {
            memorialId,
            isApproved: false,
          },
          orderBy: { createdAt: 'asc' },
        });

        return prismaTributes.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find pending tributes', error),
    }),

  /**
   * Save tribute
   */
  save: (tribute: Tribute) =>
    Effect.tryPromise({
      try: async () => {
        const data = toPrisma(tribute);
        await prisma.tribute.upsert({
          where: { id: tribute.id },
          create: data,
          update: data,
        });
      },
      catch: (error) => new PersistenceError('Failed to save tribute', error),
    }),

  /**
   * Delete tribute
   */
  delete: (id: TributeId) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.tribute.delete({
          where: { id },
        });
      },
      catch: (error) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
          return new NotFoundError({
            message: `Tribute with ID ${id} not found`,
            entityType: 'Tribute',
            entityId: id,
          });
        }
        return new PersistenceError('Failed to delete tribute', error);
      },
    }),
};

/**
 * Effect Layer to provide TributeRepository
 */
export const PrismaTributeRepositoryLive = Layer.succeed(
  TributeRepository,
  PrismaTributeRepository
);
