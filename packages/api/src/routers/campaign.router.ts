import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { 
  CampaignRepository,
  sendCampaign 
} from '@dykstra/application';
import { Campaign } from '@dykstra/domain';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

/**
 * Campaign status enum for validation
 */
const CampaignStatusSchema = z.enum(['draft', 'scheduled', 'sending', 'sent', 'paused', 'archived']);

/**
 * Campaign type enum for validation
 */
const CampaignTypeSchema = z.enum(['email', 'sms', 'direct_mail', 'mixed']);

/**
 * Campaign router
 * Handles marketing campaign management and execution
 */
export const campaignRouter = router({
  /**
   * Create a new campaign
   */
  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        type: CampaignTypeSchema,
        description: z.string().optional().nullable(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      
      const campaign = await runEffect(
        Effect.gen(function* () {
          const newCampaign = yield* Campaign.create({
            id: crypto.randomUUID(),
            businessKey: crypto.randomUUID(),
            funeralHomeId,
            name: input.name,
            type: input.type,
            createdBy: ctx.user.id,
          });

          const repo = yield* CampaignRepository;
          yield* repo.save(newCampaign);
          return newCampaign;
        })
      );

      return {
        id: campaign.id,
        businessKey: campaign.businessKey,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        createdAt: campaign.createdAt,
      };
    }),

  /**
   * Get campaign by ID
   */
  getById: staffProcedure
    .input(
      z.object({
        campaignId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const campaign = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          return yield* repo.findById(input.campaignId as any);
        })
      );

      return {
        id: campaign.id,
        businessKey: campaign.businessKey,
        version: campaign.version,
        funeralHomeId: campaign.funeralHomeId,
        name: campaign.name,
        description: campaign.description,
        type: campaign.type,
        status: campaign.status,
        subject: campaign.subject,
        content: campaign.content,
        segmentTags: campaign.segmentTags,
        scheduledFor: campaign.scheduledFor,
        sentAt: campaign.sentAt,
        targetCount: campaign.targetCount,
        sentCount: campaign.sentCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        convertedCount: campaign.convertedCount,
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        conversionRate: campaign.conversionRate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        createdBy: campaign.createdBy,
      };
    }),

  /**
   * List campaigns by funeral home with filters
   */
  list: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
          status: CampaignStatusSchema.optional(),
          type: CampaignTypeSchema.optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const allCampaigns = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          return yield* repo.findByFuneralHome(funeralHomeId, {
            status: input?.status,
            type: input?.type,
          });
        })
      );

      // Apply cursor pagination
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;
      const cursorIndex = cursor ? allCampaigns.findIndex(c => c.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedCampaigns = allCampaigns.slice(startIndex, startIndex + limit);

      const lastCampaign = paginatedCampaigns[paginatedCampaigns.length - 1];
      const nextCursor = paginatedCampaigns.length === limit && lastCampaign ? lastCampaign.id : undefined;

      return {
        items: paginatedCampaigns.map((campaign) => ({
          id: campaign.id,
          businessKey: campaign.businessKey,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          scheduledFor: campaign.scheduledFor,
          sentAt: campaign.sentAt,
          targetCount: campaign.targetCount,
          sentCount: campaign.sentCount,
          openRate: campaign.openRate,
          clickRate: campaign.clickRate,
          conversionRate: campaign.conversionRate,
          createdAt: campaign.createdAt,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: allCampaigns.length,
      };
    }),

  /**
   * Update campaign content
   */
  updateContent: staffProcedure
    .input(
      z.object({
        campaignId: z.string(),
        subject: z.string().min(1).max(200),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const campaign = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          const currentCampaign = yield* repo.findById(input.campaignId as any);
          const updatedCampaign = yield* currentCampaign.updateContent(input.subject, input.content);
          return yield* repo.update(updatedCampaign);
        })
      );

      return {
        id: campaign.id,
        subject: campaign.subject,
        updatedAt: campaign.updatedAt,
      };
    }),

  /**
   * Update campaign segment tags
   */
  updateSegment: staffProcedure
    .input(
      z.object({
        campaignId: z.string(),
        segmentTags: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const campaign = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          const currentCampaign = yield* repo.findById(input.campaignId as any);
          const segmentedCampaign = currentCampaign.setSegmentTags(input.segmentTags);
          return yield* repo.update(segmentedCampaign);
        })
      );

      return {
        id: campaign.id,
        segmentTags: campaign.segmentTags,
        updatedAt: campaign.updatedAt,
      };
    }),

  /**
   * Schedule campaign for sending
   */
  schedule: staffProcedure
    .input(
      z.object({
        campaignId: z.string(),
        scheduledFor: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const campaign = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          const currentCampaign = yield* repo.findById(input.campaignId as any);
          const scheduledCampaign = yield* currentCampaign.schedule(input.scheduledFor);
          return yield* repo.update(scheduledCampaign);
        })
      );

      return {
        id: campaign.id,
        status: campaign.status,
        scheduledFor: campaign.scheduledFor,
        updatedAt: campaign.updatedAt,
      };
    }),

  /**
   * Transition campaign status
   */
  updateStatus: staffProcedure
    .input(
      z.object({
        campaignId: z.string(),
        status: CampaignStatusSchema,
      })
    )
    .mutation(async ({ input }) => {
      const campaign = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          const currentCampaign = yield* repo.findById(input.campaignId as any);
          const updatedCampaign = yield* currentCampaign.transitionStatus(input.status);
          return yield* repo.update(updatedCampaign);
        })
      );

      return {
        id: campaign.id,
        status: campaign.status,
        updatedAt: campaign.updatedAt,
      };
    }),

  /**
   * Send campaign (executes via use case)
   */
  send: staffProcedure
    .input(
      z.object({
        campaignId: z.string(),
        targetContactIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const campaign = await runEffect(
        sendCampaign({
          campaignBusinessKey: input.campaignId,
        })
      );

      return {
        id: campaign.id,
        status: campaign.status,
        sentAt: campaign.sentAt,
        sentCount: campaign.sentCount,
      };
    }),

  /**
   * Update campaign metrics (e.g. from tracking pixels, link clicks)
   */
  updateMetrics: staffProcedure
    .input(
      z.object({
        campaignId: z.string(),
        openedCount: z.number().int().min(0).optional(),
        clickedCount: z.number().int().min(0).optional(),
        convertedCount: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const campaign = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          const currentCampaign = yield* repo.findById(input.campaignId as any);
          
          let updatedCampaign = currentCampaign;
          
          if (input.openedCount !== undefined) {
            updatedCampaign = updatedCampaign.recordOpen();
          }
          if (input.clickedCount !== undefined) {
            updatedCampaign = updatedCampaign.recordClick();
          }
          if (input.convertedCount !== undefined) {
            updatedCampaign = updatedCampaign.recordConversion();
          }
          
          return yield* repo.update(updatedCampaign);
        })
      );

      return {
        id: campaign.id,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        convertedCount: campaign.convertedCount,
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        conversionRate: campaign.conversionRate,
        updatedAt: campaign.updatedAt,
      };
    }),

  /**
   * Get campaign metrics/performance
   */
  getMetrics: staffProcedure
    .input(
      z.object({
        campaignId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const campaign = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          return yield* repo.findById(input.campaignId as any);
        })
      );

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        targetCount: campaign.targetCount,
        sentCount: campaign.sentCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        convertedCount: campaign.convertedCount,
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        conversionRate: campaign.conversionRate,
        sentAt: campaign.sentAt,
      };
    }),

  /**
   * Get top performing campaigns
   */
  getTopPerforming: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      const limit = input.limit;

      const campaigns = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          return yield* repo.findTopPerforming(funeralHomeId, limit);
        })
      );

      return campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        sentCount: campaign.sentCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        convertedCount: campaign.convertedCount,
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        conversionRate: campaign.conversionRate,
        sentAt: campaign.sentAt,
      }));
    }),

  /**
   * Get scheduled campaigns ready to send
   */
  getScheduled: staffProcedure
    .input(
      z.object({
        beforeDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const beforeDate = input.beforeDate ?? new Date();

      const campaigns = await runEffect(
        Effect.gen(function* () {
          const repo = yield* CampaignRepository;
          return yield* repo.findScheduledCampaigns(beforeDate);
        })
      );

      return campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        scheduledFor: campaign.scheduledFor,
        targetCount: campaign.targetCount,
        segmentTags: campaign.segmentTags,
      }));
    }),

  /**
   * Get campaign history (SCD Type 2)
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
          const repo = yield* CampaignRepository;
          return yield* repo.findHistory(input.businessKey);
        })
      );

      return history.map((campaign) => ({
        id: campaign.id,
        businessKey: campaign.businessKey,
        version: campaign.version,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        subject: campaign.subject,
        segmentTags: campaign.segmentTags,
        scheduledFor: campaign.scheduledFor,
        sentAt: campaign.sentAt,
        sentCount: campaign.sentCount,
        openRate: campaign.openRate,
        clickRate: campaign.clickRate,
        conversionRate: campaign.conversionRate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        createdBy: campaign.createdBy,
      }));
    }),
});
