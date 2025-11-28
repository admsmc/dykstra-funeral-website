import { Effect, Layer } from 'effect';
import { Interaction, type InteractionId, type InteractionType, type InteractionDirection, NotFoundError } from '@dykstra/domain';
import { InteractionRepository, type InteractionRepositoryService, PersistenceError } from '@dykstra/application';
import { InteractionType as PrismaInteractionType, InteractionDirection as PrismaInteractionDirection } from '@prisma/client';
import { prisma } from './prisma-client';

/**
 * Map Prisma interaction to domain Interaction entity
 */
const toDomain = (prismaInteraction: any): Interaction => {
  return new Interaction({
    id: prismaInteraction.id as InteractionId,
    funeralHomeId: prismaInteraction.funeralHomeId,
    leadId: prismaInteraction.leadId,
    contactId: prismaInteraction.contactId,
    caseId: prismaInteraction.caseId,
    type: prismaInteraction.type.toLowerCase() as InteractionType,
    direction: prismaInteraction.direction.toLowerCase() as InteractionDirection,
    subject: prismaInteraction.subject,
    body: prismaInteraction.body,
    outcome: prismaInteraction.outcome,
    scheduledFor: prismaInteraction.scheduledFor,
    completedAt: prismaInteraction.completedAt,
    duration: prismaInteraction.duration,
    staffId: prismaInteraction.staffId,
    createdAt: prismaInteraction.createdAt,
  });
};

/**
 * Map domain Interaction to Prisma format
 */
const toPrisma = (interaction: Interaction) => {
  return {
    id: interaction.id,
    funeralHomeId: interaction.funeralHomeId,
    leadId: interaction.leadId,
    contactId: interaction.contactId,
    caseId: interaction.caseId,
    type: interaction.type.toUpperCase() as PrismaInteractionType,
    direction: interaction.direction.toUpperCase() as PrismaInteractionDirection,
    subject: interaction.subject,
    body: interaction.body,
    outcome: interaction.outcome,
    scheduledFor: interaction.scheduledFor,
    completedAt: interaction.completedAt,
    duration: interaction.duration,
    staffId: interaction.staffId,
    createdAt: interaction.createdAt,
  };
};

/**
 * Prisma implementation of InteractionRepository
 * Note: Interactions are immutable after creation (no SCD2)
 */
export const PrismaInteractionRepository: InteractionRepositoryService = {
  findById: (id: InteractionId) =>
    Effect.tryPromise({
      try: async () => {
        const interaction = await prisma.interaction.findUnique({
          where: { id },
        });

        if (!interaction) {
          throw new NotFoundError({
            message: `Interaction with ID ${id} not found`,
            entityType: 'Interaction',
            entityId: id,
          });
        }

        return toDomain(interaction);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find interaction', error);
      },
    }),

  findByLead: (leadId: string) =>
    Effect.tryPromise({
      try: async () => {
        const interactions = await prisma.interaction.findMany({
          where: { leadId },
          orderBy: { createdAt: 'desc' },
        });
        return interactions.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find interactions by lead', error),
    }),

  findByContact: (contactId: string) =>
    Effect.tryPromise({
      try: async () => {
        const interactions = await prisma.interaction.findMany({
          where: { contactId },
          orderBy: { createdAt: 'desc' },
        });
        return interactions.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find interactions by contact', error),
    }),

  findByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const interactions = await prisma.interaction.findMany({
          where: { caseId },
          orderBy: { createdAt: 'desc' },
        });
        return interactions.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find interactions by case', error),
    }),

  findByStaff: (staffId: string) =>
    Effect.tryPromise({
      try: async () => {
        const interactions = await prisma.interaction.findMany({
          where: { staffId },
          orderBy: { createdAt: 'desc' },
        });
        return interactions.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find interactions by staff', error),
    }),

  findScheduled: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const interactions = await prisma.interaction.findMany({
          where: {
            funeralHomeId,
            scheduledFor: { gte: now },
            completedAt: null,
          },
          orderBy: { scheduledFor: 'asc' },
        });
        return interactions.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find scheduled interactions', error),
    }),

  findOverdue: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const interactions = await prisma.interaction.findMany({
          where: {
            funeralHomeId,
            scheduledFor: { lt: now },
            completedAt: null,
          },
          orderBy: { scheduledFor: 'asc' },
        });
        return interactions.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find overdue interactions', error),
    }),

  findByFuneralHome: (funeralHomeId: string, filters = {}) =>
    Effect.tryPromise({
      try: async () => {
        const interactions = await prisma.interaction.findMany({
          where: {
            funeralHomeId,
            ...(filters.type && { type: filters.type.toUpperCase() as PrismaInteractionType }),
            ...(filters.staffId && { staffId: filters.staffId }),
            ...(filters.from && { createdAt: { gte: filters.from } }),
            ...(filters.to && { createdAt: { lte: filters.to } }),
          },
          orderBy: { createdAt: 'desc' },
        });
        return interactions.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find interactions by funeral home', error),
    }),

  save: (interaction: Interaction) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.interaction.create({
          data: toPrisma(interaction),
        });
      },
      catch: (error) => new PersistenceError('Failed to save interaction', error),
    }),

  update: (interaction: Interaction) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.interaction.update({
          where: { id: interaction.id },
          data: {
            completedAt: interaction.completedAt,
            outcome: interaction.outcome,
            duration: interaction.duration,
          },
        });
        return interaction;
      },
      catch: (error) => new PersistenceError('Failed to update interaction', error),
    }),

  delete: (id: InteractionId) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.interaction.delete({
          where: { id },
        });
      },
      catch: (error) => {
        if ((error as any).code === 'P2025') {
          return new NotFoundError({
            message: `Interaction ${id} not found`,
            entityType: 'Interaction',
            entityId: id,
          });
        }
        return new PersistenceError('Failed to delete interaction', error);
      },
    }),
};

/**
 * Layer for dependency injection
 */
export const PrismaInteractionRepositoryLive = Layer.succeed(
  InteractionRepository,
  PrismaInteractionRepository
);
