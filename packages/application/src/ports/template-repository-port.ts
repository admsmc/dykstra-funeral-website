import { type Effect, Context } from 'effect';
import type { MemorialTemplate } from '@dykstra/domain';
import { type PersistenceError } from './case-repository';

/**
 * Template Repository Port
 * 
 * Abstraction for CRUD operations on memorial templates.
 * Implements SCD2 (Slowly Changing Dimension Type 2) pattern for versioning.
 */

/**
 * Template Repository Port Service Interface
 * 
 * All methods follow SCD2 pattern:
 * - Current version: validTo = null, isCurrent = true
 * - Historical versions: validTo = timestamp, isCurrent = false
 * - businessKey links versions together
 */
export interface TemplateRepositoryPortService {
  /**
   * Find current version by business key
   * 
   * Backend operation:
   * 1. Queries WHERE businessKey = ? AND isCurrent = true
   * 2. Returns single active template or null
   * 
   * @param businessKey - Stable identifier across versions (e.g., 'classic-program-001')
   * @returns Current template version or null
   */
  readonly findCurrentByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<MemorialTemplate | null, PersistenceError>;

  /**
   * Find current templates by funeral home
   * 
   * Backend operation:
   * 1. Queries WHERE funeralHomeId = ? AND category = ? AND isCurrent = true
   * 2. Returns array of active templates for given funeral home
   * 3. Includes both system templates (funeralHomeId = null) and custom templates
   * 
   * @param funeralHomeId - Funeral home identifier
   * @param category - Template category filter
   * @returns Array of current templates visible to funeral home
   */
  readonly findCurrentByFuneralHome: (
    funeralHomeId: string,
    category: string
  ) => Effect.Effect<MemorialTemplate[], PersistenceError>;

  /**
   * Save template (SCD2 insert or update)
   * 
   * Backend operation:
   * - **Version 1 (new template)**:
   *   1. INSERT new row with version = 1, isCurrent = true, validFrom = now
   * 
   * - **Version N (update existing)**:
   *   1. UPDATE old version: SET validTo = now, isCurrent = false WHERE businessKey = ? AND isCurrent = true
   *   2. INSERT new row: version = N+1, isCurrent = true, validFrom = now
   * 
   * @param template - Template to save (version determined by entity)
   * @returns void on success
   */
  readonly save: (
    template: MemorialTemplate
  ) => Effect.Effect<void, PersistenceError>;

  /**
   * Get version history for template
   * 
   * Backend operation:
   * 1. Queries WHERE businessKey = ? ORDER BY version ASC
   * 2. Returns all versions (current + historical)
   * 
   * @param businessKey - Stable identifier
   * @returns Array of all versions ordered by version number
   */
  readonly getHistory: (
    businessKey: string
  ) => Effect.Effect<MemorialTemplate[], PersistenceError>;

  /**
   * Find template by ID (any version)
   * 
   * Backend operation:
   * 1. Queries WHERE id = ? (unique per version)
   * 2. Returns specific version or null
   * 
   * @param id - Unique template version ID
   * @returns Template version or null
   */
  readonly findById: (
    id: string
  ) => Effect.Effect<MemorialTemplate | null, PersistenceError>;

  /**
   * Find all system templates (available to all funeral homes)
   * 
   * Backend operation:
   * 1. Queries WHERE funeralHomeId IS NULL AND isCurrent = true
   * 2. Returns array of system-wide templates
   * 
   * @param category - Optional category filter
   * @returns Array of system templates
   */
  readonly findSystemTemplates: (
    category?: string
  ) => Effect.Effect<MemorialTemplate[], PersistenceError>;
}

/**
 * Template Repository Port Context Tag
 * 
 * Usage in use cases:
 * ```typescript
 * const templateRepo = yield* TemplateRepositoryPort;
 * const template = yield* templateRepo.findCurrentByBusinessKey('classic-program-001');
 * 
 * if (!template) {
 *   return yield* Effect.fail(new NotFoundError({
 *     entityType: 'MemorialTemplate',
 *     entityId: 'classic-program-001'
 *   }));
 * }
 * ```
 */
export const TemplateRepositoryPort = Context.GenericTag<TemplateRepositoryPortService>(
  '@dykstra/TemplateRepositoryPort'
);
