import { Effect, Context } from 'effect';
import { Lead, type LeadId, type LeadStatus, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Lead Repository port
 * Defines interface for lead persistence with SCD Type 2 temporal support
 */
export interface LeadRepositoryService {
  /**
   * Find current version of lead by ID or business key
   */
  readonly findById: (id: LeadId) => Effect.Effect<Lead, NotFoundError | PersistenceError>;
  
  /**
   * Find current version of lead by business key
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<Lead | null, PersistenceError>;
  
  /**
   * Find complete version history of a lead
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly Lead[], NotFoundError | PersistenceError>;
  
  /**
   * Find current versions of leads by funeral home with optional filters
   */
  readonly findByFuneralHome: (
    funeralHomeId: string,
    filters?: {
      status?: LeadStatus;
      assignedTo?: string;
      minScore?: number;
    }
  ) => Effect.Effect<readonly Lead[], PersistenceError>;
  
  /**
   * Find hot leads (score >= 70, active status)
   */
  readonly findHotLeads: (
    funeralHomeId: string
  ) => Effect.Effect<readonly Lead[], PersistenceError>;
  
  /**
   * Find leads needing follow-up (not contacted or last contact > threshold days ago)
   */
  readonly findNeedingFollowUp: (
    funeralHomeId: string,
    daysThreshold: number
  ) => Effect.Effect<readonly Lead[], PersistenceError>;
  
  /**
   * Find leads by referral source
   */
  readonly findByReferralSource: (
    referralSourceId: string
  ) => Effect.Effect<readonly Lead[], PersistenceError>;
  
  /**
   * Save lead - creates new version (SCD2)
   */
  readonly save: (lead: Lead) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Update lead - convenience method that wraps save for SCD2 updates
   */
  readonly update: (lead: Lead) => Effect.Effect<Lead, PersistenceError>;
  
  /**
   * Delete lead (soft delete by closing current version)
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Lead Repository service tag for dependency injection
 */
export const LeadRepository = Context.GenericTag<LeadRepositoryService>('@dykstra/LeadRepository');
