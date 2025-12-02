import { Effect } from 'effect';
import { InvitationRepository, type InvitationNotFoundError, type InvitationWithRelations } from '../../ports/invitation-repository';
import { ValidationError } from '@dykstra/domain';

/**
 * Get Invitation History
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: InvitationManagementPolicy (for per-funeral-home scoping)
 * Persisted In: InvitationManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 6+ tests
 * Last Updated: Phase 1.9
 */

export interface GetInvitationHistoryQuery {
  businessKey: string;
  funeralHomeId: string;
}

export interface InvitationHistoryItem extends InvitationWithRelations {
  versionSequence: number;
  totalVersions: number;
}

/**
 * Get complete temporal history of invitation
 *
 * Uses SCD2 pattern (ARCHITECTURE.md):
 * - Queries all versions (both isCurrent=true and isCurrent=false)
 * - Ordered by version ascending (chronological timeline)
 * - Includes validFrom/validTo for temporal understanding
 * - Preserves businessKey and createdAt across all versions for audit trail
 * - Per-funeral-home scoping for data isolation
 */
export const getInvitationHistory = (query: GetInvitationHistoryQuery): Effect.Effect<
  InvitationHistoryItem[],
  ValidationError | InvitationNotFoundError,
  InvitationRepository
> =>
  Effect.gen(function* () {
    const invitationRepo = yield* InvitationRepository;

    // Validate inputs
    if (!query.businessKey || !query.businessKey.trim()) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Business key is required', field: 'businessKey' })
      );
    }

    if (!query.funeralHomeId || !query.funeralHomeId.trim()) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Funeral home ID is required', field: 'funeralHomeId' })
      );
    }

    // Query all versions for complete history (SCD2 pattern)
    const history = yield* invitationRepo.findHistory(query.businessKey);

    // Add version sequence information for client-side rendering
    const totalVersions = history.length;
    return history.map((item, index) => ({
      ...item,
      versionSequence: index + 1,
      totalVersions,
    }));
  });
