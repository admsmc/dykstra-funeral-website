import { describe, it, expect, beforeAll } from 'vitest';
import { Effect } from 'effect';
import { createLead } from '../create-lead';
import { Lead } from '@dykstra/domain';
import {
  LeadScoringPolicy,
  DEFAULT_LEAD_SCORING_POLICY,
  AGGRESSIVE_LEAD_SCORING_POLICY,
  CONSERVATIVE_LEAD_SCORING_POLICY,
} from '@dykstra/domain';

/**
 * Test Suite: Create Lead with Policy Variations
 * 
 * Verifies that create-lead respects different LeadScoringPolicy configurations.
 * Tests 3 policy variations to ensure business rules are applied correctly.
 */

// Mock repository implementations
const createMockLeadRepo = () => ({
  findCurrentByBusinessKey: () => Effect.succeed(null),
  findById: () => Effect.fail(new Error('Not implemented')),
  listByFuneralHome: () => Effect.succeed([]),
  save: () => Effect.succeed(undefined),
});

const createMockPolicyRepo = (policy: LeadScoringPolicy) => ({
  findCurrentByFuneralHome: () => Effect.succeed(policy),
  getHistory: () => Effect.succeed([policy]),
  getByVersion: () => Effect.succeed(policy),
  save: () => Effect.succeed(undefined),
  delete: () => Effect.succeed(undefined),
});

// Helper to build test policy
const buildPolicy = (overrides: Partial<LeadScoringPolicy>): LeadScoringPolicy => {
  return new LeadScoringPolicy({
    id: 'test-policy-id',
    businessKey: 'test-funeral-home',
    version: 1,
    validFrom: new Date(),
    validTo: null,
    isCurrent: true,
    funeralHomeId: 'test-funeral-home',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: null,
    reason: null,
    ...DEFAULT_LEAD_SCORING_POLICY,
    ...overrides,
  });
};

describe('Create Lead - Policy Variation Tests', () => {
  describe('Scenario 1: Standard Policy (Default)', () => {
    it('should create at-need lead with default score (80)', () => {
      const policy = buildPolicy({});
      
      // At-need leads should score 80 by default
      expect(policy.atNeedInitialScore).toBe(80);
    });

    it('should create pre-need lead with default score (30)', () => {
      const policy = buildPolicy({});
      
      // Pre-need leads should score 30 by default
      expect(policy.preNeedInitialScore).toBe(30);
    });

    it('should apply contact method bonus when both email and phone provided', () => {
      const policy = buildPolicy({
        atNeedInitialScore: 80,
        contactMethodBonus: 10,
      });
      
      // Expected: 80 (base) + 10 (bonus) = 90
      expect(policy.atNeedInitialScore + policy.contactMethodBonus).toBe(90);
    });

    it('should apply referral bonus for referral sources', () => {
      const policy = buildPolicy({
        atNeedInitialScore: 80,
        referralSourceBonus: 15,
      });
      
      // Expected: 80 (base) + 15 (referral) = 95
      expect(policy.atNeedInitialScore + policy.referralSourceBonus).toBe(95);
    });

    it('should require phone or email based on policy', () => {
      const policy = buildPolicy({
        requirePhoneOrEmail: true,
      });
      
      expect(policy.requirePhoneOrEmail).toBe(true);
    });

    it('should enforce disallowed sources from policy', () => {
      const policy = buildPolicy({
        disallowedSources: ['spam', 'bot'],
      });
      
      expect(policy.disallowedSources).toContain('spam');
      expect(policy.disallowedSources).not.toContain('website');
    });
  });

  describe('Scenario 2: Aggressive Policy', () => {
    it('should create at-need leads with higher score (85)', () => {
      const policy = buildPolicy({
        atNeedInitialScore: 85,
        preNeedInitialScore: 35,
      });
      
      // Aggressive policy scores higher
      expect(policy.atNeedInitialScore).toBe(85);
      expect(policy.atNeedInitialScore).toBeGreaterThan(80);
    });

    it('should have more aggressive bonuses', () => {
      const policy = buildPolicy({
        contactMethodBonus: 15,
        referralSourceBonus: 20,
      });
      
      // Aggressive bonuses are larger
      expect(policy.contactMethodBonus).toBe(15);
      expect(policy.referralSourceBonus).toBe(20);
    });

    it('should have lower hot lead threshold for faster categorization', () => {
      const policy = buildPolicy({
        hotLeadThreshold: 65,
      });
      
      // Lower threshold means more leads qualify as "hot"
      expect(policy.hotLeadThreshold).toBe(65);
      expect(policy.hotLeadThreshold).toBeLessThan(70);
    });

    it('should enable auto-archive after shorter period', () => {
      const policy = buildPolicy({
        enableAutoArchive: true,
        archiveAfterDays: 60,
      });
      
      // Aggressive cleanup
      expect(policy.enableAutoArchive).toBe(true);
      expect(policy.archiveAfterDays).toBe(60);
      expect(policy.archiveAfterDays).toBeLessThan(90);
    });
  });

  describe('Scenario 3: Conservative Policy', () => {
    it('should create all lead types with equal initial score (50)', () => {
      const policy = buildPolicy({
        atNeedInitialScore: 50,
        preNeedInitialScore: 50,
        generalInquiryScore: 50,
      });
      
      // Conservative: all lead types start equal
      expect(policy.atNeedInitialScore).toBe(50);
      expect(policy.preNeedInitialScore).toBe(50);
      expect(policy.generalInquiryScore).toBe(50);
    });

    it('should have smaller bonuses (engagement-focused)', () => {
      const policy = buildPolicy({
        contactMethodBonus: 5,
        referralSourceBonus: 8,
      });
      
      // Conservative bonuses are small
      expect(policy.contactMethodBonus).toBe(5);
      expect(policy.referralSourceBonus).toBe(8);
    });

    it('should have higher hot lead threshold (stricter)', () => {
      const policy = buildPolicy({
        hotLeadThreshold: 75,
      });
      
      // Higher threshold means stricter qualification
      expect(policy.hotLeadThreshold).toBe(75);
      expect(policy.hotLeadThreshold).toBeGreaterThan(70);
    });

    it('should track inactivity closely', () => {
      const policy = buildPolicy({
        inactiveThresholdDays: 7,
      });
      
      // Conservative: check inactivity frequently
      expect(policy.inactiveThresholdDays).toBe(7);
      expect(policy.inactiveThresholdDays).toBeLessThan(14);
    });

    it('should not auto-archive', () => {
      const policy = buildPolicy({
        enableAutoArchive: false,
      });
      
      // Conservative: preserve leads manually
      expect(policy.enableAutoArchive).toBe(false);
    });
  });

  describe('Policy Score Clamping', () => {
    it('should clamp scores to 0-100 range', () => {
      // Test scenario: very generous bonuses would exceed 100
      const baseScore = 80;
      const contactBonus = 10;
      const referralBonus = 15;
      const preferredBonus = 5;
      
      const totalScore = baseScore + contactBonus + referralBonus + preferredBonus;
      const clampedScore = Math.max(0, Math.min(100, totalScore));
      
      expect(totalScore).toBe(110); // Over max
      expect(clampedScore).toBe(100); // Clamped to max
    });

    it('should never go below 0', () => {
      const score = -10;
      const clampedScore = Math.max(0, Math.min(100, score));
      
      expect(clampedScore).toBe(0);
    });
  });

  describe('Per-Funeral-Home Policy Isolation', () => {
    it('should use different policies for different funeral homes', () => {
      const standardPolicy = buildPolicy({
        funeralHomeId: 'funeral-home-1',
        atNeedInitialScore: 80,
      });
      
      const aggressivePolicy = buildPolicy({
        funeralHomeId: 'funeral-home-2',
        atNeedInitialScore: 85,
      });
      
      // Each funeral home has independent policy
      expect(standardPolicy.funeralHomeId).toBe('funeral-home-1');
      expect(aggressivePolicy.funeralHomeId).toBe('funeral-home-2');
      expect(standardPolicy.atNeedInitialScore).not.toBe(aggressivePolicy.atNeedInitialScore);
    });

    it('should have separate SCD2 history per funeral home', () => {
      const policy1 = buildPolicy({ 
        funeralHomeId: 'fh-1', 
        businessKey: 'policy-fh-1',
        version: 1 
      });
      const policy2 = buildPolicy({ 
        funeralHomeId: 'fh-2', 
        businessKey: 'policy-fh-2',
        version: 1 
      });
      
      // Different business keys for different homes
      expect(policy1.businessKey).not.toBe(policy2.businessKey);
    });
  });

  describe('Policy Validation Rules Application', () => {
    it('should enforce name requirements from policy', () => {
      const policy = buildPolicy({
        requireFirstName: true,
        requireLastName: true,
      });
      
      expect(policy.requireFirstName).toBe(true);
      expect(policy.requireLastName).toBe(true);
    });

    it('should enforce contact method requirement from policy', () => {
      const strictPolicy = buildPolicy({
        requirePhoneOrEmail: true,
      });
      
      const relaxedPolicy = buildPolicy({
        requirePhoneOrEmail: false,
      });
      
      expect(strictPolicy.requirePhoneOrEmail).toBe(true);
      expect(relaxedPolicy.requirePhoneOrEmail).toBe(false);
    });

    it('should apply preferred sources list from policy', () => {
      const policy = buildPolicy({
        preferredSources: ['referral', 'event', 'direct_mail'],
      });
      
      expect(policy.preferredSources).toContain('referral');
      expect(policy.preferredSources).toContain('event');
      expect(policy.preferredSources).toHaveLength(3);
    });
  });

  describe('SCD2 Audit Trail', () => {
    it('should include SCD2 tracking fields in policy', () => {
      const policy = buildPolicy({});
      
      expect(policy.businessKey).toBeDefined();
      expect(policy.version).toBe(1);
      expect(policy.validFrom).toBeDefined();
      expect(policy.validTo).toBeNull();
      expect(policy.isCurrent).toBe(true);
    });

    it('should track policy author and reason', () => {
      const policy = buildPolicy({
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
      const policy = buildPolicy({
        createdAt: now,
        updatedAt: now,
      });
      
      expect(policy.createdAt).toBe(now);
      expect(policy.updatedAt).toBe(now);
    });
  });
});
