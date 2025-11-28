import { Effect } from 'effect';
import {
  type EmailSyncServicePort,
  EmailSyncService,
  EmailSyncError,
  type OAuthToken,
  type EmailSyncResult,
} from '../../ports/email-sync-port';

/**
 * Sync emails command
 */
export interface SyncUserEmailsCommand {
  readonly userId: string;
  readonly funeralHomeId: string;
  readonly provider: 'microsoft' | 'google';
  readonly since?: Date;
  readonly maxResults?: number;
}

/**
 * Sync user's emails from their email provider
 * 
 * This is a STUB implementation since adapters are stubs.
 * In production, this would:
 * 1. Get user's OAuth token from database
 * 2. Check if token is expired, refresh if needed
 * 3. Call provider adapter to sync emails
 * 4. Match each email to Contact/Lead/Case
 * 5. Save emails to database
 * 6. Update last sync timestamp
 * 
 * PRODUCTION TODO:
 * - Add OAuthTokenRepository to fetch/update tokens
 * - Add EmailRepository to save synced emails
 * - Add matchEmailToEntity use case integration
 * - Add error handling for rate limits
 * - Add webhook support for real-time sync
 */
export const syncUserEmails = (
  command: SyncUserEmailsCommand
): Effect.Effect<
  EmailSyncResult,
  EmailSyncError,
  EmailSyncServicePort
> =>
  Effect.gen(function* () {
    const emailSync = yield* EmailSyncService;
    
    // STUB: In production, fetch from OAuthTokenRepository
    const stubToken: OAuthToken = {
      provider: command.provider,
      accessToken: 'stub-token',
      refreshToken: 'stub-refresh',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      scope: 'mail.read mail.send',
    };
    
    // Check if token expired (production would refresh)
    if (stubToken.expiresAt < new Date()) {
      console.warn('[STUB] Token expired, would refresh in production');
      // In production: yield* emailSync.refreshToken(stubToken)
    }
    
    // Sync emails from provider
    const result = yield* emailSync.syncEmails({
      userId: command.userId,
      funeralHomeId: command.funeralHomeId,
      token: stubToken,
      since: command.since,
      maxResults: command.maxResults,
    });
    
    // PRODUCTION TODO: For each synced email:
    // 1. Match to Contact/Lead/Case using matchEmailToEntity
    // 2. Create Email entity
    // 3. Save via EmailRepository
    // 4. Update links if match found
    
    console.log(`[STUB] Synced ${result.syncedCount} emails for user ${command.userId}`);
    
    return result;
  });

/**
 * Get email provider for user
 * 
 * PRODUCTION: Would query OAuthToken table by userId
 */
export function getUserEmailProvider(
  _userId: string
): Effect.Effect<'microsoft' | 'google' | null, EmailSyncError> {
  // STUB: Return null since no tokens exist yet
  return Effect.succeed(null);
}
