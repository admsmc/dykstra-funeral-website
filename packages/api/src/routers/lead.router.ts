import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { 
  LeadRepository, 
  createLead, 
  convertLeadToCase 
} from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

/**
 * Lead status enum for validation
 */
const LeadStatusSchema = z.enum(['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost']);

/**
 * Lead source enum for validation
 */
const LeadSourceSchema = z.enum(['website', 'phone', 'email', 'referral', 'social_media', 'event', 'direct_mail', 'other']);

/**
 * Lead router
 * Handles CRM lead management operations
 */
export const leadRouter = router({
  /**
   * Create a new lead
   */
  create: staffProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        source: LeadSourceSchema,
        notes: z.string().optional().nullable(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      
      const lead = await runEffect(
        createLead({
          id: crypto.randomUUID(),
          funeralHomeId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email ?? null,
          phone: input.phone ?? null,
          source: input.source,
          type: 'general_inquiry' as any,
          createdBy: ctx.user.id,
      })
    );

      return {
        id: lead.id,
        businessKey: lead.businessKey,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        score: lead.score,
        source: lead.source,
        createdAt: lead.createdAt,
      };
    }),

  /**
   * Get lead by ID
   */
  getById: staffProcedure
    .input(
      z.object({
        leadId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const lead = await runEffect(
        Effect.gen(function* () {
          const repo = yield* LeadRepository;
          return yield* repo.findById(input.leadId as any);
        })
      );

      return {
        id: lead.id,
        businessKey: lead.businessKey,
        version: lead.version,
        funeralHomeId: lead.funeralHomeId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        score: lead.score,
        source: lead.source,
        assignedTo: lead.assignedTo,
        notes: lead.notes,
        lastContactedAt: lead.lastContactedAt,
        convertedToCaseId: lead.convertedToCaseId,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        createdBy: lead.createdBy,
      };
    }),

  /**
   * List leads by funeral home with filters
   */
  list: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
          status: LeadStatusSchema.optional(),
          source: LeadSourceSchema.optional(),
          assignedTo: z.string().optional(),
          minScore: z.number().min(0).max(100).optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const allLeads = await runEffect(
        Effect.gen(function* () {
          const repo = yield* LeadRepository;
      return yield* repo.findByFuneralHome(funeralHomeId);
        })
      );

      // Apply cursor pagination
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;
      const cursorIndex = cursor ? allLeads.findIndex(l => l.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedLeads = allLeads.slice(startIndex, startIndex + limit);

      const lastLead = paginatedLeads[paginatedLeads.length - 1];
      const nextCursor = paginatedLeads.length === limit && lastLead ? lastLead.id : undefined;

      return {
        items: paginatedLeads.map((lead) => ({
          id: lead.id,
          businessKey: lead.businessKey,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          score: lead.score,
          source: lead.source,
          assignedTo: lead.assignedTo,
          lastContactedAt: lead.lastContactedAt,
          createdAt: lead.createdAt,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: allLeads.length,
      };
    }),

  /**
   * Update lead status
   */
  updateStatus: staffProcedure
    .input(
      z.object({
        leadId: z.string(),
        status: LeadStatusSchema,
      })
    )
    .mutation(async ({ input }) => {
      const lead = await runEffect(
        Effect.gen(function* () {
          const repo = yield* LeadRepository;
          const currentLead = yield* repo.findById(input.leadId as any);
          const updatedLead = yield* currentLead.transitionStatus(input.status);
          return yield* repo.update(updatedLead);
        })
      );

      return {
        id: lead.id,
        status: lead.status,
        updatedAt: lead.updatedAt,
      };
    }),

  /**
   * Assign lead to staff member
   */
  assign: staffProcedure
    .input(
      z.object({
        leadId: z.string(),
        assignedTo: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const lead = await runEffect(
        Effect.gen(function* () {
          const repo = yield* LeadRepository;
          const currentLead = yield* repo.findById(input.leadId as any);
          const assignedLead = yield* currentLead.assignTo(input.assignedTo);
          return yield* repo.update(assignedLead);
        })
      );

      return {
        id: lead.id,
        assignedTo: lead.assignedTo,
        updatedAt: lead.updatedAt,
      };
    }),

  /**
   * Update lead score
   */
  updateScore: staffProcedure
    .input(
      z.object({
        leadId: z.string(),
        score: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const lead = await runEffect(
        Effect.gen(function* () {
          const repo = yield* LeadRepository;
          const currentLead = yield* repo.findById(input.leadId as any);
          const scoredLead = yield* currentLead.updateScore(input.score);
          return yield* repo.update(scoredLead);
        })
      );

      return {
        id: lead.id,
        score: lead.score,
        updatedAt: lead.updatedAt,
      };
    }),

  /**
   * Record contact with lead
   */
  recordContact: staffProcedure
    .input(
      z.object({
        leadId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const lead = await runEffect(
        Effect.gen(function* () {
          const repo = yield* LeadRepository;
          const currentLead = yield* repo.findById(input.leadId as any);
          const contactedLead = yield* currentLead.markContacted();
          return yield* repo.update(contactedLead);
        })
      );

      return {
        id: lead.id,
        lastContactedAt: lead.lastContactedAt,
        updatedAt: lead.updatedAt,
      };
    }),

  /**
   * Convert lead to case
   */
  convertToCase: staffProcedure
    .input(
      z.object({
        leadId: z.string(),
        caseId: z.string(),
        decedentName: z.string().min(1).max(255),
        caseType: z.enum(['AT_NEED', 'PRE_NEED', 'INQUIRY']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        convertLeadToCase({
          leadBusinessKey: input.leadId,
          decedentName: input.decedentName,
          caseType: input.caseType === 'AT_NEED' ? 'at_need' : 'pre_need',
          createdBy: ctx.user.id,
        })
      );

      return {
        lead: {
          id: result.lead.id,
          status: result.lead.status,
          convertedToCaseId: result.lead.convertedToCaseId,
        },
        case: {
          id: result.case.id,
          decedentName: result.case.decedentName,
          type: result.case.type,
          status: result.case.status,
        },
      };
    }),

  /**
   * Get lead history (SCD Type 2)
   */
  getHistory: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      const history = await runEffect(
        Effect.gen(function* () {
          const repo = yield* LeadRepository;
          return yield* repo.findHistory(input.businessKey);
        })
      );

      return history.map((lead) => ({
        id: lead.id,
        businessKey: lead.businessKey,
        version: lead.version,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        score: lead.score,
        source: lead.source,
        assignedTo: lead.assignedTo,
        lastContactedAt: lead.lastContactedAt,
        convertedToCaseId: lead.convertedToCaseId,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        createdBy: lead.createdBy,
      }));
    }),
});
