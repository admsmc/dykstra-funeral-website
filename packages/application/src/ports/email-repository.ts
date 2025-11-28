import { Effect, Context } from 'effect';
import type { Email, EmailId } from '@dykstra/domain';

/**
 * Email Repository Service port
 * Repository for email storage and retrieval (immutable)
 */
export interface EmailRepositoryService {
  /**
   * Save email (immutable - no updates)
   */
  readonly save: (email: Email) => Effect.Effect<void, PersistenceError>;

  /**
   * Find email by ID
   */
  readonly findById: (id: EmailId) => Effect.Effect<Email, NotFoundError | PersistenceError>;

  /**
   * Find emails by contact
   */
  readonly findByContact: (
    contactId: string,
    options?: { limit?: number; offset?: number }
  ) => Effect.Effect<readonly Email[], PersistenceError>;

  /**
   * Find emails by lead
   */
  readonly findByLead: (
    leadId: string,
    options?: { limit?: number; offset?: number }
  ) => Effect.Effect<readonly Email[], PersistenceError>;

  /**
   * Find emails by case
   */
  readonly findByCase: (
    caseId: string,
    options?: { limit?: number; offset?: number }
  ) => Effect.Effect<readonly Email[], PersistenceError>;

  /**
   * Find emails by thread
   */
  readonly findByThread: (
    threadId: string
  ) => Effect.Effect<readonly Email[], PersistenceError>;

  /**
   * Search emails by funeral home
   */
  readonly search: (
    funeralHomeId: string,
    filters: {
      query?: string;
      from?: string;
      to?: string;
      hasAttachments?: boolean;
      isRead?: boolean;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) => Effect.Effect<readonly Email[], PersistenceError>;

  /**
   * Check if email exists by external ID
   */
  readonly existsByExternalId: (
    externalId: string,
    provider: string
  ) => Effect.Effect<boolean, PersistenceError>;

  /**
   * Update email entity links (contact/lead/case)
   */
  readonly updateLinks: (
    emailId: EmailId,
    links: {
      contactId?: string | null;
      leadId?: string | null;
      caseId?: string | null;
    }
  ) => Effect.Effect<Email, NotFoundError | PersistenceError>;

  /**
   * Mark email as read
   */
  readonly markAsRead: (emailId: EmailId) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Email Repository tag for dependency injection
 */
export const EmailRepository = Context.GenericTag<EmailRepositoryService>('@dykstra/EmailRepository');

// Import errors from a common location to avoid duplication
import { NotFoundError, PersistenceError } from './case-repository';
