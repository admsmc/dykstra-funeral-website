import { Effect } from 'effect';
import { TemplateRepositoryPort } from '../../ports/template-repository-port';
import { TemplateRendererPort } from '../../ports/template-renderer-port';
import { PdfGeneratorPort, type PdfGenerationError } from '../../ports/pdf-generator-port';
import { PersistenceError } from '../../ports/case-repository';

/**
 * Memorial Prayer Card Data
 * 
 * Data needed to populate a memorial prayer card template
 */
export interface MemorialPrayerCardData {
  readonly deceasedName: string;
  readonly birthDate: string; // Formatted date string
  readonly deathDate: string; // Formatted date string
  readonly photoUrl?: string;
  readonly prayerTitle: string; // e.g., "The Lord's Prayer", "Prayer of St. Francis"
  readonly prayerText: string; // Full prayer text
  readonly funeralHomeName: string;
  readonly funeralHomePhone: string;
  [key: string]: unknown;
}

/**
 * Command to generate prayer card PDF
 */
export interface GeneratePrayerCardCommand {
  readonly templateBusinessKey: string; // e.g., 'classic-prayer-card-001'
  readonly data: MemorialPrayerCardData;
}

/**
 * Result of prayer card PDF generation
 */
export interface GeneratePrayerCardResult {
  readonly templateId: string;
  readonly templateName: string;
  readonly pdfBuffer: Buffer;
  readonly sizeBytes: number;
}

/**
 * Generate Prayer Card PDF Use Case
 * 
 * Complete pipeline:
 * 1. Fetch template from repository by businessKey (SCD2 current version)
 * 2. Populate template with data via Handlebars (TemplateRendererPort)
 * 3. Render HTML to PDF via Puppeteer with 4x6 dimensions (PdfGeneratorPort)
 * 4. Return PDF buffer with metadata
 * 
 * Prayer cards are typically 4x6 inches, designed for distribution at services.
 * 
 * Data flow:
 * TemplateRepository → MemorialTemplate (domain) 
 * → HandlebarsAdapter (HTML string) 
 * → PuppeteerAdapter (PDF buffer, 4x6 format)
 * 
 * Performance target: <800ms total (50ms DB + 10ms Handlebars + 250ms Puppeteer)
 * 
 * Error handling:
 * - Template not found → PersistenceError
 * - Template validation failed → TemplateRenderError
 * - PDF generation failed → PdfGenerationError
 * - Database error → PersistenceError
 * 
 * Dependencies:
 * - TemplateRepositoryPort: Fetch template from database
 * - TemplateRendererPort: Populate Handlebars template
 * - PdfGeneratorPort: Render HTML to PDF with Puppeteer
 */
export const generatePrayerCard = (command: GeneratePrayerCardCommand) =>
  Effect.gen(function* (_) {
    // 1. Fetch template from repository
    const templateRepo = yield* _(TemplateRepositoryPort);
    const template = yield* _(
      templateRepo.findCurrentByBusinessKey(command.templateBusinessKey)
    );

    if (!template) {
      return yield* _(
        Effect.fail(
          new PersistenceError(
            `Template not found: ${command.templateBusinessKey}`,
            undefined
          )
        )
      );
    }

    // Validate template is prayer card type
    if (template.metadata.category !== 'prayer_card') {
      return yield* _(
        Effect.fail(
          new PersistenceError(
            `Template ${command.templateBusinessKey} is not a prayer card (category: ${template.metadata.category})`,
            undefined
          )
        )
      );
    }

    // 2. Populate template with data via Handlebars
    const renderer = yield* _(TemplateRendererPort);
    const html = yield* _(renderer.applyData(template, command.data));

    // 3. Render HTML to PDF via Puppeteer with 4x6 dimensions
    const pdfGenerator = yield* _(PdfGeneratorPort);
    
    // Prayer cards are typically 4x6 inches
    const pdfOptions = {
      width: '4in',
      height: '6in',
      landscape: template.settings.orientation === 'landscape',
      printBackground: true,
      margin: {
        top: `${template.settings.margins.top}in`,
        right: `${template.settings.margins.right}in`,
        bottom: `${template.settings.margins.bottom}in`,
        left: `${template.settings.margins.left}in`,
      },
    };

    const pdfBuffer = yield* _(pdfGenerator.renderHtmlToPdf(html, pdfOptions));

    // 4. Return result with metadata
    return {
      templateId: template.metadata.id,
      templateName: template.metadata.name,
      pdfBuffer,
      sizeBytes: pdfBuffer.length,
    } satisfies GeneratePrayerCardResult;
  });

/**
 * Generate Prayer Card PDF Use Case (with dependencies)
 * 
 * Type signature shows all required dependencies via Effect Context
 */
export type GeneratePrayerCard = Effect.Effect<
  GeneratePrayerCardResult,
  PersistenceError | PdfGenerationError,
  | typeof TemplateRepositoryPort
  | typeof TemplateRendererPort
  | typeof PdfGeneratorPort
>;
