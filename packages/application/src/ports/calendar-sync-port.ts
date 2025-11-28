import { Effect, Context } from 'effect';
import type { CalendarProvider, Attendee, Reminder, RecurrenceRule } from '@dykstra/domain';
import type { PersistenceError } from '../errors';

/**
 * Calendar event data for creation/updates
 */
export interface CalendarEventData {
  readonly title: string;
  readonly description?: string | null;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly location?: string | null;
  readonly attendees?: readonly Attendee[];
  readonly reminders?: readonly Reminder[];
  readonly recurrenceRule?: RecurrenceRule | null;
}

/**
 * Availability slot (free/busy time)
 */
export interface AvailabilitySlot {
  readonly startTime: Date;
  readonly endTime: Date;
  readonly status: 'free' | 'busy' | 'tentative' | 'out-of-office';
  readonly event?: {
    readonly id: string;
    readonly title: string;
  };
}

/**
 * Calendar sync service port
 * Integrates with external calendar providers (Microsoft 365, Google Calendar)
 */
export interface CalendarSyncServicePort {
  /**
   * Create a new calendar event
   */
  readonly createEvent: (params: {
    userId: string;
    funeralHomeId: string;
    provider: CalendarProvider;
    eventData: CalendarEventData;
  }) => Effect.Effect<
    { externalId: string; calendarEvent: CalendarEventData },
    PersistenceError
  >;

  /**
   * Update an existing calendar event
   */
  readonly updateEvent: (params: {
    userId: string;
    provider: CalendarProvider;
    externalId: string;
    eventData: Partial<CalendarEventData>;
  }) => Effect.Effect<void, PersistenceError>;

  /**
   * Delete a calendar event
   */
  readonly deleteEvent: (params: {
    userId: string;
    provider: CalendarProvider;
    externalId: string;
  }) => Effect.Effect<void, PersistenceError>;

  /**
   * Get a single calendar event by external ID
   */
  readonly getEvent: (params: {
    userId: string;
    provider: CalendarProvider;
    externalId: string;
  }) => Effect.Effect<CalendarEventData | null, PersistenceError>;

  /**
   * List calendar events in a date range
   */
  readonly listEvents: (params: {
    userId: string;
    provider: CalendarProvider;
    startDate: Date;
    endDate: Date;
  }) => Effect.Effect<
    Array<{ externalId: string; event: CalendarEventData }>,
    PersistenceError
  >;

  /**
   * Get user availability (free/busy times)
   */
  readonly getAvailability: (params: {
    userId: string;
    provider: CalendarProvider;
    startDate: Date;
    endDate: Date;
  }) => Effect.Effect<readonly AvailabilitySlot[], PersistenceError>;

  /**
   * Refresh OAuth token for calendar access
   */
  readonly refreshToken: (params: {
    userId: string;
    provider: CalendarProvider;
  }) => Effect.Effect<void, PersistenceError>;
}

/**
 * Calendar sync service context tag
 * CRITICAL: Interface named with "Service" suffix to avoid circular reference with tag
 */
export const CalendarSyncPort = Context.GenericTag<CalendarSyncServicePort>(
  '@dykstra/CalendarSyncPort'
);
