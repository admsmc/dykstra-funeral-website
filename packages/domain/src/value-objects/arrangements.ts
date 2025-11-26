import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';
import type { ServiceType } from '@dykstra/shared';

/**
 * Product selection for arrangements
 */
export interface Product {
  readonly id: string;
  readonly type: 'casket' | 'urn' | 'flowers' | 'other';
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly imageUrl: string | null;
  readonly selected: boolean;
}

/**
 * Ceremony details for service
 */
export interface CeremonyDetails {
  readonly date: Date | null;
  readonly time: string | null;              // HH:MM format
  readonly location: string | null;
  readonly officiant: string | null;
  readonly musicSelections: string[];         // List of songs/pieces
  readonly readings: string[];                // List of readings/passages
  readonly specialRequests: string | null;
}

/**
 * Collaborative note between family and funeral director
 */
export interface CollaborativeNote {
  readonly id: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly content: string;
  readonly createdAt: Date;
}

/**
 * Arrangements value object
 * Stored as JSON in Case.arrangements field
 */
export class Arrangements extends Data.Class<{
  readonly serviceType: ServiceType | null;
  readonly products: readonly Product[];
  readonly ceremony: CeremonyDetails;
  readonly notes: readonly CollaborativeNote[];
  readonly lastModifiedBy: string | null;
  readonly lastModifiedAt: Date | null;
}> {
  /**
   * Create empty arrangements
   */
  static empty(): Arrangements {
    return new Arrangements({
      serviceType: null,
      products: [],
      ceremony: {
        date: null,
        time: null,
        location: null,
        officiant: null,
        musicSelections: [],
        readings: [],
        specialRequests: null,
      },
      notes: [],
      lastModifiedBy: null,
      lastModifiedAt: null,
    });
  }

  /**
   * Create from JSON (database storage)
   */
  static fromJSON(json: any): Effect.Effect<Arrangements, ValidationError> {
    return Effect.gen(function* (_) {
      if (!json || typeof json !== 'object') {
        return Arrangements.empty();
      }

      return new Arrangements({
        serviceType: json.serviceType ?? null,
        products: Array.isArray(json.products) ? json.products : [],
        ceremony: {
          date: json.ceremony?.date ? new Date(json.ceremony.date) : null,
          time: json.ceremony?.time ?? null,
          location: json.ceremony?.location ?? null,
          officiant: json.ceremony?.officiant ?? null,
          musicSelections: Array.isArray(json.ceremony?.musicSelections) 
            ? json.ceremony.musicSelections 
            : [],
          readings: Array.isArray(json.ceremony?.readings) 
            ? json.ceremony.readings 
            : [],
          specialRequests: json.ceremony?.specialRequests ?? null,
        },
        notes: Array.isArray(json.notes)
          ? json.notes.map((n: any) => ({
              id: n.id,
              authorId: n.authorId,
              authorName: n.authorName,
              content: n.content,
              createdAt: new Date(n.createdAt),
            }))
          : [],
        lastModifiedBy: json.lastModifiedBy ?? null,
        lastModifiedAt: json.lastModifiedAt ? new Date(json.lastModifiedAt) : null,
      });
    });
  }

  /**
   * Convert to JSON (for database storage)
   */
  toJSON(): any {
    return {
      serviceType: this.serviceType,
      products: this.products,
      ceremony: {
        ...this.ceremony,
        date: this.ceremony.date?.toISOString(),
      },
      notes: this.notes.map(note => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
      })),
      lastModifiedBy: this.lastModifiedBy,
      lastModifiedAt: this.lastModifiedAt?.toISOString(),
    };
  }

  /**
   * Update service type
   */
  withServiceType(
    serviceType: ServiceType,
    modifiedBy: string
  ): Effect.Effect<Arrangements, ValidationError> {
    return Effect.succeed(
      new Arrangements({
        ...this,
        serviceType,
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date(),
      })
    );
  }

  /**
   * Add or update product
   */
  withProduct(
    product: Product,
    modifiedBy: string
  ): Effect.Effect<Arrangements, ValidationError> {
    // Remove existing product with same ID if present
    const updatedProducts = [
      ...this.products.filter(p => p.id !== product.id),
      product,
    ];

    return Effect.succeed(
      new Arrangements({
        ...this,
        products: updatedProducts,
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date(),
      })
    );
  }

  /**
   * Remove product
   */
  withoutProduct(
    productId: string,
    modifiedBy: string
  ): Effect.Effect<Arrangements, ValidationError> {
    return Effect.succeed(
      new Arrangements({
        ...this,
        products: this.products.filter(p => p.id !== productId),
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date(),
      })
    );
  }

  /**
   * Update ceremony details
   */
  withCeremonyDetails(
    ceremony: Partial<CeremonyDetails>,
    modifiedBy: string
  ): Effect.Effect<Arrangements, ValidationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Validate time format if provided
      if (ceremony.time) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(ceremony.time)) {
          return yield* _(Effect.fail(
            new ValidationError({
              message: 'Time must be in HH:MM format',
              field: 'ceremony.time',
            })
          ));
        }
      }

      return new Arrangements({
        ...self,
        ceremony: {
          ...self.ceremony,
          ...ceremony,
          musicSelections: ceremony.musicSelections ?? self.ceremony.musicSelections,
          readings: ceremony.readings ?? self.ceremony.readings,
        },
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date(),
      });
    });
  }

  /**
   * Add a collaborative note
   */
  withNote(
    note: Omit<CollaborativeNote, 'id' | 'createdAt'>,
    modifiedBy: string
  ): Effect.Effect<Arrangements, ValidationError> {
    const self = this;
    return Effect.gen(function* (_) {
      if (!note.content.trim()) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Note content cannot be empty',
            field: 'note.content',
          })
        ));
      }

      const newNote: CollaborativeNote = {
        id: crypto.randomUUID(),
        authorId: note.authorId,
        authorName: note.authorName,
        content: note.content.trim(),
        createdAt: new Date(),
      };

      return new Arrangements({
        ...self,
        notes: [...self.notes, newNote],
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date(),
      });
    });
  }

  /**
   * Get selected products only
   */
  get selectedProducts(): readonly Product[] {
    return this.products.filter(p => p.selected);
  }

  /**
   * Get total cost of selected products
   */
  get totalProductCost(): number {
    return this.selectedProducts.reduce((sum, p) => sum + p.price, 0);
  }

  /**
   * Check if arrangements are complete enough for contract generation
   */
  get isComplete(): boolean {
    return (
      this.serviceType !== null &&
      this.selectedProducts.length > 0 &&
      this.ceremony.date !== null
    );
  }

  /**
   * Get completion percentage (0-100)
   */
  get completionPercentage(): number {
    let completed = 0;
    let total = 5;

    if (this.serviceType) completed++;
    if (this.selectedProducts.length > 0) completed++;
    if (this.ceremony.date) completed++;
    if (this.ceremony.location) completed++;
    if (this.ceremony.officiant) completed++;

    return Math.round((completed / total) * 100);
  }
}
