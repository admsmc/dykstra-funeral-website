import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { ReferralSourceRepository } from '@dykstra/application';
import { ReferralSource } from '@dykstra/domain';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

const ReferralSourceTypeSchema = z.enum(['funeral_home', 'hospice', 'hospital', 'clergy', 'attorney', 'family', 'online', 'other']);

export const referralSourceRouter = router({
  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        type: ReferralSourceTypeSchema,
        contactPerson: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      
      const source = await runEffect(
        Effect.gen(function* () {
          let newSource = yield* ReferralSource.create({
            id: crypto.randomUUID(),
            businessKey: crypto.randomUUID(),
            funeralHomeId,
            name: input.name,
            type: input.type,
            createdBy: ctx.user.id,
          });
          
          // Update optional fields after creation
          newSource = newSource.updateContactInfo({
            contactPerson: input.contactPerson ?? null,
            email: input.email ?? null,
            phone: input.phone ?? null,
            address: input.address ?? null,
          });
          
          if (input.notes) {
            newSource = yield* newSource.updateNotes(input.notes);
          }

          const repo = yield* ReferralSourceRepository;
          yield* repo.save(newSource);
          return newSource;
        })
      );

      return {
        id: source.id,
        businessKey: source.businessKey,
        name: source.name,
        type: source.type,
        createdAt: source.createdAt,
      };
    }),

  getById: staffProcedure
    .input(z.object({ sourceId: z.string() }))
    .query(async ({ input }) => {
      const source = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          return yield* repo.findById(input.sourceId as any);
        })
      );

      return {
        id: source.id,
        businessKey: source.businessKey,
        version: source.version,
        funeralHomeId: source.funeralHomeId,
        name: source.name,
        type: source.type,
        contactPerson: source.contactPerson,
        email: source.email,
        phone: source.phone,
        address: source.address,
        notes: source.notes,
        isActive: source.isActive,
        totalReferrals: source.totalReferrals,
        convertedReferrals: source.convertedReferrals,
        conversionRate: source.conversionRate,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        createdBy: source.createdBy,
      };
    }),

  list: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
        activeOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const allSources = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          return yield* repo.findByFuneralHome(funeralHomeId, input?.activeOnly);
        })
      );

      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;
      const cursorIndex = cursor ? allSources.findIndex(s => s.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedSources = allSources.slice(startIndex, startIndex + limit);

      const lastSource = paginatedSources[paginatedSources.length - 1];
      const nextCursor = paginatedSources.length === limit && lastSource ? lastSource.id : undefined;

      return {
        items: paginatedSources.map((source) => ({
          id: source.id,
          name: source.name,
          type: source.type,
          isActive: source.isActive,
          totalReferrals: source.totalReferrals,
          convertedReferrals: source.convertedReferrals,
          conversionRate: source.conversionRate,
          createdAt: source.createdAt,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: allSources.length,
      };
    }),

  findByType: staffProcedure
    .input(z.object({
      funeralHomeId: z.string().optional(),
      type: ReferralSourceTypeSchema,
    }))
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const sources = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          return yield* repo.findByType(funeralHomeId, input.type);
        })
      );

      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        totalReferrals: source.totalReferrals,
        conversionRate: source.conversionRate,
      }));
    }),

  getHighPerformers: staffProcedure
    .input(z.object({ funeralHomeId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const sources = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          return yield* repo.findHighPerformers(funeralHomeId);
        })
      );

      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        totalReferrals: source.totalReferrals,
        convertedReferrals: source.convertedReferrals,
        conversionRate: source.conversionRate,
      }));
    }),

  getUnderPerformers: staffProcedure
    .input(z.object({ funeralHomeId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const sources = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          return yield* repo.findUnderPerformers(funeralHomeId);
        })
      );

      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        totalReferrals: source.totalReferrals,
        convertedReferrals: source.convertedReferrals,
        conversionRate: source.conversionRate,
      }));
    }),

  recordReferral: staffProcedure
    .input(z.object({
      sourceId: z.string(),
      converted: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const source = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          const currentSource = yield* repo.findById(input.sourceId as any);
          const updatedSource = currentSource.recordReferral(input.converted);
          return yield* repo.update(updatedSource);
        })
      );

      return {
        id: source.id,
        totalReferrals: source.totalReferrals,
        convertedReferrals: source.convertedReferrals,
        conversionRate: source.conversionRate,
        updatedAt: source.updatedAt,
      };
    }),

  deactivate: staffProcedure
    .input(z.object({ sourceId: z.string() }))
    .mutation(async ({ input }) => {
      const source = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          const currentSource = yield* repo.findById(input.sourceId as any);
          const deactivatedSource = currentSource.deactivate();
          return yield* repo.update(deactivatedSource);
        })
      );

      return { id: source.id, isActive: source.isActive };
    }),

  reactivate: staffProcedure
    .input(z.object({ sourceId: z.string() }))
    .mutation(async ({ input }) => {
      const source = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          const currentSource = yield* repo.findById(input.sourceId as any);
          const reactivatedSource = currentSource.reactivate();
          return yield* repo.update(reactivatedSource);
        })
      );

      return { id: source.id, isActive: source.isActive };
    }),

  getHistory: staffProcedure
    .input(z.object({ businessKey: z.string() }))
    .query(async ({ input }) => {
      const history = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ReferralSourceRepository;
          return yield* repo.findHistory(input.businessKey);
        })
      );

      return history.map((source) => ({
        id: source.id,
        businessKey: source.businessKey,
        version: source.version,
        name: source.name,
        type: source.type,
        isActive: source.isActive,
        totalReferrals: source.totalReferrals,
        convertedReferrals: source.convertedReferrals,
        conversionRate: source.conversionRate,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      }));
    }),
});
