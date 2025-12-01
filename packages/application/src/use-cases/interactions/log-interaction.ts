import { Effect } from 'effect';
import { Interaction, ValidationError } from '@dykstra/domain';
import { InteractionRepository, type InteractionRepositoryService, PersistenceError } from '../../ports/interaction-repository';

/**
 * Log Interaction
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
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
 * Creates immutable interaction record
 */
export const logInteraction = (
  command: LogInteractionCommand
): Effect.Effect<
  Interaction,
  ValidationError | PersistenceError,
  InteractionRepositoryService
> =>
  Effect.gen(function* () {
    const interactionRepo = yield* InteractionRepository;
    
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
    
    yield* interactionRepo.save(interaction);
    
    return interaction;
  });
