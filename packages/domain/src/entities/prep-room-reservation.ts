/**
 * Preparation Room Reservation Entity
 * Represents a booking of a preparation room for embalming work
 */

import type { PrepRoomId } from './prep-room';

export type ReservationId = string & { readonly _brand: 'ReservationId' };

export function createReservationId(id: string): ReservationId {
  if (!id || id.trim() === '') {
    throw new Error('ReservationId cannot be empty');
  }
  return id as ReservationId;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'auto_released' | 'cancelled';
export type ReservationPriority = 'normal' | 'urgent';

export interface PrepRoomReservation {
  readonly id: ReservationId;
  readonly prepRoomId: PrepRoomId;
  readonly embalmerId: string;
  readonly caseId: string;
  readonly familyId: string;
  readonly status: ReservationStatus;
  readonly priority: ReservationPriority;
  readonly reservedFrom: Date;
  readonly reservedTo: Date;
  readonly checkedInAt?: Date;
  readonly checkedOutAt?: Date;
  readonly actualDuration?: number; // in minutes
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}

/**
 * Create a new reservation with pending status
 * Duration is typically 2-8 hours
 */
export function createPrepRoomReservation(
  prepRoomId: PrepRoomId,
  embalmerId: string,
  caseId: string,
  familyId: string,
  reservedFrom: Date,
  durationMinutes: number,
  priority: ReservationPriority,
  createdBy: string,
  notes?: string
): PrepRoomReservation {
  const now = new Date();
  const reservedTo = new Date(reservedFrom.getTime() + durationMinutes * 60000);

  return {
    id: createReservationId(`reservation-${now.getTime()}-${Math.random()}`),
    prepRoomId,
    embalmerId,
    caseId,
    familyId,
    status: 'pending',
    priority,
    reservedFrom,
    reservedTo,
    notes,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

/**
 * Confirm a pending reservation
 */
export function confirmReservation(
  reservation: PrepRoomReservation
): PrepRoomReservation {
  if (reservation.status !== 'pending') {
    throw new Error(`Cannot confirm reservation in ${reservation.status} status`);
  }

  return {
    ...reservation,
    status: 'confirmed',
    updatedAt: new Date(),
  };
}

/**
 * Mark a confirmed reservation as in-progress (check-in)
 */
export function checkInReservation(
  reservation: PrepRoomReservation
): PrepRoomReservation {
  if (reservation.status !== 'confirmed') {
    throw new Error(`Cannot check in reservation in ${reservation.status} status`);
  }

  return {
    ...reservation,
    status: 'in_progress',
    checkedInAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Mark a reservation as completed (check-out)
 */
export function checkOutReservation(
  reservation: PrepRoomReservation
): PrepRoomReservation {
  if (reservation.status !== 'in_progress') {
    throw new Error(`Cannot check out reservation in ${reservation.status} status`);
  }

  const checkedOutAt = new Date();
  const actualDuration = reservation.checkedInAt
    ? Math.round(
        (checkedOutAt.getTime() - reservation.checkedInAt.getTime()) / 60000
      )
    : undefined;

  return {
    ...reservation,
    status: 'completed',
    checkedOutAt,
    actualDuration,
    updatedAt: new Date(),
  };
}

/**
 * Auto-release a reservation after 30-minute timeout
 */
export function autoReleaseReservation(
  reservation: PrepRoomReservation
): PrepRoomReservation {
  if (reservation.status !== 'confirmed' && reservation.status !== 'pending') {
    throw new Error(
      `Cannot auto-release reservation in ${reservation.status} status`
    );
  }

  return {
    ...reservation,
    status: 'auto_released',
    updatedAt: new Date(),
  };
}

/**
 * Cancel a reservation
 */
export function cancelReservation(
  reservation: PrepRoomReservation,
  reason?: string
): PrepRoomReservation {
  return {
    ...reservation,
    status: 'cancelled',
    notes: reason ? `${reservation.notes ? reservation.notes + ' | ' : ''}Cancelled: ${reason}` : reservation.notes,
    updatedAt: new Date(),
  };
}

/**
 * Check if a reservation has exceeded the auto-release timeout (30 minutes)
 * Returns true if confirmed for 30+ minutes without check-in
 */
export function hasAutoReleaseTimeout(
  reservation: PrepRoomReservation,
  now: Date = new Date()
): boolean {
  if (reservation.status !== 'confirmed' && reservation.status !== 'pending') {
    return false;
  }

  const thirtyMinutesMs = 30 * 60 * 1000;
  const timeSinceCreation = now.getTime() - reservation.createdAt.getTime();

  return timeSinceCreation >= thirtyMinutesMs;
}

/**
 * Check if two time ranges overlap
 * Includes 30-minute buffers
 */
export function hasTimeOverlap(
  reservedFrom1: Date,
  reservedTo1: Date,
  reservedFrom2: Date,
  reservedTo2: Date,
  bufferMinutes: number = 30
): boolean {
  const buffer = bufferMinutes * 60 * 1000;

  const start1 = reservedFrom1.getTime() - buffer;
  const end1 = reservedTo1.getTime() + buffer;
  const start2 = reservedFrom2.getTime() - buffer;
  const end2 = reservedTo2.getTime() + buffer;

  return start1 < end2 && start2 < end1;
}

/**
 * Get duration including 30-minute buffer
 */
export function getDurationWithBuffer(
  reservedFrom: Date,
  reservedTo: Date,
  bufferMinutes: number = 30
): number {
  const durationMs = reservedTo.getTime() - reservedFrom.getTime();
  const durationMinutes = durationMs / 60000;
  return durationMinutes + bufferMinutes * 2; // buffer before and after
}

/**
 * Validate reservation duration (must be 2-8 hours)
 */
export function isValidDuration(durationMinutes: number): boolean {
  const minDuration = 2 * 60; // 2 hours
  const maxDuration = 8 * 60; // 8 hours
  return durationMinutes >= minDuration && durationMinutes <= maxDuration;
}

/**
 * Check if a reservation is in a terminal state
 */
export function isTerminalStatus(status: ReservationStatus): boolean {
  return (
    status === 'completed' ||
    status === 'auto_released' ||
    status === 'cancelled'
  );
}
