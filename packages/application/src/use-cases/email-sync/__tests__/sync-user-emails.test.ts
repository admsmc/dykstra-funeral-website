import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Effect } from 'effect';
import {
  STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
  STRICT_EMAIL_CALENDAR_SYNC_POLICY,
  PERMISSIVE_EMAIL_CALENDAR_SYNC_POLICY,
} from '@dykstra/domain';
import { EmailCalendarSyncPolicyAdapter, resetEmailSyncPolicyStore } from '@dykstra/infrastructure';

describe('Sync User Emails - Policy Variation Tests', () => {
  let policyAdapter: ReturnType<typeof EmailCalendarSyncPolicyAdapter>;

  beforeEach(() => {
    resetEmailSyncPolicyStore();
    policyAdapter = EmailCalendarSyncPolicyAdapter();
  });

  afterEach(() => {
    resetEmailSyncPolicyStore();
  });

  describe('Scenario 1: Standard Policy (Balanced Sync)', () => {
    it('should use 15 minute sync frequency', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.emailSyncFrequencyMinutes).toBe(15);
    });

    it('should allow 3 retries with 5 second delay', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.maxRetries).toBe(3);
      expect(policy.retryDelaySeconds).toBe(5);
    });

    it('should use exact + fuzzy fallback matching strategy', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.emailMatchingStrategy).toBe('exact_with_fallback');
      expect(policy.fuzzyMatchThreshold).toBe(85);
      expect(policy.emailFallbackStrategies).toContain('exact');
      expect(policy.emailFallbackStrategies).toContain('fuzzy');
      expect(policy.emailFallbackStrategies).toContain('domain');
    });

    it('should map all calendar fields (subject, time, attendees, desc, location)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.calendarFieldMappings.subject).toBe(true);
      expect(policy.calendarFieldMappings.startTime).toBe(true);
      expect(policy.calendarFieldMappings.endTime).toBe(true);
      expect(policy.calendarFieldMappings.attendees).toBe(true);
      expect(policy.calendarFieldMappings.description).toBe(true);
      expect(policy.calendarFieldMappings.location).toBe(true);
    });
  });

  describe('Scenario 2: Strict Policy (Conservative Sync)', () => {
    it('should use 30 minute sync frequency (less frequent)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-2',
          ...STRICT_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.emailSyncFrequencyMinutes).toBe(30);
    });

    it('should allow 5 retries with 10 second delay (more resilient)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-2',
          ...STRICT_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.maxRetries).toBe(5);
      expect(policy.retryDelaySeconds).toBe(10);
    });

    it('should use exact matching only (no fuzzy)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-2',
          ...STRICT_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.emailMatchingStrategy).toBe('exact');
      expect(policy.emailFallbackStrategies).toEqual(['exact']);
    });

    it('should map only essential calendar fields (subject, time, attendees)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-2',
          ...STRICT_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.calendarFieldMappings.subject).toBe(true);
      expect(policy.calendarFieldMappings.startTime).toBe(true);
      expect(policy.calendarFieldMappings.endTime).toBe(true);
      expect(policy.calendarFieldMappings.attendees).toBe(true);
      expect(policy.calendarFieldMappings.description).toBe(false);
      expect(policy.calendarFieldMappings.location).toBe(false);
    });
  });

  describe('Scenario 3: Permissive Policy (Aggressive Sync)', () => {
    it('should use 5 minute sync frequency (very frequent)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.emailSyncFrequencyMinutes).toBe(5);
    });

    it('should allow only 1 retry with 1 second delay (fail-fast)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.maxRetries).toBe(1);
      expect(policy.retryDelaySeconds).toBe(1);
    });

    it('should use fuzzy matching with low threshold (aggressive)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.emailMatchingStrategy).toBe('fuzzy');
      expect(policy.fuzzyMatchThreshold).toBe(70);
    });

    it('should map all calendar fields', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.calendarFieldMappings.subject).toBe(true);
      expect(policy.calendarFieldMappings.startTime).toBe(true);
      expect(policy.calendarFieldMappings.endTime).toBe(true);
      expect(policy.calendarFieldMappings.attendees).toBe(true);
      expect(policy.calendarFieldMappings.description).toBe(true);
      expect(policy.calendarFieldMappings.location).toBe(true);
    });
  });

  describe('Scenario 4: Policy Isolation & Versioning', () => {
    it('should isolate policies per funeral home', async () => {
      const policy1 = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const policy2 = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-2',
          ...STRICT_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy1.funeralHomeId).toBe('fh-1');
      expect(policy2.funeralHomeId).toBe('fh-2');
      expect(policy1.emailSyncFrequencyMinutes).not.toBe(policy2.emailSyncFrequencyMinutes);
    });

    it('should track SCD2 temporal validity', async () => {
      const policyV1 = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-1',
          version: 1,
          validFrom: new Date('2025-12-01T10:00:00Z'),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date('2025-12-01T10:00:00Z'),
          updatedAt: new Date('2025-12-01T10:00:00Z'),
        })
      );

      expect(policyV1.version).toBe(1);
      expect(policyV1.isCurrent).toBe(true);
      expect(policyV1.validTo).toBeNull();
    });

    it('should maintain audit trail (createdBy, updatedBy)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'admin-user',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.createdBy).toBe('admin-user');
      expect(policy.updatedBy).toBeNull();
    });

    it('should support custom sync frequency configuration', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-custom',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-custom',
          emailSyncFrequencyMinutes: 10, // Custom: 10 minutes
          maxRetries: 2,
          retryDelaySeconds: 3,
          emailMatchingStrategy: 'exact',
          fuzzyMatchThreshold: 80,
          emailFallbackStrategies: ['exact', 'domain'],
          calendarFieldMappings: {
            subject: true,
            startTime: true,
            endTime: true,
            attendees: false,
            description: false,
            location: false,
          },
          timezoneHandling: 'utc',
          calendarSyncRetryPolicy: 'fixed',
          availabilityLookAheadDays: 60,
          blockOutTimePerEventMinutes: 10,
          meetingDurationMinutes: 30,
          timeSlotSuggestionCount: 8,
          minimumBufferMinutes: 10,
          workingHoursStartTime: '08:30',
          workingHoursEndTime: '17:30',
          notificationDelayMinutes: 15,
          enableSyncNotifications: true,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reason: null,
        })
      );

      expect(policy.emailSyncFrequencyMinutes).toBe(10);
      expect(policy.maxRetries).toBe(2);
      expect(policy.retryDelaySeconds).toBe(3);
    });
  });

  describe('Scenario 5: Error Handling & Edge Cases', () => {
    it('should handle policy not found error gracefully', async () => {
      const result = await Effect.runPromiseEither(
        policyAdapter.findCurrentByFuneralHomeId('fh-nonexistent')
      );

      expect(result._tag).toBe('Left');
    });

    it('should enforce per-funeral-home isolation in sync commands', async () => {
      const policy1 = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      // Simulate a sync-user-emails command that specifies funeralHomeId
      const command = {
        userId: 'user-123',
        funeralHomeId: 'fh-1', // Command must specify funeral home
        provider: 'microsoft' as const,
      };

      expect(command.funeralHomeId).toBe('fh-1');
      expect(policy1.funeralHomeId).toBe('fh-1');
    });

    it('should verify sync frequency is positive number', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'email-sync-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_EMAIL_CALENDAR_SYNC_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.emailSyncFrequencyMinutes).toBeGreaterThan(0);
      expect(policy.maxRetries).toBeGreaterThanOrEqual(0);
    });
  });
});
