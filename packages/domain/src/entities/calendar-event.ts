import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';

/**
 * CalendarEvent ID branded type
 */
export type CalendarEventId = string & { readonly _brand: 'CalendarEventId' };

/**
 * Calendar provider
 */
export type CalendarProvider = 'microsoft' | 'google';

/**
 * Attendee for calendar event
 */
export interface Attendee {
  readonly email: string;
  readonly name?: string;
  readonly responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

/**
 * Reminder configuration
 */
export interface Reminder {
  readonly method: 'email' | 'popup';
  readonly minutesBefore: number;
}

/**
 * Recurrence rule (simplified iCalendar RRULE)
 */
export interface RecurrenceRule {
  readonly frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  readonly interval?: number; // Every N days/weeks/months/years
  readonly count?: number; // Number of occurrences
  readonly until?: Date; // End date
}

/**
 * CalendarEvent entity
 * Represents a calendar event synced with external calendar providers
 * Links to an Interaction for CRM integration
 */
export class CalendarEvent extends Data.Class<{
  readonly id: CalendarEventId;
  readonly funeralHomeId: string;
  readonly interactionId: string | null; // Link to Interaction entity
  readonly provider: CalendarProvider;
  readonly externalId: string | null; // Provider's event ID
  readonly title: string;
  readonly description: string | null;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly location: string | null;
  readonly attendees: readonly Attendee[];
  readonly reminders: readonly Reminder[];
  readonly recurrenceRule: RecurrenceRule | null;
  readonly isCancelled: boolean;
  readonly createdBy: string; // Staff member who created event
  readonly createdAt: Date;
  readonly updatedAt: Date;
}> {
  /**
   * Create a new CalendarEvent
   */
  static create(params: {
    id: string;
    funeralHomeId: string;
    interactionId?: string | null;
    provider: CalendarProvider;
    externalId?: string | null;
    title: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
    location?: string | null;
    attendees?: readonly Attendee[];
    reminders?: readonly Reminder[];
    recurrenceRule?: RecurrenceRule | null;
    createdBy: string;
  }): Effect.Effect<CalendarEvent, ValidationError> {
    return Effect.gen(function* () {
      const trimmedTitle = params.title.trim();
      
      if (!trimmedTitle) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Calendar event title is required', 
            field: 'title' 
          })
        );
      }

      if (trimmedTitle.length > 255) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Title too long (max 255 characters)', 
            field: 'title' 
          })
        );
      }

      // Validate time range
      if (params.endTime <= params.startTime) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'End time must be after start time', 
            field: 'endTime' 
          })
        );
      }

      // Validate attendees
      const attendees = params.attendees || [];
      for (const attendee of attendees) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(attendee.email)) {
          return yield* Effect.fail(
            new ValidationError({ 
              message: `Invalid attendee email: ${attendee.email}`, 
              field: 'attendees' 
            })
          );
        }
      }

      // Validate reminders
      const reminders = params.reminders || [];
      for (const reminder of reminders) {
        if (reminder.minutesBefore < 0 || reminder.minutesBefore > 40320) { // Max 4 weeks
          return yield* Effect.fail(
            new ValidationError({ 
              message: 'Reminder must be between 0 and 40320 minutes (4 weeks)', 
              field: 'reminders' 
            })
          );
        }
      }

      // Validate recurrence rule
      if (params.recurrenceRule) {
        const rule = params.recurrenceRule;
        if (rule.interval !== undefined && (rule.interval < 1 || rule.interval > 999)) {
          return yield* Effect.fail(
            new ValidationError({ 
              message: 'Recurrence interval must be between 1 and 999', 
              field: 'recurrenceRule' 
            })
          );
        }
        if (rule.count !== undefined && (rule.count < 1 || rule.count > 999)) {
          return yield* Effect.fail(
            new ValidationError({ 
              message: 'Recurrence count must be between 1 and 999', 
              field: 'recurrenceRule' 
            })
          );
        }
      }

      const now = new Date();

      return new CalendarEvent({
        id: params.id as CalendarEventId,
        funeralHomeId: params.funeralHomeId,
        interactionId: params.interactionId || null,
        provider: params.provider,
        externalId: params.externalId || null,
        title: trimmedTitle,
        description: params.description?.trim() || null,
        startTime: params.startTime,
        endTime: params.endTime,
        location: params.location?.trim() || null,
        attendees: attendees,
        reminders: reminders,
        recurrenceRule: params.recurrenceRule || null,
        isCancelled: false,
        createdBy: params.createdBy,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  /**
   * Reschedule the event to a new time
   */
  reschedule(startTime: Date, endTime: Date): Effect.Effect<CalendarEvent, ValidationError> {
    if (this.isCancelled) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Cannot reschedule a cancelled event' 
        })
      );
    }

    if (endTime <= startTime) {
      return Effect.fail(
        new ValidationError({ 
          message: 'End time must be after start time', 
          field: 'endTime' 
        })
      );
    }

    return Effect.succeed(
      new CalendarEvent({
        ...this,
        startTime,
        endTime,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Add an attendee to the event
   */
  addAttendee(attendee: Attendee): Effect.Effect<CalendarEvent, ValidationError> {
    if (this.isCancelled) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Cannot add attendees to a cancelled event' 
        })
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(attendee.email)) {
      return Effect.fail(
        new ValidationError({ 
          message: `Invalid attendee email: ${attendee.email}`, 
          field: 'attendees' 
        })
      );
    }

    // Check for duplicate
    if (this.attendees.some(a => a.email === attendee.email)) {
      return Effect.fail(
        new ValidationError({ 
          message: `Attendee ${attendee.email} is already invited`, 
          field: 'attendees' 
        })
      );
    }

    return Effect.succeed(
      new CalendarEvent({
        ...this,
        attendees: [...this.attendees, attendee],
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Remove an attendee from the event
   */
  removeAttendee(email: string): Effect.Effect<CalendarEvent, ValidationError> {
    if (this.isCancelled) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Cannot remove attendees from a cancelled event' 
        })
      );
    }

    const filteredAttendees = this.attendees.filter(a => a.email !== email);
    
    if (filteredAttendees.length === this.attendees.length) {
      return Effect.fail(
        new ValidationError({ 
          message: `Attendee ${email} not found`, 
          field: 'attendees' 
        })
      );
    }

    return Effect.succeed(
      new CalendarEvent({
        ...this,
        attendees: filteredAttendees,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Cancel the event
   */
  cancel(): Effect.Effect<CalendarEvent, ValidationError> {
    if (this.isCancelled) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Event is already cancelled' 
        })
      );
    }

    return Effect.succeed(
      new CalendarEvent({
        ...this,
        isCancelled: true,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Link event to external calendar provider
   */
  linkToProvider(externalId: string): CalendarEvent {
    return new CalendarEvent({
      ...this,
      externalId,
      updatedAt: new Date(),
    });
  }

  /**
   * Check if event is in the past
   */
  get isPast(): boolean {
    return this.endTime < new Date();
  }

  /**
   * Check if event is currently happening
   */
  get isOngoing(): boolean {
    const now = new Date();
    return this.startTime <= now && this.endTime >= now;
  }

  /**
   * Check if event is in the future
   */
  get isFuture(): boolean {
    return this.startTime > new Date();
  }

  /**
   * Get duration in minutes
   */
  get durationMinutes(): number {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }

  /**
   * Check if event is recurring
   */
  get isRecurring(): boolean {
    return !!this.recurrenceRule;
  }
}
