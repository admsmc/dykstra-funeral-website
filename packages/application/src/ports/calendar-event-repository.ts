import { type Effect, Context } from 'effect';
import type { CalendarEvent, CalendarProvider } from '@dykstra/domain';
import type { PersistenceError } from '../errors';

/**
 * Calendar event repository service
 * Handles persistence of calendar events in the local database
 */
export interface CalendarEventRepositoryService {
  /**
   * Save a calendar event (create or update)
   */
  readonly save: (event: CalendarEvent) => Effect.Effect<CalendarEvent, PersistenceError>;

  /**
   * Find a calendar event by ID
   */
  readonly findById: (id: string) => Effect.Effect<CalendarEvent | null, PersistenceError>;

  /**
   * Find calendar event by interaction ID
   */
  readonly findByInteraction: (interactionId: string) => Effect.Effect<CalendarEvent | null, PersistenceError>;

  /**
   * Find calendar events in a date range
   */
  readonly findByDateRange: (params: {
    funeralHomeId: string;
    startDate: Date;
    endDate: Date;
    userId?: string; // Optional: filter by creator
    includesCancelled?: boolean; // Default: false
  }) => Effect.Effect<readonly CalendarEvent[], PersistenceError>;

  /**
   * Check if calendar event exists by external ID
   */
  readonly existsByExternalId: (params: {
    provider: CalendarProvider;
    externalId: string;
  }) => Effect.Effect<boolean, PersistenceError>;

  /**
   * Find calendar event by external ID
   */
  readonly findByExternalId: (params: {
    provider: CalendarProvider;
    externalId: string;
  }) => Effect.Effect<CalendarEvent | null, PersistenceError>;

  /**
   * Delete a calendar event (soft delete by marking as cancelled)
   */
  readonly delete: (id: string) => Effect.Effect<void, PersistenceError>;

  /**
   * Hard delete a calendar event (permanent removal)
   */
  readonly hardDelete: (id: string) => Effect.Effect<void, PersistenceError>;

  /**
   * Find upcoming events for a user
   */
  readonly findUpcoming: (params: {
    funeralHomeId: string;
    userId: string;
    limit?: number; // Default: 10
  }) => Effect.Effect<readonly CalendarEvent[], PersistenceError>;

  /**
   * Find events by attendee email
   */
  readonly findByAttendee: (params: {
    funeralHomeId: string;
    attendeeEmail: string;
    startDate?: Date;
    endDate?: Date;
  }) => Effect.Effect<readonly CalendarEvent[], PersistenceError>;
}

/**
 * Calendar event repository context tag
 * CRITICAL: Interface named with "Service" suffix to avoid circular reference with tag
 */
export const CalendarEventRepository = Context.GenericTag<CalendarEventRepositoryService>(
  '@dykstra/CalendarEventRepository'
);
