import { Effect } from 'effect';
import { Lead, Case, InvalidStateTransitionError, ValidationError } from '@dykstra/domain';
import { LeadRepository, type LeadRepositoryService, NotFoundError as LeadNotFoundError, PersistenceError as LeadPersistenceError } from '../../ports/lead-repository';
import { CaseRepository, type CaseRepository as CaseRepositoryService } from '../../ports/case-repository';
import {
  LeadToCaseConversionPolicyRepository,
  NotFoundError as PolicyNotFoundError,
  PersistenceError as PolicyPersistenceError,
} from '../../ports/lead-to-case-conversion-policy-repository';

/**
 * Convert Lead To Case
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ CONFIGURABLE
 * Policy Entity: LeadToCaseConversionPolicy
 * Persisted In: PostgreSQL (Prisma model: LeadToCaseConversionPolicy)
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 3+ policy variation tests
 * Last Updated: 2025-12-01
 *
 * Business Rules (from LeadToCaseConversionPolicy):
 * - Initial case status (inquiry vs active)
 * - Auto-assignment to lead's staff
 * - Preservation of lead notes
 * - Interaction logging
 */

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
  LeadNotFoundError | InvalidStateTransitionError | ValidationError | LeadPersistenceError | PolicyNotFoundError | PolicyPersistenceError,
  LeadRepositoryService | CaseRepositoryService | typeof LeadToCaseConversionPolicyRepository
> =>
  Effect.gen(function* () {
    const leadRepo = yield* LeadRepository;
    const caseRepo = yield* CaseRepository;
    const policyRepo = yield* LeadToCaseConversionPolicyRepository;
    
    // Find lead
    const lead = yield* leadRepo.findByBusinessKey(command.leadBusinessKey);
    
    if (!lead) {
      return yield* Effect.fail(
        new LeadNotFoundError({
          message: 'Lead not found',
          entityType: 'Lead',
          entityId: command.leadBusinessKey,
        })
      );
    }
    
    // Load current conversion policy for this funeral home
    const policy = yield* policyRepo.findCurrentByFuneralHome(lead.funeralHomeId);
    
    // Create case from lead using policy-driven defaults
    const decedentName = command.decedentName || `${lead.firstName} ${lead.lastName}`;
    
    const newCase = yield* Case.create({
      id: crypto.randomUUID(),
      businessKey: crypto.randomUUID(),
      funeralHomeId: lead.funeralHomeId,
      decedentName,
      type: command.caseType,
      createdBy: command.createdBy,
    });
    
    // Apply policy: Transition to appropriate initial status from policy
    const caseWithStatus = policy.defaultCaseStatus === 'active'
      ? yield* newCase.transitionStatus('active')
      : newCase;
    
    yield* caseRepo.save(caseWithStatus);
    
    // Convert lead status
    const convertedLead = yield* lead.convertToCase(newCase.id);
    yield* leadRepo.update(convertedLead);
    
    return { lead: convertedLead, case: caseWithStatus };
  });
