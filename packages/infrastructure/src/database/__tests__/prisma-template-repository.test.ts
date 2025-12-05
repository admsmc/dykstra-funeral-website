import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Effect } from 'effect';
import { PrismaTemplateRepository } from '../prisma-template-repository';
import { MemorialTemplate } from '@dykstra/domain';
import { prisma } from '../prisma-client';

/**
 * PrismaTemplateRepository Tests
 * 
 * Tests SCD2 pattern implementation, per-funeral-home isolation,
 * version history, and all CRUD operations.
 */

describe('PrismaTemplateRepository - SCD2 Pattern', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.memorialTemplate.deleteMany({
      where: {
        businessKey: {
          startsWith: 'test-',
        },
      },
    });
  });

  describe('save() - SCD2 versioning', () => {
    it('should create version 1 on first save', async () => {
      const template = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey: 'test-template-001',
          name: 'Test Template',
          category: 'service_program',
          status: 'active',
          createdBy: 'test-user',
        },
        {
          htmlTemplate: '<html><body>{{deceasedName}}</body></html>',
          cssStyles: 'body { font-family: serif; }',
        },
        {
          pageSize: 'letter',
          orientation: 'portrait',
          margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          printQuality: 300,
        }
      );

      await Effect.runPromise(PrismaTemplateRepository.save(template));

      // Verify version 1 exists in database
      const saved = await prisma.memorialTemplate.findFirst({
        where: { businessKey: 'test-template-001' },
      });

      expect(saved).toBeTruthy();
      expect(saved!.version).toBe(1);
      expect(saved!.isCurrent).toBe(true);
      expect(saved!.validTo).toBeNull();
    });

    it('should create version 2 and close version 1 on update', async () => {
      // Create version 1
      const v1 = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey: 'test-template-002',
          name: 'Test Template V1',
          category: 'prayer_card',
          status: 'active',
          createdBy: 'test-user',
        },
        {
          htmlTemplate: '<html><body>Version 1</body></html>',
          cssStyles: 'body { color: black; }',
        },
        {
          pageSize: '4x6',
          orientation: 'portrait',
          margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
          printQuality: 300,
        }
      );

      await Effect.runPromise(PrismaTemplateRepository.save(v1));

      // Create version 2
      const v2 = v1.createNewVersion(
        {
          htmlTemplate: '<html><body>Version 2</body></html>',
          cssStyles: 'body { color: blue; }',
        },
        {
          pageSize: '4x6',
          orientation: 'portrait',
          margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
          printQuality: 300,
        },
        'Updated color'
      );

      await Effect.runPromise(PrismaTemplateRepository.save(v2));

      // Verify version 2 is current
      const current = await prisma.memorialTemplate.findFirst({
        where: { businessKey: 'test-template-002', isCurrent: true },
      });

      expect(current!.version).toBe(2);
      expect(current!.validTo).toBeNull();
      expect(current!.htmlTemplate).toContain('Version 2');

      // Verify version 1 is closed
      const old = await prisma.memorialTemplate.findFirst({
        where: { businessKey: 'test-template-002', version: 1 },
      });

      expect(old!.isCurrent).toBe(false);
      expect(old!.validTo).not.toBeNull();
    });
  });

  describe('findCurrentByBusinessKey() - SCD2 current version', () => {
    it('should return current version only', async () => {
      const businessKey = 'test-template-003';

      // Create versions 1, 2, 3
      let template = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey,
          name: 'Multi-version Template',
          category: 'service_program',
          status: 'active',
          createdBy: 'test-user',
        },
        {
          htmlTemplate: '<html>V1</html>',
          cssStyles: '',
        },
        {
          pageSize: 'letter',
          orientation: 'portrait',
          margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          printQuality: 300,
        }
      );
      await Effect.runPromise(PrismaTemplateRepository.save(template));

      template = template.createNewVersion(
        { htmlTemplate: '<html>V2</html>', cssStyles: '' },
        template.settings
      );
      await Effect.runPromise(PrismaTemplateRepository.save(template));

      template = template.createNewVersion(
        { htmlTemplate: '<html>V3</html>', cssStyles: '' },
        template.settings
      );
      await Effect.runPromise(PrismaTemplateRepository.save(template));

      // Fetch current version
      const current = await Effect.runPromise(
        PrismaTemplateRepository.findCurrentByBusinessKey(businessKey)
      );

      expect(current).toBeTruthy();
      expect(current!.temporal.version).toBe(3);
      expect(current!.content.htmlTemplate).toContain('V3');
    });

    it('should return null if template does not exist', async () => {
      const result = await Effect.runPromise(
        PrismaTemplateRepository.findCurrentByBusinessKey('nonexistent')
      );

      expect(result).toBeNull();
    });
  });

  describe('getHistory() - Version history', () => {
    it('should return all versions ordered by version number', async () => {
      const businessKey = 'test-template-004';

      // Create 3 versions
      let template = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey,
          name: 'History Test',
          category: 'memorial_folder',
          status: 'active',
          createdBy: 'test-user',
        },
        { htmlTemplate: '<html>V1</html>', cssStyles: '' },
        {
          pageSize: 'letter',
          orientation: 'portrait',
          margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          printQuality: 300,
        }
      );
      await Effect.runPromise(PrismaTemplateRepository.save(template));

      template = template.createNewVersion(
        { htmlTemplate: '<html>V2</html>', cssStyles: '' },
        template.settings
      );
      await Effect.runPromise(PrismaTemplateRepository.save(template));

      template = template.createNewVersion(
        { htmlTemplate: '<html>V3</html>', cssStyles: '' },
        template.settings
      );
      await Effect.runPromise(PrismaTemplateRepository.save(template));

      // Fetch history
      const history = await Effect.runPromise(
        PrismaTemplateRepository.getHistory(businessKey)
      );

      expect(history).toHaveLength(3);
      expect(history[0].temporal.version).toBe(1);
      expect(history[1].temporal.version).toBe(2);
      expect(history[2].temporal.version).toBe(3);

      // Only v3 should be current
      expect(history[0].temporal.validTo).not.toBeNull();
      expect(history[1].temporal.validTo).not.toBeNull();
      expect(history[2].temporal.validTo).toBeNull();
    });
  });

  describe('findCurrentByFuneralHome() - Per-funeral-home isolation', () => {
    it('should return system templates (funeralHomeId = null) for all homes', async () => {
      // Create system template
      const systemTemplate = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey: 'test-system-001',
          name: 'System Template',
          category: 'service_program',
          status: 'active',
          createdBy: 'test-user',
          funeralHomeId: undefined, // System template
        },
        { htmlTemplate: '<html>System</html>', cssStyles: '' },
        {
          pageSize: 'letter',
          orientation: 'portrait',
          margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          printQuality: 300,
        }
      );
      await Effect.runPromise(PrismaTemplateRepository.save(systemTemplate));

      // Query from any funeral home
      const templates = await Effect.runPromise(
        PrismaTemplateRepository.findCurrentByFuneralHome(
          'funeral-home-1',
          'service_program'
        )
      );

      expect(templates.length).toBeGreaterThan(0);
      const systemFound = templates.some(
        (t) => t.metadata.businessKey === 'test-system-001'
      );
      expect(systemFound).toBe(true);
    });

    it('should return custom templates only for owning funeral home', async () => {
      // Create custom template for funeral-home-1
      const customTemplate = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey: 'test-custom-001',
          name: 'Custom Template',
          category: 'prayer_card',
          status: 'active',
          createdBy: 'test-user',
          funeralHomeId: 'funeral-home-1',
        },
        { htmlTemplate: '<html>Custom</html>', cssStyles: '' },
        {
          pageSize: '4x6',
          orientation: 'portrait',
          margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
          printQuality: 300,
        }
      );
      await Effect.runPromise(PrismaTemplateRepository.save(customTemplate));

      // Query from owning funeral home - should see custom template
      const ownedTemplates = await Effect.runPromise(
        PrismaTemplateRepository.findCurrentByFuneralHome(
          'funeral-home-1',
          'prayer_card'
        )
      );

      const customFound = ownedTemplates.some(
        (t) => t.metadata.businessKey === 'test-custom-001'
      );
      expect(customFound).toBe(true);

      // Query from different funeral home - should NOT see custom template
      const otherTemplates = await Effect.runPromise(
        PrismaTemplateRepository.findCurrentByFuneralHome(
          'funeral-home-2',
          'prayer_card'
        )
      );

      const customFoundInOther = otherTemplates.some(
        (t) => t.metadata.businessKey === 'test-custom-001'
      );
      expect(customFoundInOther).toBe(false);
    });
  });

  describe('findSystemTemplates() - System template queries', () => {
    it('should return only system templates', async () => {
      // Create system template
      const systemTemplate = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey: 'test-system-002',
          name: 'System Only',
          category: 'bookmark',
          status: 'active',
          createdBy: 'test-user',
          funeralHomeId: undefined,
        },
        { htmlTemplate: '<html>System</html>', cssStyles: '' },
        {
          pageSize: '4x6',
          orientation: 'portrait',
          margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
          printQuality: 300,
        }
      );
      await Effect.runPromise(PrismaTemplateRepository.save(systemTemplate));

      // Create custom template (should not appear)
      const customTemplate = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey: 'test-custom-002',
          name: 'Custom Only',
          category: 'bookmark',
          status: 'active',
          createdBy: 'test-user',
          funeralHomeId: 'funeral-home-1',
        },
        { htmlTemplate: '<html>Custom</html>', cssStyles: '' },
        {
          pageSize: '4x6',
          orientation: 'portrait',
          margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
          printQuality: 300,
        }
      );
      await Effect.runPromise(PrismaTemplateRepository.save(customTemplate));

      // Query system templates
      const systemTemplates = await Effect.runPromise(
        PrismaTemplateRepository.findSystemTemplates('bookmark')
      );

      const systemFound = systemTemplates.some(
        (t) => t.metadata.businessKey === 'test-system-002'
      );
      const customFound = systemTemplates.some(
        (t) => t.metadata.businessKey === 'test-custom-002'
      );

      expect(systemFound).toBe(true);
      expect(customFound).toBe(false);
    });
  });

  describe('findById() - Specific version lookup', () => {
    it('should find template by specific version ID', async () => {
      const template = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey: 'test-template-005',
          name: 'ID Lookup Test',
          category: 'service_program',
          status: 'active',
          createdBy: 'test-user',
        },
        { htmlTemplate: '<html>Test</html>', cssStyles: '' },
        {
          pageSize: 'letter',
          orientation: 'portrait',
          margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          printQuality: 300,
        }
      );

      await Effect.runPromise(PrismaTemplateRepository.save(template));

      const found = await Effect.runPromise(
        PrismaTemplateRepository.findById(template.metadata.id)
      );

      expect(found).toBeTruthy();
      expect(found!.metadata.id).toBe(template.metadata.id);
      expect(found!.metadata.businessKey).toBe('test-template-005');
    });
  });
});
