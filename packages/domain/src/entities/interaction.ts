import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';

/**
 * Interaction ID branded type
 */
export type InteractionId = string & { readonly _brand: 'InteractionId' };

/**
 * Interaction type
 */
export type InteractionType = 
  | 'phone_call'   // Phone conversation
  | 'email'        // Email sent/received
  | 'meeting'      // In-person meeting
  | 'visit'        // Facility visit
  | 'note'         // General note
  | 'task';        // Task/reminder

/**
 * Interaction direction
 */
export type InteractionDirection = 
  | 'inbound'  // From customer to us
  | 'outbound'; // From us to customer

/**
 * Interaction entity
 * Represents a touchpoint with a lead or contact
 * Immutable after creation (no SCD2 - interactions don't change once logged)
 */
export class Interaction extends Data.Class<{
  readonly id: InteractionId;
  readonly funeralHomeId: string;
  readonly leadId: string | null;
  readonly contactId: string | null;
  readonly caseId: string | null;
  readonly type: InteractionType;
  readonly direction: InteractionDirection;
  readonly subject: string;
  readonly body: string | null;
  readonly outcome: string | null;
  readonly scheduledFor: Date | null;  // For future follow-ups
  readonly completedAt: Date | null;
  readonly duration: number | null;     // Duration in minutes
  readonly staffId: string;             // Staff member who logged it
  readonly createdAt: Date;
}> {
  /**
   * Create a new Interaction
   */
  static create(params: {
    id: string;
    funeralHomeId: string;
    leadId?: string | null;
    contactId?: string | null;
    caseId?: string | null;
    type: InteractionType;
    direction: InteractionDirection;
    subject: string;
    body?: string | null;
    staffId: string;
    scheduledFor?: Date | null;
  }): Effect.Effect<Interaction, ValidationError> {
    return Effect.gen(function* () {
      const trimmedSubject = params.subject.trim();
      
      if (!trimmedSubject) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Subject is required', 
            field: 'subject' 
          })
        );
      }

      if (trimmedSubject.length > 200) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Subject too long (max 200 characters)', 
            field: 'subject' 
          })
        );
      }

      // Must be associated with at least one entity
      if (!params.leadId && !params.contactId && !params.caseId) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Interaction must be associated with a lead, contact, or case' 
          })
        );
      }

      // If scheduled, must be in the future
      if (params.scheduledFor && params.scheduledFor <= new Date()) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Scheduled time must be in the future', 
            field: 'scheduledFor' 
          })
        );
      }

      return new Interaction({
        id: params.id as InteractionId,
        funeralHomeId: params.funeralHomeId,
        leadId: params.leadId || null,
        contactId: params.contactId || null,
        caseId: params.caseId || null,
        type: params.type,
        direction: params.direction,
        subject: trimmedSubject,
        body: params.body?.trim() || null,
        outcome: null,
        scheduledFor: params.scheduledFor || null,
        completedAt: null,
        duration: null,
        staffId: params.staffId,
        createdAt: new Date(),
      });
    });
  }

  /**
   * Mark interaction as completed
   * Note: Since Interaction is immutable, this returns a new instance
   */
  complete(outcome: string, duration?: number): Effect.Effect<Interaction, ValidationError> {
    if (this.completedAt) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Interaction already completed' 
        })
      );
    }

    if (outcome.length > 1000) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Outcome too long (max 1000 characters)', 
          field: 'outcome' 
        })
      );
    }

    if (duration !== undefined && (duration < 0 || duration > 10080)) { // Max 1 week in minutes
      return Effect.fail(
        new ValidationError({ 
          message: 'Duration must be between 0 and 10080 minutes (1 week)', 
          field: 'duration' 
        })
      );
    }

    return Effect.succeed(
      new Interaction({
        ...this,
        outcome: outcome.trim(),
        duration: duration !== undefined ? Math.round(duration) : null,
        completedAt: new Date(),
      })
    );
  }

  /**
   * Check if interaction is scheduled for the future
   */
  get isScheduled(): boolean {
    return !!this.scheduledFor && this.scheduledFor > new Date();
  }

  /**
   * Check if interaction is completed
   */
  get isCompleted(): boolean {
    return !!this.completedAt;
  }

  /**
   * Check if interaction is overdue (scheduled but not completed)
   */
  get isOverdue(): boolean {
    if (!this.scheduledFor || this.completedAt) {
      return false;
    }
    return this.scheduledFor < new Date();
  }

  /**
   * Check if this is a follow-up task
   */
  get isFollowUp(): boolean {
    return this.type === 'task' && !!this.scheduledFor;
  }

  /**
   * Get days until scheduled (negative if overdue)
   */
  get daysUntilScheduled(): number | null {
    if (!this.scheduledFor) {
      return null;
    }
    const now = new Date();
    const diffMs = this.scheduledFor.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}
