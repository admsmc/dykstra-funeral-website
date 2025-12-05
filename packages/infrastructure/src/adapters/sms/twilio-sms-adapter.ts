import { Effect, Layer } from 'effect';
import { SMSService, type SMSServicePort, SMSError } from '@dykstra/application';

// Lazy load Twilio to avoid initialization errors when env vars aren't set
let twilioClient: any = null;

const initTwilio = async () => {
  if (!twilioClient) {
    try {
      const twilio = await import('twilio');
      const accountSid = process.env['TWILIO_ACCOUNT_SID'];
      const authToken = process.env['TWILIO_AUTH_TOKEN'];
      
      if (accountSid && authToken) {
        twilioClient = twilio.default(accountSid, authToken);
      } else {
        // Mock implementation for development when Twilio credentials aren't set
        console.warn('Twilio credentials not configured - using mock SMS service');
        twilioClient = {
          messages: {
            create: async (params: any) => ({
              sid: `mock-sms-${Date.now()}`,
              status: 'sent',
              to: params.to,
              from: params.from,
              body: params.body,
            }),
            fetch: async (sid: string) => ({
              sid,
              status: 'delivered',
            }),
          },
        };
      }
    } catch (error) {
      // Twilio not installed - return mock implementation
      console.warn('Twilio SDK not available:', error);
      twilioClient = {
        messages: {
          create: async (params: any) => ({
            sid: `mock-sms-${Date.now()}`,
            status: 'sent',
            to: params.to,
            from: params.from,
            body: params.body,
          }),
          fetch: async (sid: string) => ({
            sid,
            status: 'delivered',
          }),
        },
      };
    }
  }
  return twilioClient;
};

/**
 * Twilio implementation of SMSService
 */
export const TwilioSMSAdapter: SMSServicePort = {
  sendSMS: (params) =>
    Effect.tryPromise({
      try: async () => {
        const client = await initTwilio();
        
        if (!process.env['TWILIO_ACCOUNT_SID'] || !process.env['TWILIO_AUTH_TOKEN']) {
          console.warn('Twilio credentials not configured - SMS not sent');
        }

        const fromNumber = params.from || process.env['TWILIO_PHONE_NUMBER'] || '+15555555555';

        const message = await client.messages.create({
          to: params.to,
          from: fromNumber,
          body: params.body,
        });

        return { messageId: message.sid };
      },
      catch: (error) => new SMSError('Failed to send SMS', error),
    }),

  sendBulkSMS: (params) =>
    Effect.tryPromise({
      try: async () => {
        const client = await initTwilio();
        
        if (!process.env['TWILIO_ACCOUNT_SID'] || !process.env['TWILIO_AUTH_TOKEN']) {
          console.warn('Twilio credentials not configured - SMS not sent');
        }

        if (params.recipients.length === 0) {
          return { successCount: 0, failureCount: 0 };
        }

        const fromNumber = params.from || process.env['TWILIO_PHONE_NUMBER'] || '+15555555555';

        let successCount = 0;
        let failureCount = 0;

        // Twilio doesn't have true bulk send - send individually
        // In production, consider using Twilio Messaging Services for better throughput
        for (const recipient of params.recipients) {
          try {
            await client.messages.create({
              to: recipient,
              from: fromNumber,
              body: params.body,
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to send SMS to ${recipient}:`, error);
            failureCount++;
          }
        }

        return { successCount, failureCount };
      },
      catch: (error) => new SMSError('Failed to send bulk SMS', error),
    }),

  trackDelivery: (messageId) =>
    Effect.tryPromise({
      try: async () => {
        const client = await initTwilio();
        
        const message = await client.messages(messageId).fetch();
        
        // Map Twilio status to our standardized status
        const statusMap: Record<string, 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered'> = {
          'queued': 'queued',
          'accepted': 'queued',
          'sending': 'sent',
          'sent': 'sent',
          'delivered': 'delivered',
          'failed': 'failed',
          'undelivered': 'undelivered',
        };

        return {
          status: statusMap[message.status] || 'failed',
          errorMessage: message.errorMessage || undefined,
        };
      },
      catch: (error) => new SMSError('Failed to track SMS delivery', error),
    }),
};

/**
 * Layer for dependency injection
 */
export const TwilioSMSAdapterLive = Layer.succeed(
  SMSService,
  TwilioSMSAdapter
);
