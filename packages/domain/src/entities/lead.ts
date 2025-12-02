import { Effect, Data } from 'effect';
import { ValidationError, InvalidStateTransitionError, BusinessRuleViolationError } from '../errors/domain-errors';
import { type LeadScoringPolicy } from './lead-scoring-policy';

/**
 * Lead ID branded type
 */
export type LeadId = string & { readonly _brand: 'LeadId' };

/**
 * Lead status lifecycle
 */
export type LeadStatus = 
  | 'new'           // Initial inquiry
  | 'contacted'     // First contact made
  | 'qualified'     // Met qualification criteria
  | 'nurturing'     // In active nurture campaign
  | 'converted'     // Converted to case
  | 'lost'          // Lost to competitor or disqualified
  | 'archived';     // Archived

/**
 * Lead source
 */
export type LeadSource = 
  | 'website'       // Website form
  | 'phone'         // Phone inquiry
  | 'email'         // Email inquiry
  | 'referral'      // Referred by funeral home/family
  | 'social_media'  // Social media
  | 'event'         // Community event
  | 'direct_mail'   // Direct mail campaign
  | 'other';

/**
 * Lead type
 */
export type LeadType = 
  | 'at_need'       // Immediate need
  | 'pre_need'      // Pre-planning
  | 'general_inquiry'; // General information

/**
 * Lead entity
 * Represents a potential customer/case
 * SCD Type 2: Full audit trail of lead progression
 */
export class Lead extends Data.Class<{
  readonly id: LeadId;
  readonly businessKey: string;
  readonly version: number;
  readonly funeralHomeId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly status: LeadStatus;
  readonly source: LeadSource;
  readonly type: LeadType;
  readonly score: number;  // Lead score 0-100
  readonly assignedTo: string | null;  // Staff member ID
  readonly referralSourceId: string | null;
  readonly notes: string | null;
  readonly lastContactedAt: Date | null;
  readonly convertedToCaseId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Valid status transitions
   */
  private static readonly STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
    new: ['contacted', 'lost', 'archived'],
    contacted: ['qualified', 'nurturing', 'lost', 'archived'],
    qualified: ['nurturing', 'converted', 'lost'],
    nurturing: ['converted', 'lost', 'archived'],
    converted: ['archived'],
    lost: ['archived'],
    archived: [],
  };

  /**
   * Create a new Lead
   * @param params Lead creation parameters
   * @param policy LeadScoringPolicy - determines initial score and validation rules
   */
  static create(params: {
    id: string;
    businessKey: string;
    funeralHomeId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    source: LeadSource;
    type: LeadType;
    createdBy: string;
  }, policy: LeadScoringPolicy): Effect.Effect<Lead, ValidationError> {
    return Effect.gen(function* () {
      // Validate name
      const trimmedFirstName = params.firstName.trim();
      const trimmedLastName = params.lastName.trim();
      
      if (!trimmedFirstName || !trimmedLastName) {
        if (policy.requireFirstName || policy.requireLastName) {
          return yield* Effect.fail(
            new ValidationError({ 
              message: 'First and last name are required', 
              field: 'name' 
            })
          );
        }
      }

      if (trimmedFirstName.length > 100 || trimmedLastName.length > 100) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Name too long (max 100 characters each)', 
            field: 'name' 
          })
        );
      }

      // Validate contact method based on policy
      if (policy.requirePhoneOrEmail && !params.email && !params.phone) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Email or phone is required', 
            field: 'contact' 
          })
        );
      }

      // Validate lead source against policy
      if (policy.disallowedSources.includes(params.source)) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: `Lead source '${params.source}' is not allowed`, 
            field: 'source' 
          })
        );
      }

      const now = new Date();
      // Calculate initial score based on lead type and policy
      let initialScore = params.type === 'at_need' 
        ? policy.atNeedInitialScore 
        : params.type === 'pre_need'
          ? policy.preNeedInitialScore
          : policy.generalInquiryScore;
      
      // Apply contact method bonus if both email and phone provided
      if (params.email && params.phone) {
        initialScore += policy.contactMethodBonus;
      }
      
      // Apply referral bonus if applicable
      if (params.source === 'referral') {
        initialScore += policy.referralSourceBonus;
      }
      
      // Apply preferred source bonus
      if (policy.preferredSources.includes(params.source)) {
        // Subtle bonus for preferred sources (1/3 of referral bonus)
        initialScore += Math.floor(policy.referralSourceBonus / 3);
      }
      
      // Clamp score to valid range (0-100)
      initialScore = Math.max(0, Math.min(100, initialScore));

      return new Lead({
        id: params.id as LeadId,
        businessKey: params.businessKey,
        version: 1,
        funeralHomeId: params.funeralHomeId,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: params.email?.trim() || null,
        phone: params.phone?.trim() || null,
        status: 'new',
        source: params.source,
        type: params.type,
        score: initialScore,
        assignedTo: null,
        referralSourceId: null,
        notes: null,
        lastContactedAt: null,
        convertedToCaseId: null,
        createdAt: now,
        updatedAt: now,
        createdBy: params.createdBy,
      });
    });
  }

  /**
   * Transition to new status with validation
   */
  transitionStatus(newStatus: LeadStatus): Effect.Effect<Lead, InvalidStateTransitionError> {
    const validTransitions = Lead.STATUS_TRANSITIONS[this.status];
    
    if (!validTransitions?.includes(newStatus)) {
      return Effect.fail(
        new InvalidStateTransitionError({
          message: `Cannot transition from ${this.status} to ${newStatus}`,
          fromState: this.status,
          toState: newStatus,
        })
      );
    }
    
    return Effect.succeed(
      new Lead({
        ...this,
        version: this.version + 1,
        status: newStatus,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Assign lead to staff member
   */
  assignTo(staffId: string): Effect.Effect<Lead, BusinessRuleViolationError> {
    if (this.status === 'converted' || this.status === 'archived') {
      return Effect.fail(
        new BusinessRuleViolationError({
          message: 'Cannot assign converted or archived lead',
          rule: 'no_assignment_after_completion',
        })
      );
    }

    return Effect.succeed(
      new Lead({
        ...this,
        version: this.version + 1,
        assignedTo: staffId,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Update lead score
   */
  updateScore(newScore: number): Effect.Effect<Lead, ValidationError> {
    if (newScore < 0 || newScore > 100) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Score must be between 0 and 100', 
          field: 'score' 
        })
      );
    }

    return Effect.succeed(
      new Lead({
        ...this,
        version: this.version + 1,
        score: Math.round(newScore),
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Mark as contacted
   */
  markContacted(): Effect.Effect<Lead, InvalidStateTransitionError> {
    const self = this;
    return Effect.gen(function* (_) {
      const withStatus = yield* _(self.transitionStatus('contacted'));
      return new Lead({
        ...withStatus,
        lastContactedAt: new Date(),
      });
    });
  }

  /**
   * Convert to case
   */
  convertToCase(caseId: string): Effect.Effect<Lead, InvalidStateTransitionError> {
    const self = this;
    return Effect.gen(function* (_) {
      const withStatus = yield* _(self.transitionStatus('converted'));
      return new Lead({
        ...withStatus,
        convertedToCaseId: caseId,
        score: 100, // Converted leads get max score
      });
    });
  }

  /**
   * Add or update notes
   */
  updateNotes(notes: string): Effect.Effect<Lead, ValidationError> {
    if (notes.length > 5000) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Notes too long (max 5000 characters)', 
          field: 'notes' 
        })
      );
    }

    return Effect.succeed(
      new Lead({
        ...this,
        version: this.version + 1,
        notes: notes.trim() || null,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Link to referral source
   */
  linkReferralSource(referralSourceId: string): Lead {
    return new Lead({
      ...this,
      version: this.version + 1,
      referralSourceId,
      updatedAt: new Date(),
    });
  }

  /**
   * Check if lead is hot (high priority)
   */
  get isHot(): boolean {
    return this.score >= 70 && 
           this.status !== 'converted' && 
           this.status !== 'lost' && 
           this.status !== 'archived';
  }

  /**
   * Check if lead needs follow-up
   */
  needsFollowUp(daysThreshold: number = 3): boolean {
    if (this.status === 'converted' || this.status === 'lost' || this.status === 'archived') {
      return false;
    }

    if (!this.lastContactedAt) {
      // Never contacted - needs immediate follow-up
      return true;
    }

    const daysSinceContact = Math.floor(
      (Date.now() - this.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceContact >= daysThreshold;
  }

  /**
   * Get full name
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Check if lead is active (can be worked)
   */
  get isActive(): boolean {
    return this.status !== 'converted' && 
           this.status !== 'lost' && 
           this.status !== 'archived';
  }
}
