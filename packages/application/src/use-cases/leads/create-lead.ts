import { Effect } from 'effect';
import { Lead, ValidationError } from '@dykstra/domain';
import { LeadRepository, type LeadRepositoryService, PersistenceError } from '../../ports/lead-repository';

export interface CreateLeadCommand {
  readonly id: string;
  readonly funeralHomeId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly source: 'website' | 'phone' | 'email' | 'referral' | 'social_media' | 'event' | 'direct_mail' | 'other';
  readonly type: 'at_need' | 'pre_need' | 'general_inquiry';
  readonly createdBy: string;
}

/**
 * Create a new lead
 * Validates domain rules and publishes LeadCreated event
 */
export const createLead = (
  command: CreateLeadCommand
): Effect.Effect<
  Lead,
  ValidationError | PersistenceError,
  LeadRepositoryService
> =>
  Effect.gen(function* () {
    const leadRepo = yield* LeadRepository;
    
    const businessKey = command.id;
    
    // Create lead entity (validates business rules)
    const lead = yield* Lead.create({
      id: command.id,
      businessKey,
      funeralHomeId: command.funeralHomeId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phone: command.phone,
      source: command.source,
      type: command.type,
      createdBy: command.createdBy,
    });
    
    // Save to repository (SCD2)
    yield* leadRepo.save(lead);
    
    // TODO: Publish domain event when LeadCreated event type is defined
    // yield* eventPublisher.publish({ ... });
    
    return lead;
  });
