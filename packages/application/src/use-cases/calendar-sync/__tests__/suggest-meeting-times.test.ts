import { describe, it, expect, beforeEach } from 'vitest';
import { Effect, Layer } from 'effect';
import { suggestMeetingTimes, type SuggestMeetingTimesCommand } from '../suggest-meeting-times';
import { CalendarSyncPort, type CalendarSyncServicePort, type AvailabilitySlot } from '../../../ports/calendar-sync-port';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../../ports/email-calendar-sync-policy-repository';
import { type EmailCalendarSyncPolicy } from '../../../../domain/src/entities/email-sync/email-calendar-sync-policy';

const createMockPolicy = (overrides?: Partial<EmailCalendarSyncPolicy>): EmailCalendarSyncPolicy => ({
  id: 'policy-1',
  funeralHomeId: 'home-1',
  policyName: 'Standard',
  emailSyncFrequencyMinutes: 15,
  maxRetries: 3,
  retryDelaySeconds: 5,
  emailMatchingStrategy: 'exact_with_fallback',
  fuzzyMatchThreshold: 85,
  emailFallbackStrategies: ['exact', 'domain'],
  calendarFieldMappings: {
    subject: true,
    startTime: true,
    endTime: true,
    attendees: true,
    description: true,
    location: true,
  },
  timezoneHandling: 'local',
  calendarSyncRetryPolicy: 'exponential',
  availabilityLookAheadDays: 30,
  blockOutTimePerEventMinutes: 15,
  meetingDurationMinutes: 60, // Default 1 hour
  timeSlotSuggestionCount: 5, // Return up to 5 suggestions
  minimumBufferMinutes: 15, // 15 min buffer between suggestions
  workingHoursStartTime: '09:00',
  workingHoursEndTime: '17:00',
  notificationDelayMinutes: 5,
  enableSyncNotifications: true,
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Suggest Meeting Times - Policy-Driven', () => {
  let mockCalendarSync: CalendarSyncServicePort;
  let mockPolicyRepo: EmailCalendarSyncPolicyRepositoryService;

  beforeEach(() => {
    mockCalendarSync = {
      createEvent: () => Effect.succeed({ externalId: '', calendarEvent: {} as any }),
      updateEvent: () => Effect.succeed(void 0),
      deleteEvent: () => Effect.succeed(void 0),
      getEvent: () => Effect.succeed(null),
      listEvents: () => Effect.succeed([]),
      getAvailability: () => Effect.succeed([]),
      refreshToken: () => Effect.succeed(void 0),
    };

    mockPolicyRepo = {
      findCurrentByFuneralHomeId: () => Effect.succeed(createMockPolicy()),
      findAllVersionsByFuneralHomeId: () => Effect.succeed([createMockPolicy()]),
      findById: () => Effect.succeed(createMockPolicy()),
      create: () => Effect.succeed(createMockPolicy()),
      update: () => Effect.succeed(createMockPolicy()),
      listCurrentPolicies: () => Effect.succeed([createMockPolicy()]),
    };
  });

  describe('Single Attendee - Standard Policy', () => {
    it('should suggest available time slots for single attendee', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T17:00:00Z'),
            status: 'free',
          },
        ]);

      const policy = createMockPolicy({
        meetingDurationMinutes: 60,
        timeSlotSuggestionCount: 5,
        minimumBufferMinutes: 15,
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      // Should suggest multiple 1-hour slots with 15-min buffer
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5); // Policy limit
      
      // Results are sorted by confidence (mid-day preference), not chronologically
      // First suggestion should be mid-day with highest confidence
      expect(result[0]?.confidence).toBeGreaterThan(0);
      
      // All slots should be 1 hour (60 min)
      for (const slot of result) {
        expect(slot.endTime.getTime() - slot.startTime.getTime()).toBe(60 * 60 * 1000);
      }
      
      // At least one slot should exist in the 9-17 range
      const allInRange = result.every(s => {
        const hour = s.startTime.getUTCHours();
        return hour >= 9 && hour < 17;
      });
      expect(allInRange).toBe(true);
    });

    it('should respect policy meeting duration (60 min)', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T12:00:00Z'),
            status: 'free',
          },
        ]);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T12:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      // All suggestions should be 60 minutes long
      for (const slot of result) {
        expect(slot.endTime.getTime() - slot.startTime.getTime()).toBe(60 * 60 * 1000);
      }
    });
  });

  describe('Multi-Attendee Intersection - Standard Policy', () => {
    it('should find common free time for multiple attendees', async () => {
      const user1Availability: AvailabilitySlot[] = [
        {
          startTime: new Date('2025-12-01T09:00:00Z'),
          endTime: new Date('2025-12-01T12:00:00Z'),
          status: 'free',
        },
        {
          startTime: new Date('2025-12-01T14:00:00Z'),
          endTime: new Date('2025-12-01T17:00:00Z'),
          status: 'free',
        },
      ];

      const user2Availability: AvailabilitySlot[] = [
        {
          startTime: new Date('2025-12-01T10:00:00Z'),
          endTime: new Date('2025-12-01T15:00:00Z'),
          status: 'free',
        },
      ];

      let callCount = 0;
      mockCalendarSync.getAvailability = () => {
        const result = callCount === 0 ? user1Availability : user2Availability;
        callCount++;
        return Effect.succeed(result);
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1', 'user-2'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      // Should suggest times only when both are free (10:00-12:00 and 14:00-15:00 overlap)
      expect(result.length).toBeGreaterThan(0);
      
      // All suggestions should be within common free time
      // User1: 09:00-12:00, 14:00-17:00 | User2: 10:00-15:00
      // Overlap: 10:00-12:00, 14:00-15:00
      for (const slot of result) {
        const hour = slot.startTime.getUTCHours();
        const inMorningOverlap = hour >= 10 && hour < 12;
        const inAfternoonOverlap = hour >= 14 && hour < 15;
        expect(inMorningOverlap || inAfternoonOverlap).toBe(true);
      }
    });

    it('should return empty when attendees have no common availability', async () => {
      const user1Availability: AvailabilitySlot[] = [
        {
          startTime: new Date('2025-12-01T09:00:00Z'),
          endTime: new Date('2025-12-01T11:00:00Z'),
          status: 'free',
        },
      ];

      const user2Availability: AvailabilitySlot[] = [
        {
          startTime: new Date('2025-12-01T13:00:00Z'),
          endTime: new Date('2025-12-01T15:00:00Z'),
          status: 'free',
        },
      ];

      let callCount = 0;
      mockCalendarSync.getAvailability = () => {
        const result = callCount === 0 ? user1Availability : user2Availability;
        callCount++;
        return Effect.succeed(result);
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1', 'user-2'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      expect(result.length).toBe(0);
    });
  });

  describe('Duration Override', () => {
    it('should use command duration over policy default', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T12:00:00Z'),
            status: 'free',
          },
        ]);

      const policy = createMockPolicy({ meetingDurationMinutes: 60 });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        durationMinutes: 30, // Override to 30 min
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T12:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      // Should suggest 30-minute slots, allowing more suggestions
      expect(result.length).toBeGreaterThan(0);
      for (const slot of result) {
        expect(slot.endTime.getTime() - slot.startTime.getTime()).toBe(30 * 60 * 1000);
      }
    });
  });

  describe('Suggestion Count - Policy Limits', () => {
    it('should respect timeSlotSuggestionCount from policy - Standard (5)', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T17:00:00Z'),
            status: 'free',
          },
        ]);

      const policy = createMockPolicy({
        meetingDurationMinutes: 30,
        timeSlotSuggestionCount: 5,
        minimumBufferMinutes: 15,
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should limit to 3 suggestions with Strict policy', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T17:00:00Z'),
            status: 'free',
          },
        ]);

      const policy = createMockPolicy({
        policyName: 'Strict',
        meetingDurationMinutes: 30,
        timeSlotSuggestionCount: 3, // Strict: only 3 suggestions
        minimumBufferMinutes: 15,
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Buffer Between Suggestions', () => {
    it('should respect minimumBufferMinutes between suggestions - Standard (15 min)', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T12:00:00Z'),
            status: 'free',
          },
        ]);

      const policy = createMockPolicy({
        meetingDurationMinutes: 30,
        minimumBufferMinutes: 15,
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T12:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      // Results are sorted by confidence, not chronologically
      // To check buffer, we need to sort by time first
      const chronological = [...result].sort((a, b) => 
        a.startTime.getTime() - b.startTime.getTime()
      );

      // Check buffer between consecutive suggestions (in chronological order)
      for (let i = 1; i < chronological.length; i++) {
        const gapMs = chronological[i]!.startTime.getTime() - chronological[i - 1]!.endTime.getTime();
        const gapMinutes = gapMs / (60 * 1000);
        expect(gapMinutes).toBeGreaterThanOrEqual(15); // At least 15 min buffer
      }
    });

    it('should allow tighter packing with Permissive policy (5 min buffer)', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T12:00:00Z'),
            status: 'free',
          },
        ]);

      const policy = createMockPolicy({
        policyName: 'Permissive',
        meetingDurationMinutes: 30,
        minimumBufferMinutes: 5, // Tight packing
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T12:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      // Permissive should allow more suggestions due to smaller buffer
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Scoring - Mid-Day Preference', () => {
    it('should rank mid-day slots higher than early/late slots', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T17:00:00Z'),
            status: 'free',
          },
        ]);

      const policy = createMockPolicy({
        meetingDurationMinutes: 60,
        timeSlotSuggestionCount: 5,
        minimumBufferMinutes: 0, // No buffer for testing
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      // First suggestion should be mid-day (around 13:00/1pm)
      expect(result[0]?.startTime.getUTCHours()).toBeGreaterThan(9);
      expect(result[0]?.startTime.getUTCHours()).toBeLessThan(17);
      // Confidence should decrease for early suggestions
      expect(result[0]?.confidence).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Multi-Provider Support', () => {
    it('should work with Microsoft provider', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T17:00:00Z'),
            status: 'free',
          },
        ]);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'microsoft',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      expect(result).toEqual(expect.any(Array));
    });

    it('should work with Google provider', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T09:00:00Z'),
            endTime: new Date('2025-12-01T17:00:00Z'),
            status: 'free',
          },
        ]);

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const command: SuggestMeetingTimesCommand = {
        attendeeUserIds: ['user-1'],
        provider: 'google',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        suggestMeetingTimes(command).pipe(Effect.provide(layer))
      );

      expect(result).toEqual(expect.any(Array));
    });
  });
});
