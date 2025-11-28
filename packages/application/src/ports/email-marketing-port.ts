import { Effect, Context } from 'effect';
import { EmailError } from './email-port';

// Re-export for convenience
export { EmailError };

/**
 * Email Marketing Service port
 * Defines interface for email campaign operations
 */
export interface EmailMarketingServicePort {
  /**
   * Send single email
   */
  readonly sendEmail: (params: {
    to: string;
    from?: string;
    fromName?: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }) => Effect.Effect<{ messageId: string }, EmailError>;
  
  /**
   * Send bulk email (for campaigns)
   */
  readonly sendBulkEmail: (params: {
    recipients: readonly string[];
    from?: string;
    fromName?: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }) => Effect.Effect<{ successCount: number; failureCount: number }, EmailError>;
  
  /**
   * Track email open
   */
  readonly trackOpen: (messageId: string) => Effect.Effect<void, EmailError>;
  
  /**
   * Track link click
   */
  readonly trackClick: (messageId: string, linkUrl: string) => Effect.Effect<void, EmailError>;
}

/**
 * Email Marketing Service tag for dependency injection
 */
export const EmailMarketingService = Context.GenericTag<EmailMarketingServicePort>('@dykstra/EmailMarketingService');
