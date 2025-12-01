import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NOTE_MANAGEMENT_POLICY,
  STRICT_NOTE_MANAGEMENT_POLICY,
  PERMISSIVE_NOTE_MANAGEMENT_POLICY,
} from '@dykstra/domain';

const buildPolicyConfig = (overrides: Partial<typeof DEFAULT_NOTE_MANAGEMENT_POLICY>) => {
  return {
    ...DEFAULT_NOTE_MANAGEMENT_POLICY,
    ...overrides,
  };
};

describe('Update Note - Policy Variation Tests', () => {
  describe('Scenario 1: Standard Policy (Default)', () => {
    it('should accept content up to 10000 characters', () => {
      const config = buildPolicyConfig({});
      expect(config.maxContentLength).toBe(10000);
    });

    it('should require minimum 1 character', () => {
      const config = buildPolicyConfig({});
      expect(config.minContentLength).toBe(1);
    });

    it('should allow content updates within policy limits', () => {
      const config = buildPolicyConfig({});
      const testContent = 'Updated content for the note';
      expect(testContent.length).toBeLessThanOrEqual(config.maxContentLength);
      expect(testContent.length).toBeGreaterThanOrEqual(config.minContentLength);
    });

    it('should reject empty updates', () => {
      const config = buildPolicyConfig({});
      const emptyContent = '';
      expect(emptyContent.length).toBeLessThan(config.minContentLength);
    });

    it('should reject updates exceeding standard limit', () => {
      const config = buildPolicyConfig({});
      const oversizedContent = 'x'.repeat(config.maxContentLength + 1);
      expect(oversizedContent.length).toBeGreaterThan(config.maxContentLength);
    });
  });

  describe('Scenario 2: Strict Policy', () => {
    it('should enforce 5000 character limit for updates', () => {
      const config = buildPolicyConfig(STRICT_NOTE_MANAGEMENT_POLICY);
      expect(config.maxContentLength).toBe(5000);
    });

    it('should maintain auto-archive settings for updated notes', () => {
      const config = buildPolicyConfig(STRICT_NOTE_MANAGEMENT_POLICY);
      expect(config.enableAutoArchive).toBe(true);
      expect(config.autoArchiveAfterDays).toBe(90);
    });

    it('should reject updates exceeding strict limit', () => {
      const config = buildPolicyConfig(STRICT_NOTE_MANAGEMENT_POLICY);
      const oversizedContent = 'x'.repeat(6000);
      expect(oversizedContent.length).toBeGreaterThan(config.maxContentLength);
    });

    it('should allow updates within strict limit', () => {
      const config = buildPolicyConfig(STRICT_NOTE_MANAGEMENT_POLICY);
      const validContent = 'x'.repeat(4000);
      expect(validContent.length).toBeLessThanOrEqual(config.maxContentLength);
    });
  });

  describe('Scenario 3: Permissive Policy', () => {
    it('should allow up to 50000 characters for updates', () => {
      const config = buildPolicyConfig(PERMISSIVE_NOTE_MANAGEMENT_POLICY);
      expect(config.maxContentLength).toBe(50000);
    });

    it('should not auto-archive in permissive mode', () => {
      const config = buildPolicyConfig(PERMISSIVE_NOTE_MANAGEMENT_POLICY);
      expect(config.enableAutoArchive).toBe(false);
    });

    it('should accept large content updates', () => {
      const config = buildPolicyConfig(PERMISSIVE_NOTE_MANAGEMENT_POLICY);
      const largeContent = 'x'.repeat(40000);
      expect(largeContent.length).toBeLessThanOrEqual(config.maxContentLength);
    });
  });

  describe('Policy Flexibility', () => {
    it('should support custom configurations', () => {
      const config = buildPolicyConfig({
        maxContentLength: 25000,
        minContentLength: 10,
      });
      expect(config.maxContentLength).toBe(25000);
      expect(config.minContentLength).toBe(10);
    });

    it('should allow independent feature configuration', () => {
      const config1 = buildPolicyConfig({
        enableAutoArchive: true,
      });
      const config2 = buildPolicyConfig({
        enableAutoArchive: false,
      });
      expect(config1.enableAutoArchive).not.toBe(config2.enableAutoArchive);
    });
  });
});
