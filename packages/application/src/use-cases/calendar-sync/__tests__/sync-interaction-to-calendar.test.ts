import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect } from 'effect';
import { syncInteractionToCalendar, type SyncInteractionToCalendarCommand } from '../sync-interaction-to-calendar';
import { type CalendarSyncServicePort } from '../../../ports/calendar-sync-port';
import { type CalendarEventRepositoryService } from '../../../ports/calendar-event-repository';
import { type EmailCalendarSyncPolicyRepositoryService } from '../../../ports/email-calendar-sync-policy-repository';
import { type EmailCalendarSyncPolicy } from '../../../../domain/src/entities/email-sync/email-calendar-sync-policy';
import { type Interaction } from '@dykstra/domain';

// Mock Interaction factory
const createMockInteraction = (overrides?: Partial<Interaction>): Interaction => ({
  id: 'interaction-1',
  funeralHomeId: 'home-1',
  type: 'phone-call',
  notes: 'Call with family',
  location: 'Office',
  scheduledFor: new Date('2025-12-03T10:00:00Z'),
  contactEmail: 'family@example.com',
  contactName: 'John Doe',
  leadEmail: null,
  leadName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

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
      findByInteractionId: () => Effect.succeed(null),
      findById: () => Effect.succeed(null),
      create: vi.fn(() => Effect.succeed(null)),
      update: vi.fn(() => Effect.succeed(null)),
      delete: vi.fn(() => Effect.succeed(void 0)),
      findByFuneralHome: () => Effect.succeed([]),
    };

    mockPolicyRepo = {
      findByFuneralHome: () => Effect.succeed(createMockPolicy()),
      findById: () => Effect.succeed(createMockPolicy()),
      create: () => Effect.succeed(createMockPolicy()),
      update: () => Effect.succeed(createMockPolicy()),
      delete: () => Effect.succeed(void 0),
    };
  });

  describe('Create Event - Standard Policy (Full Field Mapping)', () => {
    it('should create calendar event with all field mappings from Standard policy', async () => {
      const interaction = createMockInteraction({
        type: 'phone-call',
        notes: 'Family discussion',
        location: 'Conference Room A',
        contactEmail: 'family@example.com',
        contactName: 'Jane Smith',
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
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
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
            title: 'phone-call', // subject mapping
            description: 'Family discussion', // description mapping
            location: 'Conference Room A', // location mapping
            attendees: expect.arrayContaining([
              expect.objectContaining({
                email: 'family@example.com',
                name: 'Jane Smith',
              }),
            ]), // attendees mapping
          }),
        })
      );
    });

    it('should save created calendar event to repository', async () => {
      const interaction = createMockInteraction();
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(createMockPolicy());

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'google',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
            )
          )
        )
      );

      // Verify event was saved to repository
      expect(mockEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          funeralHomeId: 'home-1',
          interactionId: interaction.id,
          provider: 'google',
          externalId: 'ext-event-1',
          title: interaction.type,
          description: interaction.notes,
          location: interaction.location,
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
      mockEventRepo.findByInteractionId = () => Effect.succeed(existingEvent as any);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
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
        notes: 'Sensitive information',
        location: 'Private room',
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
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
            )
          )
        )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            description: null, // Not mapped
            location: null, // Not mapped
            title: 'phone-call',
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
        contactEmail: 'family@example.com',
        contactName: 'John Doe',
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
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'google',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
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
    it('should include attendee from contactEmail when policy enabled', async () => {
      const interaction = createMockInteraction({
        contactEmail: 'john@example.com',
        contactName: 'John Doe',
      });
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
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
            )
          )
        )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            attendees: expect.arrayContaining([
              expect.objectContaining({
                email: 'john@example.com',
                name: 'John Doe',
              }),
            ]),
          }),
        })
      );
    });

    it('should fall back to leadEmail when contactEmail absent', async () => {
      const interaction = createMockInteraction({
        contactEmail: null,
        contactName: null,
        leadEmail: 'lead@example.com',
        leadName: 'Jane Lead',
      });
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
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'google',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
            )
          )
        )
      );

      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            attendees: expect.arrayContaining([
              expect.objectContaining({
                email: 'lead@example.com',
                name: 'Jane Lead',
              }),
            ]),
          }),
        })
      );
    });

    it('should exclude attendees when policy disabled', async () => {
      const interaction = createMockInteraction({
        contactEmail: 'john@example.com',
        contactName: 'John Doe',
      });
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
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(policy);

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
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
        findByFuneralHome: (homeId) =>
          Effect.succeed(homeId === 'home-1' ? policy1 : policy2),
        findById: () => Effect.succeed(policy1),
        create: () => Effect.succeed(policy1),
        update: () => Effect.succeed(policy1),
        delete: () => Effect.succeed(void 0),
      };

      // Sync for home-1 (full mapping)
      const command1: SyncInteractionToCalendarCommand = {
        interaction: interaction1,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command1),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepoMulti)
            )
          )
        )
      );

      // First call should have all fields
      expect(mockCalendarSync.createEvent).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          eventData: expect.objectContaining({
            title: 'phone-call',
            description: expect.any(String),
            location: expect.any(String),
            attendees: expect.not.stringMatching(/^$/),
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
        Effect.provide(
          syncInteractionToCalendar(command2),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepoMulti)
            )
          )
        )
      );

      // Second call should have minimal fields
      expect(mockCalendarSync.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventData: expect.objectContaining({
            description: null,
            location: null,
            attendees: [],
          }),
        })
      );
    });
  });

  describe('Time Handling', () => {
    it('should use policy-configured duration for endTime when startTime enabled', async () => {
      const startTime = new Date('2025-12-03T14:00:00Z');
      const interaction = createMockInteraction({ scheduledFor: startTime });
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(createMockPolicy());

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
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
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(createMockPolicy());

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'microsoft',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
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
      mockPolicyRepo.findByFuneralHome = () => Effect.succeed(createMockPolicy());

      const command: SyncInteractionToCalendarCommand = {
        interaction,
        userId: 'user-1',
        provider: 'google',
        funeralHomeId: 'home-1',
      };

      await Effect.runPromise(
        Effect.provide(
          syncInteractionToCalendar(command),
          Effect.mergeContexts(
            Effect.contextFromEnvironment(() => mockCalendarSync),
            Effect.mergeContexts(
              Effect.contextFromEnvironment(() => mockEventRepo),
              Effect.contextFromEnvironment(() => mockPolicyRepo)
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
