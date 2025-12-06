import { type Effect, Context, Data } from 'effect';
import type { MemorialTemplate } from '@dykstra/domain';

/**
 * Template Renderer Port
 * 
 * Abstraction for rendering Handlebars templates with data binding.
 * Used to populate memorial templates with family/service data before PDF generation.
 */

/**
 * Error class for template rendering failures
 */
export class TemplateRenderError extends Data.TaggedError('TemplateRenderError')<{
  readonly message: string;
  readonly templateId?: string;
  readonly cause?: unknown;
}> {}

/**
 * Template Renderer Port Service Interface
 * 
 * Applies data bindings to template HTML structure using CSS selectors.
 */
export interface TemplateRendererPortService {
  /**
   * Apply data to template
   * 
   * Backend operation:
   * 1. Loads template HTML structure
   * 2. Resolves data bindings (CSS selectors → data values)
   * 3. Applies data to HTML using Cheerio/DOM manipulation
   * 4. Handles arrays (order of service), images, text
   * 5. Returns populated HTML string
   * 
   * @param template - Memorial template with data bindings
   * @param data - Key-value pairs to bind to template
   * @returns Populated HTML string ready for Puppeteer
   * 
   * @example
   * ```typescript
   * const renderer = yield* TemplateRendererPort;
   * const html = yield* renderer.applyData(template, {
   *   decedentName: 'John Smith',
   *   coverPhoto: 'https://...',
   *   obituary: '...',
   *   orderOfService: [
   *     { title: 'Opening Prayer', performedBy: '...' }
   *   ]
   * });
   * ```
   */
  readonly applyData: (
    template: MemorialTemplate,
    data: Record<string, unknown>
  ) => Effect.Effect<string, TemplateRenderError>;

  /**
   * Validate template bindings
   * 
   * Backend operation:
   * 1. Extracts all data-bind attributes from template
   * 2. Checks if all required bindings are present in data
   * 3. Returns list of missing bindings
   * 
   * @param template - Template to validate
   * @param data - Data to validate against
   * @returns Array of missing binding keys (empty if all present)
   */
  readonly validateBindings: (
    template: MemorialTemplate,
    data: Record<string, unknown>
  ) => Effect.Effect<string[], TemplateRenderError>;
}

/**
 * Template Renderer Port Context Tag
 * 
 * Usage in use cases:
 * ```typescript
 * const renderer = yield* TemplateRendererPort;
 * const html = yield* renderer.applyData(template, data);
 * ```
 */
export const TemplateRendererPort = Context.GenericTag<TemplateRendererPortService>(
  '@dykstra/TemplateRendererPort'
);
