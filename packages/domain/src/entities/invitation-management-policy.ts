import { Data } from 'effect';

/**
 * Invitation Management Policy
 *
 * SCD Type 2: Tracks historical policy changes with version control
 *
 * Defines how family invitations are created and managed per funeral home.
 * Configures token security, expiration windows, validation rules, and duplicate handling.
 *
 * Example variations:
 * - Standard: 32-byte token, 7-day expiration, strict email, no duplicates (most common)
 * - Strict: 64-byte token, 3-day expiration, strict email, no duplicates (compliance-focused)
 * - Permissive: 16-byte token, 30-day expiration, relaxed email, allow duplicates (speed-focused)
 */
export class InvitationManagementPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;
  readonly funeralHomeId: string;
  readonly tokenLengthBytes: number;
  readonly expirationDays: number;
  readonly requireStrictEmailValidation: boolean;
  readonly allowMultipleInvitationsPerEmail: boolean;
  readonly autoRevokeExpiredAfterDays: number | null;
  readonly requirePhoneNumber: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy: string | null;
  readonly reason: string | null;
}> {}

/**
 * Standard Invitation Management Policy (Most Common)
 * Default for new funeral homes
 */
export const DEFAULT_INVITATION_MANAGEMENT_POLICY = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,
  tokenLengthBytes: 32, // 64 hex characters
  expirationDays: 7,
  requireStrictEmailValidation: true,
  allowMultipleInvitationsPerEmail: false,
  autoRevokeExpiredAfterDays: null,
  requirePhoneNumber: false,
  reason: null,
};

/**
 * Strict Invitation Management Policy (Compliance-Focused)
 * For funeral homes with strong compliance and security requirements
 */
export const STRICT_INVITATION_MANAGEMENT_POLICY = {
  ...DEFAULT_INVITATION_MANAGEMENT_POLICY,
  tokenLengthBytes: 64, // 128 hex characters - maximum security
  expirationDays: 3, // Quick response window
  requireStrictEmailValidation: true,
  allowMultipleInvitationsPerEmail: false,
  autoRevokeExpiredAfterDays: 14, // Auto-cleanup after 14 days
  requirePhoneNumber: true, // Additional verification
};

/**
 * Permissive Invitation Management Policy (Speed-Focused)
 * For funeral homes prioritizing user convenience and flexibility
 */
export const PERMISSIVE_INVITATION_MANAGEMENT_POLICY = {
  ...DEFAULT_INVITATION_MANAGEMENT_POLICY,
  tokenLengthBytes: 16, // 32 hex characters - easier to share/type
  expirationDays: 30, // Extended window for flexibility
  requireStrictEmailValidation: false, // Allow edge cases
  allowMultipleInvitationsPerEmail: true, // Allow resending without revoke
  autoRevokeExpiredAfterDays: 90, // Extended cleanup window
  requirePhoneNumber: false,
};
