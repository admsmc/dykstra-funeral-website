import { Effect } from 'effect';
import { ContactRepository, type ContactRepositoryService } from '../../ports/contact-repository';
import { LeadRepository, type LeadRepositoryService } from '../../ports/lead-repository';
import { type EmailMatchResult } from '../../ports/email-sync-port';
import { PersistenceError } from '../../ports/case-repository';

/**
 * Email matching command
 */
/**
 * Match Email To Entity
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: NO
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface MatchEmailCommand {
  readonly emailAddress: string;
  readonly funeralHomeId: string;
}

/**
 * Match email address to Contact or Lead
 * Uses fuzzy matching algorithm to find best match
 * 
 * Matching strategy:
 * 1. Exact email match (100% confidence)
 * 2. Domain match (50% confidence) - same company
 * 3. No match (0% confidence)
 */
export const matchEmailToEntity = (
  command: MatchEmailCommand
): Effect.Effect<
  EmailMatchResult,
  PersistenceError,
  ContactRepositoryService | LeadRepositoryService
> =>
  Effect.gen(function* () {
    const contactRepo = yield* ContactRepository;
    const leadRepo = yield* LeadRepository;
    
    const normalizedEmail = command.emailAddress.toLowerCase().trim();
    
    // Step 1: Try exact email match on Contacts
    const contacts = yield* contactRepo.findByFuneralHome(command.funeralHomeId, {});
    
    const exactContactMatch = contacts.find(
      (c) => c.email?.toLowerCase() === normalizedEmail
    );
    
    if (exactContactMatch) {
      return {
        contactId: exactContactMatch.id,
        leadId: null,
        caseId: null,
        confidence: 100,
        matchReason: 'Exact email match on contact',
      };
    }
    
    // Step 2: Try exact email match on Leads
    const leads = yield* leadRepo.findByFuneralHome(command.funeralHomeId, {});
    
    const exactLeadMatch = leads.find(
      (l) => l.email?.toLowerCase() === normalizedEmail
    );
    
    if (exactLeadMatch) {
      return {
        contactId: null,
        leadId: exactLeadMatch.id,
        caseId: null,
        confidence: 100,
        matchReason: 'Exact email match on lead',
      };
    }
    
    // Step 3: Try domain match (same company)
    const domain = extractDomain(normalizedEmail);
    
    if (domain && !isCommonEmailProvider(domain)) {
      const domainContactMatch = contacts.find((c) => {
        if (!c.email) return false;
        const contactDomain = extractDomain(c.email.toLowerCase());
        return contactDomain === domain;
      });
      
      if (domainContactMatch) {
        return {
          contactId: domainContactMatch.id,
          leadId: null,
          caseId: null,
          confidence: 50,
          matchReason: `Domain match: ${domain}`,
        };
      }
      
      const domainLeadMatch = leads.find((l) => {
        if (!l.email) return false;
        const leadDomain = extractDomain(l.email.toLowerCase());
        return leadDomain === domain;
      });
      
      if (domainLeadMatch) {
        return {
          contactId: null,
          leadId: domainLeadMatch.id,
          caseId: null,
          confidence: 50,
          matchReason: `Domain match: ${domain}`,
        };
      }
    }
    
    // Step 4: No match found
    return {
      contactId: null,
      leadId: null,
      caseId: null,
      confidence: 0,
      matchReason: 'No match found',
    };
  });

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string | null {
  const match = email.match(/@(.+)$/);
  return match?.[1] ?? null;
}

/**
 * Check if domain is a common email provider
 * (we don't want to match everyone @gmail.com together)
 */
function isCommonEmailProvider(domain: string): boolean {
  const commonProviders = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'protonmail.com',
    'mail.com',
  ];
  
  return commonProviders.includes(domain.toLowerCase());
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy name matching (future enhancement)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = [];
  
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    dp[i]![0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0]![j] = j;
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]!;
      } else {
        dp[i]![j] = Math.min(
          dp[i - 1]![j]! + 1,      // deletion
          dp[i]![j - 1]! + 1,      // insertion
          dp[i - 1]![j - 1]! + 1   // substitution
        );
      }
    }
  }
  
  return dp[m]![n]!;
}

/**
 * Calculate similarity percentage between two strings
 */
export function similarityPercentage(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 100;
  
  return Math.round(((maxLength - distance) / maxLength) * 100);
}
