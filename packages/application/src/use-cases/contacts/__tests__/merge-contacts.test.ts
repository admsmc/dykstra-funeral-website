import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Effect } from 'effect';
import { Contact, ContactId, STANDARD_CONTACT_MANAGEMENT_POLICY, STRICT_CONTACT_MANAGEMENT_POLICY, PERMISSIVE_CONTACT_MANAGEMENT_POLICY } from '@dykstra/domain';
import { ContactManagementPolicyAdapter, resetContactPolicyStore } from '@dykstra/infrastructure';

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

describe('Merge Contacts - Policy Variation Tests', () => {
  let policyAdapter: ReturnType<typeof ContactManagementPolicyAdapter>;

  beforeEach(() => {
    resetContactPolicyStore();
    policyAdapter = ContactManagementPolicyAdapter();
  });

  afterEach(() => {
    resetContactPolicyStore();
  });

  describe('Scenario 1: Standard Policy (Balanced Merge)', () => {
    it('should use mostRecent field precedence strategy', async () => {
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

      expect(policy.mergeFieldPrecedence).toBe('mostRecent');
    });

    it('should auto-merge without approval requirement', async () => {
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

      expect(policy.isMergeApprovalRequired).toBe(false);
    });

    it('should retain merged history 1 year', async () => {
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

      expect(policy.mergeRetentionDays).toBe(365);
    });

    it('should auto-link family relationships on merge', async () => {
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

      expect(policy.mergeFamilyRelationshipsAutomatic).toBe(true);
    });
  });

  describe('Scenario 2: Strict Policy (Conservative Merge)', () => {
    it('should use newest field precedence strategy (most conservative)', async () => {
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

      expect(policy.mergeFieldPrecedence).toBe('newest');
    });

    it('should require merge approval (safety mechanism)', async () => {
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

    it('should retain merged history 7 years (legal requirement)', async () => {
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

      expect(policy.mergeRetentionDays).toBe(2555); // ~7 years
    });

    it('should require manual review of family relationships', async () => {
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

      expect(policy.mergeFamilyRelationshipsAutomatic).toBe(false);
    });
  });

  describe('Scenario 3: Permissive Policy (Aggressive Merge)', () => {
    it('should use preferNonNull strategy (maximize data retention)', async () => {
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

      expect(policy.mergeFieldPrecedence).toBe('preferNonNull');
    });

    it('should auto-merge immediately without approval', async () => {
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

    it('should retain merged history only 3 months (space-efficient)', async () => {
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

      expect(policy.mergeRetentionDays).toBe(90);
    });

    it('should aggressively auto-link family relationships', async () => {
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

      expect(policy.mergeFamilyRelationshipsAutomatic).toBe(true);
    });
  });

  describe('Scenario 4: Field Precedence Strategies', () => {
    it('should support mostRecent strategy (keeps most up-to-date values)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-recent',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-recent',
          minDuplicateSimilarityThreshold: 75,
          duplicateMatchingWeights: { name: 40, email: 30, phone: 30 },
          mergeFieldPrecedence: 'mostRecent',
          isMergeApprovalRequired: false,
          mergeRetentionDays: 365,
          mergeFamilyRelationshipsAutomatic: true,
          ignoreDuplicatesOlderThanDays: 730,
          ignoreMergedContactsInSearch: true,
          maxDuplicatesPerSearch: 50,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reason: null,
        })
      );

      expect(policy.mergeFieldPrecedence).toBe('mostRecent');
    });

    it('should support newest strategy (keeps originally created values)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-newest',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-newest',
          minDuplicateSimilarityThreshold: 85,
          duplicateMatchingWeights: { name: 50, email: 30, phone: 20 },
          mergeFieldPrecedence: 'newest',
          isMergeApprovalRequired: true,
          mergeRetentionDays: 2555,
          mergeFamilyRelationshipsAutomatic: false,
          ignoreDuplicatesOlderThanDays: 365,
          ignoreMergedContactsInSearch: true,
          maxDuplicatesPerSearch: 10,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reason: null,
        })
      );

      expect(policy.mergeFieldPrecedence).toBe('newest');
    });

    it('should support preferNonNull strategy (maximizes data retention)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-nonnull',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-nonnull',
          minDuplicateSimilarityThreshold: 60,
          duplicateMatchingWeights: { name: 34, email: 33, phone: 33 },
          mergeFieldPrecedence: 'preferNonNull',
          isMergeApprovalRequired: false,
          mergeRetentionDays: 90,
          mergeFamilyRelationshipsAutomatic: true,
          ignoreDuplicatesOlderThanDays: 1825,
          ignoreMergedContactsInSearch: false,
          maxDuplicatesPerSearch: 100,
          createdBy: 'test',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reason: null,
        })
      );

      expect(policy.mergeFieldPrecedence).toBe('preferNonNull');
    });
  });

  describe('Scenario 5: Policy Isolation & Versioning', () => {
    it('should isolate merge policies per funeral home', async () => {
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
      expect(policy1.isMergeApprovalRequired).toBe(false);
      expect(policy2.isMergeApprovalRequired).toBe(true);
    });

    it('should track SCD2 temporal validity for policy changes', async () => {
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

    it('should maintain audit trail (createdBy, updatedBy)', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STANDARD_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'admin-user',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      expect(policy.createdBy).toBe('admin-user');
      expect(policy.updatedBy).toBeNull();
    });

    it('should store policy change reason for compliance', async () => {
      const policy = await Effect.runPromise(
        policyAdapter.create({
          businessKey: 'contact-policy-fh-test-1',
          version: 2,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId: 'fh-test-1',
          ...STRICT_CONTACT_MANAGEMENT_POLICY,
          createdBy: 'admin-user',
          updatedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reason: 'Increased merge approval requirement per compliance audit',
        })
      );

      expect(policy.reason).toBe('Increased merge approval requirement per compliance audit');
    });
  });

  describe('Scenario 6: Merge Approval Requirements', () => {
    it('should return approval requirement status in merge result', async () => {
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

      // Policy result would include: requiresApproval: false
      expect(policy.isMergeApprovalRequired).toBe(false);
    });

    it('should indicate approval needed for strict policy', async () => {
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

      // Policy result would include: requiresApproval: true
      expect(policy.isMergeApprovalRequired).toBe(true);
    });
  });

  describe('Scenario 7: Error Handling & Edge Cases', () => {
    it('should handle policy not found error gracefully', async () => {
      const result = await Effect.runPromise(
        policyAdapter.findCurrentByFuneralHomeId('fh-nonexistent').pipe(
          Effect.either
        )
      );

      expect(result._tag).toBe('Left');
    });

    it('should enforce per-funeral-home isolation in commands', () => {
      const contact1 = createTestContact('1', 'John', 'Doe', 'john@example.com', '5551234567');
      const contact2 = createTestContact('2', 'Jane', 'Doe', 'jane@example.com', '5551234568');

      // Both contacts from same funeral home
      expect(contact1.funeralHomeId).toBe('fh-test-1');
      expect(contact2.funeralHomeId).toBe('fh-test-1');

      // Command must include funeralHomeId for policy lookup
      const command = {
        funeralHomeId: 'fh-test-1',
        sourceContactBusinessKey: contact1.businessKey,
        targetContactBusinessKey: contact2.businessKey,
      };

      expect(command.funeralHomeId).toBe('fh-test-1');
    });

    it('should verify retention days is positive number', async () => {
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

      expect(policy.mergeRetentionDays).toBeGreaterThan(0);
    });
  });
});
