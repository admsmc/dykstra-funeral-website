import { Effect } from 'effect';
import {
  type EmailSyncServicePort,
  EmailSyncService,
  EmailSyncError,
  type OAuthToken,
  type EmailSyncResult,
} from '../../ports/email-sync-port';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../ports/email-calendar-sync-policy-repository';

/**
 * Sync User Emails
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: EmailCalendarSyncPolicy
 * Persisted In: In-memory (Prisma in production)
 * Go Backend: NO
 * Per-Funeral-Home: YES (policy-driven sync frequency, retry logic per funeral home)
 * Test Coverage: 5 tests (STANDARD, STRICT, PERMISSIVE policies)
 * Last Updated: Phase 2.9-2.13
 *
 * Policy-Driven Configuration:
 * - Email sync frequency (5-1440 minutes) per funeral home
 * - Max retries (1-10) per funeral home
 * - Retry delay (1-60 seconds) per funeral home
 * - Email matching strategy (exact/fuzzy/domain) per funeral home
 * - Fallback strategies for matching per funeral home
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
  EmailSyncError | Error,
  EmailSyncServicePort | EmailCalendarSyncPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const emailSync = yield* EmailSyncService;
    const policyRepo = yield* EmailCalendarSyncPolicyRepository;

    // Load policy for this funeral home
    const policy = yield* policyRepo.findCurrentByFuneralHomeId(command.funeralHomeId);
    
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
    
    // Sync emails from provider using policy-driven retry configuration
    let result: EmailSyncResult | null = null;
    let lastError: EmailSyncError | null = null;
    
    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        result = yield* emailSync.syncEmails({
          userId: command.userId,
          funeralHomeId: command.funeralHomeId,
          token: stubToken,
          since: command.since,
          maxResults: command.maxResults,
        });
        
        // Success - break out of retry loop
        break;
      } catch (error) {
        lastError = error as EmailSyncError;
        
        // If this is the last attempt, don't retry
        if (attempt === policy.maxRetries) {
          return yield* Effect.fail(lastError);
        }
        
        // Wait before retrying (policy-driven delay)
        yield* Effect.sleep(policy.retryDelaySeconds * 1000);
      }
    }
    
    // Should never reach here, but handle edge case
    if (!result) {
      return yield* Effect.fail(lastError || new EmailSyncError('Unknown sync error'));
    }
    
    // PRODUCTION TODO: For each synced email:
    // 1. Match to Contact/Lead/Case using matchEmailToEntity with policy.emailMatchingStrategy
    // 2. Create Email entity
    // 3. Save via EmailRepository
    // 4. Update links if match found
    // 5. Apply fallback matching strategies from policy.emailFallbackStrategies
    
    console.log(`Synced ${result.syncedCount} emails for user ${command.userId} (funeralHome: ${command.funeralHomeId}, policy sync freq: ${policy.emailSyncFrequencyMinutes}min, retries: ${policy.maxRetries})`);
    
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
