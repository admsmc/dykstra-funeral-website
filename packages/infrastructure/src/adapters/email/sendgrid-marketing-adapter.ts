import { Effect, Layer } from 'effect';
import { EmailMarketingService, type EmailMarketingServicePort, EmailError } from '@dykstra/application';

// Lazy load SendGrid to avoid initialization errors when env vars aren't set
let sgMail: any = null;

const initSendGrid = async () => {
  if (!sgMail) {
    try {
      const sendgrid = await import('@sendgrid/mail');
      sgMail = sendgrid.default || sendgrid;
      const apiKey = process.env['SENDGRID_API_KEY'];
      if (apiKey) {
        sgMail.setApiKey(apiKey);
      }
    } catch (error) {
      // SendGrid not installed - return mock implementation for development
      console.warn('SendGrid not available:', error);
      sgMail = {
        setApiKey: () => {},
        send: async () => [{ headers: { 'x-message-id': 'mock-id' } }],
      };
    }
  }
  return sgMail;
};

/**
 * SendGrid implementation of EmailMarketingService
 */
export const SendGridMarketingAdapter: EmailMarketingServicePort = {
  sendEmail: (params) =>
    Effect.tryPromise({
      try: async () => {
        const sg = await initSendGrid();
        
        if (!process.env['SENDGRID_API_KEY']) {
          throw new Error('SENDGRID_API_KEY is not configured');
        }

        const result = await sg.send({
          to: params.to,
          from: {
            email: params.from || process.env['FROM_EMAIL'] || 'noreply@funeral.com',
            name: params.fromName || 'Funeral Home',
          },
          subject: params.subject,
          html: params.htmlBody,
          text: params.textBody,
        });

        return { messageId: result[0].headers['x-message-id'] as string };
      },
      catch: (error) => new EmailError('Failed to send email', error),
    }),

  sendBulkEmail: (params) =>
    Effect.tryPromise({
      try: async () => {
        const sg = await initSendGrid();
        
        if (!process.env['SENDGRID_API_KEY']) {
          throw new Error('SENDGRID_API_KEY is not configured');
        }

        if (params.recipients.length === 0) {
          return { successCount: 0, failureCount: 0 };
        }

        // SendGrid allows personalizations for bulk sending
        const messages = params.recipients.map(to => ({
          to,
          from: {
            email: params.from || process.env['FROM_EMAIL'] || 'noreply@funeral.com',
            name: params.fromName || 'Funeral Home',
          },
          subject: params.subject,
          html: params.htmlBody,
          text: params.textBody,
        }));

        try {
          // Send as batch (SendGrid handles up to 1000 at once)
          const results = await sg.send(messages);
          
          return {
            successCount: results.length,
            failureCount: 0,
          };
        } catch (_bulkError) {
          // If bulk send fails, try individual sends for more granular reporting
          let successCount = 0;
          let failureCount = 0;
          
          for (const message of messages) {
            try {
              await sg.send(message);
              successCount++;
            } catch {
              failureCount++;
            }
          }
          
          return { successCount, failureCount };
        }
      },
      catch: (error) => new EmailError('Failed to send bulk email', error),
    }),

  trackOpen: (messageId) =>
    Effect.sync(() => {
      // SendGrid tracks opens automatically with tracking pixels
      // This is a no-op as tracking happens server-side at SendGrid
      console.log(`Email opened: ${messageId}`);
    }),

  trackClick: (messageId, linkUrl) =>
    Effect.sync(() => {
      // SendGrid tracks clicks automatically by rewriting links
      // This is a no-op as tracking happens server-side at SendGrid
      console.log(`Email clicked: ${messageId}, link: ${linkUrl}`);
    }),
};

/**
 * Layer for dependency injection
 */
export const SendGridMarketingAdapterLive = Layer.succeed(
  EmailMarketingService,
  SendGridMarketingAdapter
);
