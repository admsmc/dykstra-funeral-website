import { Effect, Data } from 'effect';
import type { CaseType, CaseStatus, ServiceType } from '@dykstra/shared';
import { ValidationError, InvalidStateTransitionError, BusinessRuleViolationError } from '../errors/domain-errors';
import type { Arrangements } from '../value-objects/arrangements';

/**
 * Case ID branded type
 */
export type CaseId = string & { readonly _brand: 'CaseId' };

/**
 * Case entity
 * Represents a funeral case/arrangement
 * SCD Type 2: Each modification creates a new version for audit/legal compliance
 */
export class Case extends Data.Class<{
  readonly id: CaseId;
  readonly businessKey: string;              // Immutable business identifier
  readonly version: number;                   // SCD2 version number
  readonly funeralHomeId: string;
  readonly decedentName: string;
  readonly decedentDateOfBirth: Date | null;
  readonly decedentDateOfDeath: Date | null;
  readonly type: CaseType;
  readonly status: CaseStatus;
  readonly serviceType: ServiceType | null;
  readonly serviceDate: Date | null;
  readonly arrangements: Arrangements | null; // Arrangements details
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Valid status transitions
   */
  private static readonly STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
    inquiry: ['active', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: [],
  };
  
  /**
   * Create a new Case
   */
  static create(params: {
    id: string;
    businessKey: string;                       // Provided by infrastructure layer
    funeralHomeId: string;
    decedentName: string;
    type: CaseType;
    createdBy: string;
  }): Effect.Effect<Case, ValidationError> {
    return Effect.gen(function* (_) {
      // Validate decedent name
      const trimmedName = params.decedentName.trim();
      if (!trimmedName) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Decedent name is required', field: 'decedentName' })
        ));
      }
      
      if (trimmedName.length > 255) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Decedent name too long (max 255 characters)', field: 'decedentName' })
        ));
      }
      
      const now = new Date();
      
      return new Case({
        id: params.id as CaseId,
        businessKey: params.businessKey,
        version: 1,                             // Initial version
        funeralHomeId: params.funeralHomeId,
        decedentName: trimmedName,
        decedentDateOfBirth: null,
        decedentDateOfDeath: null,
        type: params.type,
        status: 'inquiry',
        serviceType: null,
        serviceDate: null,
        arrangements: null,
        createdAt: now,
        updatedAt: now,
        createdBy: params.createdBy,
      });
    });
  }
  
  /**
   * Transition to a new status
   */
  transitionStatus(newStatus: CaseStatus): Effect.Effect<Case, InvalidStateTransitionError> {
    const validTransitions = Case.STATUS_TRANSITIONS[this.status];
    
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
      new Case({
        ...this,
        version: this.version + 1,              // Increment version on change
        status: newStatus,
        updatedAt: new Date(),
      })
    );
  }
  
  /**
   * Update decedent information
   */
  updateDecedentInfo(params: {
    dateOfBirth?: Date | null;
    dateOfDeath?: Date | null;
  }): Effect.Effect<Case, ValidationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Validate dates if provided
      if (params.dateOfBirth && params.dateOfDeath) {
        if (params.dateOfBirth >= params.dateOfDeath) {
          return yield* _(Effect.fail(
            new ValidationError({
              message: 'Date of birth must be before date of death',
              field: 'dateOfDeath',
            })
          ));
        }
      }
      
      // Date of death cannot be in the future
      if (params.dateOfDeath && params.dateOfDeath > new Date()) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Date of death cannot be in the future',
            field: 'dateOfDeath',
          })
        ));
      }
      
      return new Case({
        ...self,
        version: self.version + 1,              // Increment version on change
        decedentDateOfBirth: params.dateOfBirth !== undefined ? params.dateOfBirth : self.decedentDateOfBirth,
        decedentDateOfDeath: params.dateOfDeath !== undefined ? params.dateOfDeath : self.decedentDateOfDeath,
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Set service details
   */
  setServiceDetails(params: {
    serviceType: ServiceType;
    serviceDate?: Date | null;
  }): Effect.Effect<Case, ValidationError | BusinessRuleViolationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Cannot set service details on archived case
      if (self.status === 'archived') {
        return yield* _(Effect.fail(
          new BusinessRuleViolationError({
            message: 'Cannot modify service details on archived case',
            rule: 'no_modification_archived',
          })
        ));
      }
      
      // Service date must be in the future for pre-need cases
      if (self.type === 'pre_need' && params.serviceDate && params.serviceDate < new Date()) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Service date must be in the future for pre-need cases',
            field: 'serviceDate',
          })
        ));
      }
      
      return new Case({
        ...self,
        version: self.version + 1,              // Increment version on change
        serviceType: params.serviceType,
        serviceDate: params.serviceDate !== undefined ? params.serviceDate : self.serviceDate,
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Activate the case (move from inquiry to active)
   */
  activate(): Effect.Effect<Case, InvalidStateTransitionError> {
    return this.transitionStatus('active');
  }
  
  /**
   * Complete the case
   */
  complete(): Effect.Effect<Case, InvalidStateTransitionError | BusinessRuleViolationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Must have service type set to complete
      if (!self.serviceType) {
        return yield* _(Effect.fail(
          new BusinessRuleViolationError({
            message: 'Cannot complete case without service type',
            rule: 'service_type_required',
          })
        ));
      }
      
      return yield* _(self.transitionStatus('completed'));
    });
  }
  
  /**
   * Archive the case
   */
  archive(): Effect.Effect<Case, InvalidStateTransitionError> {
    return this.transitionStatus('archived');
  }
  
  /**
   * Check if case can be modified
   */
  get canBeModified(): boolean {
    return this.status !== 'archived' && this.status !== 'completed';
  }
  
  /**
   * Check if case is inquiry
   */
  get isInquiry(): boolean {
    return this.status === 'inquiry';
  }
  
  /**
   * Check if case is active
   */
  get isActive(): boolean {
    return this.status === 'active';
  }
  
  /**
   * Update arrangements
   */
  updateArrangements(
    arrangements: Arrangements
  ): Effect.Effect<Case, BusinessRuleViolationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Cannot update arrangements on archived or completed case
      if (self.status === 'archived' || self.status === 'completed') {
        return yield* _(Effect.fail(
          new BusinessRuleViolationError({
            message: `Cannot modify arrangements on ${self.status} case`,
            rule: 'no_modification_after_completion',
          })
        ));
      }
      
      return new Case({
        ...self,
        version: self.version + 1,              // Increment version on change
        arrangements,
        updatedAt: new Date(),
      });
    });
  }
}
