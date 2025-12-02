import { describe, it, expect, beforeEach } from 'vitest';
import { Effect, Layer } from 'effect';
import { matchEmailToEntity, type MatchEmailCommand } from '../match-email-to-entity';
import { ContactRepository, type ContactRepositoryService } from '../../../ports/contact-repository';
import { LeadRepository, type LeadRepositoryService } from '../../../ports/lead-repository';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../../ports/email-calendar-sync-policy-repository';
import { type EmailCalendarSyncPolicy } from '../../../../domain/src/entities/email-sync/email-calendar-sync-policy';
import { type Contact } from '../../../../domain/src/entities/contact';
import { type Lead } from '../../../../domain/src/entities/lead';

// Mock Contact factory
const createMockContact = (overrides?: Partial<Contact>): Contact => ({
  id: 'contact-1',
  funeralHomeId: 'home-1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-1234',
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock Lead factory
const createMockLead = (overrides?: Partial<Lead>): Lead => ({
  id: 'lead-1',
  funeralHomeId: 'home-1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '555-5678',
  notes: '',
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
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Match Email To Entity - Policy-Driven', () => {
  let mockContactRepo: ContactRepositoryService;
  let mockLeadRepo: LeadRepositoryService;
  let mockPolicyRepo: EmailCalendarSyncPolicyRepositoryService;

  beforeEach(() => {
    // Default mock implementations
    mockContactRepo = {
      findById: () => Effect.succeed(createMockContact()),
      findByBusinessKey: () => Effect.succeed(null),
      findHistory: () => Effect.succeed([]),
      findByFuneralHome: () => Effect.succeed([]),
      findByTag: () => Effect.succeed([]),
      findByEmail: () => Effect.succeed([]),
      findByPhone: () => Effect.succeed([]),
      findMergedContacts: () => Effect.succeed([]),
      save: () => Effect.succeed(void 0),
      update: () => Effect.succeed(createMockContact()),
      delete: () => Effect.succeed(void 0),
    };

    mockLeadRepo = {
      findById: () => Effect.succeed(createMockLead()),
      findByBusinessKey: () => Effect.succeed(null),
      findHistory: () => Effect.succeed([]),
      findByFuneralHome: () => Effect.succeed([]),
      findHotLeads: () => Effect.succeed([]),
      findNeedingFollowUp: () => Effect.succeed([]),
      findByReferralSource: () => Effect.succeed([]),
      save: () => Effect.succeed(void 0),
      update: () => Effect.succeed(createMockLead()),
      delete: () => Effect.succeed(void 0),
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

  describe('Exact Email Match - Standard Policy', () => {
    it('should find exact email match on contact with 100% confidence', async () => {
      const contact = createMockContact({ email: 'john@example.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);

      const command: MatchEmailCommand = {
        emailAddress: 'john@example.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.contactId).toBe('contact-1');
      expect(result.leadId).toBeNull();
      expect(result.confidence).toBe(100);
      expect(result.matchReason).toContain('Exact email match on contact');
    });

    it('should find exact email match on lead with 100% confidence', async () => {
      const lead = createMockLead({ email: 'jane@example.com' });
      mockLeadRepo.findByFuneralHome = () => Effect.succeed([lead]);

      const command: MatchEmailCommand = {
        emailAddress: 'jane@example.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.leadId).toBe('lead-1');
      expect(result.contactId).toBeNull();
      expect(result.confidence).toBe(100);
      expect(result.matchReason).toContain('Exact email match on lead');
    });

    it('should be case-insensitive for exact matches', async () => {
      const contact = createMockContact({ email: 'john@example.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);

      const command: MatchEmailCommand = {
        emailAddress: 'JOHN@EXAMPLE.COM',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.contactId).toBe('contact-1');
      expect(result.confidence).toBe(100);
    });
  });

  describe('Domain Matching - Standard Policy', () => {
    it('should find domain match with 75% confidence for same company domain', async () => {
      const contact = createMockContact({ email: 'john@acmecorp.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);
      const policy = createMockPolicy({
        emailFallbackStrategies: ['exact', 'domain'],
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: MatchEmailCommand = {
        emailAddress: 'alice@acmecorp.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.contactId).toBe('contact-1');
      expect(result.confidence).toBe(75);
      expect(result.matchReason).toContain('Domain match');
    });

    it('should skip domain matching for common email providers', async () => {
      const contact = createMockContact({ email: 'john@gmail.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);
      const policy = createMockPolicy({
        emailFallbackStrategies: ['exact', 'domain'],
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: MatchEmailCommand = {
        emailAddress: 'alice@gmail.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.confidence).toBe(0);
      expect(result.matchReason).toContain('No match found');
    });
  });

  describe('Fuzzy Matching - Permissive Policy', () => {
    it('should find fuzzy email match above threshold with Permissive policy', async () => {
      const contact = createMockContact({ email: 'john.doe@example.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);
      const policy = createMockPolicy({
        policyName: 'Permissive',
        emailFallbackStrategies: ['fuzzy', 'exact', 'domain'],
        fuzzyMatchThreshold: 70,
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: MatchEmailCommand = {
        emailAddress: 'jon.doe@example.com', // Similar to john.doe
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.contactId).toBe('contact-1');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
      expect(result.matchReason).toContain('Fuzzy email match');
    });

    it('should respect Permissive policy fuzzy threshold of 70%', async () => {
      const contact = createMockContact({ email: 'abcdefghijklmnopqrst@example.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);
      const policy = createMockPolicy({
        policyName: 'Permissive',
        emailFallbackStrategies: ['fuzzy', 'exact'],
        fuzzyMatchThreshold: 70,
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: MatchEmailCommand = {
        emailAddress: 'zyxwvutsrqponmlkjih@example.com', // Very different
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Should not match as similarity is way below 70%
      expect(result.confidence).toBe(0);
    });
  });

  describe('Strict Policy - Conservative Matching', () => {
    it('should only match exact emails with Strict policy', async () => {
      const contact = createMockContact({ email: 'john@example.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);
      const policy = createMockPolicy({
        policyName: 'Strict',
        emailMatchingStrategy: 'exact',
        emailFallbackStrategies: ['exact'],
        fuzzyMatchThreshold: 100,
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: MatchEmailCommand = {
        emailAddress: 'jon@example.com', // Similar but not exact
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.confidence).toBe(0);
      expect(result.matchReason).toContain('No match found');
    });

    it('Strict policy should not use domain fallback', async () => {
      const contact = createMockContact({ email: 'john@acmecorp.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);
      const policy = createMockPolicy({
        policyName: 'Strict',
        emailFallbackStrategies: ['exact'],
        fuzzyMatchThreshold: 100,
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: MatchEmailCommand = {
        emailAddress: 'alice@acmecorp.com', // Same domain, different exact email
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.confidence).toBe(0);
      expect(result.matchReason).toContain('No match found');
    });
  });

  describe('Strategy Order - Policy-Driven Fallback Sequence', () => {
    it('should try strategies in policy-specified order', async () => {
      const contact = createMockContact({ email: 'john@acmecorp.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);
      const policy = createMockPolicy({
        emailFallbackStrategies: ['domain', 'exact'], // Domain first (unusual)
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: MatchEmailCommand = {
        emailAddress: 'alice@acmecorp.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Should match via domain strategy (first in order)
      expect(result.contactId).toBe('contact-1');
      expect(result.confidence).toBe(75);
      expect(result.matchReason).toContain('Domain match');
    });

    it('should return first match from strategy order (not best match)', async () => {
      const contact1 = createMockContact({
        id: 'contact-1',
        email: 'john@acmecorp.com',
      });
      const contact2 = createMockContact({
        id: 'contact-2',
        email: 'john.doe@example.com', // Fuzzy match: ~81% similarity
      });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact1, contact2]);
      const policy = createMockPolicy({
        emailFallbackStrategies: ['exact', 'fuzzy'],
        fuzzyMatchThreshold: 75, // Lower threshold to allow ~81% match
      });
      mockPolicyRepo.findCurrentByFuneralHomeId = () => Effect.succeed(policy);

      const command: MatchEmailCommand = {
        emailAddress: 'john@example.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Returns fuzzy match (via exact strategy) not better match from fuzzy strategy
      expect(result.matchReason).toContain('Fuzzy email match');
    });
  });

  describe('No Match Scenarios', () => {
    it('should return no match when email not found in any strategy', async () => {
      mockContactRepo.findByFuneralHome = () => Effect.succeed([]);
      mockLeadRepo.findByFuneralHome = () => Effect.succeed([]);

      const command: MatchEmailCommand = {
        emailAddress: 'unknown@example.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.contactId).toBeNull();
      expect(result.leadId).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.matchReason).toContain('No match found');
    });

    it('should handle whitespace in email addresses', async () => {
      const contact = createMockContact({ email: 'john@example.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);

      const command: MatchEmailCommand = {
        emailAddress: '  john@example.com  ',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.contactId).toBe('contact-1');
      expect(result.confidence).toBe(100);
    });
  });

  describe('Contact vs Lead Priority', () => {
    it('should prefer Contact match over Lead match with same confidence', async () => {
      const contact = createMockContact({ email: 'test@example.com' });
      const lead = createMockLead({ email: 'test@example.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);
      mockLeadRepo.findByFuneralHome = () => Effect.succeed([lead]);

      const command: MatchEmailCommand = {
        emailAddress: 'test@example.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      // Contact is checked first in exact matching
      expect(result.contactId).toBe('contact-1');
      expect(result.leadId).toBeNull();
    });
  });

  describe('Policy Versioning & Isolation', () => {
    it('should apply different policies per funeral home', async () => {
      const contact1 = createMockContact({ email: 'john@acmecorp.com', funeralHomeId: 'home-1' });
      const contact2 = createMockContact({ email: 'jane@acmecorp.com', funeralHomeId: 'home-2' });
      mockContactRepo.findByFuneralHome = (homeId) =>
        Effect.succeed(homeId === 'home-1' ? [contact1] : [contact2]);

      const policy1 = createMockPolicy({
        funeralHomeId: 'home-1',
        emailFallbackStrategies: ['exact'],
      });
      const policy2 = createMockPolicy({
        funeralHomeId: 'home-2',
        emailFallbackStrategies: ['exact', 'domain'],
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

      // home-1 with exact-only policy should not match domain
      const command1: MatchEmailCommand = {
        emailAddress: 'alice@acmecorp.com',
        funeralHomeId: 'home-1',
      };

      const result1 = await Effect.runPromise(
        matchEmailToEntity(command1).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(ContactRepository, mockContactRepo),
              Layer.succeed(LeadRepository, mockLeadRepo),
              Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepoMulti)
            )
          )
        )
      );

      expect(result1.confidence).toBe(0);

      // home-2 with exact+domain policy should match domain
      const command2: MatchEmailCommand = {
        emailAddress: 'bob@acmecorp.com',
        funeralHomeId: 'home-2',
      };

      const result2 = await Effect.runPromise(
        matchEmailToEntity(command2).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(ContactRepository, mockContactRepo),
              Layer.succeed(LeadRepository, mockLeadRepo),
              Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepoMulti)
            )
          )
        )
      );

      expect(result2.confidence).toBe(75);
      expect(result2.matchReason).toContain('Domain match');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email address', async () => {
      const command: MatchEmailCommand = {
        emailAddress: '',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.confidence).toBe(0);
    });

    it('should handle contacts/leads with null email', async () => {
      const contact = createMockContact({ email: null as any });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);

      const command: MatchEmailCommand = {
        emailAddress: 'test@example.com',
        funeralHomeId: 'home-1',
      };

      const result = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result.confidence).toBe(0);
    });

    it('should be consistent across multiple calls with same data', async () => {
      const contact = createMockContact({ email: 'john@example.com' });
      mockContactRepo.findByFuneralHome = () => Effect.succeed([contact]);

      const command: MatchEmailCommand = {
        emailAddress: 'john@example.com',
        funeralHomeId: 'home-1',
      };

      const result1 = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      const result2 = await Effect.runPromise(
        matchEmailToEntity(command).pipe(
        Effect.provide(
          Layer.mergeAll(
            Layer.succeed(ContactRepository, mockContactRepo),
            Layer.succeed(LeadRepository, mockLeadRepo),
            Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
          )
        )
      )
      );

      expect(result1).toEqual(result2);
    });
  });
});
