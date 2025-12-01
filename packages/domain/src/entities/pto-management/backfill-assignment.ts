/**
 * Backfill Assignment Entity
 * Tracks coverage assignments when staff are on PTO or training
 * Supports premium pay calculation and confirmation workflow
 */

export type BackfillAssignmentId = string & {
  readonly _brand: 'BackfillAssignmentId';
};

export function createBackfillAssignmentId(id: string): BackfillAssignmentId {
  if (!id || id.trim() === '') {
    throw new Error('BackfillAssignmentId cannot be empty');
  }
  return id as BackfillAssignmentId;
}

export type BackfillStatus =
  | 'suggested'
  | 'pending_confirmation'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type BackfillReason = 'pto' | 'training' | 'other';

export type PremiumType =
  | 'none'
  | 'overtime'
  | 'holiday'
  | 'training_coverage'
  | 'emergency';

export interface BackfillAssignment {
  readonly id: BackfillAssignmentId;
  readonly funeralHomeId: string;
  readonly absenceId: string; // PTO request ID or training record ID
  readonly absenceType: BackfillReason;
  readonly absenceStartDate: Date;
  readonly absenceEndDate: Date;
  readonly absenceEmployeeId: string;
  readonly absenceEmployeeName: string;
  readonly absenceEmployeeRole: string;
  readonly backfillEmployeeId: string;
  readonly backfillEmployeeName: string;
  readonly backfillEmployeeRole: string;
  readonly status: BackfillStatus;
  readonly suggestedAt: Date;
  readonly confirmedAt?: Date;
  readonly confirmedBy?: string;
  readonly rejectedAt?: Date;
  readonly rejectionReason?: string;
  readonly completedAt?: Date;
  readonly premiumType: PremiumType;
  readonly premiumMultiplier: number; // e.g., 1.5 for time-and-a-half
  readonly estimatedHours: number;
  readonly actualHours?: number;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}

/**
 * Create a new backfill assignment in suggested status
 */
export function createBackfillAssignment(
  funeralHomeId: string,
  absenceId: string,
  absenceType: BackfillReason,
  absenceStartDate: Date,
  absenceEndDate: Date,
  absenceEmployeeId: string,
  absenceEmployeeName: string,
  absenceEmployeeRole: string,
  backfillEmployeeId: string,
  backfillEmployeeName: string,
  backfillEmployeeRole: string,
  createdBy: string,
  premiumType: PremiumType = 'none',
  premiumMultiplier: number = 1,
  estimatedHours: number = 8
): BackfillAssignment {
  const now = new Date();

  return {
    id: createBackfillAssignmentId(
      `backfill-${now.getTime()}-${Math.random()}`
    ),
    funeralHomeId,
    absenceId,
    absenceType,
    absenceStartDate,
    absenceEndDate,
    absenceEmployeeId,
    absenceEmployeeName,
    absenceEmployeeRole,
    backfillEmployeeId,
    backfillEmployeeName,
    backfillEmployeeRole,
    status: 'suggested',
    suggestedAt: now,
    premiumType,
    premiumMultiplier,
    estimatedHours,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

/**
 * Send backfill assignment to employee for confirmation
 */
export function sendForConfirmation(
  assignment: BackfillAssignment
): BackfillAssignment {
  if (assignment.status !== 'suggested') {
    throw new Error(
      `Cannot send for confirmation from ${assignment.status} status`
    );
  }

  return {
    ...assignment,
    status: 'pending_confirmation',
    updatedAt: new Date(),
  };
}

/**
 * Confirm backfill assignment
 */
export function confirmBackfillAssignment(
  assignment: BackfillAssignment,
  confirmedBy: string,
  actualHours?: number
): BackfillAssignment {
  if (
    assignment.status !== 'pending_confirmation' &&
    assignment.status !== 'suggested'
  ) {
    throw new Error(
      `Cannot confirm backfill assignment in ${assignment.status} status`
    );
  }

  return {
    ...assignment,
    status: 'confirmed',
    confirmedAt: new Date(),
    confirmedBy,
    actualHours,
    updatedAt: new Date(),
  };
}

/**
 * Reject backfill assignment
 */
export function rejectBackfillAssignment(
  assignment: BackfillAssignment,
  rejectionReason: string
): BackfillAssignment {
  if (
    assignment.status !== 'pending_confirmation' &&
    assignment.status !== 'suggested'
  ) {
    throw new Error(
      `Cannot reject backfill assignment in ${assignment.status} status`
    );
  }

  return {
    ...assignment,
    status: 'rejected',
    rejectedAt: new Date(),
    rejectionReason,
    updatedAt: new Date(),
  };
}

/**
 * Cancel backfill assignment
 */
export function cancelBackfillAssignment(
  assignment: BackfillAssignment,
  reason?: string
): BackfillAssignment {
  if (
    assignment.status === 'completed' ||
    assignment.status === 'cancelled'
  ) {
    throw new Error(
      `Cannot cancel backfill assignment in ${assignment.status} status`
    );
  }

  return {
    ...assignment,
    status: 'cancelled',
    notes: reason,
    updatedAt: new Date(),
  };
}

/**
 * Mark backfill assignment as completed
 */
export function completeBackfillAssignment(
  assignment: BackfillAssignment,
  actualHours: number
): BackfillAssignment {
  if (assignment.status !== 'confirmed') {
    throw new Error(
      `Cannot complete backfill assignment in ${assignment.status} status`
    );
  }

  return {
    ...assignment,
    status: 'completed',
    actualHours,
    completedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Calculate premium pay for backfill assignment
 */
export function calculatePremiumPay(
  assignment: BackfillAssignment,
  baseHourlyRate: number
): number {
  const hours = assignment.actualHours ?? assignment.estimatedHours;
  return hours * baseHourlyRate * assignment.premiumMultiplier;
}

/**
 * Check if backfill assignment is pending confirmation
 */
export function isPendingConfirmation(
  assignment: BackfillAssignment
): boolean {
  return assignment.status === 'pending_confirmation';
}

/**
 * Check if backfill assignment is confirmed
 */
export function isConfirmed(assignment: BackfillAssignment): boolean {
  return assignment.status === 'confirmed';
}

/**
 * Check if backfill assignment is for a specific date
 */
export function isForDate(
  assignment: BackfillAssignment,
  date: Date
): boolean {
  const dateTime = date.getTime();
  return (
    dateTime >= assignment.absenceStartDate.getTime() &&
    dateTime <= assignment.absenceEndDate.getTime()
  );
}

/**
 * Check if backfill assignment overlaps with date range
 */
export function overlapsDateRange(
  assignment: BackfillAssignment,
  startDate: Date,
  endDate: Date
): boolean {
  const assignmentStart = assignment.absenceStartDate.getTime();
  const assignmentEnd = assignment.absenceEndDate.getTime();
  const rangeStart = startDate.getTime();
  const rangeEnd = endDate.getTime();

  return assignmentStart < rangeEnd && assignmentEnd > rangeStart;
}

/**
 * Check if backfill employee is already assigned during absence period
 */
export function hasExistingAssignmentForBackfillEmployee(
  assignment: BackfillAssignment,
  existingAssignments: BackfillAssignment[]
): boolean {
  return existingAssignments.some((existing) => {
    if (
      existing.status === 'cancelled' ||
      existing.status === 'rejected'
    ) {
      return false;
    }

    if (existing.backfillEmployeeId !== assignment.backfillEmployeeId) {
      return false;
    }

    return overlapsDateRange(
      existing,
      assignment.absenceStartDate,
      assignment.absenceEndDate
    );
  });
}

/**
 * Get backfill status display name
 */
export function getBackfillStatusDisplayName(status: BackfillStatus): string {
  const displayNames: Record<BackfillStatus, string> = {
    suggested: 'Suggested',
    pending_confirmation: 'Pending Confirmation',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };
  return displayNames[status];
}

/**
 * Get premium type display name
 */
export function getPremiumTypeDisplayName(type: PremiumType): string {
  const displayNames: Record<PremiumType, string> = {
    none: 'No Premium',
    overtime: 'Overtime',
    holiday: 'Holiday Premium',
    training_coverage: 'Training Coverage',
    emergency: 'Emergency',
  };
  return displayNames[type];
}

/**
 * Suggest appropriate premium type based on absence dates and type
 */
export function suggestPremiumType(
  assignment: BackfillAssignment,
  isHoliday: boolean
): PremiumType {
  if (isHoliday) {
    return 'holiday';
  }

  if (assignment.absenceType === 'training') {
    return 'training_coverage';
  }

  // Default to no premium for regular PTO
  return 'none';
}

/**
 * Calculate coverage duration in hours (assuming 8-hour work days)
 */
export function calculateCoverageDurationInHours(
  assignment: BackfillAssignment
): number {
  const durationMs =
    assignment.absenceEndDate.getTime() -
    assignment.absenceStartDate.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  return durationDays * 8; // Assume 8-hour work days
}
