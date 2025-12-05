import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { Effect } from 'effect';
import {
  saveMemorialTemplate,
  previewTemplate,
  generateServiceProgram,
  generatePrayerCard,
  TemplateRepositoryPort,
  TemplateRendererPort,
  PdfGeneratorPort,
} from '@dykstra/application';
import {
  PrismaTemplateRepository,
  HandlebarsAdapter,
  PuppeteerAdapter,
} from '@dykstra/infrastructure';
import { Layer } from 'effect';

/**
 * Memorial Templates tRPC Router
 * 
 * API endpoints for template management:
 * - saveTemplate: Create/update templates with SCD2 versioning
 * - previewTemplate: Generate HTML preview with sample data
 * - generateServiceProgram: Generate service program PDF
 * - generatePrayerCard: Generate prayer card PDF
 * - listTemplates: Get available templates
 * - getTemplate: Load specific template for editing
 * - getTemplateHistory: View version history
 */

// Effect layer with real implementations
const TemplateLayer = Layer.mergeAll(
  Layer.succeed(TemplateRepositoryPort, PrismaTemplateRepository),
  Layer.succeed(TemplateRendererPort, HandlebarsAdapter),
  Layer.succeed(PdfGeneratorPort, PuppeteerAdapter)
);

export const memorialTemplatesRouter = router({
  /**
   * Save Template
   * 
   * Creates new template or updates existing (SCD2 versioning)
   */
  saveTemplate: publicProcedure
    .input(
      z.object({
        businessKey: z.string().min(1),
        name: z.string().min(1),
        category: z.enum(['service_program', 'prayer_card', 'memorial_folder', 'bookmark']),
        status: z.enum(['draft', 'active', 'deprecated']).optional(),
        funeralHomeId: z.string().optional(),
        htmlTemplate: z.string().min(1),
        cssStyles: z.string().optional(),
        pageSize: z.enum(['letter', 'legal', 'a4', '4x6', '5x7']),
        orientation: z.enum(['portrait', 'landscape']),
        margins: z
          .object({
            top: z.number().min(0).max(2),
            right: z.number().min(0).max(2),
            bottom: z.number().min(0).max(2),
            left: z.number().min(0).max(2),
          })
          .optional(),
        printQuality: z.union([z.literal(150), z.literal(300), z.literal(600)]).optional(),
        existingTemplateId: z.string().optional(),
        versionNote: z.string().optional(),
        createdBy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await Effect.runPromise(
        saveMemorialTemplate(input).pipe(Effect.provide(TemplateLayer))
      );
      return result;
    }),

  /**
   * Preview Template
   * 
   * Generates HTML preview with sample data (no PDF)
   */
  previewTemplate: publicProcedure
    .input(
      z.object({
        templateBusinessKey: z.string(),
        sampleData: z.record(z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await Effect.runPromise(
        previewTemplate(input).pipe(Effect.provide(TemplateLayer))
      );
      return result;
    }),

  /**
   * Generate Service Program PDF
   */
  generateServiceProgram: publicProcedure
    .input(
      z.object({
        templateBusinessKey: z.string(),
        data: z.object({
          deceasedName: z.string(),
          birthDate: z.string(),
          deathDate: z.string(),
          photoUrl: z.string().optional(),
          orderOfService: z.array(
            z.object({
              item: z.string(),
              officiant: z.string().optional(),
            })
          ),
          obituary: z.string().optional(),
          pallbearers: z.array(z.string()).optional(),
          funeralHomeName: z.string(),
          funeralHomeAddress: z.string(),
          funeralHomePhone: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await Effect.runPromise(
        generateServiceProgram(input).pipe(Effect.provide(TemplateLayer))
      );
      
      // Convert Buffer to base64 for JSON transport
      return {
        ...result,
        pdfBuffer: result.pdfBuffer.toString('base64'),
      };
    }),

  /**
   * Generate Prayer Card PDF
   */
  generatePrayerCard: publicProcedure
    .input(
      z.object({
        templateBusinessKey: z.string(),
        data: z.object({
          deceasedName: z.string(),
          birthDate: z.string(),
          deathDate: z.string(),
          photoUrl: z.string().optional(),
          prayerTitle: z.string(),
          prayerText: z.string(),
          funeralHomeName: z.string(),
          funeralHomePhone: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await Effect.runPromise(
        generatePrayerCard(input).pipe(Effect.provide(TemplateLayer))
      );
      
      // Convert Buffer to base64 for JSON transport
      return {
        ...result,
        pdfBuffer: result.pdfBuffer.toString('base64'),
      };
    }),

  /**
   * List Templates
   * 
   * Get available templates (system + funeral-home specific)
   */
  listTemplates: publicProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
        category: z.enum(['service_program', 'prayer_card', 'memorial_folder', 'bookmark']).optional(),
      })
    )
    .query(async ({ input }) => {
      const repo = PrismaTemplateRepository;
      
      if (input.funeralHomeId && input.category) {
        const templates = await Effect.runPromise(
          repo.findCurrentByFuneralHome(input.funeralHomeId, input.category)
        );
        return templates;
      }
      
      if (input.category) {
        const templates = await Effect.runPromise(
          repo.findSystemTemplates(input.category)
        );
        return templates;
      }
      
      // Default: return all system templates
      return [];
    }),

  /**
   * Get Template
   * 
   * Load specific template for editing
   */
  getTemplate: publicProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      const repo = PrismaTemplateRepository;
      const template = await Effect.runPromise(
        repo.findCurrentByBusinessKey(input.businessKey)
      );
      return template;
    }),

  /**
   * Get Template History
   * 
   * View all versions of a template (SCD2)
   */
  getTemplateHistory: publicProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      const repo = PrismaTemplateRepository;
      const history = await Effect.runPromise(
        repo.getHistory(input.businessKey)
      );
      return history;
    }),

  /**
   * Update Template Status
   * 
   * Approve (draft->active), deprecate (active->deprecated), or reject templates
   */
  updateTemplateStatus: publicProcedure
    .input(
      z.object({
        businessKey: z.string(),
        newStatus: z.enum(['draft', 'active', 'deprecated']),
        notes: z.string().optional(),
        reviewedBy: z.string(), // User ID of reviewer
      })
    )
    .mutation(async ({ input }) => {
      const repo = PrismaTemplateRepository;
      
      // Get current version
      const currentTemplate = await Effect.runPromise(
        repo.findCurrentByBusinessKey(input.businessKey)
      );

      if (!currentTemplate) {
        throw new Error(`Template not found: ${input.businessKey}`);
      }

      // Create new version with updated status
      const newTemplate = await Effect.runPromise(
        Effect.provide(
          saveMemorialTemplate({
            businessKey: input.businessKey,
            name: currentTemplate.metadata.name,
            category: currentTemplate.metadata.category as 'service_program' | 'prayer_card' | 'bookmark' | 'memorial_folder',
            status: input.newStatus,
            funeralHomeId: currentTemplate.metadata.funeralHomeId,
            htmlTemplate: currentTemplate.content.htmlTemplate,
            cssStyles: currentTemplate.content.cssStyles,
            pageSize: currentTemplate.settings.pageSize,
            orientation: currentTemplate.settings.orientation,
            margins: currentTemplate.settings.margins,
            printQuality: currentTemplate.settings.printQuality,
            existingTemplateId: currentTemplate.metadata.id,
            versionNote: input.notes || `Status changed to ${input.newStatus} by ${input.reviewedBy}`,
            createdBy: input.reviewedBy,
          }),
          TemplateLayer
        )
      );

      return newTemplate;
    }),

  /**
   * List Pending Templates
   * 
   * Get all templates with draft status for approval workflow
   */
  listPendingTemplates: publicProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const repo = PrismaTemplateRepository;
      
      // Get all current templates across categories
      const categories: Array<'service_program' | 'prayer_card' | 'memorial_folder' | 'bookmark'> = [
        'service_program',
        'prayer_card',
        'memorial_folder',
        'bookmark',
      ];

      const allTemplates = await Promise.all(
        categories.map((category) =>
          input.funeralHomeId
            ? Effect.runPromise(repo.findCurrentByFuneralHome(input.funeralHomeId, category))
            : Effect.runPromise(repo.findSystemTemplates(category))
        )
      );

      // Flatten and filter for draft status
      return allTemplates.flat().filter((t) => t.metadata.status === 'draft');
    }),
});
