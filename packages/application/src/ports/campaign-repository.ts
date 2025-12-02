import { type Effect, Context } from 'effect';
import { type Campaign, type CampaignId, type CampaignStatus, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Campaign Repository port
 * Defines interface for campaign persistence with SCD Type 2 temporal support
 */
export interface CampaignRepositoryService {
  /**
   * Find current version of campaign by ID or business key
   */
  readonly findById: (id: CampaignId) => Effect.Effect<Campaign, NotFoundError | PersistenceError>;
  
  /**
   * Find current version of campaign by business key
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<Campaign | null, PersistenceError>;
  
  /**
   * Find complete version history of a campaign
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly Campaign[], NotFoundError | PersistenceError>;
  
  /**
   * Find current versions of campaigns by funeral home with optional filters
   */
  readonly findByFuneralHome: (
    funeralHomeId: string,
    filters?: {
      status?: CampaignStatus;
      type?: string;
    }
  ) => Effect.Effect<readonly Campaign[], PersistenceError>;
  
  /**
   * Find campaigns scheduled to send in the near future
   */
  readonly findScheduledCampaigns: (
    beforeDate: Date
  ) => Effect.Effect<readonly Campaign[], PersistenceError>;
  
  /**
   * Find campaigns with best performance (high open/click/conversion rates)
   */
  readonly findTopPerforming: (
    funeralHomeId: string,
    limit: number
  ) => Effect.Effect<readonly Campaign[], PersistenceError>;
  
  /**
   * Save campaign - creates new version (SCD2)
   */
  readonly save: (campaign: Campaign) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Update campaign - convenience method that wraps save for SCD2 updates
   */
  readonly update: (campaign: Campaign) => Effect.Effect<Campaign, PersistenceError>;
  
  /**
   * Delete campaign (soft delete by closing current version)
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Campaign Repository service tag for dependency injection
 */
export const CampaignRepository = Context.GenericTag<CampaignRepositoryService>('@dykstra/CampaignRepository');
