import { Effect } from 'effect';
import { type Case, Arrangements, type ValidationError, type BusinessRuleViolationError, type NotFoundError, type CaseId } from '@dykstra/domain';
import { CaseRepository, type PersistenceError } from '../ports/case-repository';
import { type EventPublisher, type EventPublishError } from '../ports/event-publisher';
import type { ServiceType } from '@dykstra/shared';
import type { Product, CeremonyDetails } from '@dykstra/domain';

/**
 * Save Arrangements command
 */
export interface SaveArrangementsCommand {
  readonly caseId: CaseId;
  readonly userId: string;
  readonly userName: string;
  readonly serviceType?: ServiceType;
  readonly products?: Product[];
  readonly ceremony?: Partial<CeremonyDetails>;
  readonly note?: string;
}

/**
 * Save Arrangements command handler
 * Updates case arrangements incrementally
 */
export const saveArrangements = (
  command: SaveArrangementsCommand
): Effect.Effect<
  Case,
  ValidationError | BusinessRuleViolationError | NotFoundError | PersistenceError | EventPublishError,
  CaseRepository | EventPublisher
> =>
  Effect.gen(function* (_) {
    // Get dependencies
    const caseRepo = yield* _(CaseRepository);
    // Note: Event publisher available but not used in this command
    // yield* _(EventPublisher);
    
    // Load current case
    const case_ = yield* _(caseRepo.findById(command.caseId));
    
    // Get current arrangements or create empty
    let arrangements = case_.arrangements ?? Arrangements.empty();
    
    // Apply updates based on command
    if (command.serviceType) {
      arrangements = yield* _(
        arrangements.withServiceType(command.serviceType, command.userId)
      );
    }
    
    if (command.products) {
      for (const product of command.products) {
        arrangements = yield* _(
          arrangements.withProduct(product, command.userId)
        );
      }
    }
    
    if (command.ceremony) {
      arrangements = yield* _(
        arrangements.withCeremonyDetails(command.ceremony, command.userId)
      );
    }
    
    if (command.note) {
      arrangements = yield* _(
        arrangements.withNote(
          {
            authorId: command.userId,
            authorName: command.userName,
            content: command.note,
          },
          command.userId
        )
      );
    }
    
    // Update case with new arrangements
    const updatedCase = yield* _(case_.updateArrangements(arrangements));
    
    // Persist
    yield* _(caseRepo.save(updatedCase));
    
    // Publish event (simple for now, could be more specific)
    // Note: We could create ArrangementsUpdatedEvent if needed
    yield* _(
      Effect.sync(() => {
        console.log(`Arrangements updated for case ${case_.id} by user ${command.userId}`);
      })
    );
    
    return updatedCase;
  });
