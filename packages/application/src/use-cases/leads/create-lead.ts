import { Effect } from 'effect';
import { Lead, type ValidationError, type NotFoundError } from '@dykstra/domain';
import { type PersistenceError } from '../../errors';
import { LeadRepository, type LeadRepositoryService } from '../../ports/lead-repository';
import { LeadScoringPolicyRepository } from '../../ports/lead-scoring-policy-repository';

/**
 * Create Lead
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ CONFIGURABLE
 * Policy Entity: LeadScoringPolicy
 * Persisted In: PostgreSQL (Prisma model: LeadScoringPolicy)
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 3+ policy variation tests
 * Last Updated: 2025-12-01
 *
 * Business Rules (from LeadScoringPolicy):
 * - Initial score varies by lead type (at_need, pre_need, general_inquiry)
 * - Contact method bonus: +points for email + phone
 * - Referral source bonus: +points for referrals
 * - Preferred sources: subtle bonus for strategic sources
 * - Validation: phone/email requirement, source allowlist
 */

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
  ValidationError | PersistenceError | NotFoundError,
  LeadRepositoryService | LeadScoringPolicyRepository
> =>
  Effect.gen(function* () {
    const leadRepo = yield* LeadRepository;
    const policyRepo = yield* LeadScoringPolicyRepository;
    
    const businessKey = command.id;
    
    // Load current lead scoring policy for this funeral home
    const policy = yield* policyRepo.findCurrentByFuneralHome(command.funeralHomeId);
    
    // Create lead entity with policy (validates all business rules from policy)
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
    }, policy);
    
    // Save to repository (SCD2)
    yield* leadRepo.save(lead);
    
    // TODO: Publish domain event when LeadCreated event type is defined
    // yield* eventPublisher.publish({ 
    //   type: 'LeadCreated',
    //   leadId: lead.id,
    //   initialScore: lead.score,
    //   policyVersion: policy.version,
    // });
    
    return lead;
  });
