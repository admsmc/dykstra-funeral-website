import { Effect } from 'effect';
import { Context } from 'effect';

/**
 * PDF generation error
 */
export class PdfGenerationError {
  readonly _tag = 'PdfGenerationError';
  constructor(
    readonly message: string,
    readonly cause?: unknown
  ) {}
}

/**
 * PDF format options
 */
export interface PdfFormatOptions {
  /**
   * Paper format (default: 'Letter')
   */
  readonly format?: 'Letter' | 'Legal' | 'A4' | 'A5';
  
  /**
   * Page orientation (default: 'portrait')
   */
  readonly landscape?: boolean;
  
  /**
   * Print background graphics (default: true)
   */
  readonly printBackground?: boolean;
  
  /**
   * Page margins (default: minimal)
   */
  readonly margin?: {
    readonly top?: string;
    readonly right?: string;
    readonly bottom?: string;
    readonly left?: string;
  };
  
  /**
   * Custom page size (overrides format)
   */
  readonly width?: string;
  readonly height?: string;
  
  /**
   * Display header and footer (default: false)
   */
  readonly displayHeaderFooter?: boolean;
  
  /**
   * HTML template for header
   */
  readonly headerTemplate?: string;
  
  /**
   * HTML template for footer
   */
  readonly footerTemplate?: string;
  
  /**
   * Scale of the webpage rendering (default: 1)
   */
  readonly scale?: number;
}

/**
 * PDF Generator Port
 * 
 * Converts HTML/CSS to PDF using Chromium (Puppeteer).
 * Suitable for complex layouts, memorial materials, and templated documents.
 * 
 * Use cases:
 * - Service programs (multi-page, photos, complex layouts)
 * - Prayer cards (small format, custom dimensions)
 * - Memorial folders (bifold/trifold layouts)
 * - Custom template-based documents
 * 
 * NOT suitable for:
 * - Business documents (invoices, POs) - use DocumentGeneratorPort (React-PDF) instead
 * - Simple documents that don't need Chromium rendering
 * 
 * Performance characteristics:
 * - Browser pool initialization: ~500ms (one-time)
 * - Per-PDF generation: 200-500ms (includes rendering + conversion)
 * - Memory overhead: ~50-100MB per browser instance
 * 
 * Implementation notes:
 * - Uses browser pool (max 2 instances) to avoid repeated browser launches
 * - Graceful cleanup on application shutdown
 * - HTML must be complete, valid documents
 * - CSS supports print media queries
 */
export interface PdfGeneratorPortService {
  /**
   * Render HTML to PDF
   * 
   * @param html - Complete HTML document with inline CSS or <style> tags
   * @param options - PDF format options (paper size, margins, etc.)
   * @returns PDF buffer
   * 
   * @example
   * ```typescript
   * const html = `
   *   <!DOCTYPE html>
   *   <html>
   *     <head>
   *       <style>
   *         body { font-family: serif; margin: 0; padding: 20mm; }
   *         h1 { text-align: center; }
   *       </style>
   *     </head>
   *     <body>
   *       <h1>Service Program</h1>
   *       <p>In loving memory...</p>
   *     </body>
   *   </html>
   * `;
   * 
   * const pdf = yield* _(
   *   pdfGenerator.renderHtmlToPdf(html, {
   *     format: 'Letter',
   *     printBackground: true,
   *     margin: { top: '0.5in', bottom: '0.5in' },
   *   })
   * );
   * ```
   */
  renderHtmlToPdf: (
    html: string,
    options?: PdfFormatOptions
  ) => Effect.Effect<Buffer, PdfGenerationError, never>;
  
  /**
   * Cleanup browser pool and release resources
   * 
   * Should be called on application shutdown.
   * Effect-based for graceful error handling.
   */
  cleanup: () => Effect.Effect<void, never, never>;
}

/**
 * PdfGeneratorPort Context Tag
 */
export const PdfGeneratorPort = Context.GenericTag<PdfGeneratorPortService>(
  '@dykstra/PdfGeneratorPort'
);
