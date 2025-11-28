import { Effect, Data } from 'effect';
import { ValidationError, InvalidStateTransitionError } from '../errors/domain-errors';

/**
 * Campaign ID branded type
 */
export type CampaignId = string & { readonly _brand: 'CampaignId' };

/**
 * Campaign status
 */
export type CampaignStatus = 
  | 'draft'      // Being created
  | 'scheduled'  // Scheduled to send
  | 'sending'    // Currently sending
  | 'sent'       // Completed
  | 'paused'     // Paused mid-send
  | 'archived';  // Archived

/**
 * Campaign type
 */
export type CampaignType = 
  | 'email'       // Email campaign
  | 'sms'         // SMS campaign
  | 'direct_mail' // Direct mail
  | 'mixed';      // Multi-channel

/**
 * Campaign entity
 * Represents a marketing campaign
 * SCD Type 2: Track campaign changes and performance over time
 */
export class Campaign extends Data.Class<{
  readonly id: CampaignId;
  readonly businessKey: string;
  readonly version: number;
  readonly funeralHomeId: string;
  readonly name: string;
  readonly description: string | null;
  readonly type: CampaignType;
  readonly status: CampaignStatus;
  readonly subject: string | null;  // Email subject or SMS preview
  readonly content: string | null;  // HTML or text content
  readonly segmentTags: readonly string[];  // Target audience tags
  readonly scheduledFor: Date | null;
  readonly sentAt: Date | null;
  readonly targetCount: number;  // Expected recipients
  readonly sentCount: number;    // Actually sent
  readonly openedCount: number;  // Opened (email only)
  readonly clickedCount: number; // Clicked (email only)
  readonly convertedCount: number; // Converted to cases
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Valid status transitions
   */
  private static readonly STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
    draft: ['scheduled', 'sending', 'archived'],
    scheduled: ['draft', 'sending', 'paused', 'archived'],
    sending: ['sent', 'paused'],
    sent: ['archived'],
    paused: ['sending', 'archived'],
    archived: [],
  };

  /**
   * Create a new Campaign
   */
  static create(params: {
    id: string;
    businessKey: string;
    funeralHomeId: string;
    name: string;
    type: CampaignType;
    createdBy: string;
  }): Effect.Effect<Campaign, ValidationError> {
    return Effect.gen(function* () {
      const trimmedName = params.name.trim();
      
      if (!trimmedName) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Campaign name is required', 
            field: 'name' 
          })
        );
      }

      if (trimmedName.length > 200) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Campaign name too long (max 200 characters)', 
            field: 'name' 
          })
        );
      }

      const now = new Date();

      return new Campaign({
        id: params.id as CampaignId,
        businessKey: params.businessKey,
        version: 1,
        funeralHomeId: params.funeralHomeId,
        name: trimmedName,
        description: null,
        type: params.type,
        status: 'draft',
        subject: null,
        content: null,
        segmentTags: [],
        scheduledFor: null,
        sentAt: null,
        targetCount: 0,
        sentCount: 0,
        openedCount: 0,
        clickedCount: 0,
        convertedCount: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: params.createdBy,
      });
    });
  }

  /**
   * Transition to new status
   */
  transitionStatus(newStatus: CampaignStatus): Effect.Effect<Campaign, InvalidStateTransitionError> {
    const validTransitions = Campaign.STATUS_TRANSITIONS[this.status];
    
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
      new Campaign({
        ...this,
        version: this.version + 1,
        status: newStatus,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Update campaign content
   */
  updateContent(subject: string, content: string): Effect.Effect<Campaign, ValidationError> {
    if (this.status !== 'draft' && this.status !== 'scheduled') {
      return Effect.fail(
        new ValidationError({ 
          message: 'Can only update content for draft or scheduled campaigns' 
        })
      );
    }

    if (!subject.trim()) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Subject is required', 
          field: 'subject' 
        })
      );
    }

    if (subject.length > 200) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Subject too long (max 200 characters)', 
          field: 'subject' 
        })
      );
    }

    if (!content.trim()) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Content is required', 
          field: 'content' 
        })
      );
    }

    return Effect.succeed(
      new Campaign({
        ...this,
        version: this.version + 1,
        subject: subject.trim(),
        content: content.trim(),
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Update description
   */
  updateDescription(description: string): Effect.Effect<Campaign, ValidationError> {
    if (description.length > 1000) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Description too long (max 1000 characters)', 
          field: 'description' 
        })
      );
    }

    return Effect.succeed(
      new Campaign({
        ...this,
        version: this.version + 1,
        description: description.trim() || null,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Set target audience tags
   */
  setSegmentTags(tags: readonly string[]): Campaign {
    const normalizedTags = tags
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    return new Campaign({
      ...this,
      version: this.version + 1,
      segmentTags: [...new Set(normalizedTags)], // Remove duplicates
      updatedAt: new Date(),
    });
  }

  /**
   * Schedule campaign for future send
   */
  schedule(scheduledFor: Date): Effect.Effect<Campaign, ValidationError | InvalidStateTransitionError> {
    if (scheduledFor <= new Date()) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Schedule time must be in the future', 
          field: 'scheduledFor' 
        })
      );
    }

    if (!this.subject || !this.content) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Campaign must have subject and content before scheduling' 
        })
      );
    }

    const self = this;
    return Effect.gen(function* (_) {
      const withStatus = yield* _(self.transitionStatus('scheduled'));
      return new Campaign({
        ...withStatus,
        scheduledFor,
      });
    });
  }

  /**
   * Record metrics when campaign is sent
   */
  recordSent(sentCount: number): Campaign {
    return new Campaign({
      ...this,
      version: this.version + 1,
      sentCount,
      sentAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Record email opened
   */
  recordOpen(): Campaign {
    if (this.type !== 'email' && this.type !== 'mixed') {
      return this;
    }

    return new Campaign({
      ...this,
      version: this.version + 1,
      openedCount: this.openedCount + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Record link clicked
   */
  recordClick(): Campaign {
    if (this.type !== 'email' && this.type !== 'mixed') {
      return this;
    }

    return new Campaign({
      ...this,
      version: this.version + 1,
      clickedCount: this.clickedCount + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Record conversion (lead/contact converted to case)
   */
  recordConversion(): Campaign {
    return new Campaign({
      ...this,
      version: this.version + 1,
      convertedCount: this.convertedCount + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Calculate open rate
   */
  get openRate(): number {
    if (this.sentCount === 0) return 0;
    return Math.round((this.openedCount / this.sentCount) * 10000) / 100;
  }

  /**
   * Calculate click-through rate
   */
  get clickRate(): number {
    if (this.sentCount === 0) return 0;
    return Math.round((this.clickedCount / this.sentCount) * 10000) / 100;
  }

  /**
   * Calculate conversion rate
   */
  get conversionRate(): number {
    if (this.sentCount === 0) return 0;
    return Math.round((this.convertedCount / this.sentCount) * 10000) / 100;
  }

  /**
   * Calculate engagement rate (opens + clicks)
   */
  get engagementRate(): number {
    if (this.sentCount === 0) return 0;
    const engaged = Math.min(this.openedCount + this.clickedCount, this.sentCount);
    return Math.round((engaged / this.sentCount) * 10000) / 100;
  }

  /**
   * Check if campaign is ready to send
   */
  get isReadyToSend(): boolean {
    return !!this.subject && 
           !!this.content && 
           (this.status === 'draft' || this.status === 'scheduled');
  }

  /**
   * Check if campaign is active
   */
  get isActive(): boolean {
    return this.status === 'sending' || this.status === 'scheduled';
  }
}
