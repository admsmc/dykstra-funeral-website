/**
 * Approve PTO Request Use Case
 * Allows managers/directors to approve pending PTO requests
 * Requires backfill coverage confirmation before approval
 */

import { Effect } from 'effect';
import {
  approvePtoRequest as approvePtoRequestEntity,
  type PtoRequest,
  type PtoRequestId,
} from '@dykstra/domain';
import { PtoManagementPort } from '../../ports/pto-management-port';
import { BackfillManagementPort } from '../../ports/backfill-management-port';

/**
 * Input command for approving PTO
 */
/**
 * Approve Pto Request
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface ApprovePtoRequestCommand {
  readonly ptoRequestId: PtoRequestId;
  readonly approvedBy: string;
  readonly backfillVerified: boolean;
  readonly comments?: string;
}

/**
 * Result of approving PTO
 */
export interface ApprovePtoRequestResult {
  readonly success: boolean;
  readonly ptoRequest?: PtoRequest;
  readonly errors: string[];
}

/**
 * Approve PTO request workflow
 */
export const approvePtoRequest = (
  command: ApprovePtoRequestCommand
): Effect.Effect<ApprovePtoRequestResult, Error, typeof PtoManagementPort | typeof BackfillManagementPort> =>
  Effect.gen(function* () {
    const ptoRepo = yield* PtoManagementPort;
    const backfillRepo = yield* BackfillManagementPort;
    const errors: string[] = [];

    // Get PTO request
    const existingRequest = yield* ptoRepo.getPtoRequest(command.ptoRequestId);
    if (!existingRequest) {
      return {
        success: false,
        errors: ['PTO request not found'],
      };
    }

    // Verify request is pending
    if (existingRequest.status !== 'pending') {
      return {
        success: false,
        errors: [`Cannot approve PTO request in ${existingRequest.status} status`],
      };
    }

    // Check backfill coverage if required
    if (command.backfillVerified) {
      const coverage = yield* backfillRepo.getBackfillCoverageSummary(existingRequest.id as any);
      if (!coverage.coverageComplete) {
        errors.push(
          `Backfill coverage incomplete: ${coverage.pendingBackfills} pending, ${coverage.rejectedBackfills} rejected`
        );
      }
    }

    // If errors exist, return early
    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    // Approve request
    const approvedRequest = approvePtoRequestEntity(existingRequest, command.approvedBy);
    const savedRequest = yield* ptoRepo.updatePtoRequest(existingRequest.id, approvedRequest);

    return {
      success: true,
      ptoRequest: savedRequest,
      errors,
    };
  });
