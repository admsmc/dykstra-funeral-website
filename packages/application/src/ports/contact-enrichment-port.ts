import { type Effect, Context } from 'effect';

/**
 * Social media profile
 */
export interface SocialProfile {
  readonly platform: 'linkedin' | 'facebook' | 'twitter' | 'instagram' | 'other';
  readonly url: string;
  readonly username: string | null;
}

/**
 * Employment information
 */
export interface Employment {
  readonly company: string | null;
  readonly title: string | null;
  readonly domain: string | null;
}

/**
 * Enriched contact profile
 */
export interface EnrichedProfile {
  readonly email: string;
  readonly fullName: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly photoUrl: string | null;
  readonly location: {
    readonly city: string | null;
    readonly state: string | null;
    readonly country: string | null;
  } | null;
  readonly employment: Employment | null;
  readonly socialProfiles: readonly SocialProfile[];
  readonly bio: string | null;
  readonly confidence: number; // 0-100 confidence score
}

/**
 * Email verification result
 */
export interface EmailVerification {
  readonly email: string;
  readonly isValid: boolean;
  readonly isDeliverable: boolean;
  readonly isDisposable: boolean;
  readonly isCatchAll: boolean;
  readonly didYouMean: string | null; // Suggested correction (e.g., gmail.com instead of gmial.com)
  readonly score: number; // 0-100 quality score
}

/**
 * Contact enrichment error
 */
export class ContactEnrichmentError extends Error {
  readonly _tag = 'ContactEnrichmentError';
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
  }
}

/**
 * Port for contact enrichment and email verification
 * Implementation: Clearbit Enrichment API or FullContact API
 */
export interface ContactEnrichmentService {
  /**
   * Enrich contact from email address
   * @param email - Email address to enrich
   * @returns Enriched profile with social and employment data
   */
  readonly enrichFromEmail: (
    email: string
  ) => Effect.Effect<EnrichedProfile, ContactEnrichmentError>;

  /**
   * Verify email address deliverability
   * @param email - Email address to verify
   * @returns Email verification result with suggestions
   */
  readonly verifyEmail: (
    email: string
  ) => Effect.Effect<EmailVerification, ContactEnrichmentError>;

  /**
   * Suggest email correction for typos
   * @param email - Email address to check
   * @returns Suggested correction or null if email looks correct
   */
  readonly suggestEmailCorrection: (
    email: string
  ) => Effect.Effect<string | null, ContactEnrichmentError>;

  /**
   * Batch enrich multiple emails
   * @param emails - Array of email addresses
   * @returns Array of enriched profiles (null for not found)
   */
  readonly batchEnrich: (
    emails: readonly string[]
  ) => Effect.Effect<readonly (EnrichedProfile | null)[], ContactEnrichmentError>;

  /**
   * Check if email is from a disposable email provider
   * @param email - Email address to check
   * @returns True if disposable (e.g., temp-mail.com, guerrillamail.com)
   */
  readonly isDisposableEmail: (
    email: string
  ) => Effect.Effect<boolean, ContactEnrichmentError>;
}

/**
 * Context tag for dependency injection
 */
export const ContactEnrichment = Context.GenericTag<ContactEnrichmentService>(
  '@dykstra/ContactEnrichment'
);
