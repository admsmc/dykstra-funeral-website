import { Effect, Layer } from 'effect';
import { GuestbookEntry, type GuestbookEntryId, type MemorialId, NotFoundError } from '@dykstra/domain';
import { GuestbookRepository } from '@dykstra/application';
import { PersistenceError } from '@dykstra/application';
import { prisma } from './prisma-client';

/**
 * Map Prisma guestbook entry to domain GuestbookEntry entity
 */
const toDomain = (prismaEntry: any): GuestbookEntry => {
  return new GuestbookEntry({
    id: prismaEntry.id as GuestbookEntryId,
    memorialId: prismaEntry.memorialId as MemorialId,
    name: prismaEntry.name,
    email: prismaEntry.email,
    message: prismaEntry.message,
    city: prismaEntry.city,
    state: prismaEntry.state,
    createdAt: prismaEntry.createdAt,
  });
};

/**
 * Map domain GuestbookEntry to Prisma format
 */
const toPrisma = (entry: GuestbookEntry) => {
  return {
    id: entry.id,
    memorialId: entry.memorialId,
    name: entry.name,
    email: entry.email,
    message: entry.message,
    city: entry.city,
    state: entry.state,
    createdAt: entry.createdAt,
  };
};

/**
 * Prisma implementation of GuestbookRepository
 */
export const PrismaGuestbookRepository: GuestbookRepository = {
  /**
   * Find guestbook entry by ID
   */
  findById: (id: GuestbookEntryId) =>
    Effect.tryPromise({
      try: async () => {
        const prismaEntry = await prisma.guestbookEntry.findUnique({
          where: { id },
        });

        if (!prismaEntry) {
          throw new NotFoundError({
            message: `Guestbook entry with ID ${id} not found`,
            entityType: 'GuestbookEntry',
            entityId: id,
          });
        }

        return toDomain(prismaEntry);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find guestbook entry', error);
      },
    }),

  /**
   * Find all guestbook entries for a memorial
   */
  findByMemorial: (memorialId: MemorialId) =>
    Effect.tryPromise({
      try: async () => {
        const prismaEntries = await prisma.guestbookEntry.findMany({
          where: { memorialId },
          orderBy: { createdAt: 'desc' },
        });

        return prismaEntries.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find guestbook entries by memorial', error),
    }),

  /**
   * Save guestbook entry
   */
  save: (entry: GuestbookEntry) =>
    Effect.tryPromise({
      try: async () => {
        const data = toPrisma(entry);
        await prisma.guestbookEntry.upsert({
          where: { id: entry.id },
          create: data,
          update: data,
        });
      },
      catch: (error) => new PersistenceError('Failed to save guestbook entry', error),
    }),

  /**
   * Delete guestbook entry
   */
  delete: (id: GuestbookEntryId) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.guestbookEntry.delete({
          where: { id },
        });
      },
      catch: (error) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
          return new NotFoundError({
            message: `Guestbook entry with ID ${id} not found`,
            entityType: 'GuestbookEntry',
            entityId: id,
          });
        }
        return new PersistenceError('Failed to delete guestbook entry', error);
      },
    }),

  /**
   * Count entries for a memorial
   */
  countByMemorial: (memorialId: MemorialId) =>
    Effect.tryPromise({
      try: async () => {
        return await prisma.guestbookEntry.count({
          where: { memorialId },
        });
      },
      catch: (error) => new PersistenceError('Failed to count guestbook entries', error),
    }),
};

/**
 * Effect Layer to provide GuestbookRepository
 */
export const PrismaGuestbookRepositoryLive = Layer.succeed(
  GuestbookRepository,
  PrismaGuestbookRepository
);
