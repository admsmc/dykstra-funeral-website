import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';

/**
 * Contact ID branded type
 */
export type ContactId = string & { readonly _brand: 'ContactId' };

/**
 * Contact type
 */
export type ContactType = 
  | 'primary'       // Primary family contact
  | 'secondary'     // Secondary family member
  | 'professional'  // Professional contact (clergy, etc.)
  | 'referral';     // Referral source

/**
 * Relationship type
 */
export type RelationshipType =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'friend'
  | 'clergy'
  | 'attorney'
  | 'other';

/**
 * Grief stage tracking (Kübler-Ross model)
 */
export type GriefStage =
  | 'shock'        // Initial shock/denial
  | 'denial'       // Denial of loss
  | 'anger'        // Anger at situation
  | 'bargaining'   // Bargaining/what-ifs
  | 'depression'   // Deep sadness
  | 'acceptance';  // Coming to terms

/**
 * Military branch for veteran tracking
 */
export type MilitaryBranch =
  | 'army'
  | 'navy'
  | 'air_force'
  | 'marines'
  | 'coast_guard'
  | 'space_force';

/**
 * Language preference for communications
 */
export type LanguagePreference =
  | 'en'  // English
  | 'es'  // Spanish
  | 'fr'  // French
  | 'de'  // German
  | 'pl'  // Polish
  | 'it'  // Italian
  | 'zh'  // Chinese
  | 'other';

/**
 * Contact entity
 * Represents a person in the CRM system
 * SCD Type 2: Track all changes to contact information
 */
export class Contact extends Data.Class<{
  readonly id: ContactId;
  readonly businessKey: string;
  readonly version: number;
  readonly funeralHomeId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly alternatePhone: string | null;
  readonly address: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly zipCode: string | null;
  readonly type: ContactType;
  readonly relationshipType: RelationshipType | null;
  readonly birthDate: Date | null;
  readonly notes: string | null;
  readonly doNotContact: boolean;
  readonly emailOptIn: boolean;
  readonly smsOptIn: boolean;
  readonly tags: readonly string[];  // Segmentation tags
  readonly mergedIntoContactId: string | null;  // If merged into another contact
  // Funeral-specific enhancements
  readonly isVeteran: boolean;
  readonly militaryBranch: MilitaryBranch | null;
  readonly religiousAffiliation: string | null;
  readonly culturalPreferences: readonly string[];
  readonly dietaryRestrictions: readonly string[];
  readonly languagePreference: LanguagePreference;
  // Grief journey tracking
  readonly griefStage: GriefStage | null;
  readonly griefJourneyStartedAt: Date | null;
  readonly decedentRelationshipId: string | null;  // Link to deceased family member
  readonly serviceAnniversaryDate: Date | null;  // Date of funeral service
  readonly lastGriefCheckIn: Date | null;  // Last grief support touchpoint
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Create a new Contact
   */
  static create(params: {
    id: string;
    businessKey: string;
    funeralHomeId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    type: ContactType;
    createdBy: string;
  }): Effect.Effect<Contact, ValidationError> {
    return Effect.gen(function* () {
      const trimmedFirstName = params.firstName.trim();
      const trimmedLastName = params.lastName.trim();
      
      if (!trimmedFirstName || !trimmedLastName) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Name is required', 
            field: 'name' 
          })
        );
      }

      if (trimmedFirstName.length > 100 || trimmedLastName.length > 100) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Name too long (max 100 characters each)', 
            field: 'name' 
          })
        );
      }

      const now = new Date();

      return new Contact({
        id: params.id as ContactId,
        businessKey: params.businessKey,
        version: 1,
        funeralHomeId: params.funeralHomeId,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: params.email?.trim() || null,
        phone: params.phone?.trim() || null,
        alternatePhone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        type: params.type,
        relationshipType: null,
        birthDate: null,
        notes: null,
        doNotContact: false,
        emailOptIn: false,
        smsOptIn: false,
        tags: [],
        mergedIntoContactId: null,
        // Funeral-specific fields
        isVeteran: false,
        militaryBranch: null,
        religiousAffiliation: null,
        culturalPreferences: [],
        dietaryRestrictions: [],
        languagePreference: 'en',
        // Grief journey fields
        griefStage: null,
        griefJourneyStartedAt: null,
        decedentRelationshipId: null,
        serviceAnniversaryDate: null,
        lastGriefCheckIn: null,
        createdAt: now,
        updatedAt: now,
        createdBy: params.createdBy,
      });
    });
  }

  /**
   * Update contact information
   */
  updateContactInfo(params: {
    email?: string | null;
    phone?: string | null;
    alternatePhone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
  }): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      email: params.email !== undefined ? params.email : this.email,
      phone: params.phone !== undefined ? params.phone : this.phone,
      alternatePhone: params.alternatePhone !== undefined ? params.alternatePhone : this.alternatePhone,
      address: params.address !== undefined ? params.address : this.address,
      city: params.city !== undefined ? params.city : this.city,
      state: params.state !== undefined ? params.state : this.state,
      zipCode: params.zipCode !== undefined ? params.zipCode : this.zipCode,
      updatedAt: new Date(),
    });
  }

  /**
   * Update relationship information
   */
  updateRelationship(relationshipType: RelationshipType): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      relationshipType,
      updatedAt: new Date(),
    });
  }

  /**
   * Update birth date
   */
  updateBirthDate(birthDate: Date): Effect.Effect<Contact, ValidationError> {
    if (birthDate > new Date()) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Birth date cannot be in the future', 
          field: 'birthDate' 
        })
      );
    }

    return Effect.succeed(
      new Contact({
        ...this,
        version: this.version + 1,
        birthDate,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Add tag for segmentation
   */
  addTag(tag: string): Contact {
    const trimmedTag = tag.trim().toLowerCase();
    
    if (!trimmedTag) {
      return this;
    }

    if (this.tags.includes(trimmedTag)) {
      return this;
    }

    return new Contact({
      ...this,
      version: this.version + 1,
      tags: [...this.tags, trimmedTag],
      updatedAt: new Date(),
    });
  }

  /**
   * Remove tag
   */
  removeTag(tag: string): Contact {
    const trimmedTag = tag.trim().toLowerCase();
    
    if (!this.tags.includes(trimmedTag)) {
      return this;
    }

    return new Contact({
      ...this,
      version: this.version + 1,
      tags: this.tags.filter(t => t !== trimmedTag),
      updatedAt: new Date(),
    });
  }

  /**
   * Opt in to email marketing
   */
  optInEmail(): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      emailOptIn: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Opt out of email marketing
   */
  optOutEmail(): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      emailOptIn: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Opt in to SMS marketing
   */
  optInSMS(): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      smsOptIn: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Opt out of SMS marketing
   */
  optOutSMS(): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      smsOptIn: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Mark as do not contact (GDPR/CAN-SPAM compliance)
   */
  markDoNotContact(): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      doNotContact: true,
      emailOptIn: false,
      smsOptIn: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Remove do not contact flag
   */
  removeDoNotContact(): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      doNotContact: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Merge into another contact
   */
  mergeInto(targetContactId: string): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      mergedIntoContactId: targetContactId,
      updatedAt: new Date(),
    });
  }

  /**
   * Update notes
   */
  updateNotes(notes: string): Effect.Effect<Contact, ValidationError> {
    if (notes.length > 5000) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Notes too long (max 5000 characters)', 
          field: 'notes' 
        })
      );
    }

    return Effect.succeed(
      new Contact({
        ...this,
        version: this.version + 1,
        notes: notes.trim() || null,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Check if contact can be emailed
   */
  get canEmail(): boolean {
    return !!this.email && !this.doNotContact && this.emailOptIn;
  }

  /**
   * Check if contact can receive SMS
   */
  get canSMS(): boolean {
    return !!this.phone && !this.doNotContact && this.smsOptIn;
  }

  /**
   * Check if contact is merged
   */
  get isMerged(): boolean {
    return !!this.mergedIntoContactId;
  }

  /**
   * Get full name
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Get full address
   */
  get fullAddress(): string | null {
    if (!this.address) {
      return null;
    }

    const parts = [
      this.address,
      this.city,
      this.state ? `${this.state} ${this.zipCode || ''}`.trim() : this.zipCode,
    ].filter(Boolean);

    return parts.join(', ') || null;
  }

  /**
   * Check if contact has any segmentation tags
   */
  hasTag(tag: string): boolean {
    return this.tags.includes(tag.trim().toLowerCase());
  }

  /**
   * Check if contact has any of the specified tags
   */
  hasAnyTag(tags: readonly string[]): boolean {
    const lowerTags = tags.map(t => t.trim().toLowerCase());
    return this.tags.some(t => lowerTags.includes(t));
  }

  // ========================================
  // Funeral-Specific Business Logic
  // ========================================

  /**
   * Start grief journey tracking
   */
  startGriefJourney(params: {
    decedentRelationshipId: string;
    serviceAnniversaryDate: Date;
  }): Effect.Effect<Contact, ValidationError> {
    if (this.griefJourneyStartedAt) {
      return Effect.fail(
        new ValidationError({
          message: 'Grief journey already started for this contact',
          field: 'griefJourneyStartedAt',
        })
      );
    }

    if (params.serviceAnniversaryDate > new Date()) {
      return Effect.fail(
        new ValidationError({
          message: 'Service anniversary date cannot be in the future',
          field: 'serviceAnniversaryDate',
        })
      );
    }

    return Effect.succeed(
      new Contact({
        ...this,
        version: this.version + 1,
        griefStage: 'shock',
        griefJourneyStartedAt: new Date(),
        decedentRelationshipId: params.decedentRelationshipId,
        serviceAnniversaryDate: params.serviceAnniversaryDate,
        lastGriefCheckIn: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Update grief stage
   */
  updateGriefStage(stage: GriefStage): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      griefStage: stage,
      updatedAt: new Date(),
    });
  }

  /**
   * Record grief check-in (touchpoint)
   */
  recordGriefCheckIn(): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      lastGriefCheckIn: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Update veteran information
   */
  updateVeteranInfo(params: {
    isVeteran: boolean;
    militaryBranch?: MilitaryBranch | null;
  }): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      isVeteran: params.isVeteran,
      militaryBranch: params.militaryBranch !== undefined ? params.militaryBranch : this.militaryBranch,
      updatedAt: new Date(),
    });
  }

  /**
   * Update religious and cultural preferences
   */
  updateCulturalPreferences(params: {
    religiousAffiliation?: string | null;
    culturalPreferences?: readonly string[];
    dietaryRestrictions?: readonly string[];
  }): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      religiousAffiliation: params.religiousAffiliation !== undefined ? params.religiousAffiliation : this.religiousAffiliation,
      culturalPreferences: params.culturalPreferences !== undefined ? params.culturalPreferences : this.culturalPreferences,
      dietaryRestrictions: params.dietaryRestrictions !== undefined ? params.dietaryRestrictions : this.dietaryRestrictions,
      updatedAt: new Date(),
    });
  }

  /**
   * Update language preference
   */
  updateLanguagePreference(language: LanguagePreference): Contact {
    return new Contact({
      ...this,
      version: this.version + 1,
      languagePreference: language,
      updatedAt: new Date(),
    });
  }

  /**
   * Check if contact is in active grief journey
   */
  get isInGriefJourney(): boolean {
    return !!this.griefJourneyStartedAt && this.griefStage !== 'acceptance';
  }

  /**
   * Get days since grief journey started
   */
  get daysSinceGriefStarted(): number | null {
    if (!this.griefJourneyStartedAt) {
      return null;
    }
    const now = new Date();
    const diffMs = now.getTime() - this.griefJourneyStartedAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days since service anniversary
   */
  get daysSinceServiceAnniversary(): number | null {
    if (!this.serviceAnniversaryDate) {
      return null;
    }
    const now = new Date();
    const diffMs = now.getTime() - this.serviceAnniversaryDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if upcoming service anniversary (within next 30 days)
   */
  get hasUpcomingServiceAnniversary(): boolean {
    if (!this.serviceAnniversaryDate) {
      return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Get anniversary date for current year
    const thisYearAnniversary = new Date(
      currentYear,
      this.serviceAnniversaryDate.getMonth(),
      this.serviceAnniversaryDate.getDate()
    );

    // If already passed this year, check next year
    const targetAnniversary = thisYearAnniversary < now
      ? new Date(currentYear + 1, thisYearAnniversary.getMonth(), thisYearAnniversary.getDate())
      : thisYearAnniversary;

    const daysUntil = Math.floor((targetAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 30;
  }

  /**
   * Check if grief check-in is needed (>30 days since last)
   */
  get needsGriefCheckIn(): boolean {
    if (!this.isInGriefJourney || !this.lastGriefCheckIn) {
      return false;
    }

    const now = new Date();
    const daysSinceCheckIn = Math.floor(
      (now.getTime() - this.lastGriefCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCheckIn > 30;
  }
}
