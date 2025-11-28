import { Effect } from 'effect';
import { Lead, Case, InvalidStateTransitionError, ValidationError } from '@dykstra/domain';
import { LeadRepository, type LeadRepositoryService, NotFoundError, PersistenceError } from '../../ports/lead-repository';
import { CaseRepository, type CaseRepository as CaseRepositoryService } from '../../ports/case-repository';

export interface ConvertLeadToCaseCommand {
  readonly leadBusinessKey: string;
  readonly decedentName?: string;  // If different from lead name
  readonly caseType: 'at_need' | 'pre_need';
  readonly createdBy: string;
}

/**
 * Convert lead to case
 * Creates new case and updates lead status to converted
 */
export const convertLeadToCase = (
  command: ConvertLeadToCaseCommand
): Effect.Effect<
  { lead: Lead; case: Case },
  NotFoundError | InvalidStateTransitionError | ValidationError | PersistenceError,
  LeadRepositoryService | CaseRepositoryService
> =>
  Effect.gen(function* () {
    const leadRepo = yield* LeadRepository;
    const caseRepo = yield* CaseRepository;
    
    const lead = yield* leadRepo.findByBusinessKey(command.leadBusinessKey);
    
    if (!lead) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Lead not found',
          entityType: 'Lead',
          entityId: command.leadBusinessKey,
        })
      );
    }
    
    // Create case from lead
    const decedentName = command.decedentName || `${lead.firstName} ${lead.lastName}`;
    
    const newCase = yield* Case.create({
      id: crypto.randomUUID(),
      businessKey: crypto.randomUUID(),
      funeralHomeId: lead.funeralHomeId,
      decedentName,
      type: command.caseType,
      createdBy: command.createdBy,
    });
    
    yield* caseRepo.save(newCase);
    
    // Convert lead status
    const convertedLead = yield* lead.convertToCase(newCase.id);
    yield* leadRepo.update(convertedLead);
    
    return { lead: convertedLead, case: newCase };
  });
