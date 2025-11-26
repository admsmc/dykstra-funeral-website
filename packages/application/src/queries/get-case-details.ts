import { Effect } from 'effect';
import { Case, type CaseId, NotFoundError, UnauthorizedError } from '@dykstra/domain';
import { CaseRepository, PersistenceError } from '../ports/case-repository';

/**
 * Get Case Details query
 */
export interface GetCaseDetailsQuery {
  readonly caseId: CaseId;
  readonly requestingUserId: string;
}

/**
 * Case details with additional computed data
 */
export interface CaseDetails {
  readonly case_: Case;
  readonly canModify: boolean;
  readonly isActive: boolean;
  readonly daysUntilService: number | null;
}

/**
 * Get Case Details query handler
 * Retrieves case with computed metadata
 */
export const getCaseDetails = (
  query: GetCaseDetailsQuery
): Effect.Effect<
  CaseDetails,
  NotFoundError | UnauthorizedError | PersistenceError,
  CaseRepository
> =>
  Effect.gen(function* (_) {
    const caseRepo = yield* _(CaseRepository);
    
    // Fetch case
    const case_ = yield* _(caseRepo.findById(query.caseId));
    
    // TODO: Check authorization - verify requesting user has access to this case
    // This would check against CaseMember table
    // For now, we'll skip this check
    
    // Compute additional data
    const daysUntilService = case_.serviceDate
      ? Math.ceil((case_.serviceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    
    return {
      case_,
      canModify: case_.canBeModified,
      isActive: case_.isActive,
      daysUntilService,
    };
  });
