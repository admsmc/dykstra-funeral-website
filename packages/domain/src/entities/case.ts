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
  readonly goContractId: string | null;       // Go backend contract ID
  readonly glJournalEntryId: string | null;   // GL journal entry ID (when finalized)
  readonly revenueAmount: number | null;      // Total revenue recognized (when finalized)
  readonly cogsAmount: number | null;         // Total COGS for inventory delivered
  readonly cogsJournalEntryId: string | null; // COGS GL journal entry ID
  readonly inventoryDeliveredAt: Date | null; // When inventory was delivered to family
  readonly inventoryDeliveredBy: string | null; // Who delivered the inventory
  readonly finalizedAt: Date | null;          // When case was finalized
  readonly finalizedBy: string | null;        // Who finalized the case
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
        goContractId: null,
        glJournalEntryId: null,
        revenueAmount: null,
        cogsAmount: null,
        cogsJournalEntryId: null,
        inventoryDeliveredAt: null,
        inventoryDeliveredBy: null,
        finalizedAt: null,
        finalizedBy: null,
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
   * Get case number (alias for businessKey)
   */
  get caseNumber(): string {
    return this.businessKey;
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
  
  /**
   * Link Go backend contract to case
   */
  linkContract(goContractId: string): Effect.Effect<Case, ValidationError> {
    const self = this;
    return Effect.gen(function* (_) {
      if (!goContractId || goContractId.trim() === '') {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Contract ID is required',
            field: 'goContractId',
          })
        ));
      }
      
      return new Case({
        ...self,
        version: self.version + 1,
        goContractId,
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Update COGS information after inventory delivery
   * 
   * This method records the cost of goods sold when inventory is delivered to a family.
   * Typically called after committing inventory reservations.
   * 
   * @param params - COGS tracking parameters
   * @returns Effect with updated case or validation error
   */
  updateCOGS(params: {
    cogsAmount: number;
    cogsJournalEntryId: string;
    inventoryDeliveredAt: Date;
    inventoryDeliveredBy: string;
  }): Effect.Effect<Case, ValidationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Validate case status (must be active or completed)
      if (self.status !== 'active' && self.status !== 'completed') {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Cannot update COGS for case in ${self.status} status`,
            field: 'status',
          })
        ));
      }
      
      // Validate COGS amount
      if (params.cogsAmount < 0) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'COGS amount cannot be negative',
            field: 'cogsAmount',
          })
        ));
      }
      
      // Validate journal entry ID
      if (!params.cogsJournalEntryId || params.cogsJournalEntryId.trim() === '') {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'COGS journal entry ID is required',
            field: 'cogsJournalEntryId',
          })
        ));
      }
      
      // Validate delivered by
      if (!params.inventoryDeliveredBy || params.inventoryDeliveredBy.trim() === '') {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Inventory delivered by user ID is required',
            field: 'inventoryDeliveredBy',
          })
        ));
      }
      
      return new Case({
        ...self,
        version: self.version + 1,
        cogsAmount: params.cogsAmount,
        cogsJournalEntryId: params.cogsJournalEntryId,
        inventoryDeliveredAt: params.inventoryDeliveredAt,
        inventoryDeliveredBy: params.inventoryDeliveredBy,
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Finalize case with GL posting
   * 
   * This method handles the business logic for case finalization:
   * - Validates case can be finalized (active or completed status)
   * - Validates contract is linked
   * - Transitions status to archived
   * - Records GL journal entry reference
   * - Records revenue amount and finalization timestamp
   * 
   * @param journalEntryId - GL journal entry ID from Go backend
   * @param revenueAmount - Total revenue recognized
   * @param finalizedBy - User ID who performed finalization
   * @returns Effect with finalized case or validation error
   */
  finalize(
    journalEntryId: string,
    revenueAmount: number,
    finalizedBy: string
  ): Effect.Effect<Case, ValidationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Validate case status
      if (self.status !== 'active' && self.status !== 'completed') {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Cannot finalize case from status: ${self.status}. Case must be active or completed.`,
            field: 'status',
          })
        ));
      }
      
      // Validate contract is linked
      if (!self.goContractId) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Cannot finalize case without linked contract',
            field: 'goContractId',
          })
        ));
      }
      
      // Validate journal entry ID
      if (!journalEntryId || journalEntryId.trim() === '') {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Journal entry ID is required',
            field: 'journalEntryId',
          })
        ));
      }
      
      // Validate revenue amount
      if (revenueAmount <= 0) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Revenue amount must be positive',
            field: 'revenueAmount',
          })
        ));
      }
      
      // Validate finalized by
      if (!finalizedBy || finalizedBy.trim() === '') {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Finalized by user ID is required',
            field: 'finalizedBy',
          })
        ));
      }
      
      const now = new Date();
      
      return new Case({
        ...self,
        version: self.version + 1,              // Increment version
        status: 'archived',                     // Finalized cases are archived
        glJournalEntryId: journalEntryId,
        revenueAmount: revenueAmount,
        finalizedAt: now,
        finalizedBy: finalizedBy,
        updatedAt: now,
      });
    });
  }
}
