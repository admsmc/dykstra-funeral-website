import { Effect, Context } from 'effect';
import { Contact, type ContactId, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Contact Repository port
 * Defines interface for contact persistence with SCD Type 2 temporal support
 */
export interface ContactRepositoryService {
  /**
   * Find current version of contact by ID or business key
   */
  readonly findById: (id: ContactId) => Effect.Effect<Contact, NotFoundError | PersistenceError>;
  
  /**
   * Find current version of contact by business key
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<Contact | null, PersistenceError>;
  
  /**
   * Find complete version history of a contact
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly Contact[], NotFoundError | PersistenceError>;
  
  /**
   * Find current versions of contacts by funeral home with optional filters
   */
  readonly findByFuneralHome: (
    funeralHomeId: string,
    filters?: {
      tags?: readonly string[];
      canEmail?: boolean;
      canSMS?: boolean;
      type?: string;
    }
  ) => Effect.Effect<readonly Contact[], PersistenceError>;
  
  /**
   * Find contacts by tag (current versions only)
   */
  readonly findByTag: (
    funeralHomeId: string,
    tag: string
  ) => Effect.Effect<readonly Contact[], PersistenceError>;
  
  /**
   * Find contacts by email (for duplicate detection)
   */
  readonly findByEmail: (
    email: string
  ) => Effect.Effect<readonly Contact[], PersistenceError>;
  
  /**
   * Find contacts by phone (for duplicate detection)
   */
  readonly findByPhone: (
    phone: string
  ) => Effect.Effect<readonly Contact[], PersistenceError>;
  
  /**
   * Find contacts that have been merged into another contact
   */
  readonly findMergedContacts: (
    targetContactId: ContactId
  ) => Effect.Effect<readonly Contact[], PersistenceError>;
  
  /**
   * Save contact - creates new version (SCD2)
   */
  readonly save: (contact: Contact) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Update contact - convenience method that wraps save for SCD2 updates
   */
  readonly update: (contact: Contact) => Effect.Effect<Contact, PersistenceError>;
  
  /**
   * Delete contact (soft delete by closing current version)
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Contact Repository service tag for dependency injection
 */
export const ContactRepository = Context.GenericTag<ContactRepositoryService>('@dykstra/ContactRepository');
