import puppeteer, { type Browser, type PDFOptions } from 'puppeteer';
import { createPool, type Pool } from 'generic-pool';
import { Effect } from 'effect';
import {
  type PdfGeneratorPortService,
  type PdfFormatOptions,
  PdfGenerationError,
} from '@dykstra/application';

/**
 * Browser pool for Puppeteer instances
 * 
 * Reuses browser instances to avoid expensive launch/teardown operations.
 * Max 2 concurrent browsers to balance performance vs memory usage.
 */
let browserPool: Pool<Browser> | null = null;

/**
 * Initialize browser pool (lazy initialization)
 */
const initBrowserPool = (): Pool<Browser> => {
  if (browserPool) return browserPool;

  browserPool = createPool(
    {
      create: async () => {
        return await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Overcome limited resource problems
            '--disable-gpu',
          ],
        });
      },
      destroy: async (browser) => {
        await browser.close();
      },
    },
    {
      max: 2, // Maximum 2 browser instances
      min: 0, // No minimum (lazy creation)
      idleTimeoutMillis: 30000, // Close idle browsers after 30s
      acquireTimeoutMillis: 10000, // Fail fast if pool exhausted
    }
  );

  return browserPool;
};

/**
 * Map PdfFormatOptions to Puppeteer PDFOptions
 */
const mapToPuppeteerOptions = (options?: PdfFormatOptions): PDFOptions => {
  const defaults: PDFOptions = {
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in',
    },
  };

  if (!options) return defaults;

  return {
    format: options.format,
    landscape: options.landscape,
    printBackground: options.printBackground ?? true,
    margin: options.margin
      ? {
          top: options.margin.top,
          right: options.margin.right,
          bottom: options.margin.bottom,
          left: options.margin.left,
        }
      : defaults.margin,
    width: options.width,
    height: options.height,
    displayHeaderFooter: options.displayHeaderFooter,
    headerTemplate: options.headerTemplate,
    footerTemplate: options.footerTemplate,
    scale: options.scale,
  };
};

/**
 * Puppeteer Adapter
 * 
 * Implements PdfGeneratorPort using Puppeteer/Chromium.
 * 
 * Architecture notes:
 * - Object-based implementation (NOT class-based) per ARCHITECTURE.md
 * - Browser pool for performance (avoid repeated launches)
 * - Graceful cleanup with pool draining
 * 
 * Performance:
 * - First call: ~500ms (browser launch + render)
 * - Subsequent calls: ~200-300ms (render only)
 * - Memory: ~50-100MB per browser instance
 * 
 * Error handling:
 * - Browser launch failures → PdfGenerationError
 * - Render failures → PdfGenerationError
 * - Pool exhaustion → PdfGenerationError (acquire timeout)
 */
export const PuppeteerAdapter: PdfGeneratorPortService = {
  renderHtmlToPdf: (html, options) =>
    Effect.tryPromise({
      try: async () => {
        const pool = initBrowserPool();
        let browser: Browser | null = null;

        try {
          // Acquire browser from pool
          browser = await pool.acquire();

          // Create new page
          const page = await browser.newPage();

          try {
            // Set content and wait for rendering
            await page.setContent(html, {
              waitUntil: 'networkidle0', // Wait for network to be idle
            });

            // Generate PDF
            const pdfOptions = mapToPuppeteerOptions(options);
            const pdfBuffer = await page.pdf(pdfOptions);

            return Buffer.from(pdfBuffer);
          } finally {
            // Always close the page
            await page.close();
          }
        } finally {
          // Always return browser to pool
          if (browser) {
            await pool.release(browser);
          }
        }
      },
      catch: (error) =>
        new PdfGenerationError(
          error instanceof Error
            ? `Puppeteer PDF generation failed: ${error.message}`
            : 'Unknown Puppeteer error',
          error
        ),
    }),

  cleanup: () =>
    Effect.promise(async () => {
      if (browserPool) {
        try {
          await browserPool.drain(); // Wait for active operations
          await browserPool.clear(); // Close all browsers
        } catch {
          // Swallow cleanup errors - best effort
        } finally {
          browserPool = null;
        }
      }
    }),
};
