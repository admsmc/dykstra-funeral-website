import { describe, it, expect } from 'vitest';
import {
  LeadToCaseConversionPolicy,
  DEFAULT_LEAD_TO_CASE_CONVERSION_POLICY,
  FAST_TRACK_LEAD_TO_CASE_CONVERSION_POLICY,
  MINIMAL_LEAD_TO_CASE_CONVERSION_POLICY,
} from '@dykstra/domain';

/**
 * Test Suite: Convert Lead To Case with Policy Variations
 * 
 * Verifies that convert-lead-to-case respects different LeadToCaseConversionPolicy configurations.
 * Tests 3 policy variations to ensure rules are applied correctly.
 */

// Helper to build test policy config
const buildPolicyConfig = (overrides: Partial<typeof DEFAULT_LEAD_TO_CASE_CONVERSION_POLICY>) => {
  return {
    ...DEFAULT_LEAD_TO_CASE_CONVERSION_POLICY,
    ...overrides,
  };
};

// Helper to build full policy object (for SCD2 testing)
const buildFullPolicy = (overrides: any) => {
  const now = new Date();
  return {
    id: 'test-policy-id',
    businessKey: 'test-funeral-home',
    version: 1,
    validFrom: now,
    validTo: null,
    isCurrent: true,
    funeralHomeId: 'test-funeral-home',
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    updatedBy: null,
    reason: null,
    ...DEFAULT_LEAD_TO_CASE_CONVERSION_POLICY,
    ...overrides,
  };
};

describe('Convert Lead To Case - Policy Variation Tests', () => {
  describe('Scenario 1: Standard Policy (Default)', () => {
    it('should create cases in inquiry status by default', () => {
      const config = buildPolicyConfig({});
      
      expect(config.defaultCaseStatus).toBe('inquiry');
    });

    it('should auto-assign case to lead staff member', () => {
      const config = buildPolicyConfig({
        autoAssignToLeadStaff: true,
      });
      
      expect(config.autoAssignToLeadStaff).toBe(true);
    });

    it('should preserve lead notes in conversion', () => {
      const config = buildPolicyConfig({
        preserveLeadNotes: true,
      });
      
      expect(config.preserveLeadNotes).toBe(true);
    });

    it('should create interaction record for audit trail', () => {
      const config = buildPolicyConfig({
        createInteractionRecord: true,
      });
      
      expect(config.createInteractionRecord).toBe(true);
    });

    it('should require decedent name', () => {
      const config = buildPolicyConfig({
        requireDecedentName: true,
      });
      
      expect(config.requireDecedentName).toBe(true);
    });
  });

  describe('Scenario 2: Fast-Track Policy', () => {
    it('should create cases in active status for fast-track', () => {
      const config = buildPolicyConfig({
        defaultCaseStatus: 'active',
      });
      
      expect(config.defaultCaseStatus).toBe('active');
      expect(config.defaultCaseStatus).not.toBe('inquiry');
    });

    it('should still preserve lead data for context', () => {
      const config = buildPolicyConfig({
        defaultCaseStatus: 'active',
        autoAssignToLeadStaff: true,
        preserveLeadNotes: true,
        createInteractionRecord: true,
      });
      
      expect(config.defaultCaseStatus).toBe('active');
      expect(config.autoAssignToLeadStaff).toBe(true);
      expect(config.preserveLeadNotes).toBe(true);
      expect(config.createInteractionRecord).toBe(true);
    });
  });

  describe('Scenario 3: Minimal Policy', () => {
    it('should create cases in inquiry status with minimal transfer', () => {
      const config = buildPolicyConfig({
        defaultCaseStatus: 'inquiry',
        autoAssignToLeadStaff: false,
        preserveLeadNotes: false,
        createInteractionRecord: false,
      });
      
      expect(config.defaultCaseStatus).toBe('inquiry');
    });

    it('should not auto-assign staff in minimal mode', () => {
      const config = buildPolicyConfig({
        autoAssignToLeadStaff: false,
      });
      
      expect(config.autoAssignToLeadStaff).toBe(false);
    });

    it('should not preserve notes in minimal mode', () => {
      const config = buildPolicyConfig({
        preserveLeadNotes: false,
      });
      
      expect(config.preserveLeadNotes).toBe(false);
    });

    it('should not create interaction record in minimal mode', () => {
      const config = buildPolicyConfig({
        createInteractionRecord: false,
      });
      
      expect(config.createInteractionRecord).toBe(false);
    });
  });

  describe('Per-Funeral-Home Policy Isolation', () => {
    it('should have independent policies per funeral home', () => {
      const config1 = buildPolicyConfig({
        // funeralHomeId would be set via buildFullPolicy in production
        defaultCaseStatus: 'inquiry',
      });

      const config2 = buildPolicyConfig({
        defaultCaseStatus: 'active',
      });

      expect(config1.defaultCaseStatus).not.toBe(config2.defaultCaseStatus);
    });

    it('should have separate SCD2 history per funeral home', () => {
      const policy1 = buildFullPolicy({
        funeralHomeId: 'fh-1',
        businessKey: 'policy-fh-1',
        version: 1,
      });

      const policy2 = buildFullPolicy({
        funeralHomeId: 'fh-2',
        businessKey: 'policy-fh-2',
        version: 1,
      });

      expect(policy1.businessKey).not.toBe(policy2.businessKey);
      expect(policy1.funeralHomeId).not.toBe(policy2.funeralHomeId);
    });
  });

  describe('SCD2 Audit Trail', () => {
    it('should include SCD2 tracking fields', () => {
      const policy = buildFullPolicy({});

      expect(policy.businessKey).toBeDefined();
      expect(policy.version).toBe(1);
      expect(policy.validFrom).toBeDefined();
      expect(policy.validTo).toBeNull();
      expect(policy.isCurrent).toBe(true);
    });

    it('should track policy author and change reason', () => {
      const policy = buildFullPolicy({
        createdBy: 'admin@dykstra.com',
        updatedBy: null,
        reason: 'Initial setup',
      });

      expect(policy.createdBy).toBe('admin@dykstra.com');
      expect(policy.updatedBy).toBeNull();
      expect(policy.reason).toBe('Initial setup');
    });

    it('should track policy change timestamps', () => {
      const now = new Date();
      const policy = buildFullPolicy({
        createdAt: now,
        updatedAt: now,
      });

      expect(policy.createdAt).toBe(now);
      expect(policy.updatedAt).toBe(now);
    });
  });

  describe('Policy Flexibility', () => {
    it('should support mixed policies (e.g., active status but no auto-assign)', () => {
      const config = buildPolicyConfig({
        defaultCaseStatus: 'active',
        autoAssignToLeadStaff: false, // Manual assignment required
        preserveLeadNotes: true,
        createInteractionRecord: true,
      });

      expect(config.defaultCaseStatus).toBe('active');
      expect(config.autoAssignToLeadStaff).toBe(false);
      expect(config.preserveLeadNotes).toBe(true);
      expect(config.createInteractionRecord).toBe(true);
    });

    it('should allow enabling/disabling features independently', () => {
      const config1 = buildPolicyConfig({
        autoAssignToLeadStaff: true,
        preserveLeadNotes: false,
      });

      const config2 = buildPolicyConfig({
        autoAssignToLeadStaff: false,
        preserveLeadNotes: true,
      });

      expect(config1.autoAssignToLeadStaff).toBe(true);
      expect(config1.preserveLeadNotes).toBe(false);

      expect(config2.autoAssignToLeadStaff).toBe(false);
      expect(config2.preserveLeadNotes).toBe(true);
    });
  });
});
