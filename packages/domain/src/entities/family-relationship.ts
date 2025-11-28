import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';
import type { ContactId } from './contact';

/**
 * FamilyRelationship ID branded type
 */
export type FamilyRelationshipId = string & { readonly _brand: 'FamilyRelationshipId' };

/**
 * Extended relationship types for family network mapping
 */
export type FamilyRelationshipType =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'grandchild'
  | 'grandparent'
  | 'niece_nephew'
  | 'aunt_uncle'
  | 'cousin'
  | 'in_law'
  | 'step_relation'
  | 'friend'
  | 'other';

/**
 * FamilyRelationship entity
 * Maps relationships between contacts, centered around a deceased person
 * SCD Type 2: Track all changes to family relationships
 */
export class FamilyRelationship extends Data.Class<{
  readonly id: FamilyRelationshipId;
  readonly businessKey: string;
  readonly version: number;
  // SCD Type 2 temporal fields
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly funeralHomeId: string;
  readonly sourceContactId: ContactId;  // Person in the relationship
  readonly targetContactId: ContactId;  // Related person
  readonly relationshipType: FamilyRelationshipType;
  readonly isPrimaryContact: boolean;  // Is this the main family contact?
  readonly decedentId: ContactId | null;  // If relationship is centered around deceased
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Create a new FamilyRelationship
   */
  static create(params: {
    id: string;
    businessKey: string;
    funeralHomeId: string;
    sourceContactId: ContactId;
    targetContactId: ContactId;
    relationshipType: FamilyRelationshipType;
    isPrimaryContact?: boolean;
    decedentId?: ContactId | null;
    createdBy: string;
  }): Effect.Effect<FamilyRelationship, ValidationError> {
    return Effect.gen(function* () {
      // Validate that source and target are different
      if (params.sourceContactId === params.targetContactId) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Source and target contact cannot be the same',
            field: 'sourceContactId',
          })
        );
      }

      const now = new Date();

      return new FamilyRelationship({
        id: params.id as FamilyRelationshipId,
        businessKey: params.businessKey,
        version: 1,
        validFrom: now,
        validTo: null,
        funeralHomeId: params.funeralHomeId,
        sourceContactId: params.sourceContactId,
        targetContactId: params.targetContactId,
        relationshipType: params.relationshipType,
        isPrimaryContact: params.isPrimaryContact ?? false,
        decedentId: params.decedentId ?? null,
        notes: null,
        createdAt: now,
        updatedAt: now,
        createdBy: params.createdBy,
      });
    });
  }

  /**
   * Update relationship type
   */
  updateRelationshipType(type: FamilyRelationshipType): FamilyRelationship {
    return new FamilyRelationship({
      ...this,
      version: this.version + 1,
      relationshipType: type,
      updatedAt: new Date(),
    });
  }

  /**
   * Set as primary contact
   */
  setAsPrimaryContact(): FamilyRelationship {
    return new FamilyRelationship({
      ...this,
      version: this.version + 1,
      isPrimaryContact: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Remove primary contact designation
   */
  removeAsPrimaryContact(): FamilyRelationship {
    return new FamilyRelationship({
      ...this,
      version: this.version + 1,
      isPrimaryContact: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Link to deceased person
   */
  linkToDecedent(decedentId: ContactId): FamilyRelationship {
    return new FamilyRelationship({
      ...this,
      version: this.version + 1,
      decedentId,
      updatedAt: new Date(),
    });
  }

  /**
   * Update notes
   */
  updateNotes(notes: string): Effect.Effect<FamilyRelationship, ValidationError> {
    if (notes.length > 2000) {
      return Effect.fail(
        new ValidationError({
          message: 'Notes too long (max 2000 characters)',
          field: 'notes',
        })
      );
    }

    return Effect.succeed(
      new FamilyRelationship({
        ...this,
        version: this.version + 1,
        notes: notes.trim() || null,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Check if relationship is related to a deceased person
   */
  get isDecedentRelated(): boolean {
    return !!this.decedentId;
  }

  /**
   * Get inverse relationship type (for bidirectional mapping)
   */
  get inverseRelationshipType(): FamilyRelationshipType | null {
    const inverseMap: Record<FamilyRelationshipType, FamilyRelationshipType> = {
      spouse: 'spouse',
      child: 'parent',
      parent: 'child',
      sibling: 'sibling',
      grandchild: 'grandparent',
      grandparent: 'grandchild',
      niece_nephew: 'aunt_uncle',
      aunt_uncle: 'niece_nephew',
      cousin: 'cousin',
      in_law: 'in_law',
      step_relation: 'step_relation',
      friend: 'friend',
      other: 'other',
    };

    return inverseMap[this.relationshipType] || null;
  }

  // ========================================
  // SCD Type 2 Temporal Methods
  // ========================================

  /**
   * Check if this is the current version
   */
  get isCurrent(): boolean {
    return this.validTo === null;
  }

  /**
   * End validity of this version (SCD2 pattern)
   * Used when creating a new version or soft-deleting
   */
  endValidity(endDate?: Date): FamilyRelationship {
    return new FamilyRelationship({
      ...this,
      validTo: endDate ?? new Date(),
    });
  }

  /**
   * Create new version with updated data (SCD2 pattern)
   */
  createNewVersion(updates: Partial<{
    relationshipType: FamilyRelationshipType;
    isPrimaryContact: boolean;
    decedentId: ContactId | null;
    notes: string | null;
  }>): FamilyRelationship {
    const now = new Date();
    return new FamilyRelationship({
      ...this,
      id: crypto.randomUUID() as FamilyRelationshipId,
      version: this.version + 1,
      validFrom: now,
      validTo: null,
      relationshipType: updates.relationshipType ?? this.relationshipType,
      isPrimaryContact: updates.isPrimaryContact ?? this.isPrimaryContact,
      decedentId: updates.decedentId !== undefined ? updates.decedentId : this.decedentId,
      notes: updates.notes !== undefined ? updates.notes : this.notes,
      updatedAt: now,
    });
  }
}
