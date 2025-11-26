import { Effect } from 'effect';
import { Case, CaseCreated, ValidationError } from '@dykstra/domain';
import type { CaseType } from '@dykstra/shared';
import { CaseRepository, PersistenceError } from '../ports/case-repository';
import { EventPublisher, EventPublishError } from '../ports/event-publisher';

/**
 * Create Case command
 */
export interface CreateCaseCommand {
  readonly id: string;
  readonly funeralHomeId: string;
  readonly decedentName: string;
  readonly type: CaseType;
  readonly createdBy: string;
}

/**
 * Create Case command handler
 * Creates a new funeral case with SCD Type 2 support
 */
export const createCase = (
  command: CreateCaseCommand
): Effect.Effect<
  Case,
  ValidationError | PersistenceError | EventPublishError,
  CaseRepository | EventPublisher
> =>
  Effect.gen(function* (_) {
    // Get dependencies
    const caseRepo = yield* _(CaseRepository);
    const eventPublisher = yield* _(EventPublisher);
    
    // For SCD2, businessKey is the same as the initial ID
    // In production, consider using a more sophisticated key generator
    const businessKey = command.id;
    
    // Create case entity
    const case_ = yield* _(
      Case.create({
        id: command.id,
        businessKey,
        funeralHomeId: command.funeralHomeId,
        decedentName: command.decedentName,
        type: command.type,
        createdBy: command.createdBy,
      })
    );
    
    // Persist case
    yield* _(caseRepo.save(case_));
    
    // Publish domain event
    yield* _(
      eventPublisher.publish(
        new CaseCreated({
          occurredAt: new Date(),
          aggregateId: case_.id,
          funeralHomeId: case_.funeralHomeId,
          decedentName: case_.decedentName,
          caseType: case_.type,
          createdBy: case_.createdBy,
        })
      )
    );
    
    return case_;
  });
