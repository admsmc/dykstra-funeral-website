import { Effect } from 'effect';
import { 
  type EmailSyncServicePort, 
  EmailSyncError
} from '@dykstra/application';

/**
 * Gmail API adapter for email sync (stub implementation)
 * 
 * PRODUCTION SETUP:
 * 1. Create project in Google Cloud Console: https://console.cloud.google.com
 * 2. Enable Gmail API
 * 3. Create OAuth 2.0 credentials (Web application)
 * 4. Add authorized redirect URIs
 * 5. Install: npm install googleapis
 * 6. Environment variables:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - GOOGLE_REDIRECT_URI
 */

// Lazy load Gmail client (optional dependency)
let gmailClient: any = null;

const initGmailClient = async (accessToken: string) => {
  if (!gmailClient) {
    try {
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
      return gmailClient;
    } catch (error) {
      console.warn('Google APIs not available - using mock implementation');
      return null;
    }
  }
  return gmailClient;
};


/**
 * Gmail Email Sync Adapter (object-based)
 */
export const GmailAdapter: EmailSyncServicePort = {
  syncEmails: (params) =>
    Effect.tryPromise({
      try: async () => {
        const client = await initGmailClient(params.token.accessToken);
        
        if (!client) {
          // MOCK IMPLEMENTATION - Remove in production
          console.log('[MOCK] Syncing emails from Gmail...');
          const mockCount = params.maxResults || 5;
          return {
            syncedCount: mockCount,
            newCount: mockCount,
            errorCount: 0,
            lastSyncAt: new Date(),
          };
        }
        
        // PRODUCTION IMPLEMENTATION (uncomment when SDK installed):
        /*
        const query = params.since 
          ? `after:${Math.floor(params.since.getTime() / 1000)}`
          : 'in:inbox';
        
        const response = await client.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: params.maxResults || 50,
        });
        
        let newCount = 0;
        const messages = response.data.messages || [];
        
        for (const message of messages) {
          // Get full message details
          const fullMessage = await client.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });
          
          // Check if already synced
          const exists = await checkIfExists(message.id);
          if (!exists) {
            newCount++;
            // Parse and save email entity
          }
        }
        
        return {
          syncedCount: messages.length,
          newCount,
          errorCount: 0,
          lastSyncAt: new Date(),
        };
        */
        
        return {
          syncedCount: 0,
          newCount: 0,
          errorCount: 0,
          lastSyncAt: new Date(),
        };
      },
      catch: (error) => new EmailSyncError('Failed to sync emails from Gmail', error),
    }),

  sendEmail: (params) =>
    Effect.tryPromise({
      try: async () => {
        const client = await initGmailClient(params.token.accessToken);
        
        if (!client) {
          // MOCK IMPLEMENTATION
          console.log('[MOCK] Sending email via Gmail...', {
            to: params.email.to,
            subject: params.email.subject,
          });
          return {
            messageId: `mock-sent-${Date.now()}`,
            externalId: `16b8c${Date.now()}`,
          };
        }
        
        // PRODUCTION IMPLEMENTATION (uncomment when SDK installed):
        /*
        // Construct RFC 2822 email
        const messageParts = [
          `To: ${params.email.to.join(', ')}`,
          `Subject: ${params.email.subject}`,
          'Content-Type: text/html; charset=utf-8',
          '',
          params.email.htmlBody || params.email.body,
        ];
        
        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const result = await client.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });
        
        return {
          messageId: result.data.id || 'unknown',
          externalId: result.data.id || 'unknown',
        };
        */
        
        return {
          messageId: 'mock-id',
          externalId: 'mock-external-id',
        };
      },
      catch: (error) => new EmailSyncError('Failed to send email via Gmail', error),
    }),

  matchEmailToEntity: (_emailAddress: string, _funeralHomeId: string) =>
    Effect.succeed({
      contactId: null,
      leadId: null,
      caseId: null,
      confidence: 0,
      matchReason: 'No match found (stub implementation)',
    }),

  getEmailThread: (_threadId: string) =>
    Effect.succeed([]),

  markAsRead: (emailId, token) =>
    Effect.tryPromise({
      try: async () => {
        const client = await initGmailClient(token.accessToken);
        
        if (!client) {
          console.log('[MOCK] Marking email as read:', emailId);
          return;
        }
        
        // PRODUCTION IMPLEMENTATION (uncomment when SDK installed):
        /*
        await client.users.messages.modify({
          userId: 'me',
          id: emailId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });
        */
      },
      catch: (error) => new EmailSyncError('Failed to mark email as read', error),
    }),

  refreshToken: (token) =>
    Effect.tryPromise({
      try: async () => {
        // PRODUCTION IMPLEMENTATION:
        // Use Google OAuth2 token endpoint
        // POST https://oauth2.googleapis.com/token
        
        console.log('[MOCK] Refreshing Gmail OAuth token...');
        
        /*
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            refresh_token: token.refreshToken || '',
            grant_type: 'refresh_token',
          }),
        });
        
        const data = await response.json();
        
        return {
          ...token,
          accessToken: data.access_token,
          expiresAt: new Date(Date.now() + data.expires_in * 1000),
        };
        */
        
        return {
          ...token,
          accessToken: `mock-refreshed-${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        };
      },
      catch: (error) => new EmailSyncError('Failed to refresh OAuth token', error),
    }),
};

/**
 * PRODUCTION OAuth Flow Implementation Guide:
 * 
 * 1. Initiate OAuth:
 *    GET https://accounts.google.com/o/oauth2/v2/auth
 *    ?client_id={client_id}
 *    &redirect_uri={redirect_uri}
 *    &response_type=code
 *    &scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send
 *    &access_type=offline
 *    &prompt=consent
 * 
 * 2. Handle callback and exchange code for token:
 *    POST https://oauth2.googleapis.com/token
 *    Body: grant_type=authorization_code&code={code}&redirect_uri={redirect_uri}&client_id={client_id}&client_secret={client_secret}
 * 
 * 3. Store tokens in OAuthToken table
 * 
 * 4. Refresh token when expired:
 *    POST https://oauth2.googleapis.com/token
 *    Body: grant_type=refresh_token&refresh_token={refresh_token}&client_id={client_id}&client_secret={client_secret}
 */
