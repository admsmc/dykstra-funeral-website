import { Data } from 'effect';

/**
 * Interaction Management Policy
 *
 * SCD Type 2: Tracks historical policy changes with version control
 *
 * Defines how interactions are logged and managed per funeral home.
 * Configures validation rules, duration limits, and completion behavior.
 *
 * Example variations:
 * - Standard: 200 char subject, 1000 char outcome, max 1 week duration (most common)
 * - Strict: 150 char subject, 500 char outcome, max 4 hours (compliance-focused)
 * - Permissive: 500 char subject, 5000 char outcome, no duration limit (documentation-heavy)
 */
export class InteractionManagementPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;
  readonly funeralHomeId: string;
  readonly maxSubjectLength: number;
  readonly minSubjectLength: number;
  readonly maxOutcomeLength: number;
  readonly maxDurationMinutes: number | null;
  readonly requireAssociation: boolean;
  readonly allowScheduledInteractions: boolean;
  readonly autoCompleteUncompletedAfterDays: number | null;
  readonly allowOutcomeUpdate: boolean;
  readonly autoArchiveCompletedAfterDays: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy: string | null;
  readonly reason: string | null;
}> {}

/**
 * Standard Interaction Management Policy (Most Common)
 * Default for new funeral homes
 */
export const DEFAULT_INTERACTION_MANAGEMENT_POLICY = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,
  maxSubjectLength: 200,
  minSubjectLength: 1,
  maxOutcomeLength: 1000,
  maxDurationMinutes: 10080, // 1 week
  requireAssociation: true,
  allowScheduledInteractions: true,
  autoCompleteUncompletedAfterDays: null,
  allowOutcomeUpdate: false,
  autoArchiveCompletedAfterDays: null,
  reason: null,
};

/**
 * Strict Interaction Management Policy (Compliance-Focused)
 * For funeral homes with compliance requirements
 */
export const STRICT_INTERACTION_MANAGEMENT_POLICY = {
  ...DEFAULT_INTERACTION_MANAGEMENT_POLICY,
  maxSubjectLength: 150,
  maxOutcomeLength: 500,
  maxDurationMinutes: 240, // 4 hours
  allowOutcomeUpdate: false, // No updates after completion
  autoArchiveCompletedAfterDays: 30, // Archive after 30 days
};

/**
 * Permissive Interaction Management Policy (Documentation-Heavy)
 * For funeral homes that log extensive interaction details
 */
export const PERMISSIVE_INTERACTION_MANAGEMENT_POLICY = {
  ...DEFAULT_INTERACTION_MANAGEMENT_POLICY,
  maxSubjectLength: 500,
  maxOutcomeLength: 5000,
  maxDurationMinutes: null, // No limit
  allowOutcomeUpdate: true, // Allow updates after completion
  autoArchiveCompletedAfterDays: 90, // Archive after 90 days
};
