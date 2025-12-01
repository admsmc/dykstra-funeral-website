import { Effect } from 'effect';
import { CaseRepository, NotFoundError, PersistenceError } from '../../ports/case-repository';
import type { CaseStatus } from '@dykstra/shared';
import { InvalidStateTransitionError } from '@dykstra/domain';

/**
 * Update Case Status
 *
 * Policy Type: N/A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

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
 * Update case status with validation
 * Uses SCD2 pattern to create new version
 */
export const updateCaseStatus = (
  command: UpdateCaseStatusCommand
): Effect.Effect<
  UpdateCaseStatusResult,
  InvalidStateTransitionError | NotFoundError | PersistenceError,
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

    // Use Case domain entity's transitionStatus method for validation
    const updatedCase = yield* currentCase.transitionStatus(command.newStatus);

    // Save the new version (SCD2 pattern)
    const newCase = yield* caseRepo.update(updatedCase);

    return {
      id: newCase.id,
      businessKey: newCase.businessKey,
      version: newCase.version,
      status: newCase.status,
    };
  });
