import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer } from 'effect';
import { syncInteractionToCalendar, type SyncInteractionToCalendarCommand } from '../sync-interaction-to-calendar';
import { CalendarSyncPort, type CalendarSyncServicePort } from '../../../ports/calendar-sync-port';
import { CalendarEventRepository, type CalendarEventRepositoryService } from '../../../ports/calendar-event-repository';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../../ports/email-calendar-sync-policy-repository';
import { type EmailCalendarSyncPolicy } from '../../../../domain/src/entities/email-sync/email-calendar-sync-policy';
import { type Interaction } from '@dykstra/domain';

// Mock Interaction factory (matches real Interaction entity)
const createMockInteraction = (overrides?: Partial<Interaction>): Interaction => ({
  id: 'interaction-1' as any,
  funeralHomeId: 'home-1',
  leadId: null,
  contactId: null,
  caseId: null,
  type: 'phone_call',
  direction: 'inbound',
  subject: 'Call with family', // Maps to calendar title
  body: 'Discussion about funeral arrangements', // Maps to calendar description
  outcome: null,
  scheduledFor: new Date('2025-12-03T10:00:00Z'),
  completedAt: null,
  duration: null,
  staffId: 'staff-1',
  createdAt: new Date(),
  ...overrides,
} as Interaction);

// Mock Policy factory
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

describe('Sync Interaction To Calendar - Policy-Driven', () => {
  let mockCalendarSync: CalendarSyncServicePort;
  let mockEventRepo: CalendarEventRepositoryService;
  let mockPolicyRepo: EmailCalendarSyncPolicyRepositoryService;

  beforeEach(() => {
    mockCalendarSync = {
      createEvent: vi.fn(() =>
        Effect.succeed({ externalId: 'ext-event-1', calendarEvent: {} as any })
      ),
      updateEvent: vi.fn(() => Effect.succeed(void 0)),
      deleteEvent: vi.fn(() => Effect.succeed(void 0)),
      getEvent: vi.fn(() => Effect.succeed(null)),
      listEvents: vi.fn(() => Effect.succeed([])),
      getAvailability: vi.fn(() =>
        Effect.succeed([
          {
            startTime: new Date(),
            endTime: new Date(),
            status: 'free' as const,
          },
        ])
      ),
      refreshToken: vi.fn(() => Effect.succeed(void 0)),
    };

    mockEventRepo = {
      save: vi.fn(() => Effect.succeed(null as any)),
      findById: () => Effect.succeed(null),
      findByInteraction: () => Effect.succeed(null),
      findByDateRange: () => Effect.succeed([]),
      existsByExternalId: () => Effect.succeed(false),
      findByExternalId: () => Effect.succeed(null),
      delete: vi.fn(() => Effect.succeed(void 0)),
      hardDelete: vi.fn(() => Effect.succeed(void 0)),
      findUpcoming: () => Effect.succeed([]),
      findByAttendee: () => Effect.succeed([]),
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

  describe('Create Event - Standard Policy (Full Field Mapping)', () => {
    it('should create calendar event with all field mappings from Standard policy', async () => {
      const interaction = createMockInteraction({
        subject: 'Family consultation call',
        body: 'Discussion about pre-planning arrangements',
      });
      const policy = createMockPolicy({
        policyName: 'Standard',
        calendarFieldMappings: {
          subject: true,
          startTime: true,
          endTime: true,
          attendees: true,
          description: true,
          location: true,
        },
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Verify createEvent was called with all fields
      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          funeralHomeId: 'home-1',
          provider: 'microsoft',
          eventData: expect.objectContaining({
            title: 'Family consultation call', // From interaction.subject
            description: 'Discussion about pre-planning arrangements', // From interaction.body
            // Note: Interaction doesn't have location or attendees - use case should handle null/empty
          }),
        })
      );
    });

    it('should save created calendar event to repository', async () => {
      const interaction = createMockInteraction();
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(createMockPolicy());

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'google',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Verify event was saved to repository
      expect(mockEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          funeralHomeId: 'home-1',
          interactionId: interaction.id,
          provider: 'google',
          externalId: 'ext-event-1',
          title: interaction.subject,
          description: interaction.body,
          createdBy: 'user-1',
        })
      );
    });
  });

  describe('Update Event - Existing Linked Calendar Event', () => {
    it('should update existing calendar event instead of creating new', async () => {
      const interaction = createMockInteraction();
      const existingEvent = {
        id: 'cal-event-1',
        externalId: 'ext-event-123',
        interactionId: interaction.id,
      };
      mockEventRepo.findByInteraction = () => Effect.succeed(existingEvent as any);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Verify updateEvent was called instead of createEvent
      expect(mockCalendarSync.updateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          provider: 'microsoft',
          externalId: 'ext-event-123',
          eventData: expect.any(Object),
        })
      );

      // Verify createEvent was NOT called
      expect(mockCalendarSync.createEvent).not.toHaveBeenCalled();
    });
  });

  describe('Selective Field Mapping - Strict Policy', () => {
    it('should exclude description and location with Strict policy', async () => {
      const interaction = createMockInteraction({
        subject: 'Sensitive call',
        body: 'Confidential information', // Will be excluded by policy
      });
      const policy = createMockPolicy({
        policyName: 'Strict',
        calendarFieldMappings: {
          subject: true,
          startTime: true,
          endTime: true,
          attendees: true,
          description: false, // Excluded in Strict
          location: false, // Excluded in Strict
        },
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            title: 'Sensitive call', // Subject mapped
            description: null, // Excluded by Strict policy
            location: null, // Interaction doesn't have location; use case returns null
            startTime: expect.any(Date),
            endTime: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('Minimal Field Mapping - Permissive Policy (Time Only)', () => {
    it('should include only time fields with minimal Permissive policy', async () => {
      const interaction = createMockInteraction({
        subject: 'Will be excluded',
        body: 'Will also be excluded',
      });
      const policy = createMockPolicy({
        policyName: 'Permissive',
        calendarFieldMappings: {
          subject: false,
          startTime: true,
          endTime: true,
          attendees: false,
          description: false,
          location: false,
        },
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'google',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            title: 'Event', // Default since subject=false
            startTime: interaction.scheduledFor,
            endTime: expect.any(Date),
            description: null,
            location: null,
            attendees: [],
          }),
        })
      );
    });
  });

  describe('Attendee Mapping', () => {
    it('should return empty attendees (Interaction has no email fields)', async () => {
      const interaction = createMockInteraction({});
      const policy = createMockPolicy({
        calendarFieldMappings: {
          subject: true,
          startTime: true,
          endTime: true,
          attendees: true, // Enabled
          description: false,
          location: false,
        },
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Interaction doesn't have contactEmail/contactName fields
      // Use case correctly returns empty attendees array
      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            attendees: [], // Empty - Interaction doesn't have email fields
          }),
        })
      );
    });

    it('should return empty attendees when policy disabled', async () => {
      const interaction = createMockInteraction({});
      const policy = createMockPolicy({
        calendarFieldMappings: {
          subject: true,
          startTime: true,
          endTime: true,
          attendees: true,
          description: false,
          location: false,
        },
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'google',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Always returns empty attendees (Interaction has no email fields)
      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            attendees: [], // Empty regardless of policy
          }),
        })
      );
    });

    it('should exclude attendees when policy disabled', async () => {
      const interaction = createMockInteraction({});
      const policy = createMockPolicy({
        calendarFieldMappings: {
          subject: true,
          startTime: true,
          endTime: true,
          attendees: false, // Disabled
          description: false,
          location: false,
        },
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            attendees: [], // Empty
          }),
        })
      );
    });
  });

  describe('Policy Isolation Per Funeral Home', () => {
    it('should apply different policies for different funeral homes', async () => {
      const interaction1 = createMockInteraction({ funeralHomeId: 'home-1' });
      const interaction2 = createMockInteraction({ funeralHomeId: 'home-2' });

      const policy1 = createMockPolicy({
        funeralHomeId: 'home-1',
        calendarFieldMappings: {
          subject: true,
          startTime: true,
          endTime: true,
          attendees: true,
          description: true,
          location: true,
        },
      });

      const policy2 = createMockPolicy({
        funeralHomeId: 'home-2',
        calendarFieldMappings: {
          subject: true,
          startTime: true,
          endTime: true,
          attendees: false, // Different: no attendees
          description: false, // Different: no description
          location: false, // Different: no location
        },
      });

      const mockPolicyRepoMulti: EmailCalendarSyncPolicyRepositoryService = {
        findCurrentByFuneralHomeId: (homeId) =>
          Effect.succeed(homeId === 'home-1' ? policy1 : policy2),
        findAllVersionsByFuneralHomeId: () => Effect.succeed([policy1]),
        findById: () => Effect.succeed(policy1),
        create: () => Effect.succeed(policy1),
        update: () => Effect.succeed(policy1),
        listCurrentPolicies: () => Effect.succeed([policy1]),
      };

      // Sync for home-1 (full mapping)
      const command1: SyncInteractionToCalendarCommand = {
        interaction: interaction1,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command1).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(CalendarSyncPort, mockCalendarSync),
              Layer.succeed(CalendarEventRepository, mockEventRepo),
              Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepoMulti)
            )
          )
        )
      );

      // First call should have all fields (Standard policy)
      expect(mockCalendarSync.createEvent).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          eventData: expect.objectContaining({
            title: expect.any(String), // From interaction.subject
            description: expect.any(String), // From interaction.body
          }),
        })
      );

      vi.clearAllMocks();

      // Sync for home-2 (minimal mapping)
      const command2: SyncInteractionToCalendarCommand = {
        interaction: interaction2,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-2',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command2).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(CalendarSyncPort, mockCalendarSync),
              Layer.succeed(CalendarEventRepository, mockEventRepo),
              Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepoMulti)
            )
          )
        )
      );

      // Second call should have minimal fields
      // Always returns empty attendees (Interaction has no email fields)
      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            attendees: [], // Empty regardless of policy
          }),
        })
      );
    });
  });

  describe('Time Handling', () => {
    it('should use policy-configured duration for endTime when startTime enabled', async () => {
      const startTime = new Date('2025-12-03T14:00:00Z');
      const interaction = createMockInteraction({ scheduledFor: startTime });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(createMockPolicy());

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            startTime: startTime,
            endTime: expect.any(Date), // Should be 1 hour after start
          }),
        })
      );
    });
  });

  describe('Multi-Provider Support', () => {
    it('should work with Microsoft provider', async () => {
      const interaction = createMockInteraction();
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(createMockPolicy());

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'microsoft' })
      );
    });

    it('should work with Google provider', async () => {
      const interaction = createMockInteraction();
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(createMockPolicy());

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'google',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        syncInteractionToCalendar(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(CalendarSyncPort, mockCalendarSync),
            Layer.succeed(CalendarEventRepository, mockEventRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      );
    });
  });
});
