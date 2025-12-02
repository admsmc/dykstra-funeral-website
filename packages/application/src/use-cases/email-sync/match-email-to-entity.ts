import { Effect } from 'effect';
import { ContactRepository, type ContactRepositoryService } from '../../ports/contact-repository';
import { LeadRepository, type LeadRepositoryService } from '../../ports/lead-repository';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../ports/email-calendar-sync-policy-repository';
import { type EmailMatchResult } from '../../ports/email-sync-port';
import { type PersistenceError } from '../../ports/case-repository';

/**
 * Match Email To Entity
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: EmailCalendarSyncPolicy
 * Persisted In: In-memory (Prisma in production)
 * Go Backend: NO
 * Per-Funeral-Home: YES (policy-driven matching strategy per funeral home)
 * Test Coverage: 6 tests (exact, fuzzy, domain, fallback, 3 policies)
 * Last Updated: Phase 2.9-2.13
 *
 * Policy-Driven Configuration:
 * - Email matching strategy (exact/fuzzy/domain/exact_with_fallback) per funeral home
 * - Fuzzy match threshold (0-100%) per funeral home
 * - Fallback strategies (ordered) per funeral home
 * - Custom common email providers list (future enhancement)
 */

export interface MatchEmailCommand {
  readonly emailAddress: string;
  readonly funeralHomeId: string;
}

/**
 * Match email address to Contact or Lead
 * Uses policy-driven matching strategies to find best match.
 * 
 * Matching strategies (applied in order per funeral home policy):
 * 1. 'exact' - Exact email match (100% confidence)
 * 2. 'fuzzy' - Fuzzy match using Levenshtein distance (varies 0-100% per policy.fuzzyMatchThreshold)
 * 3. 'domain' - Domain/company match (75% confidence)
 * 
 * Policy controls:
 * - emailFallbackStrategies: ordered array of strategies to try
 * - fuzzyMatchThreshold: minimum similarity % for fuzzy matches (0-100)
 * - emailMatchingStrategy: primary strategy name (informational)
 * 
 * Example policies:
 * - Standard (balanced): ['exact', 'domain'], 85% fuzzy threshold
 * - Strict (conservative): ['exact'], 100% fuzzy threshold
 * - Permissive (aggressive): ['fuzzy', 'domain', 'exact'], 70% fuzzy threshold
 */
export const matchEmailToEntity = (
  command: MatchEmailCommand
): Effect.Effect<
  EmailMatchResult,
  PersistenceError | Error,
  ContactRepositoryService | LeadRepositoryService | EmailCalendarSyncPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const contactRepo = yield* ContactRepository;
    const leadRepo = yield* LeadRepository;
    const policyRepo = yield* EmailCalendarSyncPolicyRepository;
    
    const normalizedEmail = command.emailAddress.toLowerCase().trim();
    
    // Load policy for this funeral home
    const policy = yield* policyRepo.findCurrentByFuneralHomeId(command.funeralHomeId);
    
    // Fetch all contacts and leads for this funeral home
    const contacts = yield* contactRepo.findByFuneralHome(command.funeralHomeId, {});
    const leads = yield* leadRepo.findByFuneralHome(command.funeralHomeId, {});
    
    // Apply matching strategies in order based on policy configuration
    for (const strategy of policy.emailFallbackStrategies) {
      if (strategy === 'exact') {
        // Try exact email match on Contacts
        const exactContactMatch = contacts.find(
          (c) => c.email?.toLowerCase() === normalizedEmail
        );
        
        if (exactContactMatch) {
          return {
            contactId: exactContactMatch.id,
            leadId: null,
            caseId: null,
            confidence: 100,
            matchReason: 'Exact email match on contact (policy-driven)',
          };
        }
        
        // Try exact email match on Leads
        const exactLeadMatch = leads.find(
          (l) => l.email?.toLowerCase() === normalizedEmail
        );
        
        if (exactLeadMatch) {
          return {
            contactId: null,
            leadId: exactLeadMatch.id,
            caseId: null,
            confidence: 100,
            matchReason: 'Exact email match on lead (policy-driven)',
          };
        }
      }
      
      if (strategy === 'fuzzy') {
        // Try fuzzy email matching using policy threshold
        const fuzzyContactMatch = contacts
          .map((c) => ({
            entity: c,
            type: 'contact' as const,
            similarity: c.email ? similarityPercentage(c.email.toLowerCase(), normalizedEmail) : 0,
          }))
          .filter((m) => m.similarity >= policy.fuzzyMatchThreshold)
          .sort((a, b) => b.similarity - a.similarity)[0];
        
        if (fuzzyContactMatch && fuzzyContactMatch.similarity >= policy.fuzzyMatchThreshold) {
          return {
            contactId: fuzzyContactMatch.entity.id,
            leadId: null,
            caseId: null,
            confidence: fuzzyContactMatch.similarity,
            matchReason: `Fuzzy email match on contact: ${fuzzyContactMatch.similarity}% similarity (policy threshold: ${policy.fuzzyMatchThreshold}%)`,
          };
        }
        
        // Try fuzzy match on Leads
        const fuzzyLeadMatch = leads
          .map((l) => ({
            entity: l,
            type: 'lead' as const,
            similarity: l.email ? similarityPercentage(l.email.toLowerCase(), normalizedEmail) : 0,
          }))
          .filter((m) => m.similarity >= policy.fuzzyMatchThreshold)
          .sort((a, b) => b.similarity - a.similarity)[0];
        
        if (fuzzyLeadMatch && fuzzyLeadMatch.similarity >= policy.fuzzyMatchThreshold) {
          return {
            contactId: null,
            leadId: fuzzyLeadMatch.entity.id,
            caseId: null,
            confidence: fuzzyLeadMatch.similarity,
            matchReason: `Fuzzy email match on lead: ${fuzzyLeadMatch.similarity}% similarity (policy threshold: ${policy.fuzzyMatchThreshold}%)`,
          };
        }
      }
      
      if (strategy === 'domain') {
        // Try domain match (same company)
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
              confidence: 75,
              matchReason: `Domain match on contact: ${domain} (policy-driven)`,
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
              confidence: 75,
              matchReason: `Domain match on lead: ${domain} (policy-driven)`,
            };
          }
        }
      }
    }
    
    // No match found after trying all policy-configured strategies
    return {
      contactId: null,
      leadId: null,
      caseId: null,
      confidence: 0,
      matchReason: 'No match found after applying all policy-configured strategies',
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
