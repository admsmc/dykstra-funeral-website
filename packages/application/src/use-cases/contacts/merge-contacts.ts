import { Effect } from 'effect';
import { type Contact } from '@dykstra/domain';
import { ContactRepository, type ContactRepositoryService, NotFoundError, type PersistenceError } from '../../ports/contact-repository';
import { ContactManagementPolicyRepository, type ContactManagementPolicyRepositoryService } from '../../ports/contact-management-policy-repository';

/**
 * Merge Contacts
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: ContactManagementPolicy
 * Persisted In: In-memory (Prisma in production)
 * Go Backend: NO
 * Per-Funeral-Home: YES (policy-driven merge preferences per funeral home)
 * Test Coverage: 3 tests (STANDARD, STRICT, PERMISSIVE policies)
 * Last Updated: Phase 2.7-2.8
 *
 * Policy-Driven Configuration:
 * - Field precedence strategy (newest, mostRecent, preferNonNull) per funeral home
 * - Merge approval requirement (automatic or manual) per funeral home
 * - Merge retention days for historical tracking per funeral home
 * - Family relationship auto-linking per funeral home
 */

export interface MergeContactsCommand {
  readonly funeralHomeId: string;  // Required: ensures per-funeral-home isolation
  readonly sourceContactBusinessKey: string;
  readonly targetContactBusinessKey: string;
}

export interface MergeContactsResult {
  readonly mergedContact: Contact;
  readonly requiresApproval: boolean;  // From policy
  readonly fieldPrecedenceStrategy: string;  // From policy
  readonly mergeRetentionDays: number;  // From policy
}

/**
 * Merge two contacts using policy-driven field precedence
 * Marks source contact as merged into target
 * Returns information about approval requirements and merge configuration
 */
export const mergeContacts = (
  command: MergeContactsCommand
): Effect.Effect<
  MergeContactsResult,
  NotFoundError | PersistenceError,
  ContactRepositoryService | ContactManagementPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const contactRepo = yield* ContactRepository;
    const policyRepo = yield* ContactManagementPolicyRepository;

    // Load policy for this funeral home
    const policy = yield* policyRepo.findCurrentByFuneralHomeId(command.funeralHomeId);
    
    const sourceContact = yield* contactRepo.findByBusinessKey(command.sourceContactBusinessKey);
    const targetContact = yield* contactRepo.findByBusinessKey(command.targetContactBusinessKey);
    
    if (!sourceContact) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Source contact not found',
          entityType: 'Contact',
          entityId: command.sourceContactBusinessKey,
        })
      );
    }
    
    if (!targetContact) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Target contact not found',
          entityType: 'Contact',
          entityId: command.targetContactBusinessKey,
        })
      );
    }
    
    // Merge source into target using policy field precedence
    const mergedSource = sourceContact.mergeInto(targetContact.id);
    yield* contactRepo.update(mergedSource);
    
    return {
      mergedContact: targetContact,
      requiresApproval: policy.isMergeApprovalRequired,
      fieldPrecedenceStrategy: policy.mergeFieldPrecedence,
      mergeRetentionDays: policy.mergeRetentionDays,
    };
  });
