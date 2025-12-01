import { Data } from 'effect';

/**
 * Note Management Policy
 *
 * SCD Type 2: Tracks historical policy changes with version control
 *
 * Defines how notes are created and managed per funeral home.
 * Minimal policy - primarily captures note validation and retention behavior.
 *
 * Example variations:
 * - Standard: 10,000 char limit, no auto-archive (most common)
 * - Strict: 5,000 char limit, auto-archive after 90 days (compliance-focused)
 * - Permissive: 50,000 char limit, no auto-archive (large note support)
 */
export class NoteManagementPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;
  readonly funeralHomeId: string;
  readonly maxContentLength: number;
  readonly minContentLength: number;
  readonly requireContentValidation: boolean;
  readonly enableAutoArchive: boolean;
  readonly autoArchiveAfterDays: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy: string | null;
  readonly reason: string | null;
}> {}

export const DEFAULT_NOTE_MANAGEMENT_POLICY = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,
  maxContentLength: 10000,
  minContentLength: 1,
  requireContentValidation: true,
  enableAutoArchive: false,
  autoArchiveAfterDays: null,
  reason: null,
};

export const STRICT_NOTE_MANAGEMENT_POLICY = {
  ...DEFAULT_NOTE_MANAGEMENT_POLICY,
  maxContentLength: 5000,
  enableAutoArchive: true,
  autoArchiveAfterDays: 90,
};

export const PERMISSIVE_NOTE_MANAGEMENT_POLICY = {
  ...DEFAULT_NOTE_MANAGEMENT_POLICY,
  maxContentLength: 50000,
  enableAutoArchive: false,
  autoArchiveAfterDays: null,
};
