/**
 * PTO Policy Entity
 * Defines per-funeral-home PTO policies with SCD2 versioning support
 * Policies control notice requirements, annual limits, role-based rules, and blackout dates
 */

export type PtoPolicyId = string & { readonly _brand: 'PtoPolicyId' };

export function createPtoPolicyId(id: string): PtoPolicyId {
  if (!id || id.trim() === '') {
    throw new Error('PtoPolicyId cannot be empty');
  }
  return id as PtoPolicyId;
}

export interface BlackoutDateRange {
  readonly name: string;
  readonly description?: string;
  readonly startDate: Date;
  readonly endDate: Date;
}

export interface RoleSpecificPolicy {
  readonly role: string;
  readonly requiresDirectorApproval: boolean;
  readonly requiresBackfill: boolean;
  readonly maxConcurrentEmployees: number;
}

export interface PtoPolicySettings {
  readonly minAdvanceNoticeDays: number; // 7-28 days
  readonly minAdvanceNoticeHolidaysDays: number; // 28-42 days
  readonly annualPtoDaysPerEmployee: number; // 15-25 days
  readonly maxConcurrentEmployeesOnPto: number; // 1-3 or percentage
  readonly maxConsecutivePtoDays: number; // Maximum days in single request
  readonly roleSpecificPolicies: Map<string, RoleSpecificPolicy>;
  readonly blackoutDates: BlackoutDateRange[];
  readonly enablePremiumPayForBackfill: boolean;
  readonly premiumMultiplier: number; // e.g., 1.5 for time-and-a-half
}

export interface PtoPolicy {
  readonly id: PtoPolicyId;
  readonly funeralHomeId: string;
  readonly settings: PtoPolicySettings;
  readonly effectiveDate: Date;
  readonly endDate?: Date; // For SCD2 versioning
  readonly isCurrent: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly notes?: string;
}

/**
 * Create a default PTO policy for a funeral home
 */
export function createDefaultPtoPolicy(
  funeralHomeId: string,
  createdBy: string
): PtoPolicy {
  const now = new Date();

  return {
    id: createPtoPolicyId(`pto-policy-${now.getTime()}-${Math.random()}`),
    funeralHomeId,
    settings: {
      minAdvanceNoticeDays: 14,
      minAdvanceNoticeHolidaysDays: 30,
      annualPtoDaysPerEmployee: 20,
      maxConcurrentEmployeesOnPto: 2,
      maxConsecutivePtoDays: 10,
      roleSpecificPolicies: new Map([
        [
          'director',
          {
            role: 'director',
            requiresDirectorApproval: true,
            requiresBackfill: true,
            maxConcurrentEmployees: 1,
          },
        ],
        [
          'embalmer',
          {
            role: 'embalmer',
            requiresDirectorApproval: false,
            requiresBackfill: true,
            maxConcurrentEmployees: 2,
          },
        ],
        [
          'staff',
          {
            role: 'staff',
            requiresDirectorApproval: false,
            requiresBackfill: false,
            maxConcurrentEmployees: 3,
          },
        ],
      ]),
      blackoutDates: [],
      enablePremiumPayForBackfill: true,
      premiumMultiplier: 1.5,
    },
    effectiveDate: now,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

/**
 * Create a new version of PTO policy (for SCD2 updates)
 */
export function updatePtoPolicy(
  existingPolicy: PtoPolicy,
  newSettings: Partial<PtoPolicySettings>,
  createdBy: string
): { oldPolicy: PtoPolicy; newPolicy: PtoPolicy } {
  const now = new Date();

  // End the current policy
  const oldPolicy: PtoPolicy = {
    ...existingPolicy,
    isCurrent: false,
    endDate: now,
    updatedAt: now,
  };

  // Create new policy with updated settings
  const mergedSettings: PtoPolicySettings = {
    ...existingPolicy.settings,
    ...newSettings,
  };

  const newPolicy: PtoPolicy = {
    id: createPtoPolicyId(`pto-policy-${now.getTime()}-${Math.random()}`),
    funeralHomeId: existingPolicy.funeralHomeId,
    settings: mergedSettings,
    effectiveDate: now,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  return { oldPolicy, newPolicy };
}

/**
 * Get advance notice requirement for a specific PTO type
 */
export function getAdvanceNoticeRequirement(
  policy: PtoPolicy,
  isHoliday: boolean
): number {
  return isHoliday
    ? policy.settings.minAdvanceNoticeHolidaysDays
    : policy.settings.minAdvanceNoticeDays;
}

/**
 * Get role-specific policy
 */
export function getRolePolicy(
  policy: PtoPolicy,
  role: string
): RoleSpecificPolicy | undefined {
  return policy.settings.roleSpecificPolicies.get(role);
}

/**
 * Check if role requires director approval for PTO
 */
export function requiresDirectorApproval(
  policy: PtoPolicy,
  role: string
): boolean {
  const rolePolicy = getRolePolicy(policy, role);
  return rolePolicy?.requiresDirectorApproval ?? false;
}

/**
 * Check if role requires backfill coverage
 */
export function requiresBackfill(policy: PtoPolicy, role: string): boolean {
  const rolePolicy = getRolePolicy(policy, role);
  return rolePolicy?.requiresBackfill ?? false;
}

/**
 * Get max concurrent employees allowed on PTO for a specific role
 */
export function getMaxConcurrentForRole(
  policy: PtoPolicy,
  role: string
): number {
  const rolePolicy = getRolePolicy(policy, role);
  if (!rolePolicy) {
    // Default to global max if role not found
    return policy.settings.maxConcurrentEmployeesOnPto;
  }
  return rolePolicy.maxConcurrentEmployees;
}

/**
 * Check if a date falls within any blackout period
 */
export function isBlackoutDate(policy: PtoPolicy, date: Date): boolean {
  return policy.settings.blackoutDates.some((blackout) => {
    const dateTime = date.getTime();
    return (
      dateTime >= blackout.startDate.getTime() &&
      dateTime <= blackout.endDate.getTime()
    );
  });
}

/**
 * Check if date range overlaps with any blackout period
 */
export function overlapsBlackoutDates(
  policy: PtoPolicy,
  startDate: Date,
  endDate: Date
): boolean {
  return policy.settings.blackoutDates.some((blackout) => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const blackoutStart = blackout.startDate.getTime();
    const blackoutEnd = blackout.endDate.getTime();

    return start < blackoutEnd && end > blackoutStart;
  });
}

/**
 * Get overlapping blackout periods
 */
export function getOverlappingBlackoutDates(
  policy: PtoPolicy,
  startDate: Date,
  endDate: Date
): BlackoutDateRange[] {
  return policy.settings.blackoutDates.filter((blackout) => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const blackoutStart = blackout.startDate.getTime();
    const blackoutEnd = blackout.endDate.getTime();

    return start < blackoutEnd && end > blackoutStart;
  });
}

/**
 * Add a blackout date range to policy
 */
export function addBlackoutDate(
  policy: PtoPolicy,
  blackoutDate: BlackoutDateRange,
  createdBy: string
): { oldPolicy: PtoPolicy; newPolicy: PtoPolicy } {
  const newSettings: Partial<PtoPolicySettings> = {
    blackoutDates: [...policy.settings.blackoutDates, blackoutDate],
  };

  return updatePtoPolicy(policy, newSettings, createdBy);
}

/**
 * Remove a blackout date range from policy
 */
export function removeBlackoutDate(
  policy: PtoPolicy,
  blackoutDateName: string,
  createdBy: string
): { oldPolicy: PtoPolicy; newPolicy: PtoPolicy } {
  const newSettings: Partial<PtoPolicySettings> = {
    blackoutDates: policy.settings.blackoutDates.filter(
      (bd) => bd.name !== blackoutDateName
    ),
  };

  return updatePtoPolicy(policy, newSettings, createdBy);
}

/**
 * Validate policy settings for consistency
 */
export function validatePtoPolicy(policy: PtoPolicy): string[] {
  const errors: string[] = [];

  if (policy.settings.minAdvanceNoticeDays < 0) {
    errors.push('minAdvanceNoticeDays must be non-negative');
  }

  if (policy.settings.minAdvanceNoticeHolidaysDays < 0) {
    errors.push('minAdvanceNoticeHolidaysDays must be non-negative');
  }

  if (policy.settings.annualPtoDaysPerEmployee < 0) {
    errors.push('annualPtoDaysPerEmployee must be non-negative');
  }

  if (policy.settings.maxConcurrentEmployeesOnPto < 1) {
    errors.push('maxConcurrentEmployeesOnPto must be at least 1');
  }

  if (policy.settings.maxConsecutivePtoDays < 1) {
    errors.push('maxConsecutivePtoDays must be at least 1');
  }

  if (policy.settings.premiumMultiplier < 1) {
    errors.push('premiumMultiplier must be at least 1.0');
  }

  if (
    policy.settings.minAdvanceNoticeHolidaysDays <
    policy.settings.minAdvanceNoticeDays
  ) {
    errors.push(
      'minAdvanceNoticeHolidaysDays should be greater than or equal to minAdvanceNoticeDays'
    );
  }

  // Check for overlapping blackout dates
  for (let i = 0; i < policy.settings.blackoutDates.length; i++) {
    for (let j = i + 1; j < policy.settings.blackoutDates.length; j++) {
      const bd1 = policy.settings.blackoutDates[i];
      const bd2 = policy.settings.blackoutDates[j];

      if (bd1 && bd2) {
        if (
          bd1.startDate < bd2.endDate &&
          bd1.endDate > bd2.startDate
        ) {
          errors.push(
            `Blackout dates "${bd1.name}" and "${bd2.name}" overlap`
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Clone policy for new funeral home
 */
export function clonePolicyForFuneralHome(
  sourcePolicy: PtoPolicy,
  newFuneralHomeId: string,
  createdBy: string
): PtoPolicy {
  const now = new Date();

  return {
    id: createPtoPolicyId(`pto-policy-${now.getTime()}-${Math.random()}`),
    funeralHomeId: newFuneralHomeId,
    settings: JSON.parse(JSON.stringify(sourcePolicy.settings)), // Deep copy
    effectiveDate: now,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}
