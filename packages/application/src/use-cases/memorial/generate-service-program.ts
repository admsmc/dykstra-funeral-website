import { Effect } from 'effect';
import { TemplateRepositoryPort } from '../../ports/template-repository-port';
import { TemplateRendererPort } from '../../ports/template-renderer-port';
import { PdfGeneratorPort, type PdfGenerationError } from '../../ports/pdf-generator-port';
import { PersistenceError } from '../../ports/case-repository';

/**
 * Service Program Data
 * 
 * Data needed to populate a service program template
 */
export interface ServiceProgramData {
  readonly deceasedName: string;
  readonly birthDate: string; // Formatted date string
  readonly deathDate: string; // Formatted date string
  readonly photoUrl?: string;
  readonly orderOfService: ReadonlyArray<{
    readonly item: string;
    readonly officiant?: string;
  }>;
  readonly obituary?: string;
  readonly pallbearers?: ReadonlyArray<string>;
  readonly funeralHomeName: string;
  readonly funeralHomeAddress: string;
  readonly funeralHomePhone: string;
  [key: string]: unknown;
}

/**
 * Command to generate service program PDF
 */
export interface GenerateServiceProgramCommand {
  readonly templateBusinessKey: string; // e.g., 'classic-program-001'
  readonly data: ServiceProgramData;
}

/**
 * Result of service program PDF generation
 */
export interface GenerateServiceProgramResult {
  readonly templateId: string;
  readonly templateName: string;
  readonly pdfBuffer: Buffer;
  readonly sizeBytes: number;
}

/**
 * Generate Service Program PDF Use Case
 * 
 * Complete pipeline:
 * 1. Fetch template from repository by businessKey (SCD2 current version)
 * 2. Populate template with data via Handlebars (TemplateRendererPort)
 * 3. Render HTML to PDF via Puppeteer (PdfGeneratorPort)
 * 4. Return PDF buffer with metadata
 * 
 * Data flow:
 * TemplateRepository → MemorialTemplate (domain) 
 * → HandlebarsAdapter (HTML string) 
 * → PuppeteerAdapter (PDF buffer)
 * 
 * Performance target: <1s total (50ms DB + 10ms Handlebars + 300ms Puppeteer)
 * 
 * Error handling:
 * - Template not found → NotFoundError
 * - Template validation failed → TemplateRenderError
 * - PDF generation failed → PdfGenerationError
 * - Database error → PersistenceError
 * 
 * Dependencies:
 * - TemplateRepositoryPort: Fetch template from database
 * - TemplateRendererPort: Populate Handlebars template
 * - PdfGeneratorPort: Render HTML to PDF with Puppeteer
 */
export const generateServiceProgram = (command: GenerateServiceProgramCommand) =>
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

    // Validate template is service program type
    if (template.metadata.category !== 'service_program') {
      return yield* _(
        Effect.fail(
          new PersistenceError(
            `Template ${command.templateBusinessKey} is not a service program (category: ${template.metadata.category})`,
            undefined
          )
        )
      );
    }

    // 2. Populate template with data via Handlebars
    const renderer = yield* _(TemplateRendererPort);
    const html = yield* _(renderer.applyData(template, command.data));

    // 3. Render HTML to PDF via Puppeteer
    const pdfGenerator = yield* _(PdfGeneratorPort);
    
    // Map template settings to PDF options
    const pdfOptions = {
      format: (template.settings.pageSize === '4x6' || template.settings.pageSize === '5x7'
        ? undefined
        : (template.settings.pageSize.charAt(0).toUpperCase() + template.settings.pageSize.slice(1))) as 'Letter' | 'Legal' | 'A4' | undefined,
      landscape: template.settings.orientation === 'landscape',
      printBackground: true,
      margin: {
        top: `${template.settings.margins.top}in`,
        right: `${template.settings.margins.right}in`,
        bottom: `${template.settings.margins.bottom}in`,
        left: `${template.settings.margins.left}in`,
      },
      ...(template.settings.pageSize === '4x6' && {
        width: '4in',
        height: '6in',
      }),
      ...(template.settings.pageSize === '5x7' && {
        width: '5in',
        height: '7in',
      }),
    };

    const pdfBuffer = yield* _(pdfGenerator.renderHtmlToPdf(html, pdfOptions));

    // 4. Return result with metadata
    return {
      templateId: template.metadata.id,
      templateName: template.metadata.name,
      pdfBuffer,
      sizeBytes: pdfBuffer.length,
    } satisfies GenerateServiceProgramResult;
  });

/**
 * Generate Service Program PDF Use Case (with dependencies)
 * 
 * Type signature shows all required dependencies via Effect Context
 */
export type GenerateServiceProgram = Effect.Effect<
  GenerateServiceProgramResult,
  PersistenceError | PdfGenerationError,
  | typeof TemplateRepositoryPort
  | typeof TemplateRendererPort
  | typeof PdfGeneratorPort
>;
