import { Data } from 'effect';

/**
 * Contact Management Policy
 *
 * SCD Type 2: Tracks historical policy changes with version control
 *
 * Defines how contacts are deduplicated and merged per funeral home.
 * Each funeral home can have different matching sensitivity and merge preferences.
 *
 * Example variations:
 * - Standard: Balanced approach (75% threshold, equal weights)
 * - Strict: Conservative matching (85% threshold, higher name weight)
 * - Permissive: Aggressive deduplication (60% threshold, equal weights)
 */
export class ContactManagementPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;  // Policy identifier, typically funeralHomeId
  readonly version: number;       // SCD2: Version number
  readonly validFrom: Date;       // SCD2: When this version became active
  readonly validTo: Date | null;  // SCD2: When this version ended (null = current)
  readonly isCurrent: boolean;    // SCD2: Is this the current version?
  readonly funeralHomeId: string; // Which funeral home uses this policy

  // Duplicate Detection Configuration
  readonly minDuplicateSimilarityThreshold: number;  // Minimum score to flag as duplicate (0-100)
  readonly duplicateMatchingWeights: {
    readonly name: number;        // Weight for name similarity (0-100)
    readonly email: number;       // Weight for email match (0-100)
    readonly phone: number;       // Weight for phone match (0-100)
  };

  // Merge Configuration
  readonly mergeFieldPrecedence: 'newest' | 'mostRecent' | 'preferNonNull';  // Which value to keep on merge
  readonly isMergeApprovalRequired: boolean;        // Require manager approval to merge
  readonly mergeRetentionDays: number;              // Days to keep merged record history
  readonly mergeFamilyRelationshipsAutomatic: boolean; // Auto-link family relationships on merge

  // Deduplication Rules
  readonly ignoreDuplicatesOlderThanDays: number;   // Don't flag duplicates older than this
  readonly ignoreMergedContactsInSearch: boolean;   // Exclude merged contacts from duplicate search
  readonly maxDuplicatesPerSearch: number;          // Max duplicates to return per search

  // Audit Trail
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy: string | null;
  readonly reason: string | null;        // Reason for policy change
}> {}

/**
 * Standard Contact Management Policy
 *
 * Balanced approach for typical funeral homes.
 * Moderate matching sensitivity with equal weights.
 */
export const STANDARD_CONTACT_MANAGEMENT_POLICY: Omit<
  ContactManagementPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,

  // Moderate matching threshold
  minDuplicateSimilarityThreshold: 75,
  duplicateMatchingWeights: {
    name: 40,       // 40% weight to name similarity
    email: 30,      // 30% weight to email match
    phone: 30,      // 30% weight to phone match
  },

  // Balanced merge preferences
  mergeFieldPrecedence: 'mostRecent',     // Keep most recently updated values
  isMergeApprovalRequired: false,         // Auto-merge below threshold
  mergeRetentionDays: 365,                // Keep merged history 1 year
  mergeFamilyRelationshipsAutomatic: true, // Auto-link family relationships

  // Reasonable deduplication rules
  ignoreDuplicatesOlderThanDays: 730,     // Don't flag if older than 2 years
  ignoreMergedContactsInSearch: true,     // Hide already-merged contacts
  maxDuplicatesPerSearch: 50,             // Return up to 50 matches

  reason: null,
};

/**
 * Strict Contact Management Policy
 *
 * Conservative approach prioritizing accuracy over coverage.
 * Higher threshold, higher name weight, approval required.
 */
export const STRICT_CONTACT_MANAGEMENT_POLICY: Omit<
  ContactManagementPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,

  // Conservative matching threshold
  minDuplicateSimilarityThreshold: 85,   // Higher threshold - only very similar
  duplicateMatchingWeights: {
    name: 50,       // 50% weight to name (prioritize name match)
    email: 30,      // 30% weight to email
    phone: 20,      // 20% weight to phone
  },

  // Strict merge preferences
  mergeFieldPrecedence: 'newest',        // Keep newest record values (safest)
  isMergeApprovalRequired: true,         // Always require approval
  mergeRetentionDays: 2555,              // Keep merged history ~7 years (legal retention)
  mergeFamilyRelationshipsAutomatic: false, // Manual relationship review

  // Strict deduplication rules
  ignoreDuplicatesOlderThanDays: 365,    // Only flag if within 1 year
  ignoreMergedContactsInSearch: true,    // Hide merged contacts
  maxDuplicatesPerSearch: 10,            // Return only top 10

  reason: null,
};

/**
 * Permissive Contact Management Policy
 *
 * Aggressive approach maximizing duplicate detection.
 * Lower threshold, equal weights, auto-merge.
 */
export const PERMISSIVE_CONTACT_MANAGEMENT_POLICY: Omit<
  ContactManagementPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,

  // Permissive matching threshold
  minDuplicateSimilarityThreshold: 60,   // Low threshold - catch more matches
  duplicateMatchingWeights: {
    name: 34,       // ~33% weight to name
    email: 33,      // ~33% weight to email
    phone: 33,      // ~33% weight to phone
  },

  // Permissive merge preferences
  mergeFieldPrecedence: 'preferNonNull', // Keep non-null values (most data retained)
  isMergeApprovalRequired: false,        // Auto-merge immediately
  mergeRetentionDays: 90,                // Keep merged history 3 months (space-efficient)
  mergeFamilyRelationshipsAutomatic: true, // Aggressive auto-linking

  // Permissive deduplication rules
  ignoreDuplicatesOlderThanDays: 1825,   // Flag if within 5 years
  ignoreMergedContactsInSearch: false,   // Include merged contacts in search
  maxDuplicatesPerSearch: 100,           // Return all matches up to 100

  reason: null,
};
