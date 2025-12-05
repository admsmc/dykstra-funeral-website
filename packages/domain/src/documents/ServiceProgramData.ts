/**
 * Service Program domain entity
 * Pure business logic for funeral service program generation
 */

export interface DeceasedInfo {
  readonly fullName: string;
  readonly birthDate: Date;
  readonly deathDate: Date;
  readonly birthPlace?: string;
  readonly residenceAtDeath?: string;
  readonly photoUrl?: string; // URL to photo in storage
}

export interface ServiceDetails {
  readonly serviceDate: Date;
  readonly serviceTime: string; // e.g., "2:00 PM"
  readonly location: string;
  readonly locationAddress: string;
  readonly officiant?: string;
}

export interface ServiceEvent {
  readonly title: string; // e.g., "Opening Hymn", "Eulogy", "Scripture Reading"
  readonly description?: string;
  readonly performedBy?: string;
}

export interface Survivor {
  readonly name: string;
  readonly relationship: string; // e.g., "Wife", "Son", "Sister"
}

export interface ServiceProgramMetadata {
  readonly caseId: string;
  readonly funeralHomeId: string;
  readonly programType: 'funeral' | 'memorial' | 'celebration_of_life';
  readonly createdAt: Date;
  readonly createdBy: string; // User ID
}

/**
 * Service Program domain entity
 * Contains all data for generating a funeral service program
 */
export class ServiceProgramData {
  private constructor(
    public readonly metadata: ServiceProgramMetadata,
    public readonly deceased: DeceasedInfo,
    public readonly service: ServiceDetails,
    public readonly orderOfService: ReadonlyArray<ServiceEvent>,
    public readonly survivors: ReadonlyArray<Survivor>,
    public readonly obituaryText?: string,
    public readonly acknowledgements?: string
  ) {
    this.validate();
  }

  /**
   * Factory method for creating new service programs
   */
  static create(
    metadata: ServiceProgramMetadata,
    deceased: DeceasedInfo,
    service: ServiceDetails,
    orderOfService: ReadonlyArray<ServiceEvent>,
    survivors: ReadonlyArray<Survivor>,
    obituaryText?: string,
    acknowledgements?: string
  ): ServiceProgramData {
    return new ServiceProgramData(
      metadata,
      deceased,
      service,
      orderOfService,
      survivors,
      obituaryText,
      acknowledgements
    );
  }

  /**
   * Business rule: Validate service program data
   * @throws Error if validation fails
   */
  private validate(): void {
    if (this.deceased.deathDate < this.deceased.birthDate) {
      throw new Error('Death date cannot be before birth date');
    }

    if (this.service.serviceDate < this.deceased.deathDate) {
      throw new Error('Service date cannot be before death date');
    }

    if (this.orderOfService.length === 0) {
      throw new Error('Service program must have at least one event in order of service');
    }

    // Validate time format (basic check)
    const timePattern = /^\d{1,2}:\d{2}\s?(AM|PM)$/i;
    if (!timePattern.test(this.service.serviceTime)) {
      throw new Error('Service time must be in format "H:MM AM/PM"');
    }
  }

  /**
   * Business rule: Format date range for deceased (e.g., "January 15, 1950 - December 3, 2024")
   */
  formatLifespan(): string {
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return `${formatDate(this.deceased.birthDate)} - ${formatDate(this.deceased.deathDate)}`;
  }

  /**
   * Business rule: Calculate age at death
   */
  calculateAgeAtDeath(): number {
    const birthYear = this.deceased.birthDate.getFullYear();
    const deathYear = this.deceased.deathDate.getFullYear();
    let age = deathYear - birthYear;

    // Adjust if birthday hasn't occurred in death year
    const birthMonth = this.deceased.birthDate.getMonth();
    const deathMonth = this.deceased.deathDate.getMonth();
    const birthDay = this.deceased.birthDate.getDate();
    const deathDay = this.deceased.deathDate.getDate();

    if (deathMonth < birthMonth || (deathMonth === birthMonth && deathDay < birthDay)) {
      age--;
    }

    return age;
  }

  /**
   * Business rule: Format service datetime for display
   */
  formatServiceDateTime(): string {
    const dateStr = this.service.serviceDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `${dateStr} at ${this.service.serviceTime}`;
  }

  /**
   * Business rule: Group survivors by relationship type
   * Returns a map of relationship type to names
   */
  groupSurvivorsByRelationship(): Map<string, string[]> {
    const grouped = new Map<string, string[]>();

    for (const survivor of this.survivors) {
      const existing = grouped.get(survivor.relationship) || [];
      grouped.set(survivor.relationship, [...existing, survivor.name]);
    }

    return grouped;
  }

  /**
   * Business rule: Format survivors list for display
   * Groups by relationship with proper grammar (e.g., "Wife: Jane Doe; Sons: John Doe, James Doe")
   */
  formatSurvivorsText(): string {
    const grouped = this.groupSurvivorsByRelationship();
    const sections: string[] = [];

    grouped.forEach((names, relationship) => {
      const label = names.length === 1 ? relationship : this.pluralizeRelationship(relationship);
      sections.push(`${label}: ${names.join(', ')}`);
    });

    return sections.join('; ');
  }

  /**
   * Business rule: Pluralize relationship (basic English rules)
   */
  private pluralizeRelationship(relationship: string): string {
    const irregulars: Record<string, string> = {
      Wife: 'Wives',
      Child: 'Children',
      Person: 'People',
    };

    if (irregulars[relationship]) {
      return irregulars[relationship];
    }

    // Handle most common patterns
    if (relationship.endsWith('y')) {
      return relationship.slice(0, -1) + 'ies'; // "Family" -> "Families"
    }

    return relationship + 's'; // "Son" -> "Sons", "Sister" -> "Sisters"
  }

  /**
   * Business rule: Should include photo?
   */
  shouldIncludePhoto(): boolean {
    return !!this.deceased.photoUrl;
  }

  /**
   * Business rule: Get program title based on type
   */
  getProgramTitle(): string {
    switch (this.metadata.programType) {
      case 'funeral':
        return 'Funeral Service';
      case 'memorial':
        return 'Memorial Service';
      case 'celebration_of_life':
        return 'Celebration of Life';
    }
  }
}
