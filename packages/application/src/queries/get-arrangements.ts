import { Effect } from 'effect';
import { Arrangements, NotFoundError, type CaseId } from '@dykstra/domain';
import { CaseRepository, PersistenceError } from '../ports/case-repository';

/**
 * Get Arrangements query
 */
export interface GetArrangementsQuery {
  readonly caseId: CaseId;
  readonly requestingUserId: string;
}

/**
 * Arrangements result with computed metadata
 */
export interface ArrangementsResult {
  readonly arrangements: Arrangements;
  readonly completionPercentage: number;
  readonly isComplete: boolean;
  readonly totalProductCost: number;
  readonly selectedProductCount: number;
}

/**
 * Get Arrangements query handler
 * Retrieves arrangements for a case with computed metadata
 */
export const getArrangements = (
  query: GetArrangementsQuery
): Effect.Effect<
  ArrangementsResult,
  NotFoundError | PersistenceError,
  CaseRepository
> =>
  Effect.gen(function* (_) {
    const caseRepo = yield* _(CaseRepository);
    
    // Fetch case
    const case_ = yield* _(caseRepo.findById(query.caseId));
    
    // TODO: Check authorization - verify requesting user has access to this case
    // This would check against CaseMember table
    // For now, we'll skip this check
    
    // Get arrangements or return empty
    const arrangements = case_.arrangements ?? Arrangements.empty();
    
    return {
      arrangements,
      completionPercentage: arrangements.completionPercentage,
      isComplete: arrangements.isComplete,
      totalProductCost: arrangements.totalProductCost,
      selectedProductCount: arrangements.selectedProducts.length,
    };
  });
