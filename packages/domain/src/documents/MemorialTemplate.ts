/**
 * Memorial Template domain entity
 * Supports SCD2 (Slowly Changing Dimension Type 2) pattern for versioning
 */

export type TemplateCategory =
  | 'service_program'
  | 'prayer_card'
  | 'bookmark'
  | 'acknowledgement_card'
  | 'memorial_folder';

export type TemplateStatus = 'draft' | 'active' | 'deprecated';

export interface TemplateMetadata {
  readonly id: string; // Unique ID per version (UUID)
  readonly businessKey: string; // Stable ID across versions (e.g., "classic-program-001")
  readonly name: string; // Display name (e.g., "Classic Elegant Program")
  readonly category: TemplateCategory;
  readonly status: TemplateStatus;
  readonly createdBy: string; // User ID
  readonly funeralHomeId?: string; // null for system templates, specific ID for custom templates
}

export interface TemporalMetadata {
  readonly validFrom: Date; // When this version became active
  readonly validTo: Date | null; // null = currently active version
  readonly version: number; // 1, 2, 3, etc.
  readonly changeReason?: string; // Why this version was created
}

export interface TemplateContent {
  readonly htmlTemplate: string; // Handlebars template HTML
  readonly cssStyles: string; // CSS for styling
  readonly previewImageUrl?: string; // URL to preview thumbnail
}

export interface TemplateSettings {
  readonly pageSize: 'letter' | 'a4' | 'legal' | '4x6' | '5x7'; // Paper size
  readonly orientation: 'portrait' | 'landscape';
  readonly margins: {
    readonly top: number; // in inches
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  };
  readonly printQuality: 150 | 300 | 600; // DPI
}

/**
 * Memorial Template domain entity
 * Represents a versioned document template with SCD2 pattern
 */
export class MemorialTemplate {
  private constructor(
    public readonly metadata: TemplateMetadata,
    public readonly temporal: TemporalMetadata,
    public readonly content: TemplateContent,
    public readonly settings: TemplateSettings
  ) {
    this.validate();
  }

  /**
   * Factory method for creating new templates (version 1)
   */
  static create(
    metadata: TemplateMetadata,
    content: TemplateContent,
    settings: TemplateSettings
  ): MemorialTemplate {
    const temporal: TemporalMetadata = {
      validFrom: new Date(),
      validTo: null, // Active version
      version: 1,
    };

    return new MemorialTemplate(metadata, temporal, content, settings);
  }

  /**
   * Factory method for creating a new version from an existing template
   * Implements SCD2 pattern: old version gets validTo, new version gets validFrom
   */
  createNewVersion(
    content: TemplateContent,
    settings: TemplateSettings,
    changeReason?: string
  ): MemorialTemplate {
    const now = new Date();

    const newTemporal: TemporalMetadata = {
      validFrom: now,
      validTo: null, // New active version
      version: this.temporal.version + 1,
      changeReason,
    };

    // Generate new ID for new version (different row in database)
    const newMetadata: TemplateMetadata = {
      ...this.metadata,
      id: crypto.randomUUID(), // New ID for new version
      // businessKey stays the same - links versions together
    };

    return new MemorialTemplate(newMetadata, newTemporal, content, settings);
  }

  /**
   * Business rule: Validate template data
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.content.htmlTemplate || this.content.htmlTemplate.trim().length === 0) {
      throw new Error('Template must have HTML content');
    }

    if (this.settings.margins.top < 0 || this.settings.margins.top > 2) {
      throw new Error('Top margin must be between 0 and 2 inches');
    }
    if (this.settings.margins.right < 0 || this.settings.margins.right > 2) {
      throw new Error('Right margin must be between 0 and 2 inches');
    }
    if (this.settings.margins.bottom < 0 || this.settings.margins.bottom > 2) {
      throw new Error('Bottom margin must be between 0 and 2 inches');
    }
    if (this.settings.margins.left < 0 || this.settings.margins.left > 2) {
      throw new Error('Left margin must be between 0 and 2 inches');
    }

    if (this.temporal.validTo && this.temporal.validTo <= this.temporal.validFrom) {
      throw new Error('validTo must be after validFrom');
    }

    if (this.temporal.version < 1) {
      throw new Error('Version must be at least 1');
    }
  }

  /**
   * Business rule: Is this the currently active version?
   */
  isActiveVersion(): boolean {
    return this.temporal.validTo === null && this.metadata.status === 'active';
  }

  /**
   * Business rule: Is this template available for use?
   */
  isAvailableForUse(asOfDate: Date = new Date()): boolean {
    const isWithinValidPeriod =
      asOfDate >= this.temporal.validFrom &&
      (this.temporal.validTo === null || asOfDate < this.temporal.validTo);

    return isWithinValidPeriod && this.metadata.status !== 'deprecated';
  }

  /**
   * Business rule: Is this a system template (available to all funeral homes)?
   */
  isSystemTemplate(): boolean {
    return this.metadata.funeralHomeId === undefined || this.metadata.funeralHomeId === null;
  }

  /**
   * Business rule: Is this a custom template (specific to one funeral home)?
   */
  isCustomTemplate(): boolean {
    return !this.isSystemTemplate();
  }

  /**
   * Business rule: Get page dimensions in pixels at given DPI
   */
  getPageDimensionsInPixels(): { width: number; height: number } {
    // Page sizes in inches
    const pageSizes: Record<
      typeof this.settings.pageSize,
      { width: number; height: number }
    > = {
      letter: { width: 8.5, height: 11 },
      a4: { width: 8.27, height: 11.69 },
      legal: { width: 8.5, height: 14 },
      '4x6': { width: 4, height: 6 },
      '5x7': { width: 5, height: 7 },
    };

    const size = pageSizes[this.settings.pageSize];
    const dpi = this.settings.printQuality;

    if (this.settings.orientation === 'portrait') {
      return {
        width: size.width * dpi,
        height: size.height * dpi,
      };
    } else {
      return {
        width: size.height * dpi, // Swap for landscape
        height: size.width * dpi,
      };
    }
  }

  /**
   * Business rule: Get category display name
   */
  getCategoryDisplayName(): string {
    const displayNames: Record<TemplateCategory, string> = {
      service_program: 'Service Program',
      prayer_card: 'Prayer Card',
      bookmark: 'Memorial Bookmark',
      acknowledgement_card: 'Acknowledgement Card',
      memorial_folder: 'Memorial Folder',
    };

    return displayNames[this.metadata.category];
  }

  /**
   * Business rule: Should this template show up in template picker for a given funeral home?
   */
  isVisibleToFuneralHome(funeralHomeId: string): boolean {
    // System templates visible to all
    if (this.isSystemTemplate()) {
      return true;
    }

    // Custom templates only visible to owning funeral home
    return this.metadata.funeralHomeId === funeralHomeId;
  }

  /**
   * Business rule: Get all Handlebars variables used in template
   * Useful for validation and documentation
   */
  getTemplateVariables(): string[] {
    // Extract {{variableName}} patterns
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = this.content.htmlTemplate.matchAll(regex);
    const variables = new Set<string>();

    for (const match of matches) {
      const varName = match[1]?.trim();
      // Exclude Handlebars helpers (start with #) and ensure varName exists
      if (varName && !varName.startsWith('#') && !varName.startsWith('/')) {
        variables.add(varName);
      }
    }

    return Array.from(variables).sort();
  }
}
