/**
 * PTO Request Entity
 * Represents a staff member's request for paid time off
 * Supports policy-driven validation and backfill coverage tracking
 */

export type PtoRequestId = string & { readonly _brand: 'PtoRequestId' };

export function createPtoRequestId(id: string): PtoRequestId {
  if (!id || id.trim() === '') {
    throw new Error('PtoRequestId cannot be empty');
  }
  return id as PtoRequestId;
}

export type PtoRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'taken'
  | 'cancelled';

export type PtoType =
  | 'vacation'
  | 'sick_leave'
  | 'bereavement'
  | 'unpaid'
  | 'personal';

export interface PtoRequest {
  readonly id: PtoRequestId;
  readonly funeralHomeId: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly ptoType: PtoType;
  readonly requestedDays: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly reason?: string;
  readonly status: PtoRequestStatus;
  readonly requestedAt: Date;
  readonly respondedAt?: Date;
  readonly respondedBy?: string;
  readonly rejectionReason?: string;
  readonly backfillRequirementsMet: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}

/**
 * Create a new PTO request in draft status
 */
export function createPtoRequest(
  funeralHomeId: string,
  employeeId: string,
  employeeName: string,
  ptoType: PtoType,
  startDate: Date,
  endDate: Date,
  createdBy: string,
  reason?: string
): PtoRequest {
  const now = new Date();
  const requestedDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: createPtoRequestId(`pto-${now.getTime()}-${Math.random()}`),
    funeralHomeId,
    employeeId,
    employeeName,
    ptoType,
    requestedDays,
    startDate,
    endDate,
    reason,
    status: 'draft',
    requestedAt: now,
    backfillRequirementsMet: false,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

/**
 * Submit a draft PTO request for approval
 */
export function submitPtoRequest(request: PtoRequest): PtoRequest {
  if (request.status !== 'draft') {
    throw new Error(
      `Cannot submit PTO request in ${request.status} status`
    );
  }

  return {
    ...request,
    status: 'pending',
    requestedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Approve a pending PTO request
 */
export function approvePtoRequest(
  request: PtoRequest,
  respondedBy: string
): PtoRequest {
  if (request.status !== 'pending') {
    throw new Error(
      `Cannot approve PTO request in ${request.status} status`
    );
  }

  if (!request.backfillRequirementsMet) {
    throw new Error('Cannot approve PTO request without backfill coverage');
  }

  return {
    ...request,
    status: 'approved',
    respondedAt: new Date(),
    respondedBy,
    updatedAt: new Date(),
  };
}

/**
 * Reject a pending PTO request
 */
export function rejectPtoRequest(
  request: PtoRequest,
  rejectionReason: string,
  respondedBy: string
): PtoRequest {
  if (request.status !== 'pending') {
    throw new Error(
      `Cannot reject PTO request in ${request.status} status`
    );
  }

  return {
    ...request,
    status: 'rejected',
    rejectionReason,
    respondedAt: new Date(),
    respondedBy,
    updatedAt: new Date(),
  };
}

/**
 * Mark approved PTO as taken (when the PTO period starts)
 */
export function markPtoAsTaken(request: PtoRequest): PtoRequest {
  if (request.status !== 'approved') {
    throw new Error(
      `Cannot mark PTO as taken in ${request.status} status`
    );
  }

  return {
    ...request,
    status: 'taken',
    updatedAt: new Date(),
  };
}

/**
 * Cancel a PTO request
 */
export function cancelPtoRequest(request: PtoRequest): PtoRequest {
  if (request.status === 'taken' || request.status === 'cancelled') {
    throw new Error(
      `Cannot cancel PTO request in ${request.status} status`
    );
  }

  return {
    ...request,
    status: 'cancelled',
    updatedAt: new Date(),
  };
}

/**
 * Mark backfill requirements as met
 */
export function markBackfillRequirementsMet(
  request: PtoRequest
): PtoRequest {
  return {
    ...request,
    backfillRequirementsMet: true,
    updatedAt: new Date(),
  };
}

/**
 * Check if PTO request meets advance notice requirement
 */
export function meetsAdvanceNoticeRequirement(
  request: PtoRequest,
  minAdvanceDays: number,
  now: Date = new Date()
): boolean {
  const daysUntilStart =
    (request.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilStart >= minAdvanceDays;
}

/**
 * Check if PTO request is within blackout dates
 */
export function isWithinBlackoutDates(
  request: PtoRequest,
  blackoutDates: { startDate: Date; endDate: Date }[]
): boolean {
  return blackoutDates.some((blackout) => {
    const requestStart = request.startDate.getTime();
    const requestEnd = request.endDate.getTime();
    const blackoutStart = blackout.startDate.getTime();
    const blackoutEnd = blackout.endDate.getTime();

    // Check for overlap
    return requestStart < blackoutEnd && requestEnd > blackoutStart;
  });
}

/**
 * Check if PTO request exceeds maximum consecutive days
 */
export function exceedsMaxConsecutiveDays(
  request: PtoRequest,
  maxConsecutiveDays: number
): boolean {
  return request.requestedDays > maxConsecutiveDays;
}

/**
 * Check if PTO request overlaps with existing approved/taken requests
 */
export function hasScheduleConflict(
  request: PtoRequest,
  existingRequests: PtoRequest[]
): boolean {
  return existingRequests.some((existing) => {
    // Only check against approved or taken requests
    if (existing.status !== 'approved' && existing.status !== 'taken') {
      return false;
    }

    // Don't check against self
    if (existing.id === request.id) {
      return false;
    }

    // Check for overlap
    const requestStart = request.startDate.getTime();
    const requestEnd = request.endDate.getTime();
    const existingStart = existing.startDate.getTime();
    const existingEnd = existing.endDate.getTime();

    return requestStart < existingEnd && requestEnd > existingStart;
  });
}

/**
 * Check if PTO is currently in progress
 */
export function isCurrentlyOnPto(
  request: PtoRequest,
  now: Date = new Date()
): boolean {
  if (request.status !== 'taken') {
    return false;
  }

  const currentTime = now.getTime();
  return (
    currentTime >= request.startDate.getTime() &&
    currentTime <= request.endDate.getTime()
  );
}

/**
 * Calculate days used (partial days if current date is within PTO period)
 */
export function calculateDaysUsed(
  request: PtoRequest,
  now: Date = new Date()
): number {
  if (request.status !== 'taken') {
    return 0;
  }

  const currentTime = now.getTime();

  // If PTO hasn't started yet
  if (currentTime < request.startDate.getTime()) {
    return 0;
  }

  // If PTO is over
  if (currentTime > request.endDate.getTime()) {
    return request.requestedDays;
  }

  // Calculate partial days used
  const daysUsed =
    (currentTime - request.startDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.ceil(daysUsed);
}

/**
 * Check if PTO can be cancelled (typically not after it's taken)
 */
export function canBeCancelled(request: PtoRequest): boolean {
  return request.status !== 'taken' && request.status !== 'cancelled';
}

/**
 * Get PTO type display name
 */
export function getPtoTypeDisplayName(ptoType: PtoType): string {
  const displayNames: Record<PtoType, string> = {
    vacation: 'Vacation',
    sick_leave: 'Sick Leave',
    bereavement: 'Bereavement Leave',
    unpaid: 'Unpaid Leave',
    personal: 'Personal Leave',
  };
  return displayNames[ptoType];
}
