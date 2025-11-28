import { Effect, Context } from 'effect';
import { Interaction, type InteractionId, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Interaction Repository port
 * Defines interface for interaction persistence
 * Note: Interactions are immutable after creation (no SCD2)
 */
export interface InteractionRepositoryService {
  /**
   * Find interaction by ID
   */
  readonly findById: (id: InteractionId) => Effect.Effect<Interaction, NotFoundError | PersistenceError>;
  
  /**
   * Find interactions by lead
   */
  readonly findByLead: (
    leadId: string
  ) => Effect.Effect<readonly Interaction[], PersistenceError>;
  
  /**
   * Find interactions by contact
   */
  readonly findByContact: (
    contactId: string
  ) => Effect.Effect<readonly Interaction[], PersistenceError>;
  
  /**
   * Find interactions by case
   */
  readonly findByCase: (
    caseId: string
  ) => Effect.Effect<readonly Interaction[], PersistenceError>;
  
  /**
   * Find interactions by staff member
   */
  readonly findByStaff: (
    staffId: string
  ) => Effect.Effect<readonly Interaction[], PersistenceError>;
  
  /**
   * Find scheduled interactions (future follow-ups)
   */
  readonly findScheduled: (
    funeralHomeId: string
  ) => Effect.Effect<readonly Interaction[], PersistenceError>;
  
  /**
   * Find overdue interactions (scheduled but not completed)
   */
  readonly findOverdue: (
    funeralHomeId: string
  ) => Effect.Effect<readonly Interaction[], PersistenceError>;
  
  /**
   * Find interactions by funeral home with optional filters
   */
  readonly findByFuneralHome: (
    funeralHomeId: string,
    filters?: {
      type?: string;
      staffId?: string;
      from?: Date;
      to?: Date;
    }
  ) => Effect.Effect<readonly Interaction[], PersistenceError>;
  
  /**
   * Save interaction (immutable - once saved, cannot be modified except completion)
   */
  readonly save: (interaction: Interaction) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Update interaction (only for completion - updates completedAt, outcome, duration)
   */
  readonly update: (interaction: Interaction) => Effect.Effect<Interaction, PersistenceError>;
  
  /**
   * Delete interaction (hard delete - should be rare)
   */
  readonly delete: (id: InteractionId) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Interaction Repository service tag for dependency injection
 */
export const InteractionRepository = Context.GenericTag<InteractionRepositoryService>('@dykstra/InteractionRepository');
