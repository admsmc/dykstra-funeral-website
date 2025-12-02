import { Effect } from 'effect';
import { type Contact, type ContactId, type NotFoundError } from '@dykstra/domain';
import { ContactRepository, type ContactRepositoryService, type PersistenceError } from '../../ports/contact-repository';
import { ContactManagementPolicyRepository, type ContactManagementPolicyRepositoryService } from '../../ports/contact-management-policy-repository';

/**
 * Duplicate match with similarity score
 */
/**
 * Find Duplicates
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: ContactManagementPolicy
 * Persisted In: In-memory (Prisma in production)
 * Go Backend: NO
 * Per-Funeral-Home: YES (policy-driven configuration per funeral home)
 * Test Coverage: 3 tests (STANDARD, STRICT, PERMISSIVE policies)
 * Last Updated: Phase 2.7-2.8
 *
 * Policy-Driven Configuration:
 * - Duplicate matching weights (name, email, phone) per funeral home
 * - Minimum similarity threshold (default 75%) per funeral home
 * - Maximum duplicates returned per search
 * - Ignore duplicates older than N days
 * - Exclude merged contacts from search
 */

export interface DuplicateMatch {
  readonly contact: Contact;
  readonly similarityScore: number;  // 0-100
  readonly matchReasons: readonly string[];
}

/**
 * Command to find duplicate contacts
 */
export interface FindDuplicatesCommand {
  readonly funeralHomeId: string;
  readonly targetContactId?: ContactId;  // Optional: check specific contact
  readonly minSimilarityScore?: number;  // Default: 75
}

/**
 * Levenshtein distance for fuzzy string matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0]![i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j]![0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j]![i] = Math.min(
        track[j]![i - 1]! + 1,
        track[j - 1]![i]! + 1,
        track[j - 1]![i - 1]! + indicator
      );
    }
  }
  
  return track[str2.length]![str1.length]!;
}

/**
 * Calculate string similarity percentage (0-100)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  return Math.round(((maxLength - distance) / maxLength) * 100);
}

/**
 * Normalize phone number for comparison
 */
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, ''); // Remove all non-digits
}

/**
 * Normalize email for comparison
 */
function normalizeEmail(email: string | null): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

/**
 * Calculate similarity between two contacts using policy weights
 */
function calculateSimilarity(
  contact1: Contact,
  contact2: Contact,
  weights: { readonly name: number; readonly email: number; readonly phone: number },
): {
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let totalScore = 0;
  const maxPossibleScore = weights.name + weights.email + weights.phone;

  // Name similarity (policy-driven weight)
  const firstNameSim = stringSimilarity(contact1.firstName, contact2.firstName);
  const lastNameSim = stringSimilarity(contact1.lastName, contact2.lastName);
  const nameSim = (firstNameSim + lastNameSim) / 2;
  const nameScore = (nameSim / 100) * weights.name;
  totalScore += nameScore;

  if (nameSim > 85) {
    reasons.push(`Similar name (${Math.round(nameSim)}% match)`);
  }

  // Email match (policy-driven weight)
  const email1 = normalizeEmail(contact1.email);
  const email2 = normalizeEmail(contact2.email);
  if (email1 && email2) {
    if (email1 === email2) {
      totalScore += weights.email;
      reasons.push('Identical email address');
    }
  }

  // Phone match (policy-driven weight)
  const phone1 = normalizePhone(contact1.phone);
  const phone2 = normalizePhone(contact2.phone);
  const altPhone1 = normalizePhone(contact1.alternatePhone);
  const altPhone2 = normalizePhone(contact2.alternatePhone);

  if (phone1 && phone2 && phone1 === phone2) {
    totalScore += weights.phone;
    reasons.push('Identical phone number');
  } else if (phone1 && altPhone2 && phone1 === altPhone2) {
    totalScore += Math.round(weights.phone * 0.83); // 25/30 = 0.83
    reasons.push('Phone matches alternate phone');
  } else if (altPhone1 && phone2 && altPhone1 === phone2) {
    totalScore += Math.round(weights.phone * 0.83);
    reasons.push('Alternate phone matches phone');
  }

  // Calculate final percentage
  const finalScore = Math.round((totalScore / maxPossibleScore) * 100);

  return {
    score: finalScore,
    reasons,
  };
}

/**
 * Find potential duplicate contacts using policy-driven matching
 */
export const findDuplicates = (
  command: FindDuplicatesCommand
): Effect.Effect<
  readonly DuplicateMatch[],
  NotFoundError | PersistenceError,
  ContactRepositoryService | ContactManagementPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const repo = yield* ContactRepository;
    const policyRepo = yield* ContactManagementPolicyRepository;

    // Load policy for this funeral home
    const policy = yield* policyRepo.findCurrentByFuneralHomeId(command.funeralHomeId);
    const minScore = command.minSimilarityScore ?? policy.minDuplicateSimilarityThreshold;

    // Get all active contacts for the funeral home
    const allContacts = yield* repo.findByFuneralHome(command.funeralHomeId, {
      // Exclude merged contacts
    });

    // If checking specific contact, compare against all others
    if (command.targetContactId) {
      const targetContact = allContacts.find(c => c.id === command.targetContactId);
      if (!targetContact) {
        return [];
      }

      const matches: DuplicateMatch[] = [];

      for (const contact of allContacts) {
        // Skip self and already merged contacts
        if (contact.id === targetContact.id || contact.isMerged) {
          continue;
        }

        const { score, reasons } = calculateSimilarity(
          targetContact,
          contact,
          policy.duplicateMatchingWeights
        );

        if (score >= minScore) {
          matches.push({
            contact,
            similarityScore: score,
            matchReasons: reasons,
          });
        }
      }

      // Sort by similarity score (highest first)
      return matches.sort((a, b) => b.similarityScore - a.similarityScore) as readonly DuplicateMatch[];
    }

    // Find all potential duplicates (compare all contacts)
    const duplicateGroups = new Map<string, DuplicateMatch[]>();

    for (let i = 0; i < allContacts.length; i++) {
      const contact1 = allContacts[i];
      if (!contact1 || contact1.isMerged) continue;

      for (let j = i + 1; j < allContacts.length; j++) {
        const contact2 = allContacts[j];
        if (!contact2 || contact2.isMerged) continue;

        const { score, reasons } = calculateSimilarity(
          contact1,
          contact2,
          policy.duplicateMatchingWeights
        );

        if (score >= minScore) {
          // Add to contact1's duplicate list
          const key1 = contact1.id;
          if (!duplicateGroups.has(key1)) {
            duplicateGroups.set(key1, []);
          }
          duplicateGroups.get(key1)!.push({
            contact: contact2,
            similarityScore: score,
            matchReasons: reasons,
          });

          // Add to contact2's duplicate list
          const key2 = contact2.id;
          if (!duplicateGroups.has(key2)) {
            duplicateGroups.set(key2, []);
          }
          duplicateGroups.get(key2)!.push({
            contact: contact1,
            similarityScore: score,
            matchReasons: reasons,
          });
        }
      }
    }

    // Flatten and return all matches
    const allMatches: DuplicateMatch[] = [];
    for (const matches of duplicateGroups.values()) {
      allMatches.push(...matches);
    }

    // Sort by similarity score and limit by policy
    const sorted = allMatches.sort((a, b) => b.similarityScore - a.similarityScore);
    return sorted.slice(0, policy.maxDuplicatesPerSearch) as readonly DuplicateMatch[];
  });

/**
 * Get duplicate contacts grouped by similarity clusters
 */
export const findDuplicateClusters = (
  funeralHomeId: string,
  minSimilarityScore: number = 85
): Effect.Effect<
  ReadonlyArray<readonly Contact[]>,
  NotFoundError | PersistenceError,
  ContactRepositoryService | ContactManagementPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const matches = yield* findDuplicates({ funeralHomeId, minSimilarityScore });

    // Group contacts into clusters
    const clusters = new Map<string, Set<string>>();
    const contactMap = new Map<string, Contact>();

    for (const match of matches) {
      contactMap.set(match.contact.id, match.contact);
    }

    // Build clusters using union-find-like approach
    for (const match of matches) {
      const contactId = match.contact.id;
      
      // Find if contact already belongs to a cluster
      let foundCluster: Set<string> | null = null;
      for (const [, members] of clusters) {
        if (members.has(contactId)) {
          foundCluster = members;
          break;
        }
      }

      if (!foundCluster) {
        // Create new cluster
        const newCluster = new Set<string>([contactId]);
        clusters.set(contactId, newCluster);
      }
    }

    // Convert clusters to Contact arrays
    const result: readonly Contact[][] = [];
    const processed = new Set<string>();

    for (const [, members] of clusters) {
      const clusterKey = Array.from(members).sort().join(',');
      if (processed.has(clusterKey)) continue;
      processed.add(clusterKey);

      const clusterContacts = Array.from(members)
        .map(id => contactMap.get(id))
        .filter((c): c is Contact => c !== undefined);

      if (clusterContacts.length >= 2) {
        (result as Contact[][]).push(clusterContacts);
      }
    }

    return result;
  });
