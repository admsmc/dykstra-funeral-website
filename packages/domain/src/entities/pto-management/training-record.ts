/**
 * Training Record Entity
 * Tracks staff certifications, training completion, and renewal requirements
 */

export type TrainingRecordId = string & { readonly _brand: 'TrainingRecordId' };

export function createTrainingRecordId(id: string): TrainingRecordId {
  if (!id || id.trim() === '') {
    throw new Error('TrainingRecordId cannot be empty');
  }
  return id as TrainingRecordId;
}

export type TrainingStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type TrainingType =
  | 'embalming'
  | 'funeral_directing'
  | 'restorative_art'
  | 'customer_service'
  | 'safety'
  | 'compliance'
  | 'other';

export interface TrainingRecord {
  readonly id: TrainingRecordId;
  readonly funeralHomeId: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly trainingType: TrainingType;
  readonly trainingName: string;
  readonly requiredForRole: boolean;
  readonly status: TrainingStatus;
  readonly scheduledDate?: Date;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly completedAt?: Date;
  readonly hours: number;
  readonly cost: number;
  readonly instructor?: string;
  readonly location?: string;
  readonly certificationNumber?: string;
  readonly expiresAt?: Date;
  readonly renewalReminderSentAt?: Date;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}

/**
 * Create a new training record in scheduled status
 */
export function createTrainingRecord(
  funeralHomeId: string,
  employeeId: string,
  employeeName: string,
  trainingType: TrainingType,
  trainingName: string,
  hours: number,
  cost: number,
  createdBy: string,
  scheduledDate?: Date,
  requiredForRole: boolean = false
): TrainingRecord {
  const now = new Date();

  return {
    id: createTrainingRecordId(`training-${now.getTime()}-${Math.random()}`),
    funeralHomeId,
    employeeId,
    employeeName,
    trainingType,
    trainingName,
    hours,
    cost,
    requiredForRole,
    status: 'scheduled',
    scheduledDate,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

/**
 * Start training session
 */
export function startTraining(
  record: TrainingRecord,
  startDate: Date = new Date()
): TrainingRecord {
  if (record.status !== 'scheduled') {
    throw new Error(
      `Cannot start training in ${record.status} status`
    );
  }

  return {
    ...record,
    status: 'in_progress',
    startDate,
    updatedAt: new Date(),
  };
}

/**
 * Complete training with certification details
 */
export function completeTraining(
  record: TrainingRecord,
  hours: number,
  certificationNumber?: string,
  expiresAt?: Date,
  endDate: Date = new Date()
): TrainingRecord {
  if (record.status !== 'in_progress' && record.status !== 'scheduled') {
    throw new Error(
      `Cannot complete training in ${record.status} status`
    );
  }

  return {
    ...record,
    status: 'completed',
    hours,
    certificationNumber,
    expiresAt,
    endDate,
    completedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Cancel training
 */
export function cancelTraining(
  record: TrainingRecord,
  notes?: string
): TrainingRecord {
  if (record.status === 'completed' || record.status === 'cancelled') {
    throw new Error(
      `Cannot cancel training in ${record.status} status`
    );
  }

  return {
    ...record,
    status: 'cancelled',
    notes,
    updatedAt: new Date(),
  };
}

/**
 * Mark employee as no-show
 */
export function markNoShow(
  record: TrainingRecord,
  notes?: string
): TrainingRecord {
  if (record.status !== 'scheduled' && record.status !== 'in_progress') {
    throw new Error(
      `Cannot mark no-show for training in ${record.status} status`
    );
  }

  return {
    ...record,
    status: 'no_show',
    notes,
    updatedAt: new Date(),
  };
}

/**
 * Mark renewal reminder as sent
 */
export function markReminderSent(record: TrainingRecord): TrainingRecord {
  return {
    ...record,
    renewalReminderSentAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Check if certification is expired
 */
export function isCertificationExpired(
  record: TrainingRecord,
  now: Date = new Date()
): boolean {
  if (!record.expiresAt || record.status !== 'completed') {
    return false;
  }

  return now > record.expiresAt;
}

/**
 * Check if certification is expiring soon
 */
export function isCertificationExpiringWithinDays(
  record: TrainingRecord,
  days: number,
  now: Date = new Date()
): boolean {
  if (!record.expiresAt || record.status !== 'completed') {
    return false;
  }

  const expiryTime = record.expiresAt.getTime();
  const cutoffTime = now.getTime() + days * 24 * 60 * 60 * 1000;

  return now <= record.expiresAt && expiryTime <= cutoffTime;
}

/**
 * Calculate days until expiration
 */
export function daysUntilExpiration(
  record: TrainingRecord,
  now: Date = new Date()
): number | null {
  if (!record.expiresAt || record.status !== 'completed') {
    return null;
  }

  if (isCertificationExpired(record, now)) {
    return null; // Already expired
  }

  const daysRemaining =
    (record.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return Math.ceil(daysRemaining);
}

/**
 * Get training status display name
 */
export function getTrainingStatusDisplayName(status: TrainingStatus): string {
  const displayNames: Record<TrainingStatus, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return displayNames[status];
}

/**
 * Get training type display name
 */
export function getTrainingTypeDisplayName(type: TrainingType): string {
  const displayNames: Record<TrainingType, string> = {
    embalming: 'Embalming',
    funeral_directing: 'Funeral Directing',
    restorative_art: 'Restorative Art',
    customer_service: 'Customer Service',
    safety: 'Safety',
    compliance: 'Compliance',
    other: 'Other',
  };
  return displayNames[type];
}

/**
 * Check if training is multi-day (requires backfill)
 */
export function isMultiDayTraining(record: TrainingRecord): boolean {
  if (!record.startDate || !record.endDate) {
    return false;
  }

  const durationDays =
    (record.endDate.getTime() - record.startDate.getTime()) /
    (1000 * 60 * 60 * 24);
  return durationDays > 1;
}
