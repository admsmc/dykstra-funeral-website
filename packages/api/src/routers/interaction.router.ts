import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { InteractionRepository, logInteraction } from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

const InteractionTypeSchema = z.enum(['phone_call', 'email', 'meeting', 'visit', 'note', 'task']);
const InteractionDirectionSchema = z.enum(['inbound', 'outbound']);

export const interactionRouter = router({
  create: staffProcedure
    .input(
      z.object({
        type: InteractionTypeSchema,
        direction: InteractionDirectionSchema,
        subject: z.string().min(1).max(200),
        body: z.string().optional().nullable(),
        contactId: z.string().optional().nullable(),
        leadId: z.string().optional().nullable(),
        caseId: z.string().optional().nullable(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const interaction = await runEffect(
        logInteraction({
          id: crypto.randomUUID(),
          funeralHomeId,
          type: input.type,
          direction: input.direction,
          subject: input.subject,
          body: input.body ?? null,
          contactId: input.contactId as any,
          leadId: input.leadId as any,
          caseId: input.caseId as any,
          staffId: ctx.user.id,
        })
      );

      return {
        id: interaction.id,
        type: interaction.type,
        direction: interaction.direction,
        subject: interaction.subject,
        createdAt: interaction.createdAt,
      };
    }),

  getById: staffProcedure
    .input(z.object({ interactionId: z.string() }))
    .query(async ({ input }) => {
      const interaction = await runEffect(
        Effect.gen(function* () {
          const repo = yield* InteractionRepository;
          return yield* repo.findById(input.interactionId as any);
        })
      );

      return {
        id: interaction.id,
        funeralHomeId: interaction.funeralHomeId,
        type: interaction.type,
        direction: interaction.direction,
        subject: interaction.subject,
        body: interaction.body,
        contactId: interaction.contactId,
        leadId: interaction.leadId,
        caseId: interaction.caseId,
        staffId: interaction.staffId,
        createdAt: interaction.createdAt,
      };
    }),

  listByContact: staffProcedure
    .input(z.object({
      contactId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const allInteractions = await runEffect(
        Effect.gen(function* () {
          const repo = yield* InteractionRepository;
          return yield* repo.findByContact(input.contactId as any);
        })
      );

      const limit = input.limit;
      const cursor = input.cursor;
      const cursorIndex = cursor ? allInteractions.findIndex(i => i.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedInteractions = allInteractions.slice(startIndex, startIndex + limit);

      const lastInteraction = paginatedInteractions[paginatedInteractions.length - 1];
      const nextCursor = paginatedInteractions.length === limit && lastInteraction ? lastInteraction.id : undefined;

      return {
        items: paginatedInteractions.map((interaction) => ({
          id: interaction.id,
          type: interaction.type,
          direction: interaction.direction,
          subject: interaction.subject,
          createdAt: interaction.createdAt,
          staffId: interaction.staffId,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: allInteractions.length,
      };
    }),

  listByLead: staffProcedure
    .input(z.object({
      leadId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const allInteractions = await runEffect(
        Effect.gen(function* () {
          const repo = yield* InteractionRepository;
          return yield* repo.findByLead(input.leadId as any);
        })
      );

      const limit = input.limit;
      const cursor = input.cursor;
      const cursorIndex = cursor ? allInteractions.findIndex(i => i.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedInteractions = allInteractions.slice(startIndex, startIndex + limit);

      const lastInteraction = paginatedInteractions[paginatedInteractions.length - 1];
      const nextCursor = paginatedInteractions.length === limit && lastInteraction ? lastInteraction.id : undefined;

      return {
        items: paginatedInteractions.map((interaction) => ({
          id: interaction.id,
          type: interaction.type,
          direction: interaction.direction,
          subject: interaction.subject,
          createdAt: interaction.createdAt,
          staffId: interaction.staffId,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: allInteractions.length,
      };
    }),

  listByCase: staffProcedure
    .input(z.object({
      caseId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const allInteractions = await runEffect(
        Effect.gen(function* () {
          const repo = yield* InteractionRepository;
          return yield* repo.findByCase(input.caseId as any);
        })
      );

      const limit = input.limit;
      const cursor = input.cursor;
      const cursorIndex = cursor ? allInteractions.findIndex(i => i.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedInteractions = allInteractions.slice(startIndex, startIndex + limit);

      const lastInteraction = paginatedInteractions[paginatedInteractions.length - 1];
      const nextCursor = paginatedInteractions.length === limit && lastInteraction ? lastInteraction.id : undefined;

      return {
        items: paginatedInteractions.map((interaction) => ({
          id: interaction.id,
          type: interaction.type,
          direction: interaction.direction,
          subject: interaction.subject,
          createdAt: interaction.createdAt,
          staffId: interaction.staffId,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: allInteractions.length,
      };
    }),

  getRecentByContact: staffProcedure
    .input(z.object({
      contactId: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const interactions = await runEffect(
        Effect.gen(function* () {
          const repo = yield* InteractionRepository;
          const allInteractions = yield* repo.findByContact(input.contactId as any);
          return allInteractions.slice(0, input.limit);
        })
      );

      return interactions.map((interaction) => ({
        id: interaction.id,
        type: interaction.type,
        direction: interaction.direction,
        subject: interaction.subject,
        createdAt: interaction.createdAt,
        staffId: interaction.staffId,
      }));
    }),

  listByFuneralHome: staffProcedure
    .input(z.object({
      funeralHomeId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const allInteractions = await runEffect(
        Effect.gen(function* () {
          const repo = yield* InteractionRepository;
          return yield* repo.findByFuneralHome(funeralHomeId);
        })
      );

      const limit = input.limit;
      const cursor = input.cursor;
      const cursorIndex = cursor ? allInteractions.findIndex(i => i.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedInteractions = allInteractions.slice(startIndex, startIndex + limit);

      const lastInteraction = paginatedInteractions[paginatedInteractions.length - 1];
      const nextCursor = paginatedInteractions.length === limit && lastInteraction ? lastInteraction.id : undefined;

      return {
        items: paginatedInteractions.map((interaction) => ({
          id: interaction.id,
          type: interaction.type,
          direction: interaction.direction,
          subject: interaction.subject,
          contactId: interaction.contactId,
          leadId: interaction.leadId,
          caseId: interaction.caseId,
          createdAt: interaction.createdAt,
          staffId: interaction.staffId,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: allInteractions.length,
      };
    }),
});
