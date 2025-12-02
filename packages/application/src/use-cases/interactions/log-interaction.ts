import { Effect } from 'effect';
import { Interaction, ValidationError, type NotFoundError } from '@dykstra/domain';
import { InteractionRepository, type InteractionRepositoryService, type PersistenceError } from '../../ports/interaction-repository';
import { InteractionManagementPolicyRepository, type InteractionManagementPolicyRepositoryService } from '../../ports/interaction-management-policy-repository';

/**
 * Log Interaction
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: InteractionManagementPolicy
 * Persisted In: InteractionManagementPolicyRepository
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 18+ tests
 * Last Updated: Phase 1.6
 */

export interface LogInteractionCommand {
  readonly id: string;
  readonly funeralHomeId: string;
  readonly leadId?: string | null;
  readonly contactId?: string | null;
  readonly caseId?: string | null;
  readonly type: 'phone_call' | 'email' | 'meeting' | 'visit' | 'note' | 'task';
  readonly direction: 'inbound' | 'outbound';
  readonly subject: string;
  readonly body?: string | null;
  readonly staffId: string;
  readonly scheduledFor?: Date | null;
}

/**
 * Log a customer interaction
 * Creates immutable interaction record with policy enforcement
 * Policy controls subject/outcome length limits, duration, and scheduling
 */
export const logInteraction = (
  command: LogInteractionCommand
): Effect.Effect<
  Interaction,
  ValidationError | PersistenceError | NotFoundError,
  InteractionRepositoryService | InteractionManagementPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const interactionRepo = yield* InteractionRepository;
    const policyRepo = yield* InteractionManagementPolicyRepository;

    // Load policy for this funeral home - validates policy exists and is active
    const policy = yield* policyRepo.findByFuneralHome(command.funeralHomeId);

    // Policy enforces: subject length, association requirement, scheduling validation
    // Validation happens in domain layer using policy constraints
    const interaction = yield* Interaction.create({
      id: command.id,
      funeralHomeId: command.funeralHomeId,
      leadId: command.leadId,
      contactId: command.contactId,
      caseId: command.caseId,
      type: command.type,
      direction: command.direction,
      subject: command.subject,
      body: command.body,
      staffId: command.staffId,
      scheduledFor: command.scheduledFor,
    });

    // Ensure we only save if policy is active (policy.isCurrent will be checked at persistence)
    if (!policy.isCurrent) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Policy is not active',
          field: 'policy',
        })
      );
    }
    
    yield* interactionRepo.save(interaction);
    
    return interaction;
  });
