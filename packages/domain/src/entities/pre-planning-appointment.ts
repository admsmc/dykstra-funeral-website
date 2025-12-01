import { Data } from 'effect';

/**
 * Pre-Planning Appointment Domain Entity
 * 
 * Scenario 6: Pre-Planning Appointment Scheduling
 * Manages pre-need consultation appointments with funeral directors.
 * 
 * Business Rules:
 * - Only directors can conduct pre-planning (enforced at application layer)
 * - Appointments only 8am-5pm Mon-Fri (excluding holidays)
 * - Minimum 1 hour duration
 * - Maximum 4 appointments per director per day
 * - No double-booking (overlapping appointments)
 * - Lunch break 12-1pm automatically blocks availability
 * - 24-hour cancellation notice required
 * - Automated reminders at 24 hours and 1 hour before
 */

export type AppointmentId = string & { readonly _brand: 'AppointmentId' };
export type AppointmentStatus = 
  | 'scheduled'    // Confirmed appointment
  | 'confirmed'    // Confirmed by director/family
  | 'completed'    // Appointment completed
  | 'cancelled'    // Cancelled by family/director
  | 'no-show';     // Family did not attend

export class PrePlanningAppointment extends Data.Class<{
  readonly id: AppointmentId;
  readonly businessKey: string;
  readonly version: number;
  readonly directorId: string;
  readonly directorName: string;
  readonly familyName: string;
  readonly familyEmail: string;
  readonly familyPhone: string;
  readonly appointmentDate: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly duration: number;  // in minutes
  readonly notes?: string;
  readonly status: AppointmentStatus;
  readonly reminderEmailSent: boolean;
  readonly reminderSmsSent: boolean;
  readonly completedAt?: Date;
  readonly cancelledAt?: Date;
  readonly cancelReason?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Create a new pre-planning appointment
   */
  static create(input: {
    directorId: string;
    directorName: string;
    familyName: string;
    familyEmail: string;
    familyPhone: string;
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    notes?: string;
    createdBy: string;
  }): PrePlanningAppointment {
    const duration = (input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60);
    
    return new PrePlanningAppointment({
      id: input.directorId + ':' + Date.now() as AppointmentId,
      businessKey: input.directorId + ':' + Date.now(),
      version: 1,
      directorId: input.directorId,
      directorName: input.directorName,
      familyName: input.familyName,
      familyEmail: input.familyEmail,
      familyPhone: input.familyPhone,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      duration,
      notes: input.notes,
      status: 'scheduled',
      reminderEmailSent: false,
      reminderSmsSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: input.createdBy,
    });
  }

  /**
   * Complete appointment
   */
  complete(actualEndTime?: Date, notes?: string): PrePlanningAppointment {
    if (this.status === 'cancelled') {
      throw new Error('Cannot complete a cancelled appointment');
    }
    if (this.status === 'completed') {
      throw new Error('Appointment already completed');
    }

    return new PrePlanningAppointment({
      ...this,
      status: 'completed',
      completedAt: new Date(),
      endTime: actualEndTime || this.endTime,
      notes: notes || this.notes,
      version: this.version + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Cancel appointment
   * Requires 24-hour notice (enforced at application layer)
   */
  cancel(reason: string, cancelledBy: string): PrePlanningAppointment {
    if (this.status === 'completed') {
      throw new Error('Cannot cancel a completed appointment');
    }
    if (this.status === 'cancelled') {
      throw new Error('Appointment already cancelled');
    }

    return new PrePlanningAppointment({
      ...this,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
      version: this.version + 1,
      updatedAt: new Date(),
      createdBy: cancelledBy,  // Track who cancelled
    });
  }

  /**
   * Mark as no-show
   */
  markNoShow(): PrePlanningAppointment {
    if (this.status === 'completed') {
      throw new Error('Cannot mark completed appointment as no-show');
    }
    if (this.status === 'cancelled') {
      throw new Error('Cannot mark cancelled appointment as no-show');
    }

    return new PrePlanningAppointment({
      ...this,
      status: 'no-show',
      version: this.version + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Record email reminder sent
   */
  recordEmailReminderSent(): PrePlanningAppointment {
    return new PrePlanningAppointment({
      ...this,
      reminderEmailSent: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Record SMS reminder sent
   */
  recordSmsReminderSent(): PrePlanningAppointment {
    return new PrePlanningAppointment({
      ...this,
      reminderSmsSent: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Confirm appointment (director acknowledges)
   */
  confirm(): PrePlanningAppointment {
    if (this.status !== 'scheduled') {
      throw new Error('Can only confirm scheduled appointments');
    }

    return new PrePlanningAppointment({
      ...this,
      status: 'confirmed',
      version: this.version + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Check if appointment requires reminder
   * Returns true if appointment is within 24-36 hours and reminder not yet sent
   */
  needsEmailReminder(): boolean {
    if (this.status !== 'scheduled' && this.status !== 'confirmed') {
      return false;
    }
    if (this.reminderEmailSent) {
      return false;
    }

    const now = new Date();
    const hoursUntilAppointment = (this.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilAppointment >= 1 && hoursUntilAppointment <= 36;
  }

  /**
   * Check if appointment is in the past
   */
  isInThePast(): boolean {
    return this.startTime < new Date();
  }

  /**
   * Check if appointment can be cancelled (must be 24+ hours away)
   */
  canBeCancelled(): boolean {
    const now = new Date();
    const hoursUntilAppointment = (this.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilAppointment >= 24;
  }

  /**
   * Check if appointment overlaps with another
   */
  overlaps(other: PrePlanningAppointment): boolean {
    // Different days = no overlap
    if (
      this.appointmentDate.toDateString() !== other.appointmentDate.toDateString()
    ) {
      return false;
    }

    // Check time overlap: this.start < other.end AND other.start < this.end
    return this.startTime < other.endTime && other.startTime < this.endTime;
  }

  /**
   * Check if appointment is within business hours (8am-5pm)
   */
  isWithinBusinessHours(): boolean {
    const startHour = this.startTime.getHours();
    const endHour = this.endTime.getHours();
    const startMinutes = this.startTime.getMinutes();
    const endMinutes = this.endTime.getMinutes();

    // Must start at 8am or later
    if (startHour < 8) return false;
    if (startHour === 8 && startMinutes < 0) return false;

    // Must end at 5pm or earlier
    if (endHour > 17) return false;
    if (endHour === 17 && endMinutes > 0) return false;

    // Must be at least 1 hour
    if (this.duration < 60) return false;

    return true;
  }

  /**
   * Check if appointment is on a business day (Mon-Fri)
   */
  isOnBusinessDay(): boolean {
    const dayOfWeek = this.appointmentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  /**
   * Check if appointment overlaps with lunch (12-1pm)
   */
  overlapsWithLunch(): boolean {
    const startHour = this.startTime.getHours();
    const startMinutes = this.startTime.getMinutes();
    const endHour = this.endTime.getHours();
    const endMinutes = this.endTime.getMinutes();

    // Lunch is 12:00-13:00
    const lunchStart = 12 * 60;  // 720 minutes
    const lunchEnd = 13 * 60;    // 780 minutes
    
    const appointmentStart = startHour * 60 + startMinutes;
    const appointmentEnd = endHour * 60 + endMinutes;

    // Overlap if appointment overlaps lunch period
    return appointmentStart < lunchEnd && appointmentEnd > lunchStart;
  }
}

/**
 * Domain errors
 */
export class AppointmentError extends Error {
  readonly _tag = 'AppointmentError' as const;
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
  }
}

export class AppointmentConflictError extends Error {
  readonly _tag = 'AppointmentConflictError' as const;
  constructor(message: string, readonly conflictingAppointmentId?: string) {
    super(message);
  }
}

export class AppointmentCapacityError extends Error {
  readonly _tag = 'AppointmentCapacityError' as const;
  constructor(message: string) {
    super(message);
  }
}

export class BusinessHoursError extends Error {
  readonly _tag = 'BusinessHoursError' as const;
  constructor(message: string) {
    super(message);
  }
}

export class AppointmentCancellationError extends Error {
  readonly _tag = 'AppointmentCancellationError' as const;
  constructor(message: string, readonly hoursUntilAppointment?: number) {
    super(message);
  }
}

/**
 * Availability slot (used in availability queries)
 */
export interface AvailabilitySlot {
  readonly date: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly available: boolean;
  readonly reason?: string;  // Why slot is unavailable (conflict, lunch, etc.)
}

/**
 * Helper to calculate next available slot from a given time
 */
export function calculateNextAvailableSlot(
  directorAppointments: PrePlanningAppointment[],
  fromDate: Date,
  duration: number = 60
): AvailabilitySlot | null {
  // Start from 8am on the given date
  let slotStart = new Date(fromDate);
  slotStart.setHours(8, 0, 0, 0);

  // Check for next 30 days
  for (let day = 0; day < 30; day++) {
    const checkDate = new Date(slotStart);
    checkDate.setDate(checkDate.getDate() + day);

    // Skip weekends
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Try each hour from 8am to 4pm (to allow 1-hour appointment before 5pm)
    for (let hour = 8; hour < 17; hour++) {
      const potentialStart = new Date(checkDate);
      potentialStart.setHours(hour, 0, 0, 0);
      const potentialEnd = new Date(potentialStart);
      potentialEnd.setMinutes(potentialEnd.getMinutes() + duration);

      // Create temp appointment to test
      const tempAppointment = new PrePlanningAppointment({
        id: 'temp' as AppointmentId,
        businessKey: 'temp',
        version: 1,
        directorId: 'temp',
        directorName: 'temp',
        familyName: 'temp',
        familyEmail: 'temp@temp.com',
        familyPhone: 'temp',
        appointmentDate: checkDate,
        startTime: potentialStart,
        endTime: potentialEnd,
        duration,
        status: 'scheduled',
        reminderEmailSent: false,
        reminderSmsSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'temp',
      });

      // Check conflicts
      const hasConflict = directorAppointments.some(apt => tempAppointment.overlaps(apt));
      
      // Check lunch
      const overlapsLunch = tempAppointment.overlapsWithLunch();

      if (!hasConflict && !overlapsLunch && tempAppointment.isWithinBusinessHours()) {
        return {
          date: checkDate,
          startTime: potentialStart,
          endTime: potentialEnd,
          available: true,
        };
      }
    }
  }

  return null;
}
