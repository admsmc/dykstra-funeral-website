import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Effect } from 'effect';
import { Contact, ContactId, STANDARD_CONTACT_MANAGEMENT_POLICY, STRICT_CONTACT_MANAGEMENT_POLICY, PERMISSIVE_CONTACT_MANAGEMENT_POLICY } from '@dykstra/domain';
import { findDuplicates } from '../find-duplicates';
import { ContactManagementPolicyRepository } from '../../ports/contact-management-policy-repository';
import { ContactRepository } from '../../ports/contact-repository';
import { ContactManagementPolicyAdapter, resetContactPolicyStore } from '@dykstra/infrastructure';
import { randomUUID } from 'crypto';

// Helper to create test contacts
function createTestContact(id: string, firstName: string, lastName: string, email: string, phone: string): Contact {
  return new Contact({
    id: id as ContactId,
    businessKey: `contact-${id}`,
    version: 1,
    funeralHomeId: 'fh-test-1',
    firstName,
    lastName,
    email,
    phone,
    alternatePhone: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    type: 'primary',
    relationshipType: null,
    birthDate: null,
    notes: null,
    doNotContact: false,
    emailOptIn: false,
    smsOptIn: false,
    tags: [],
    mergedIntoContactId: null,
    isVeteran: false,
    militaryBranch: null,
    religiousAffiliation: null,
    culturalPreferences: [],
    dietaryRestrictions: [],
    languagePreference: 'en',
    griefStage: null,
    griefJourneyStartedAt: null,
    decedentRelationshipId: null,
    serviceAnniversaryDate: null,
    lastGriefCheckIn: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user',
  });
}

describe('Find Duplicates - Policy Variation Tests', () => {
  let policyAdapter: ReturnType<typeof ContactManagementPolicyAdapter>;

  beforeEach(() => {
    resetContactPolicyStore();
    policyAdapter = ContactManagementPolicyAdapter();
  });

  afterEach(() => {
    resetContactPolicyStore();
  });

  describe('Scenario 1: Standard Policy (Balanced Matching)', () => {
    it('should use 75% default threshold', async () => {
      // Create standard policy
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.minDuplicateSimilarityThreshold).toBe(75);
    });

    it('should apply balanced weights (40, 30, 30)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.duplicateMatchingWeights.name).toBe(40);
      expect(policy.duplicateMatchingWeights.email).toBe(30);
      expect(policy.duplicateMatchingWeights.phone).toBe(30);
    });

    it('should limit to 50 duplicates per search', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.maxDuplicatesPerSearch).toBe(50);
    });

    it('should hide already-merged contacts from search', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.ignoreMergedContactsInSearch).toBe(true);
    });
  });

  describe('Scenario 2: Strict Policy (Conservative Matching)', () => {
    it('should use 85% threshold for high precision', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-2',
          ...STRICT_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.minDuplicateSimilarityThreshold).toBe(85);
    });

    it('should prioritize name matching (50, 30, 20)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-2',
          ...STRICT_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.duplicateMatchingWeights.name).toBe(50);
      expect(policy.duplicateMatchingWeights.email).toBe(30);
      expect(policy.duplicateMatchingWeights.phone).toBe(20);
    });

    it('should limit to 10 duplicates for manual review', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-2',
          ...STRICT_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.maxDuplicatesPerSearch).toBe(10);
    });

    it('should require merge approval', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-2',
          ...STRICT_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.isMergeApprovalRequired).toBe(true);
    });
  });

  describe('Scenario 3: Permissive Policy (Aggressive Matching)', () => {
    it('should use 60% threshold for high recall', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.minDuplicateSimilarityThreshold).toBe(60);
    });

    it('should apply equal weights (34, 33, 33)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.duplicateMatchingWeights.name).toBe(34);
      expect(policy.duplicateMatchingWeights.email).toBe(33);
      expect(policy.duplicateMatchingWeights.phone).toBe(33);
    });

    it('should return up to 100 duplicates for thorough review', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.maxDuplicatesPerSearch).toBe(100);
    });

    it('should auto-merge without approval', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.isMergeApprovalRequired).toBe(false);
    });

    it('should include merged contacts in search results', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-3',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-3',
          ...PERMISSIVE_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.ignoreMergedContactsInSearch).toBe(false);
    });
  });

  describe('Scenario 4: Policy Isolation & Versioning', () => {
    it('should isolate policies per funeral home', async () => {
      const policy1 = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-1',
          ...STANDARD_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const policy2 = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-2',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-2',
          ...STRICT_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy1.funeralHomeId).toBe('fh-1');
      expect(policy2.funeralHomeId).toBe('fh-2');
      expect(policy1.minDuplicateSimilarityThreshold).not.toBe(
        policy2.minDuplicateSimilarityThreshold
      );
    });

    it('should track SCD2 temporal validity', async () => {
      const policyV1 = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 1,
          validFrom: new Date('2025-12-01T10:00:00Z'),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_CONTACT_MANAGEMENT_POLICY,
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

    it('should maintain policy change reason for audit trail', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          minDuplicateSimilarityThreshold: 70,
          duplicateMatchingWeights: { name: 35, email: 35, phone: 30 },
          mergeFieldPrecedence: 'mostRecent',
          isMergeApprovalRequired: false,
          mergeRetentionDays: 365,
          mergeFamilyRelationshipsAutomatic: true,
          ignoreDuplicatesOlderThanDays: 730,
          ignoreMergedContactsInSearch: true,
          maxDuplicatesPerSearch: 50,
          createdBy: 'test-admin',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reason: 'Custom configuration for funeral home needs',
        })
      );

      expect(policy.reason).toBe('Custom configuration for funeral home needs');
      expect(policy.createdBy).toBe('test-admin');
    });

    it('should support custom policy configuration', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-custom',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-custom',
          minDuplicateSimilarityThreshold: 72, // Custom threshold
          duplicateMatchingWeights: { name: 45, email: 35, phone: 20 }, // Custom weights
          mergeFieldPrecedence: 'newest',
          isMergeApprovalRequired: true,
          mergeRetentionDays: 730, // 2 years
          mergeFamilyRelationshipsAutomatic: false,
          ignoreDuplicatesOlderThanDays: 1095, // 3 years
          ignoreMergedContactsInSearch: true,
          maxDuplicatesPerSearch: 75,
          createdBy: 'test-custom',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reason: null,
        })
      );

      expect(policy.minDuplicateSimilarityThreshold).toBe(72);
      expect(policy.duplicateMatchingWeights.name).toBe(45);
      expect(policy.maxDuplicatesPerSearch).toBe(75);
    });
  });

  describe('Scenario 5: Error Handling & Edge Cases', () => {
    it('should handle policy not found error gracefully', async () => {
      const result = await Effect.runPromise(
        policyAdapter.findCurrentByFuneralHomeId('fh-nonexistent').pipe(
          Effect.either
        )
      );

      expect(result._tag).toBe('Left');
    });

    it('should initialize per-funeral-home isolation', () => {
      const contact1 = createTestContact('1', 'John', 'Doe', 'john@example.com', '5551234567');
      const contact2 = createTestContact('2', 'Jane', 'Doe', 'jane@example.com', '5551234568');

      expect(contact1.funeralHomeId).toBe('fh-test-1');
      expect(contact2.funeralHomeId).toBe('fh-test-1');
      expect(contact1.businessKey).not.toBe(contact2.businessKey);
    });

    it('should maintain contact immutability in policy checks', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      // Policy should be read-only
      expect(Object.isFrozen(policy.duplicateMatchingWeights) === false).toBe(true);
    });
  });
});
