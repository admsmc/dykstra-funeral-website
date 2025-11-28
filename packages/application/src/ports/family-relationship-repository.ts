import { Effect, Context } from 'effect';
import { FamilyRelationship, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * FamilyRelationship Repository port
 * Defines interface for family relationship persistence with SCD Type 2 temporal support
 */
export interface FamilyRelationshipRepositoryService {
  /**
   * Find current version of relationship by ID
   */
  readonly findById: (id: string) => Effect.Effect<FamilyRelationship | null, PersistenceError>;
  
  /**
   * Find all current relationships for a contact (as either contactA or contactB)
   */
  readonly findByContactId: (
    contactId: string,
    includeHistorical?: boolean
  ) => Effect.Effect<readonly FamilyRelationship[], PersistenceError>;
  
  /**
   * Find all current relationships for a decedent
   */
  readonly findByDecedentId: (
    decedentId: string
  ) => Effect.Effect<readonly FamilyRelationship[], PersistenceError>;
  
  /**
   * Find primary contact for a decedent
   */
  readonly findPrimaryContactForDecedent: (
    decedentId: string
  ) => Effect.Effect<FamilyRelationship | null, PersistenceError>;
  
  /**
   * Find complete version history of a relationship between two contacts
   */
  readonly findHistory: (
    sourceContactId: string,
    targetContactId: string
  ) => Effect.Effect<readonly FamilyRelationship[], PersistenceError>;
  
  /**
   * Save relationship - creates new version (SCD2)
   */
  readonly save: (relationship: FamilyRelationship) => Effect.Effect<FamilyRelationship, PersistenceError>;
  
  /**
   * Delete relationship (soft delete by closing current version)
   */
  readonly delete: (id: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * FamilyRelationship Repository service tag for dependency injection
 */
export const FamilyRelationshipRepository = Context.GenericTag<FamilyRelationshipRepositoryService>(
  '@dykstra/FamilyRelationshipRepository'
);
