/**
 * Service Coverage Policy Entity
 * Defines configurable staffing rules for different service types
 * Supports per-funeral-home customization via SCD2 versioning
 */

/**
 * Branded type for Service Coverage Policy ID
 */
export type ServiceCoveragePolicyId = string & { readonly _brand: 'ServiceCoveragePolicyId' };

/**
 * Creates a branded ServiceCoveragePolicyId
 */
export function createServiceCoveragePolicyId(id: string): ServiceCoveragePolicyId {
  return id as ServiceCoveragePolicyId;
}

/**
 * Staff role types for service coverage
 */
export type StaffRole = 'director' | 'staff' | 'driver';

/**
 * Service type supported by funeral home
 */
export type ServiceTypeKey = 'traditional_funeral' | 'memorial_service' | 'graveside' | 'visitation';

/**
 * Staffing requirement for a specific role
 */
export interface StaffingRequirementConfig {
  readonly role: StaffRole;
  readonly minCount: number;
  readonly maxCount: number;
  readonly requiresLicense: boolean;
}

/**
 * Staffing rules for a service type
 */
export interface ServiceTypeStaffingConfig {
  readonly serviceType: ServiceTypeKey;
  readonly requirements: readonly StaffingRequirementConfig[];
  readonly maxDurationHours: number;
  readonly directorRequired: boolean;
}

/**
 * Service Coverage Policy Configuration
 * All staffing rules for services are stored here,
 * allowing per-funeral-home customization without code changes
 */
export interface ServiceCoveragePolicy {
  readonly id: ServiceCoveragePolicyId;
  readonly funeralHomeId: string;

  /**
   * Staffing requirements by service type
   * Each service type can have different staffing needs
   */
  readonly serviceTypeStaffing: readonly ServiceTypeStaffingConfig[];

  /**
   * Whether a director is required for all services
   * Override: true = always require director, false = depends on serviceTypeStaffing
   */
  readonly directorRequired: boolean;

  /**
   * Minimum rest hours required between shifts for same staff member
   * Range: 6-12 hours
   * Common values: 8 (standard), 6 (minimum), 12 (generous)
   */
  readonly minRestHoursBetweenShifts: number;

  /**
   * Hours before service to validate coverage
   * Sends alerts if still understaffed at this point
   * Range: 12-48 hours
   * Common values: 24 (1 day), 48 (2 days)
   */
  readonly validateCoverageHoursBefore: number;

  /**
   * Whether to prioritize staff with specialty certifications
   * true = prefer certified embalmers, funeral directors
   * false = any qualified staff acceptable
   */
  readonly prioritizeSpecialtyStaff: boolean;

  /**
   * Whether to allow double-booking staff for overlapping services
   * true = allow (small homes may not have choice)
   * false = prevent (standard practice, ensures quality)
   */
  readonly allowDoubleBooking: boolean;

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
 * Helper function to validate ServiceCoveragePolicy configuration
 * Returns validation errors if policy violates business constraints
 */
export function validateServiceCoveragePolicy(policy: ServiceCoveragePolicy): string[] {
  const errors: string[] = [];

  if (policy.minRestHoursBetweenShifts < 6 || policy.minRestHoursBetweenShifts > 12) {
    errors.push('minRestHoursBetweenShifts must be between 6 and 12');
  }

  if (policy.validateCoverageHoursBefore < 12 || policy.validateCoverageHoursBefore > 48) {
    errors.push('validateCoverageHoursBefore must be between 12 and 48');
  }

  // Validate service type staffing configs
  for (const serviceConfig of policy.serviceTypeStaffing) {
    if (serviceConfig.maxDurationHours < 2 || serviceConfig.maxDurationHours > 12) {
      errors.push(
        `maxDurationHours for ${serviceConfig.serviceType} must be between 2 and 12`
      );
    }

    // Validate each requirement
    for (const requirement of serviceConfig.requirements) {
      if (requirement.minCount < 0 || requirement.minCount > 10) {
        errors.push(
          `minCount for ${requirement.role} in ${serviceConfig.serviceType} must be between 0 and 10`
        );
      }

      if (requirement.maxCount < 1 || requirement.maxCount > 20) {
        errors.push(
          `maxCount for ${requirement.role} in ${serviceConfig.serviceType} must be between 1 and 20`
        );
      }

      if (requirement.minCount > requirement.maxCount) {
        errors.push(
          `minCount cannot exceed maxCount for ${requirement.role} in ${serviceConfig.serviceType}`
        );
      }
    }
  }

  return errors;
}

/**
 * Helper to check if policy has changed significantly
 * Used to determine if notification needed
 */
export function hasSignificantPolicyCoverageChange(
  oldPolicy: ServiceCoveragePolicy,
  newPolicy: ServiceCoveragePolicy
): boolean {
  return (
    oldPolicy.directorRequired !== newPolicy.directorRequired ||
    oldPolicy.minRestHoursBetweenShifts !== newPolicy.minRestHoursBetweenShifts ||
    oldPolicy.validateCoverageHoursBefore !== newPolicy.validateCoverageHoursBefore ||
    oldPolicy.prioritizeSpecialtyStaff !== newPolicy.prioritizeSpecialtyStaff ||
    oldPolicy.allowDoubleBooking !== newPolicy.allowDoubleBooking ||
    JSON.stringify(oldPolicy.serviceTypeStaffing) !==
      JSON.stringify(newPolicy.serviceTypeStaffing)
  );
}
