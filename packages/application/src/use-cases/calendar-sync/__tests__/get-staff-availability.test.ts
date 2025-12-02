import { describe, it, expect, beforeEach } from 'vitest';
import { Effect, Layer } from 'effect';
import { getStaffAvailability, type GetStaffAvailabilityCommand } from '../get-staff-availability';
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
  meetingDurationMinutes: 60,
  timeSlotSuggestionCount: 5,
  minimumBufferMinutes: 15,
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

describe('Get Staff Availability - Policy-Driven', () => {
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

  describe('No Busy Events - Standard Policy', () => {
    it('should return entire working window when calendar is free', async () => {
      mockCalendarSync.getAvailability = () => Effect.succeed([]);
      const policy = createMockPolicy({
        availabilityLookAheadDays: 7,
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const start = new Date('2025-12-01T00:00:00Z');
      const end = new Date('2025-12-05T23:59:59Z');

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      // Should have slots for each working day (Mon-Fri)
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.status).toBe('free');
      // First slot should start at 09:00
      expect(result[0]?.startTime.getUTCHours()).toBe(9);
    });
  });

  describe('Busy Event with Block-Out Buffer', () => {
    it('should exclude meeting plus block-out buffer from availability - Standard Policy', async () => {
      const meetingStart = new Date('2025-12-01T10:00:00Z');
      const meetingEnd = new Date('2025-12-01T11:00:00Z');

      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: meetingStart,
            endTime: meetingEnd,
            status: 'busy',
          },
        ]);

      const policy = createMockPolicy({
        blockOutTimePerEventMinutes: 15, // 15 min before and after
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const start = new Date('2025-12-01T09:00:00Z');
      const end = new Date('2025-12-01T17:00:00Z');

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      // Should have morning slot (9:00 to 9:45) and afternoon slot (11:15 to 17:00)
      expect(result.length).toBeGreaterThanOrEqual(2);
      // First free slot ends before meeting start minus buffer
      expect(result[0]!.endTime.getTime()).toBeLessThanOrEqual(new Date('2025-12-01T09:45:00Z').getTime());
      // Second free slot starts after meeting end plus buffer
      expect(result[1]!.startTime.getTime()).toBeGreaterThanOrEqual(new Date('2025-12-01T11:15:00Z').getTime());
    });

    it('should respect different block-out buffers per policy - Strict vs Permissive', async () => {
      const meetingStart = new Date('2025-12-01T10:00:00Z');
      const meetingEnd = new Date('2025-12-01T11:00:00Z');

      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: meetingStart,
            endTime: meetingEnd,
            status: 'busy',
          },
        ]);

      const strictPolicy = createMockPolicy({
        policyName: 'Strict',
        blockOutTimePerEventMinutes: 30, // Conservative
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });

      const permissivePolicy = createMockPolicy({
        policyName: 'Permissive',
        blockOutTimePerEventMinutes: 5, // Aggressive
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });

      const start = new Date('2025-12-01T09:00:00Z');
      const end = new Date('2025-12-01T17:00:00Z');

      // Test Strict policy
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(strictPolicy);
      const strictCommand: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const strictLayer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const strictResult = await Effect.runPromise(
        getStaffAvailability(strictCommand).pipe(Effect.provide(strictLayer))
      );

      // Test Permissive policy
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(permissivePolicy);
      const permCommand: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const permLayer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const permResult = await Effect.runPromise(
        getStaffAvailability(permCommand).pipe(Effect.provide(permLayer))
      );

      // Permissive should have more total free time (smaller buffer)
      const permTotalFree = permResult.reduce((sum, s) => sum + (s.endTime.getTime() - s.startTime.getTime()), 0);
      const strictTotalFree = strictResult.reduce((sum, s) => sum + (s.endTime.getTime() - s.startTime.getTime()), 0);
      expect(permTotalFree).toBeGreaterThan(strictTotalFree);
    });
  });

  describe('Lookahead Window Enforcement', () => {
    it('should limit results to lookahead days - Standard Policy (30 days)', async () => {
      mockCalendarSync.getAvailability = () => Effect.succeed([]);
      const policy = createMockPolicy({
        availabilityLookAheadDays: 7, // Only 7 days ahead
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const start = new Date('2025-12-01T09:00:00Z');
      const end = new Date('2025-12-31T17:00:00Z'); // Request 30 days

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      // All results should be within 7 days
      const maxDate = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(result.every((s) => s.endTime <= maxDate)).toBe(true);
    });

    it('should return earlier end date if within lookahead - Strict Policy', async () => {
      mockCalendarSync.getAvailability = () => Effect.succeed([]);
      const policy = createMockPolicy({
        policyName: 'Strict',
        availabilityLookAheadDays: 14,
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const start = new Date('2025-12-01T09:00:00Z');
      const end = new Date('2025-12-05T17:00:00Z'); // 4 days (within 14 day lookahead)

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      // Should not exceed requested end date
      expect(result.every((s) => s.endTime <= end)).toBe(true);
    });
  });

  describe('Working Hours Enforcement', () => {
    it('should only return time within working hours - Standard Policy (9-5)', async () => {
      mockCalendarSync.getAvailability = () => Effect.succeed([]);
      const policy = createMockPolicy({
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const start = new Date('2025-12-01T06:00:00Z'); // Before working hours
      const end = new Date('2025-12-01T20:00:00Z'); // After working hours

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      // All slots should be between 9 and 17
      for (const slot of result) {
        expect(slot.startTime.getUTCHours()).toBeGreaterThanOrEqual(9);
        expect(slot.endTime.getUTCHours()).toBeLessThanOrEqual(17);
      }
    });

    it('should respect extended working hours - Permissive Policy (8-6)', async () => {
      mockCalendarSync.getAvailability = () => Effect.succeed([]);
      const policy = createMockPolicy({
        policyName: 'Permissive',
        workingHoursStartTime: '08:00',
        workingHoursEndTime: '18:00', // Extended
      });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const start = new Date('2025-12-01T07:00:00Z');
      const end = new Date('2025-12-01T19:00:00Z');

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      // Should have slots from 8-18 (not 7-19)
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.startTime.getUTCHours() === 8)).toBe(true);
    });
  });

  describe('Multiple Busy Periods', () => {
    it('should handle multiple non-overlapping meetings correctly', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T10:00:00Z'),
            endTime: new Date('2025-12-01T11:00:00Z'),
            status: 'busy',
          },
          {
            startTime: new Date('2025-12-01T13:00:00Z'),
            endTime: new Date('2025-12-01T14:00:00Z'),
            status: 'busy',
          },
        ]);

      const policy = createMockPolicy({
        blockOutTimePerEventMinutes: 15,
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const start = new Date('2025-12-01T09:00:00Z');
      const end = new Date('2025-12-01T17:00:00Z');

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      // Should have 3 free slots: before first meeting, between meetings, after second meeting
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should merge overlapping busy periods', async () => {
      mockCalendarSync.getAvailability = () =>
        Effect.succeed([
          {
            startTime: new Date('2025-12-01T10:00:00Z'),
            endTime: new Date('2025-12-01T10:45:00Z'),
            status: 'busy',
          },
          {
            startTime: new Date('2025-12-01T10:30:00Z'),
            endTime: new Date('2025-12-01T11:30:00Z'),
            status: 'busy',
          },
        ]);

      const policy = createMockPolicy({
        blockOutTimePerEventMinutes: 0,
        workingHoursStartTime: '09:00',
        workingHoursEndTime: '17:00',
      });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const start = new Date('2025-12-01T09:00:00Z');
      const end = new Date('2025-12-01T12:00:00Z');

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'microsoft',
        startDate: start,
        endDate: end,
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      // Should treat overlapping meetings as single busy block
      expect(result.length).toBe(2); // Before and after merged block
    });
  });

  describe('Multi-Provider Support', () => {
    it('should work with Microsoft provider', async () => {
      mockCalendarSync.getAvailability = () => Effect.succeed([]);
      const policy = createMockPolicy();
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
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
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      expect(result).toEqual(expect.any(Array));
    });

    it('should work with Google provider', async () => {
      mockCalendarSync.getAvailability = () => Effect.succeed([]);
      const policy = createMockPolicy();
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const command: GetStaffAvailabilityCommand = {
        userId: 'user-1',
        provider: 'google',
        startDate: new Date('2025-12-01T09:00:00Z'),
        endDate: new Date('2025-12-01T17:00:00Z'),
        funeralHomeId: 'home-1',
      };

      const layer = Layer.mergeAll(
        Layer.succeed(CalendarSyncPort, mockCalendarSync),
        Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
      );

      const result = await Effect.runPromise(
        getStaffAvailability(command).pipe(Effect.provide(layer))
      );

      expect(result).toEqual(expect.any(Array));
    });
  });
});
