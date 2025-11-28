import { Effect, Context } from 'effect';

/**
 * SMS Error
 */
export class SMSError extends Error {
  readonly _tag = 'SMSError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * SMS Service port
 * Defines interface for SMS operations
 */
export interface SMSServicePort {
  /**
   * Send single SMS
   */
  readonly sendSMS: (params: {
    to: string;
    from?: string;
    body: string;
  }) => Effect.Effect<{ messageId: string }, SMSError>;
  
  /**
   * Send bulk SMS (for campaigns)
   */
  readonly sendBulkSMS: (params: {
    recipients: readonly string[];
    from?: string;
    body: string;
  }) => Effect.Effect<{ successCount: number; failureCount: number }, SMSError>;
  
  /**
   * Track SMS delivery status
   */
  readonly trackDelivery: (messageId: string) => Effect.Effect<{
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
    errorMessage?: string;
  }, SMSError>;
}

/**
 * SMS Service tag for dependency injection
 */
export const SMSService = Context.GenericTag<SMSServicePort>('@dykstra/SMSService');
