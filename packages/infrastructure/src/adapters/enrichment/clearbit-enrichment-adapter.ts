import { Effect, Layer } from 'effect';
import {
  ContactEnrichment,
  type ContactEnrichmentService,
  type EnrichedProfile,
  type EmailVerification,
  ContactEnrichmentError,
} from '@dykstra/application';

/**
 * Clearbit Enrichment API adapter
 * Implementation: Object-based (not class-based) following Clean Architecture
 * 
 * Note: This is a stub implementation for demonstration.
 * For production, integrate with Clearbit Enrichment API or FullContact API.
 * Add: CLEARBIT_API_KEY environment variable
 */

/**
 * Simple email validation regex
 */
function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if email domain is disposable
 */
function isDisposableDomain(email: string): boolean {
  const disposableDomains = [
    'temp-mail.com',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
    '10minutemail.com',
    'throwaway.email',
    'maildrop.cc',
    'getnada.com',
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? disposableDomains.includes(domain) : false;
}

/**
 * Suggest email correction for common typos
 */
function suggestCorrection(email: string): string | null {
  const commonTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };
  
  const [localPart, domain] = email.split('@');
  if (!domain) return null;
  
  const correction = commonTypos[domain.toLowerCase()];
  if (correction) {
    return `${localPart}@${correction}`;
  }
  
  return null;
}

export const ClearbitEnrichmentAdapter: ContactEnrichmentService = {
  enrichFromEmail: (email: string) =>
    Effect.tryPromise({
      try: async () => {
        if (!isValidEmailFormat(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }
        
        // For production: Call Clearbit Enrichment API
        // const apiKey = process.env.CLEARBIT_API_KEY;
        // const response = await fetch(
        //   `https://person.clearbit.com/v2/combined/find?email=${encodeURIComponent(email)}`,
        //   { headers: { Authorization: `Bearer ${apiKey}` }}
        // );
        
        // Stub response
        const enriched: EnrichedProfile = {
          email,
          fullName: null,
          firstName: null,
          lastName: null,
          photoUrl: null,
          location: null,
          employment: null,
          socialProfiles: [],
          bio: null,
          confidence: 0, // No data in stub
        };
        
        return enriched;
      },
      catch: (error) => new ContactEnrichmentError('Failed to enrich contact', error),
    }),

  verifyEmail: (email: string) =>
    Effect.tryPromise({
      try: async () => {
        const isValid = isValidEmailFormat(email);
        const isDisposable = isDisposableDomain(email);
        const suggestion = suggestCorrection(email);
        
        // For production: Use ZeroBounce or similar service
        // const response = await fetch(
        //   `https://api.zerobounce.net/v2/validate?api_key=${ZEROBOUNCE_API_KEY}&email=${email}`
        // );
        
        const verification: EmailVerification = {
          email,
          isValid,
          isDeliverable: isValid && !isDisposable,
          isDisposable,
          isCatchAll: false, // Would come from API
          didYouMean: suggestion,
          score: isValid && !isDisposable ? 100 : 0,
        };
        
        return verification;
      },
      catch: (error) => new ContactEnrichmentError('Failed to verify email', error),
    }),

  suggestEmailCorrection: (email: string) =>
    Effect.tryPromise({
      try: async () => {
        return suggestCorrection(email);
      },
      catch: (error) => new ContactEnrichmentError('Failed to suggest email correction', error),
    }),

  batchEnrich: (emails: readonly string[]) =>
    Effect.tryPromise({
      try: async () => {
        // For production: Use Clearbit batch API
        // const apiKey = process.env.CLEARBIT_API_KEY;
        // const response = await fetch(
        //   'https://person.clearbit.com/v2/combined/batch',
        //   {
        //     method: 'POST',
        //     headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ emails })
        //   }
        // );
        
        // Stub: Return null for all emails
        const results = emails.map(() => null);
        return results;
      },
      catch: (error) => new ContactEnrichmentError('Failed to batch enrich contacts', error),
    }),

  isDisposableEmail: (email: string) =>
    Effect.tryPromise({
      try: async () => {
        return isDisposableDomain(email);
      },
      catch: (error) => new ContactEnrichmentError('Failed to check disposable email', error),
    }),
};

/**
 * Layer for dependency injection
 */
export const ClearbitEnrichmentAdapterLive = Layer.succeed(
  ContactEnrichment,
  ClearbitEnrichmentAdapter
);
