import { Effect } from 'effect';
import { TemplateRepositoryPort } from '../../ports/template-repository-port';
import { PersistenceError } from '../../ports/case-repository';
import { MemorialTemplate } from '@dykstra/domain';

/**
 * Save Template Command
 * 
 * Command to create a new template or update an existing one (SCD2 versioning)
 */
export interface SaveTemplateCommand {
  // Metadata
  readonly businessKey: string; // e.g., 'classic-program-001'
  readonly name: string;
  readonly category: 'service_program' | 'prayer_card' | 'memorial_folder' | 'bookmark';
  readonly status?: 'draft' | 'active' | 'deprecated';
  readonly funeralHomeId?: string; // undefined = system template
  
  // Content
  readonly htmlTemplate: string;
  readonly cssStyles?: string;
  
  // Settings
  readonly pageSize: 'letter' | 'legal' | 'a4' | '4x6' | '5x7';
  readonly orientation: 'portrait' | 'landscape';
  readonly margins?: {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  };
  readonly printQuality?: 150 | 300 | 600; // DPI, default 300
  
  // Versioning (for updates)
  readonly existingTemplateId?: string; // If updating, provide existing template ID
  readonly versionNote?: string; // Reason for version update
  readonly createdBy: string; // User ID
}

/**
 * Save Template Result
 * 
 * Returns saved template with version info
 */
export interface SaveTemplateResult {
  readonly templateId: string;
  readonly businessKey: string;
  readonly version: number;
  readonly isNewTemplate: boolean;
}

/**
 * Save Template Use Case
 * 
 * Creates a new template or updates an existing one using SCD2 versioning.
 * 
 * Two scenarios:
 * 1. **New Template**: Creates version 1
 *    - Validates businessKey uniqueness
 *    - Sets initial metadata and content
 *    - No existing versions
 * 
 * 2. **Update Template**: Creates new version (N+1)
 *    - Loads existing template by ID
 *    - Creates new version with updated content/settings
 *    - Closes previous version (validTo = now, isCurrent = false)
 *    - Preserves version history
 * 
 * SCD2 Pattern:
 * - Each save creates immutable version
 * - Only current version has validTo = null, isCurrent = true
 * - History preserved for audit trail
 * 
 * Pipeline:
 * 1. Check if updating existing template (existingTemplateId provided)
 * 2a. If new: Create MemorialTemplate.create()
 * 2b. If update: Load existing, call createNewVersion()
 * 3. Save to repository (SCD2 transaction)
 * 4. Return version metadata
 * 
 * Performance target: <200ms (150ms DB transaction + 50ms domain logic)
 * 
 * Error handling:
 * - Template not found (update) → PersistenceError
 * - Duplicate businessKey (new) → PersistenceError
 * - Validation error → DomainValidationError
 * - Database error → PersistenceError
 * 
 * Dependencies:
 * - TemplateRepositoryPort: Save template with SCD2 versioning
 */
export const saveTemplate = (command: SaveTemplateCommand) =>
  Effect.gen(function* (_) {
    const templateRepo = yield* _(TemplateRepositoryPort);

    // Default margins if not provided
    const margins = command.margins || {
      top: 0.5,
      right: 0.5,
      bottom: 0.5,
      left: 0.5,
    };

    let template: MemorialTemplate;
    let isNewTemplate: boolean;

    if (command.existingTemplateId) {
      // Scenario 2: Update existing template
      const existing = yield* _(
        templateRepo.findById(command.existingTemplateId)
      );

      if (!existing) {
        return yield* _(
          Effect.fail(
            new PersistenceError(
              `Template not found: ${command.existingTemplateId}`,
              undefined
            )
          )
        );
      }

      // Create new version
      template = existing.createNewVersion(
        {
          htmlTemplate: command.htmlTemplate,
          cssStyles: command.cssStyles || '',
        },
        {
          pageSize: command.pageSize,
          orientation: command.orientation,
          margins,
          printQuality: command.printQuality || 300,
        },
        command.versionNote
      );

      isNewTemplate = false;
    } else {
      // Scenario 1: Create new template
      template = MemorialTemplate.create(
        {
          id: crypto.randomUUID(),
          businessKey: command.businessKey,
          name: command.name,
          category: command.category,
          status: command.status || 'draft',
          createdBy: command.createdBy,
          funeralHomeId: command.funeralHomeId,
        },
        {
          htmlTemplate: command.htmlTemplate,
          cssStyles: command.cssStyles || '',
        },
        {
          pageSize: command.pageSize,
          orientation: command.orientation,
          margins,
          printQuality: command.printQuality || 300,
        }
      );

      isNewTemplate = true;
    }

    // Save to repository (SCD2 transaction handles version closure)
    yield* _(templateRepo.save(template));

    return {
      templateId: template.metadata.id,
      businessKey: template.metadata.businessKey,
      version: template.temporal.version,
      isNewTemplate,
    } satisfies SaveTemplateResult;
  });

/**
 * Save Template Use Case (with dependencies)
 * 
 * Type signature shows all required dependencies via Effect Context
 */
export type SaveTemplate = Effect.Effect<
  SaveTemplateResult,
  PersistenceError,
  typeof TemplateRepositoryPort
>;
