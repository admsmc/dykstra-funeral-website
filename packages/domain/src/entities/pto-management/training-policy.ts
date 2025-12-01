/**
 * Training Policy Entity
 * Defines per-funeral-home training policies and certification requirements
 * Supports role-based requirements, renewal schedules, and budget controls
 */

export type TrainingPolicyId = string & { readonly _brand: 'TrainingPolicyId' };

export function createTrainingPolicyId(id: string): TrainingPolicyId {
  if (!id || id.trim() === '') {
    throw new Error('TrainingPolicyId cannot be empty');
  }
  return id as TrainingPolicyId;
}

export type CertificationRenewalPeriod =
  | 'annual'
  | 'biennial'
  | 'triennial'
  | 'never';

export interface RequiredCertification {
  readonly certificationId: string;
  readonly certificationName: string;
  readonly trainingType: string;
  readonly renewalPeriod: CertificationRenewalPeriod;
  readonly renewalDaysNotice: number; // Days before expiry to send renewal notice
  readonly estimatedHours: number;
  readonly estimatedCost: number;
}

export interface RoleTrainingRequirement {
  readonly role: string;
  readonly requiredCertifications: RequiredCertification[];
  readonly annualTrainingHoursBudget: number;
  readonly annualTrainingBudget: number;
  readonly requiresDirectorApprovalForTraining: boolean;
  readonly maxTrainingDaysPerYear: number;
}

export interface TrainingPolicySettings {
  readonly roleRequirements: Map<string, RoleTrainingRequirement>;
  readonly enableTrainingBackfill: boolean;
  readonly backfillPremiumMultiplier: number;
  readonly defaultRenewalNoticeDay: number; // Default days before expiry to send notice
  readonly approvalRequiredAboveCost: number; // Cost threshold for approval
}

export interface TrainingPolicy {
  readonly id: TrainingPolicyId;
  readonly funeralHomeId: string;
  readonly settings: TrainingPolicySettings;
  readonly effectiveDate: Date;
  readonly endDate?: Date; // For SCD2 versioning
  readonly isCurrent: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly notes?: string;
}

/**
 * Create a default training policy for a funeral home
 */
export function createDefaultTrainingPolicy(
  funeralHomeId: string,
  createdBy: string
): TrainingPolicy {
  const now = new Date();

  return {
    id: createTrainingPolicyId(
      `training-policy-${now.getTime()}-${Math.random()}`
    ),
    funeralHomeId,
    settings: {
      roleRequirements: new Map([
        [
          'director',
          {
            role: 'director',
            requiredCertifications: [
              {
                certificationId: 'funeral-director-license',
                certificationName: 'Funeral Director License',
                trainingType: 'funeral_directing',
                renewalPeriod: 'triennial',
                renewalDaysNotice: 90,
                estimatedHours: 24,
                estimatedCost: 500,
              },
            ],
            annualTrainingHoursBudget: 40,
            annualTrainingBudget: 2000,
            requiresDirectorApprovalForTraining: false,
            maxTrainingDaysPerYear: 10,
          },
        ],
        [
          'embalmer',
          {
            role: 'embalmer',
            requiredCertifications: [
              {
                certificationId: 'embalming-license',
                certificationName: 'Embalming License',
                trainingType: 'embalming',
                renewalPeriod: 'biennial',
                renewalDaysNotice: 60,
                estimatedHours: 32,
                estimatedCost: 600,
              },
              {
                certificationId: 'restorative-art',
                certificationName: 'Restorative Art',
                trainingType: 'restorative_art',
                renewalPeriod: 'biennial',
                renewalDaysNotice: 60,
                estimatedHours: 16,
                estimatedCost: 300,
              },
            ],
            annualTrainingHoursBudget: 32,
            annualTrainingBudget: 1500,
            requiresDirectorApprovalForTraining: false,
            maxTrainingDaysPerYear: 8,
          },
        ],
        [
          'staff',
          {
            role: 'staff',
            requiredCertifications: [
              {
                certificationId: 'customer-service',
                certificationName: 'Customer Service',
                trainingType: 'customer_service',
                renewalPeriod: 'annual',
                renewalDaysNotice: 30,
                estimatedHours: 8,
                estimatedCost: 200,
              },
            ],
            annualTrainingHoursBudget: 16,
            annualTrainingBudget: 500,
            requiresDirectorApprovalForTraining: true,
            maxTrainingDaysPerYear: 4,
          },
        ],
      ]),
      enableTrainingBackfill: true,
      backfillPremiumMultiplier: 1.25,
      defaultRenewalNoticeDay: 60,
      approvalRequiredAboveCost: 1000,
    },
    effectiveDate: now,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

/**
 * Create a new version of training policy (for SCD2 updates)
 */
export function updateTrainingPolicy(
  existingPolicy: TrainingPolicy,
  newSettings: Partial<TrainingPolicySettings>,
  createdBy: string
): { oldPolicy: TrainingPolicy; newPolicy: TrainingPolicy } {
  const now = new Date();

  // End the current policy
  const oldPolicy: TrainingPolicy = {
    ...existingPolicy,
    isCurrent: false,
    endDate: now,
    updatedAt: now,
  };

  // Create new policy with updated settings
  const mergedSettings: TrainingPolicySettings = {
    ...existingPolicy.settings,
    ...newSettings,
  };

  const newPolicy: TrainingPolicy = {
    id: createTrainingPolicyId(
      `training-policy-${now.getTime()}-${Math.random()}`
    ),
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
 * Get training requirement for a specific role
 */
export function getRoleTrainingRequirement(
  policy: TrainingPolicy,
  role: string
): RoleTrainingRequirement | undefined {
  return policy.settings.roleRequirements.get(role);
}

/**
 * Get all required certifications for a role
 */
export function getRequiredCertificationsForRole(
  policy: TrainingPolicy,
  role: string
): RequiredCertification[] {
  const requirement = getRoleTrainingRequirement(policy, role);
  return requirement?.requiredCertifications ?? [];
}

/**
 * Check if training requires director approval
 */
export function requiresDirectorApproval(
  policy: TrainingPolicy,
  role: string
): boolean {
  const requirement = getRoleTrainingRequirement(policy, role);
  return requirement?.requiresDirectorApprovalForTraining ?? false;
}

/**
 * Check if cost requires approval
 */
export function costRequiresApproval(
  policy: TrainingPolicy,
  cost: number
): boolean {
  return cost > policy.settings.approvalRequiredAboveCost;
}

/**
 * Get annual training budget for a role
 */
export function getAnnualBudgetForRole(
  policy: TrainingPolicy,
  role: string
): { hoursRemaining: number; budgetRemaining: number } | null {
  const requirement = getRoleTrainingRequirement(policy, role);
  if (!requirement) {
    return null;
  }

  return {
    hoursRemaining: requirement.annualTrainingHoursBudget,
    budgetRemaining: requirement.annualTrainingBudget,
  };
}

/**
 * Check if employee can take training based on budget
 */
export function canTakeTraining(
  policy: TrainingPolicy,
  role: string,
  trainingHours: number,
  trainingCost: number,
  hoursUsedThisYear: number,
  budgetUsedThisYear: number
): { canTake: boolean; reason?: string } {
  const requirement = getRoleTrainingRequirement(policy, role);
  if (!requirement) {
    return { canTake: false, reason: `No training requirements found for role: ${role}` };
  }

  const hoursRemaining =
    requirement.annualTrainingHoursBudget - hoursUsedThisYear;
  if (trainingHours > hoursRemaining) {
    return {
      canTake: false,
      reason: `Insufficient training hours budget. Remaining: ${hoursRemaining}, Required: ${trainingHours}`,
    };
  }

  const budgetRemaining =
    requirement.annualTrainingBudget - budgetUsedThisYear;
  if (trainingCost > budgetRemaining) {
    return {
      canTake: false,
      reason: `Insufficient training budget. Remaining: $${budgetRemaining}, Required: $${trainingCost}`,
    };
  }

  return { canTake: true };
}

/**
 * Get next renewal date for a certification
 */
export function getNextRenewalDate(
  certificationExpiryDate: Date,
  renewalPeriod: CertificationRenewalPeriod
): Date {
  const nextRenewal = new Date(certificationExpiryDate);

  switch (renewalPeriod) {
    case 'annual':
      nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
      break;
    case 'biennial':
      nextRenewal.setFullYear(nextRenewal.getFullYear() + 2);
      break;
    case 'triennial':
      nextRenewal.setFullYear(nextRenewal.getFullYear() + 3);
      break;
    case 'never':
      return new Date(8640000000000000); // Far future date
  }

  return nextRenewal;
}

/**
 * Calculate when renewal notice should be sent
 */
export function calculateRenewalNoticeDate(
  certificationExpiryDate: Date,
  noticeDaysInAdvance: number
): Date {
  const noticeDate = new Date(certificationExpiryDate);
  noticeDate.setDate(
    noticeDate.getDate() - noticeDaysInAdvance
  );
  return noticeDate;
}

/**
 * Check if renewal notice should be sent
 */
export function shouldSendRenewalNotice(
  certificationExpiryDate: Date,
  noticeDaysInAdvance: number,
  now: Date = new Date()
): boolean {
  const noticeDate = calculateRenewalNoticeDate(
    certificationExpiryDate,
    noticeDaysInAdvance
  );
  return now >= noticeDate && now < certificationExpiryDate;
}

/**
 * Validate training policy for consistency
 */
export function validateTrainingPolicy(policy: TrainingPolicy): string[] {
  const errors: string[] = [];

  if (policy.settings.backfillPremiumMultiplier < 1) {
    errors.push('backfillPremiumMultiplier must be at least 1.0');
  }

  if (policy.settings.defaultRenewalNoticeDay < 0) {
    errors.push('defaultRenewalNoticeDay must be non-negative');
  }

  if (policy.settings.approvalRequiredAboveCost < 0) {
    errors.push('approvalRequiredAboveCost must be non-negative');
  }

  // Validate role requirements
  policy.settings.roleRequirements.forEach((requirement, role) => {
    if (requirement.annualTrainingHoursBudget < 0) {
      errors.push(`annualTrainingHoursBudget must be non-negative for role: ${role}`);
    }

    if (requirement.annualTrainingBudget < 0) {
      errors.push(`annualTrainingBudget must be non-negative for role: ${role}`);
    }

    if (requirement.maxTrainingDaysPerYear < 0) {
      errors.push(`maxTrainingDaysPerYear must be non-negative for role: ${role}`);
    }
  });

  return errors;
}

/**
 * Clone policy for new funeral home
 */
export function clonePolicyForFuneralHome(
  sourcePolicy: TrainingPolicy,
  newFuneralHomeId: string,
  createdBy: string
): TrainingPolicy {
  const now = new Date();

  return {
    id: createTrainingPolicyId(
      `training-policy-${now.getTime()}-${Math.random()}`
    ),
    funeralHomeId: newFuneralHomeId,
    settings: JSON.parse(JSON.stringify(sourcePolicy.settings)), // Deep copy
    effectiveDate: now,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}
