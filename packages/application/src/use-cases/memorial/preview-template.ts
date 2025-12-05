import { Effect } from 'effect';
import { TemplateRepositoryPort } from '../../ports/template-repository-port';
import { TemplateRendererPort } from '../../ports/template-renderer-port';
import { PersistenceError } from '../../ports/case-repository';

/**
 * Preview Template Command
 * 
 * Command to preview a template with sample data
 */
export interface PreviewTemplateCommand {
  readonly templateBusinessKey: string;
  readonly sampleData: Record<string, unknown>;
}

/**
 * Preview Template Result
 * 
 * Returns populated HTML for browser preview
 */
export interface PreviewTemplateResult {
  readonly templateId: string;
  readonly templateName: string;
  readonly templateCategory: string;
  readonly html: string;
  readonly sizeBytes: number;
}

/**
 * Preview Template Use Case
 * 
 * Generates HTML preview of a template with sample data.
 * Useful for:
 * - Template editing interface
 * - Visual template selection
 * - Testing template changes before publishing
 * 
 * Pipeline:
 * 1. Fetch template from repository by businessKey (SCD2 current version)
 * 2. Populate template with sample data via Handlebars
 * 3. Return HTML string (no PDF generation)
 * 
 * Performance target: <100ms (50ms DB + 10ms Handlebars)
 * 
 * Error handling:
 * - Template not found → PersistenceError
 * - Template validation failed → TemplateRenderError
 * - Database error → PersistenceError
 * 
 * Dependencies:
 * - TemplateRepositoryPort: Fetch template from database
 * - TemplateRendererPort: Populate Handlebars template
 */
export const previewTemplate = (command: PreviewTemplateCommand) =>
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

    // 2. Populate template with sample data via Handlebars
    const renderer = yield* _(TemplateRendererPort);
    const html = yield* _(renderer.applyData(template, command.sampleData));

    // 3. Return HTML preview
    return {
      templateId: template.metadata.id,
      templateName: template.metadata.name,
      templateCategory: template.metadata.category,
      html,
      sizeBytes: Buffer.byteLength(html, 'utf8'),
    } satisfies PreviewTemplateResult;
  });

/**
 * Preview Template Use Case (with dependencies)
 * 
 * Type signature shows all required dependencies via Effect Context
 */
export type PreviewTemplate = Effect.Effect<
  PreviewTemplateResult,
  PersistenceError,
  typeof TemplateRepositoryPort | typeof TemplateRendererPort
>;
