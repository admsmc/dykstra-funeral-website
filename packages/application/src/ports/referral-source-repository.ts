import { Effect, Context } from 'effect';
import { ReferralSource, type ReferralSourceId, NotFoundError } from '@dykstra/domain';
import { PersistenceError } from './case-repository';

// Re-export for convenience
export { NotFoundError, PersistenceError };

/**
 * Referral Source Repository port
 * Defines interface for referral source persistence with SCD Type 2 temporal support
 */
export interface ReferralSourceRepositoryService {
  /**
   * Find current version of referral source by ID or business key
   */
  readonly findById: (id: ReferralSourceId) => Effect.Effect<ReferralSource, NotFoundError | PersistenceError>;
  
  /**
   * Find current version of referral source by business key
   */
  readonly findByBusinessKey: (
    businessKey: string
  ) => Effect.Effect<ReferralSource | null, PersistenceError>;
  
  /**
   * Find complete version history of a referral source
   */
  readonly findHistory: (
    businessKey: string
  ) => Effect.Effect<readonly ReferralSource[], NotFoundError | PersistenceError>;
  
  /**
   * Find current versions of referral sources by funeral home
   */
  readonly findByFuneralHome: (
    funeralHomeId: string,
    activeOnly?: boolean
  ) => Effect.Effect<readonly ReferralSource[], PersistenceError>;
  
  /**
   * Find high-performing referral sources (>50% conversion, 10+ referrals)
   */
  readonly findHighPerformers: (
    funeralHomeId: string
  ) => Effect.Effect<readonly ReferralSource[], PersistenceError>;
  
  /**
   * Find underperforming referral sources (<20% conversion, 20+ referrals)
   */
  readonly findUnderPerformers: (
    funeralHomeId: string
  ) => Effect.Effect<readonly ReferralSource[], PersistenceError>;
  
  /**
   * Find referral sources by type
   */
  readonly findByType: (
    funeralHomeId: string,
    type: string
  ) => Effect.Effect<readonly ReferralSource[], PersistenceError>;
  
  /**
   * Save referral source - creates new version (SCD2)
   */
  readonly save: (referralSource: ReferralSource) => Effect.Effect<void, PersistenceError>;
  
  /**
   * Update referral source - convenience method that wraps save for SCD2 updates
   */
  readonly update: (referralSource: ReferralSource) => Effect.Effect<ReferralSource, PersistenceError>;
  
  /**
   * Delete referral source (soft delete by closing current version)
   */
  readonly delete: (businessKey: string) => Effect.Effect<void, NotFoundError | PersistenceError>;
}

/**
 * Referral Source Repository service tag for dependency injection
 */
export const ReferralSourceRepository = Context.GenericTag<ReferralSourceRepositoryService>('@dykstra/ReferralSourceRepository');
