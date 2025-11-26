import { z } from 'zod';
import { router, familyProcedure, staffProcedure } from '../trpc';
import { createCase, getCaseDetails, getCaseTimeline, CaseRepository } from '@dykstra/application';
import { CaseTypeSchema } from '@dykstra/shared';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

/**
 * Case router
 */
export const caseRouter = router({
  /**
   * Create a new case
   */
  create: staffProcedure
    .input(
      z.object({
        decedentName: z.string().min(1).max(255),
        type: CaseTypeSchema,
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      
      const case_ = await runEffect(
        createCase({
          id: crypto.randomUUID(), // Generate CUID in production
          funeralHomeId,
          decedentName: input.decedentName,
          type: input.type,
          createdBy: ctx.user.id,
        })
      );

      return {
        id: case_.id,
        decedentName: case_.decedentName,
        type: case_.type,
        status: case_.status,
        createdAt: case_.createdAt,
      };
    }),

  /**
   * Get case details
   */
  getDetails: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const details = await runEffect(
        getCaseDetails({
          caseId: input.caseId as any, // CaseId brand
          requestingUserId: ctx.user.id,
        })
      );

      return {
        case: {
          id: details.case_.id,
          funeralHomeId: details.case_.funeralHomeId,
          decedentName: details.case_.decedentName,
          decedentDateOfBirth: details.case_.decedentDateOfBirth,
          decedentDateOfDeath: details.case_.decedentDateOfDeath,
          type: details.case_.type,
          status: details.case_.status,
          serviceType: details.case_.serviceType,
          serviceDate: details.case_.serviceDate,
          createdAt: details.case_.createdAt,
          updatedAt: details.case_.updatedAt,
        },
        canModify: details.canModify,
        isActive: details.isActive,
        daysUntilService: details.daysUntilService,
      };
    }),

  /**
   * List cases by family member
   */
  listMyCases: familyProcedure.query(async ({ ctx }) => {
    const cases = await runEffect(
      Effect.gen(function* (_) {
        const repo = yield* _(CaseRepository);
        return yield* _(repo.findByFamilyMember(ctx.user.id));
      })
    );

    return cases.map((case_) => ({
      id: case_.id,
      decedentName: case_.decedentName,
      type: case_.type,
      status: case_.status,
      serviceDate: case_.serviceDate,
      createdAt: case_.createdAt,
    }));
  }),

  /**
   * List all cases for funeral home (staff only)
   * Supports pagination for performance with 100+ cases
   */
  listAll: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(), // Last case ID from previous page
          status: z.enum(['INQUIRY', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
          type: z.enum(['AT_NEED', 'PRE_NEED', 'INQUIRY']).optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;
      
      const allCases = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findByFuneralHome(funeralHomeId));
        })
      );
      
      // Filter by status and type if provided (case-insensitive matching)
      let filtered = allCases;
      if (input?.status) {
        filtered = filtered.filter(c => c.status.toUpperCase() === input.status);
      }
      if (input?.type) {
        filtered = filtered.filter(c => c.type.toUpperCase() === input.type);
      }
      
      // Apply cursor pagination
      const cursorIndex = cursor ? filtered.findIndex(c => c.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedCases = filtered.slice(startIndex, startIndex + limit);
      
      const lastCase = paginatedCases[paginatedCases.length - 1];
      const nextCursor = paginatedCases.length === limit && lastCase
        ? lastCase.id 
        : undefined;

      return {
        items: paginatedCases.map((case_) => ({
          id: case_.id,
          businessKey: case_.businessKey,
          version: case_.version,
          decedentName: case_.decedentName,
          type: case_.type,
          status: case_.status,
          serviceType: case_.serviceType,
          serviceDate: case_.serviceDate,
          createdAt: case_.createdAt,
          createdBy: case_.createdBy,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: filtered.length,
      };
    }),
  
  /**
   * Get case history - SCD Type 2 temporal query
   * Returns all versions of a case for audit trail
   */
  getHistory: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      const history = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findHistory(input.businessKey));
        })
      );

      return history.map((case_) => ({
        id: case_.id,
        businessKey: case_.businessKey,
        version: case_.version,
        decedentName: case_.decedentName,
        type: case_.type,
        status: case_.status,
        serviceType: case_.serviceType,
        serviceDate: case_.serviceDate,
        createdAt: case_.createdAt,
        updatedAt: case_.updatedAt,
        createdBy: case_.createdBy,
      }));
    }),
  
  /**
   * Get case at specific time - SCD Type 2 temporal query
   * Returns case state as it existed at a point in time
   */
  getAtTime: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
        asOf: z.date(),
      })
    )
    .query(async ({ input }) => {
      const case_ = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findByIdAtTime(input.businessKey, input.asOf));
        })
      );

      return {
        id: case_.id,
        businessKey: case_.businessKey,
        version: case_.version,
        decedentName: case_.decedentName,
        decedentDateOfBirth: case_.decedentDateOfBirth,
        decedentDateOfDeath: case_.decedentDateOfDeath,
        type: case_.type,
        status: case_.status,
        serviceType: case_.serviceType,
        serviceDate: case_.serviceDate,
        createdAt: case_.createdAt,
        updatedAt: case_.updatedAt,
        createdBy: case_.createdBy,
      };
    }),
  
  /**
   * Get changes between dates - SCD Type 2 temporal query
   * Returns versions that were effective in a date range
   */
  getChangesBetween: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
        from: z.date(),
        to: z.date(),
      })
    )
    .query(async ({ input }) => {
      const changes = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findChangesBetween(input.businessKey, input.from, input.to));
        })
      );

      return changes.map((case_) => ({
        id: case_.id,
        businessKey: case_.businessKey,
        version: case_.version,
        decedentName: case_.decedentName,
        type: case_.type,
        status: case_.status,
        serviceType: case_.serviceType,
        serviceDate: case_.serviceDate,
        createdAt: case_.createdAt,
        updatedAt: case_.updatedAt,
        createdBy: case_.createdBy,
      }));
    }),

  /**
   * Get case timeline
   * Returns chronological timeline of all events for a case
   */
  getTimeline: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        getCaseTimeline({
          caseId: input.caseId as any, // CaseId brand
          limit: input.limit,
        })
      );

      return {
        caseId: result.caseId,
        events: result.events.map((event) => ({
          id: event.id,
          timestamp: event.timestamp,
          eventType: event.eventType,
          title: event.title,
          description: event.description,
          actor: event.actor,
          metadata: event.metadata,
        })),
        totalEvents: result.totalEvents,
      };
    }),
});
