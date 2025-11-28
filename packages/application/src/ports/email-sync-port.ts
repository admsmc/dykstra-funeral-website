import { Effect, Context } from 'effect';
import type { Email, EmailId } from '@dykstra/domain';

/**
 * Email Sync Error
 */
export class EmailSyncError extends Error {
  readonly _tag = 'EmailSyncError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * OAuth provider type
 */
export type OAuthProvider = 'microsoft' | 'google';

/**
 * OAuth token for email provider
 */
export interface OAuthToken {
  readonly provider: OAuthProvider;
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly expiresAt: Date;
  readonly scope: string;
}

/**
 * Email sync result
 */
export interface EmailSyncResult {
  readonly syncedCount: number;
  readonly newCount: number;
  readonly errorCount: number;
  readonly lastSyncAt: Date;
}

/**
 * Send email parameters
 */
export interface SendEmailParams {
  readonly from: string;
  readonly to: readonly string[];
  readonly cc?: readonly string[];
  readonly bcc?: readonly string[];
  readonly subject: string;
  readonly body: string;
  readonly htmlBody?: string | null;
  readonly replyToEmailId?: EmailId | null;
}

/**
 * Email match result
 */
export interface EmailMatchResult {
  readonly contactId: string | null;
  readonly leadId: string | null;
  readonly caseId: string | null;
  readonly confidence: number; // 0-100
  readonly matchReason: string;
}

/**
 * Email Sync Service port
 * Defines interface for bi-directional email synchronization
 */
export interface EmailSyncServicePort {
  /**
   * Sync emails from provider for a user
   */
  readonly syncEmails: (params: {
    userId: string;
    funeralHomeId: string;
    token: OAuthToken;
    since?: Date;
    maxResults?: number;
  }) => Effect.Effect<EmailSyncResult, EmailSyncError>;

  /**
   * Send email via provider
   */
  readonly sendEmail: (params: {
    userId: string;
    token: OAuthToken;
    email: SendEmailParams;
  }) => Effect.Effect<{ messageId: string; externalId: string }, EmailSyncError>;

  /**
   * Match email address to CRM entities
   */
  readonly matchEmailToEntity: (
    emailAddress: string,
    funeralHomeId: string
  ) => Effect.Effect<EmailMatchResult, EmailSyncError>;

  /**
   * Get email thread by threadId
   */
  readonly getEmailThread: (
    threadId: string
  ) => Effect.Effect<readonly Email[], EmailSyncError>;

  /**
   * Mark email as read
   */
  readonly markAsRead: (
    emailId: EmailId,
    token: OAuthToken
  ) => Effect.Effect<void, EmailSyncError>;

  /**
   * Refresh OAuth token if expired
   */
  readonly refreshToken: (
    token: OAuthToken
  ) => Effect.Effect<OAuthToken, EmailSyncError>;
}

/**
 * Email Sync Service tag for dependency injection
 */
export const EmailSyncService = Context.GenericTag<EmailSyncServicePort>('@dykstra/EmailSyncService');
