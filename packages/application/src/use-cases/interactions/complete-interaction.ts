import { Effect } from 'effect';
import { type Interaction, type InteractionId, ValidationError, type NotFoundError } from '@dykstra/domain';
import { InteractionRepository, type InteractionRepositoryService, type PersistenceError } from '../../ports/interaction-repository';
import { InteractionManagementPolicyRepository, type InteractionManagementPolicyRepositoryService } from '../../ports/interaction-management-policy-repository';

/**
 * Complete Interaction
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: InteractionManagementPolicy
 * Persisted In: InteractionManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 18+ tests
 * Last Updated: Phase 1.7
 */

export interface CompleteInteractionCommand {
  readonly id: string;
  readonly funeralHomeId: string;
  readonly outcome: string;
  readonly duration?: number | null;
}

/**
 * Complete an interaction with outcome and duration tracking
 * Uses policy to enforce outcome length and duration limits
 * Prevents re-completion of already-completed interactions
 */
export const completeInteraction = (
  command: CompleteInteractionCommand
): Effect.Effect<
  Interaction,
  ValidationError | PersistenceError | NotFoundError,
  InteractionRepositoryService | InteractionManagementPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const interactionRepo = yield* InteractionRepository;
    const policyRepo = yield* InteractionManagementPolicyRepository;

    // Load policy for this funeral home
    const policy = yield* policyRepo.findByFuneralHome(command.funeralHomeId);

    // Load existing interaction
    const interaction = yield* interactionRepo.findById(command.id as InteractionId);

    // Validate policy is active
    if (!policy.isCurrent) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Policy is not active',
          field: 'policy',
        })
      );
    }

    // Validate outcome length against policy
    if (command.outcome.length > policy.maxOutcomeLength) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Outcome exceeds maximum length of ${policy.maxOutcomeLength} characters`,
          field: 'outcome',
        })
      );
    }

    // Validate duration against policy if provided
    if (command.duration !== undefined && command.duration !== null) {
      if (policy.maxDurationMinutes !== null && command.duration > policy.maxDurationMinutes) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Duration exceeds maximum of ${policy.maxDurationMinutes} minutes`,
            field: 'duration',
          })
        );
      }
    }

    // Complete the interaction (domain method enforces additional rules)
    const completedInteraction = yield* interaction.complete(command.outcome, command.duration || undefined);

    // Save completed interaction
    yield* interactionRepo.update(completedInteraction);

    return completedInteraction;
  });
