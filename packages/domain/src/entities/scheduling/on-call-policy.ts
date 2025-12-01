/**
 * On-Call Policy Entity
 * Defines configurable rules for on-call rotation scheduling
 * Supports per-funeral-home customization via SCD2 versioning
 */

/**
 * Branded type for On-Call Policy ID
 */
export type OnCallPolicyId = string & { readonly _brand: 'OnCallPolicyId' };

/**
 * Creates a branded OnCallPolicyId
 */
export function createOnCallPolicyId(id: string): OnCallPolicyId {
  return id as OnCallPolicyId;
}

/**
 * On-Call Policy Configuration
 * All business rules for on-call rotation are stored here,
 * allowing per-funeral-home customization without code changes
 */
export interface OnCallPolicy {
  readonly id: OnCallPolicyId;
  readonly funeralHomeId: string;

  /**
   * Minimum hours in advance for on-call assignments
   * Range: 24-96 hours (1-4 days)
   * Common values: 48 (2 days), 72 (3 days)
   */
  readonly minAdvanceNoticeHours: number;

  /**
   * Maximum hours in advance for on-call assignments
   * Range: 72-168 hours (3-7 days)
   * Common values: 168 (1 week planning window)
   */
  readonly maxAdvanceNoticeHours: number;

  /**
   * Minimum shift duration in hours
   * Range: 8-16 hours
   * Common values: 12 (typical 12-hour shift)
   */
  readonly minShiftDurationHours: number;

  /**
   * Maximum shift duration in hours
   * Range: 48-72 hours
   * Common values: 72 (3-day weekend)
   */
  readonly maxShiftDurationHours: number;

  /**
   * Maximum consecutive weekends a director can work
   * Range: 1-3 weekends
   * Common values: 2 (standard), 1 (restrictive), 3 (flexible)
   */
  readonly maxConsecutiveWeekendsOn: number;

  /**
   * Minimum rest hours required after on-call shift
   * Range: 6-12 hours
   * Common values: 8 (standard), 6 (minimum), 12 (generous)
   */
  readonly minRestHoursAfterShift: number;

  /**
   * Whether fair rotation scoring is enabled
   * When enabled: directors with fewer recent assignments prioritized
   * When disabled: any available director can be assigned
   */
  readonly enableFairRotation: boolean;

  /**
   * Maximum on-call assignments per director per quarter (13 weeks)
   * Range: 10-16 assignments
   * Common values: 13 (weekly rotation across multiple directors)
   */
  readonly maxOnCallPerDirectorPerQuarter: number;

  /**
   * Base flat-rate pay for on-call assignment
   * Paid regardless of callback hours
   * Currency: dollars
   * Common values: $100-200
   */
  readonly onCallBasePayAmount: number;

  /**
   * Multiplier for callback hour pay
   * Applied to base hourly rate when callback activated
   * Range: 1.0-2.0 (1.0 = regular rate, 1.5 = time-and-half, 2.0 = double-time)
   * Common values: 1.5 (time-and-half)
   */
  readonly callbackHourlyRate: number;

  /**
   * SCD2 Temporal Tracking
   */
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;

  /**
   * Metadata
   */
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy?: string;

  /**
   * Business key for SCD2 tracking
   */
  readonly businessKey: string;
}

/**
 * Helper function to validate OnCallPolicy configuration
 * Returns validation errors if policy violates business constraints
 */
export function validateOnCallPolicy(policy: OnCallPolicy): string[] {
  const errors: string[] = [];

  if (policy.minAdvanceNoticeHours < 24 || policy.minAdvanceNoticeHours > 96) {
    errors.push('minAdvanceNoticeHours must be between 24 and 96');
  }

  if (policy.maxAdvanceNoticeHours < 72 || policy.maxAdvanceNoticeHours > 168) {
    errors.push('maxAdvanceNoticeHours must be between 72 and 168');
  }

  if (policy.minAdvanceNoticeHours > policy.maxAdvanceNoticeHours) {
    errors.push('minAdvanceNoticeHours must be less than maxAdvanceNoticeHours');
  }

  if (policy.minShiftDurationHours < 8 || policy.minShiftDurationHours > 16) {
    errors.push('minShiftDurationHours must be between 8 and 16');
  }

  if (policy.maxShiftDurationHours < 48 || policy.maxShiftDurationHours > 72) {
    errors.push('maxShiftDurationHours must be between 48 and 72');
  }

  if (policy.minShiftDurationHours > policy.maxShiftDurationHours) {
    errors.push('minShiftDurationHours must be less than maxShiftDurationHours');
  }

  if (policy.maxConsecutiveWeekendsOn < 1 || policy.maxConsecutiveWeekendsOn > 3) {
    errors.push('maxConsecutiveWeekendsOn must be between 1 and 3');
  }

  if (policy.minRestHoursAfterShift < 6 || policy.minRestHoursAfterShift > 12) {
    errors.push('minRestHoursAfterShift must be between 6 and 12');
  }

  if (policy.maxOnCallPerDirectorPerQuarter < 10 || policy.maxOnCallPerDirectorPerQuarter > 16) {
    errors.push('maxOnCallPerDirectorPerQuarter must be between 10 and 16');
  }

  if (policy.onCallBasePayAmount < 0) {
    errors.push('onCallBasePayAmount must be non-negative');
  }

  if (policy.callbackHourlyRate < 1.0 || policy.callbackHourlyRate > 2.0) {
    errors.push('callbackHourlyRate must be between 1.0 and 2.0');
  }

  return errors;
}

/**
 * Helper to check if policy has changed significantly
 * Used to determine if notification needed
 */
export function hasSignificantPolicyChange(
  oldPolicy: OnCallPolicy,
  newPolicy: OnCallPolicy
): boolean {
  return (
    oldPolicy.minAdvanceNoticeHours !== newPolicy.minAdvanceNoticeHours ||
    oldPolicy.maxAdvanceNoticeHours !== newPolicy.maxAdvanceNoticeHours ||
    oldPolicy.minShiftDurationHours !== newPolicy.minShiftDurationHours ||
    oldPolicy.maxShiftDurationHours !== newPolicy.maxShiftDurationHours ||
    oldPolicy.maxConsecutiveWeekendsOn !== newPolicy.maxConsecutiveWeekendsOn ||
    oldPolicy.minRestHoursAfterShift !== newPolicy.minRestHoursAfterShift ||
    oldPolicy.enableFairRotation !== newPolicy.enableFairRotation ||
    oldPolicy.maxOnCallPerDirectorPerQuarter !== newPolicy.maxOnCallPerDirectorPerQuarter ||
    oldPolicy.onCallBasePayAmount !== newPolicy.onCallBasePayAmount ||
    oldPolicy.callbackHourlyRate !== newPolicy.callbackHourlyRate
  );
}
