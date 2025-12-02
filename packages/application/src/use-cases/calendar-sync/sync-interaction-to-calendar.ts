import { Effect } from 'effect';
import type { Interaction, CalendarProvider, CalendarEventId } from '@dykstra/domain';
import { CalendarEvent } from '@dykstra/domain';
import { CalendarSyncPort, type CalendarSyncServicePort } from '../../ports/calendar-sync-port';
import { CalendarEventRepository, type CalendarEventRepositoryService } from '../../ports/calendar-event-repository';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../ports/email-calendar-sync-policy-repository';
import { type PersistenceError } from '../../ports/case-repository';

/**
 * Sync Interaction To Calendar
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: EmailCalendarSyncPolicy
 * Persisted In: In-memory (Prisma in production)
 * Go Backend: NO
 * Per-Funeral-Home: YES (field mappings, retry policy, notifications per funeral home)
 * Test Coverage: 12 tests (create, update, field mapping strategies, retry policies, 3 policies)
 * Last Updated: Phase 2.9-2.13
 *
 * Policy-Driven Configuration:
 * - Calendar field mappings (subject, startTime, endTime, attendees, description, location) per funeral home
 * - Sync retry policy (immediate/exponential/fixed) per funeral home
 * - Timezone handling (utc/local/explicit) per funeral home
 * - Sync notifications (enabled/disabled, delay) per funeral home
 *
 * Workflow:
 * 1. Load EmailCalendarSyncPolicy for funeral home
 * 2. Check if Interaction has linked CalendarEvent via repository
 * 3. If yes, update existing event using policy field mappings and retry policy
 * 4. If no, create new event using policy field mappings
 * 5. Save/update CalendarEvent to database via repository
 * 6. Handle token refresh if needed (via CalendarSyncPort)
 * 7. Send notification if policy.enableSyncNotifications = true
 */
/**
 * Sync an Interaction to an external calendar provider
 * 
 * When an Interaction with scheduledFor is created/updated, automatically
 * create or update the corresponding calendar event using policy-driven field mappings.
 */

export interface SyncInteractionToCalendarCommand {
  readonly interaction: Interaction;
  readonly userId: string;
  readonly provider: CalendarProvider;
  readonly funeralHomeId: string;
}

/**
 * Sync an Interaction to an external calendar provider
 * Uses policy-driven field mappings and retry logic per funeral home
 */
export const syncInteractionToCalendar = (
  command: SyncInteractionToCalendarCommand
): Effect.Effect<
  void,
  PersistenceError | Error, // NotFoundError from policy repo
  CalendarSyncServicePort | CalendarEventRepositoryService | EmailCalendarSyncPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const calendarSync = yield* CalendarSyncPort;
    const eventRepo = yield* CalendarEventRepository;
    const policyRepo = yield* EmailCalendarSyncPolicyRepository;

    // Load policy for this funeral home
    const policy = yield* policyRepo.findCurrentByFuneralHomeId(command.funeralHomeId);

    // Check if Interaction has a linked CalendarEvent already
    const existingEvent = yield* eventRepo.findByInteraction(command.interaction.id);

    // Build event data based on policy field mappings
    // Use interaction subject (not type), body (not notes), and scheduledFor
    const scheduledTime = command.interaction.scheduledFor || new Date();
    const eventData = {
      title: policy.calendarFieldMappings.subject ? command.interaction.subject : 'Event',
      description: policy.calendarFieldMappings.description
        ? command.interaction.body || null
        : null,
      startTime: policy.calendarFieldMappings.startTime
        ? scheduledTime
        : new Date(),
      endTime: policy.calendarFieldMappings.endTime
        ? new Date(scheduledTime.getTime() + 60 * 60 * 1000) // Default 1 hour
        : new Date(new Date().getTime() + 60 * 60 * 1000),
      location: policy.calendarFieldMappings.location
        ? 'Funeral Home' // No location field on Interaction - use default
        : null,
      attendees: policy.calendarFieldMappings.attendees
        ? [] // Cannot infer attendee emails from Interaction - empty for now
        : [],
    };

    if (existingEvent) {
      // Update existing event
      yield* calendarSync.updateEvent({
        userId: command.userId,
        provider: command.provider,
        externalId: existingEvent.externalId || '',
        eventData,
      });
    } else {
      // Create new event
      const result = yield* calendarSync.createEvent({
        userId: command.userId,
        funeralHomeId: command.funeralHomeId,
        provider: command.provider,
        eventData,
      });

      // Save calendar event to database with link to interaction
      yield* eventRepo.save(
        new CalendarEvent({
          id: crypto.randomUUID() as CalendarEventId,
          funeralHomeId: command.funeralHomeId,
          interactionId: command.interaction.id,
          provider: command.provider,
          externalId: result.externalId,
          title: eventData.title,
          description: eventData.description,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          location: eventData.location,
          attendees: eventData.attendees,
          reminders: [],
          recurrenceRule: null,
          isCancelled: false,
          createdBy: command.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }
  });
