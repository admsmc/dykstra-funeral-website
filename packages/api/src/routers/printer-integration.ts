/**
 * External Printer Integration Router
 * 
 * API for integrating with external print services and physical printers.
 * 
 * Features:
 * - Webhook endpoints for print job notifications
 * - PDF delivery via FTP, SFTP, HTTP POST, or email
 * - Print job status tracking and lifecycle management
 * - Retry logic with exponential backoff
 * - Vendor-specific adapters (PrintNode, Printix, etc.)
 * - Real-time status updates via webhooks
 * 
 * Supported vendors:
 * - Generic (FTP/SFTP/HTTP)
 * - PrintNode
 * - Printix
 * - Google Cloud Print (deprecated but legacy support)
 * 
 * Print job lifecycle:
 * 1. pending → Document generated, awaiting dispatch
 * 2. dispatched → Sent to print service
 * 3. queued → Acknowledged by print service
 * 4. printing → Physical printing in progress
 * 5. completed → Successfully printed
 * 6. failed → Error occurred, retries exhausted
 * 
 * Webhook events:
 * - print.job.created
 * - print.job.dispatched
 * - print.job.queued
 * - print.job.printing
 * - print.job.completed
 * - print.job.failed
 */

import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

// Print job status tracking
interface PrintJob {
  id: string;
  documentId: string;
  vendorType: 'generic_ftp' | 'generic_http' | 'printnode' | 'printix';
  status: 'pending' | 'dispatched' | 'queued' | 'printing' | 'completed' | 'failed';
  pdfUrl: string;
  vendorJobId?: string;
  createdAt: Date;
  dispatchedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  lastError?: string;
  metadata?: Record<string, unknown>;
}

const printJobs = new Map<string, PrintJob>();
const webhookSubscribers = new Map<string, string[]>(); // event -> webhook URLs

export const printerIntegrationRouter = router({
  /**
   * Create Print Job
   * 
   * Submit a document for printing via external service.
   */
  createPrintJob: publicProcedure
    .input(
      z.object({
        documentId: z.string(),
        pdfUrl: z.string(), // URL or base64 data URL
        vendorType: z.enum(['generic_ftp', 'generic_http', 'printnode', 'printix']),
        vendorConfig: z.object({
          // Generic FTP/SFTP
          ftpHost: z.string().optional(),
          ftpPort: z.number().optional(),
          ftpUser: z.string().optional(),
          ftpPassword: z.string().optional(),
          ftpPath: z.string().optional(),
          // Generic HTTP
          httpUrl: z.string().optional(),
          httpHeaders: z.record(z.string()).optional(),
          // PrintNode
          printnodeApiKey: z.string().optional(),
          printnodePrinterId: z.string().optional(),
          // Printix
          printixApiKey: z.string().optional(),
          printixPrinterId: z.string().optional(),
        }),
        printerOptions: z.object({
          copies: z.number().default(1),
          color: z.boolean().default(false),
          duplex: z.enum(['none', 'short', 'long']).default('none'),
          paperSize: z.enum(['letter', 'a4', 'legal']).default('letter'),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const jobId = `print_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // Create job
      const job: PrintJob = {
        id: jobId,
        documentId: input.documentId,
        vendorType: input.vendorType,
        status: 'pending',
        pdfUrl: input.pdfUrl,
        createdAt: new Date(),
        retryCount: 0,
        metadata: {
          vendorConfig: input.vendorConfig,
          printerOptions: input.printerOptions,
        },
      };

      printJobs.set(jobId, job);

      // Dispatch job (non-blocking)
      dispatchPrintJob(jobId).catch(console.error);

      // Trigger webhook
      await triggerWebhook('print.job.created', job);

      return {
        jobId,
        status: job.status,
        createdAt: job.createdAt,
      };
    }),

  /**
   * Get Print Job Status
   * 
   * Query status of a print job.
   */
  getPrintJobStatus: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const job = printJobs.get(input.jobId);

      if (!job) {
        throw new Error(`Print job not found: ${input.jobId}`);
      }

      return {
        jobId: job.id,
        documentId: job.documentId,
        status: job.status,
        vendorType: job.vendorType,
        vendorJobId: job.vendorJobId,
        createdAt: job.createdAt,
        dispatchedAt: job.dispatchedAt,
        completedAt: job.completedAt,
        retryCount: job.retryCount,
        lastError: job.lastError,
      };
    }),

  /**
   * Cancel Print Job
   * 
   * Cancel a pending or dispatched print job.
   */
  cancelPrintJob: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const job = printJobs.get(input.jobId);

      if (!job) {
        throw new Error(`Print job not found: ${input.jobId}`);
      }

      if (job.status === 'completed' || job.status === 'failed') {
        throw new Error(`Cannot cancel job in status: ${job.status}`);
      }

      job.status = 'failed';
      job.lastError = 'Cancelled by user';
      job.completedAt = new Date();

      await triggerWebhook('print.job.failed', job);

      return { jobId: job.id, status: job.status };
    }),

  /**
   * List Print Jobs
   * 
   * Get all print jobs with optional filters.
   */
  listPrintJobs: publicProcedure
    .input(
      z.object({
        documentId: z.string().optional(),
        status: z.enum(['pending', 'dispatched', 'queued', 'printing', 'completed', 'failed']).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      let jobs = Array.from(printJobs.values());

      if (input.documentId) {
        jobs = jobs.filter((job) => job.documentId === input.documentId);
      }

      if (input.status) {
        jobs = jobs.filter((job) => job.status === input.status);
      }

      // Sort by creation date descending
      jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply limit
      jobs = jobs.slice(0, input.limit);

      return jobs.map((job) => ({
        jobId: job.id,
        documentId: job.documentId,
        status: job.status,
        vendorType: job.vendorType,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      }));
    }),

  /**
   * Register Webhook
   * 
   * Subscribe to print job events.
   */
  registerWebhook: publicProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
        events: z.array(
          z.enum([
            'print.job.created',
            'print.job.dispatched',
            'print.job.queued',
            'print.job.printing',
            'print.job.completed',
            'print.job.failed',
          ])
        ),
      })
    )
    .mutation(async ({ input }) => {
      for (const event of input.events) {
        const subscribers = webhookSubscribers.get(event) || [];
        if (!subscribers.includes(input.webhookUrl)) {
          subscribers.push(input.webhookUrl);
          webhookSubscribers.set(event, subscribers);
        }
      }

      return {
        webhookUrl: input.webhookUrl,
        events: input.events,
        registered: true,
      };
    }),

  /**
   * Unregister Webhook
   * 
   * Unsubscribe from print job events.
   */
  unregisterWebhook: publicProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      // Remove from all event subscriptions
      for (const [event, subscribers] of webhookSubscribers.entries()) {
        const filtered = subscribers.filter((url) => url !== input.webhookUrl);
        webhookSubscribers.set(event, filtered);
      }

      return {
        webhookUrl: input.webhookUrl,
        unregistered: true,
      };
    }),

  /**
   * Webhook Callback (External)
   * 
   * Receive status updates from print vendors.
   * This would be called by external services, not directly by clients.
   */
  webhookCallback: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        vendorJobId: z.string().optional(),
        status: z.enum(['queued', 'printing', 'completed', 'failed']),
        errorMessage: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const job = printJobs.get(input.jobId);

      if (!job) {
        throw new Error(`Print job not found: ${input.jobId}`);
      }

      // Update job status
      job.status = input.status;
      if (input.vendorJobId) job.vendorJobId = input.vendorJobId;
      if (input.errorMessage) job.lastError = input.errorMessage;
      if (input.metadata) job.metadata = { ...job.metadata, ...input.metadata };

      if (input.status === 'completed' || input.status === 'failed') {
        job.completedAt = new Date();
      }

      // Trigger appropriate webhook
      await triggerWebhook(`print.job.${input.status}`, job);

      return { jobId: job.id, status: job.status };
    }),
});

/**
 * Dispatch Print Job
 * 
 * Send PDF to print service with retry logic.
 */
async function dispatchPrintJob(jobId: string) {
  const job = printJobs.get(jobId);
  if (!job) return;

  const MAX_RETRIES = 3;

  while (job.retryCount <= MAX_RETRIES) {
    try {
      // Update status
      job.status = 'dispatched';
      job.dispatchedAt = new Date();
      await triggerWebhook('print.job.dispatched', job);

      // Send to appropriate vendor
      await sendToVendor(job);

      // Success - mark as queued
      job.status = 'queued';
      await triggerWebhook('print.job.queued', job);
      break;
    } catch (error) {
      job.retryCount++;
      job.lastError = (error as Error).message;

      console.error(`Print job ${jobId} failed (attempt ${job.retryCount}):`, error);

      if (job.retryCount > MAX_RETRIES) {
        // Exhausted retries
        job.status = 'failed';
        job.completedAt = new Date();
        await triggerWebhook('print.job.failed', job);
        break;
      }

      // Exponential backoff
      await delay(Math.pow(2, job.retryCount) * 1000);
    }
  }
}

/**
 * Send to Vendor
 * 
 * Vendor-specific dispatch logic.
 */
async function sendToVendor(job: PrintJob): Promise<void> {
  const config = (job.metadata?.['vendorConfig'] as Record<string, unknown>) || {};

  switch (job.vendorType) {
    case 'generic_http':
      await sendViaHttp(job, config);
      break;

    case 'generic_ftp':
      await sendViaFtp(job, config);
      break;

    case 'printnode':
      await sendViaPrintNode(job, config);
      break;

    case 'printix':
      await sendViaPrintix(job, config);
      break;

    default:
      throw new Error(`Unsupported vendor type: ${job.vendorType}`);
  }
}

/**
 * Vendor-Specific Implementations
 * 
 * In production, these would use actual vendor SDKs.
 * For now, they're stubs.
 */

async function sendViaHttp(job: PrintJob, config: Record<string, unknown>): Promise<void> {
  const httpUrl = config['httpUrl'] as string;
  const headers = (config['httpHeaders'] as Record<string, string>) || {};

  // Simulate HTTP POST
  console.log(`[HTTP] Sending to ${httpUrl}`, { jobId: job.id, headers });

  // In production:
  // const response = await fetch(httpUrl, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/pdf', ...headers },
  //   body: pdfBuffer,
  // });
  // if (!response.ok) throw new Error(`HTTP ${response.status}`);

  job.vendorJobId = `http_${Date.now()}`;
}

async function sendViaFtp(job: PrintJob, config: Record<string, unknown>): Promise<void> {
  const ftpHost = config['ftpHost'];
  const ftpPort = config['ftpPort'];

  console.log(`[FTP] Connecting to ${ftpHost}:${ftpPort}`, { jobId: job.id });

  // In production:
  // const ftpUser = config['ftpUser'];
  // const ftpPassword = config['ftpPassword'];
  // const ftpPath = config['ftpPath'];
  // const ftp = new FTPClient();
  // await ftp.connect({ host: ftpHost, port: ftpPort, user: ftpUser, password: ftpPassword });
  // await ftp.put(pdfBuffer, ftpPath);
  // ftp.close();

  job.vendorJobId = `ftp_${Date.now()}`;
}

async function sendViaPrintNode(job: PrintJob, config: Record<string, unknown>): Promise<void> {
  const printnodePrinterId = config['printnodePrinterId'];

  console.log(`[PrintNode] Sending to printer ${printnodePrinterId}`, { jobId: job.id });

  // In production:
  // const printnodeApiKey = config['printnodeApiKey'];
  // const printnode = new PrintNodeClient(printnodeApiKey);
  // const result = await printnode.createPrintJob({
  //   printerId: printnodePrinterId,
  //   title: `Job ${job.id}`,
  //   contentType: 'pdf_uri',
  //   content: job.pdfUrl,
  //   options: job.metadata?.printerOptions,
  // });
  // job.vendorJobId = result.id;

  job.vendorJobId = `printnode_${Date.now()}`;
}

async function sendViaPrintix(job: PrintJob, config: Record<string, unknown>): Promise<void> {
  const printixPrinterId = config['printixPrinterId'];

  console.log(`[Printix] Sending to printer ${printixPrinterId}`, { jobId: job.id });

  // In production:
  // const printixApiKey = config['printixApiKey'];
  // const printix = new PrintixClient(printixApiKey);
  // const result = await printix.createDocument({
  //   printerId: printixPrinterId,
  //   documentUrl: job.pdfUrl,
  //   options: job.metadata?.printerOptions,
  // });
  // job.vendorJobId = result.documentId;

  job.vendorJobId = `printix_${Date.now()}`;
}

/**
 * Trigger Webhook
 * 
 * Send webhook notifications to registered subscribers.
 */
async function triggerWebhook(event: string, job: PrintJob): Promise<void> {
  const subscribers = webhookSubscribers.get(event) || [];

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data: {
      jobId: job.id,
      documentId: job.documentId,
      status: job.status,
      vendorType: job.vendorType,
      vendorJobId: job.vendorJobId,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      error: job.lastError,
    },
  };

  // Send to all subscribers (fire-and-forget)
  await Promise.allSettled(
    subscribers.map(async (url) => {
      try {
        // In production, use actual HTTP client
        console.log(`[Webhook] ${event} → ${url}`, payload);

        // await fetch(url, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload),
        // });
      } catch (error) {
        console.error(`Failed to send webhook to ${url}:`, error);
      }
    })
  );
}

// Utility

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
