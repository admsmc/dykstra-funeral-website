import { Effect } from 'effect';
import { CaseRepository, NotFoundError } from '../../ports/case-repository';
import { ValidationError } from '@dykstra/domain';

export type CaseStatus = 'INQUIRY' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface UpdateCaseStatusCommand {
  businessKey: string;
  newStatus: CaseStatus;
}

export interface UpdateCaseStatusResult {
  id: string;
  businessKey: string;
  version: number;
  status: string;
}

/**
 * Valid status transitions
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  INQUIRY: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [], // Cannot transition from archived
};

/**
 * Update case status with validation
 * Uses SCD2 pattern to create new version
 */
export const updateCaseStatus = (
  command: UpdateCaseStatusCommand
): Effect.Effect<
  UpdateCaseStatusResult,
  ValidationError | NotFoundError,
  CaseRepository
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;

    // Find current version
    const currentCase = yield* caseRepo.findByBusinessKey(command.businessKey);

    if (!currentCase) {
      return yield* Effect.fail(
        new NotFoundError({
          message: `Case not found: ${command.businessKey}`,
          entityType: 'Case',
          entityId: command.businessKey
        })
      );
    }

    // Validate status transition
    const allowedNextStatuses = VALID_TRANSITIONS[currentCase.status] || [];
    if (!allowedNextStatuses.includes(command.newStatus)) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Cannot transition from ${currentCase.status} to ${command.newStatus}`,
          field: 'status'
        })
      );
    }

    // Create new version with updated status
    const updatedCase = {
      ...currentCase,
      status: command.newStatus,
    };

    const newCase = yield* caseRepo.update(updatedCase);

    return {
      id: newCase.id,
      businessKey: newCase.businessKey,
      version: newCase.version,
      status: newCase.status,
    };
  });
