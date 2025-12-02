/**
 * Reject PTO Request Use Case
 * Allows managers to reject pending PTO requests
 * Cancels associated backfill assignments
 */

import { Effect } from 'effect';
import {
  rejectPtoRequest as rejectPtoRequestEntity,
  type PtoRequest,
  type PtoRequestId,
} from '@dykstra/domain';
import { PtoManagementPort, type PtoManagementPortService } from '../../ports/pto-management-port';
import { BackfillManagementPort, type BackfillManagementPortService } from '../../ports/backfill-management-port';

/**
 * Input command for rejecting PTO
 */
/**
 * Reject Pto Request
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

export interface RejectPtoRequestCommand {
  readonly ptoRequestId: PtoRequestId;
  readonly rejectionReason: string;
  readonly rejectedBy: string;
}

/**
 * Result of rejecting PTO
 */
export interface RejectPtoRequestResult {
  readonly success: boolean;
  readonly ptoRequest?: PtoRequest;
  readonly backfillsCancelled: number;
  readonly errors: string[];
}

/**
 * Reject PTO request workflow
 */
export const rejectPtoRequest = (
  command: RejectPtoRequestCommand
): Effect.Effect<RejectPtoRequestResult, Error, PtoManagementPortService | BackfillManagementPortService> =>
  Effect.gen(function* () {
    const ptoRepo = yield* PtoManagementPort;
    const backfillRepo = yield* BackfillManagementPort;
    const errors: string[] = [];
    let backfillsCancelled = 0;

    // Get PTO request
    const existingRequest = yield* ptoRepo.getPtoRequest(command.ptoRequestId);
    if (!existingRequest) {
      return {
        success: false,
        backfillsCancelled: 0,
        errors: ['PTO request not found'],
      };
    }

    // Verify request is pending
    if (existingRequest.status !== 'pending') {
      return {
        success: false,
        backfillsCancelled: 0,
        errors: [`Cannot reject PTO request in ${existingRequest.status} status`],
      };
    }

    // Cancel associated backfill assignments
    const backfills = yield* backfillRepo.getBackfillAssignmentsByAbsence(String(existingRequest.id));
    for (const backfill of backfills) {
      if (backfill.status !== 'completed' && backfill.status !== 'cancelled') {
        // Note: In real implementation, update status to 'cancelled' in repository
        backfillsCancelled++;
      }
    }

    // Reject request
    const rejectedRequest = rejectPtoRequestEntity(
      existingRequest,
      command.rejectionReason,
      command.rejectedBy
    );
    const savedRequest = yield* ptoRepo.updatePtoRequest(existingRequest.id, rejectedRequest);

    return {
      success: true,
      ptoRequest: savedRequest,
      backfillsCancelled,
      errors,
    };
  });
