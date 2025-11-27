import { Effect, Data } from 'effect';
import type { ContractStatus } from '@dykstra/shared';
import { ValidationError, InvalidStateTransitionError, BusinessRuleViolationError } from '../errors/domain-errors';
import { Money } from '../value-objects/money';

/**
 * Contract ID branded type
 */
export type ContractId = string & { readonly _brand: 'ContractId' };

/**
 * Service line item
 */
export interface ServiceLineItem {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly price: number;
}

/**
 * Product line item
 */
export interface ProductLineItem {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly price: number;
}

/**
 * Contract entity
 * Represents a funeral service contract
 * SCD Type 2: Immutable once signed for legal compliance (ESIGN Act)
 */
export class Contract extends Data.Class<{
  readonly id: ContractId;
  readonly businessKey: string;              // Immutable business identifier
  readonly version: number;                   // SCD2 version number
  readonly caseId: string;
  readonly contractVersion: number;           // Business version (v1.0, v2.0)
  readonly status: ContractStatus;
  readonly services: readonly ServiceLineItem[];  // Service line items
  readonly products: readonly ProductLineItem[];  // Product line items
  readonly subtotal: Money;
  readonly tax: Money;
  readonly totalAmount: Money;
  readonly termsAndConditions: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Valid status transitions
   */
  private static readonly STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    draft: ['pending_review', 'cancelled'],
    pending_review: ['pending_signatures', 'draft', 'cancelled'],
    pending_signatures: ['fully_signed', 'cancelled'],
    fully_signed: [],                          // Terminal state - immutable
    cancelled: [],                             // Terminal state
  };
  
  /**
   * Create a new Contract
   */
  static create(params: {
    id: string;
    businessKey: string;
    caseId: string;
    services: readonly ServiceLineItem[];
    products: readonly ProductLineItem[];
    termsAndConditions: string;
    createdBy: string;
  }): Effect.Effect<Contract, ValidationError> {
    return Effect.gen(function* (_) {
      // Validate terms and conditions
      if (!params.termsAndConditions.trim()) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Terms and conditions are required', field: 'termsAndConditions' })
        ));
      }
      
      // Calculate totals
      const subtotalRaw = calculateSubtotal(params.services, params.products);
      const subtotal = yield* _(Money.create(subtotalRaw.amount, 'USD'));
      const taxRaw = calculateTax(subtotalRaw);
      const tax = yield* _(Money.create(taxRaw.amount, 'USD'));
      const totalAmount = yield* _(Money.create(
        subtotal.amount + tax.amount,
        'USD'
      ));
      
      const now = new Date();
      
      return new Contract({
        id: params.id as ContractId,
        businessKey: params.businessKey,
        version: 1,                             // Initial version
        caseId: params.caseId,
        contractVersion: 1,
        status: 'draft',
        services: params.services,
        products: params.products,
        subtotal,
        tax,
        totalAmount,
        termsAndConditions: params.termsAndConditions,
        createdAt: now,
        updatedAt: now,
        createdBy: params.createdBy,
      });
    });
  }
  
  /**
   * Transition to a new status
   */
  transitionStatus(newStatus: ContractStatus): Effect.Effect<Contract, InvalidStateTransitionError | BusinessRuleViolationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Check if transition is valid
      const validTransitions = Contract.STATUS_TRANSITIONS[self.status];
      
      if (!validTransitions?.includes(newStatus)) {
        return yield* _(Effect.fail(
          new InvalidStateTransitionError({
            message: `Cannot transition contract from ${self.status} to ${newStatus}`,
            fromState: self.status,
            toState: newStatus,
          })
        ));
      }
      
      // Signed contracts are immutable
      if (self.status === 'fully_signed') {
        return yield* _(Effect.fail(
          new BusinessRuleViolationError({
            message: 'Cannot modify fully signed contract (ESIGN Act compliance)',
            rule: 'signed_contract_immutable',
          })
        ));
      }
      
      return new Contract({
        ...self,
        version: self.version + 1,              // Increment version on change
        status: newStatus,
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Submit for review
   */
  submitForReview(): Effect.Effect<Contract, InvalidStateTransitionError | BusinessRuleViolationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Must be in draft status
      if (self.status !== 'draft') {
        return yield* _(Effect.fail(
          new BusinessRuleViolationError({
            message: 'Only draft contracts can be submitted for review',
            rule: 'draft_only_review',
          })
        ));
      }
      
      // Must have at least one service or product
      if (self.services.length === 0 && self.products.length === 0) {
        return yield* _(Effect.fail(
          new BusinessRuleViolationError({
            message: 'Contract must include at least one service or product',
            rule: 'contract_not_empty',
          })
        ));
      }
      
      return yield* _(self.transitionStatus('pending_review'));
    });
  }
  
  /**
   * Approve and prepare for signatures
   */
  approveForSignature(): Effect.Effect<Contract, InvalidStateTransitionError | BusinessRuleViolationError> {
    return this.transitionStatus('pending_signatures');
  }
  
  /**
   * Mark as fully signed
   */
  markFullySigned(): Effect.Effect<Contract, InvalidStateTransitionError | BusinessRuleViolationError> {
    return this.transitionStatus('fully_signed');
  }
  
  /**
   * Cancel contract
   */
  cancel(): Effect.Effect<Contract, InvalidStateTransitionError | BusinessRuleViolationError> {
    return this.transitionStatus('cancelled');
  }
  
  /**
   * Check if contract can be modified
   */
  get canBeModified(): boolean {
    return this.status === 'draft' || this.status === 'pending_review';
  }
  
  /**
   * Check if contract is signed
   */
  get isSigned(): boolean {
    return this.status === 'fully_signed';
  }
  
  /**
   * Check if contract is pending signatures
   */
  get isPendingSignatures(): boolean {
    return this.status === 'pending_signatures';
  }
}

/**
 * Calculate subtotal from services and products
 */
function calculateSubtotal(services: readonly ServiceLineItem[], products: readonly ProductLineItem[]): { amount: number; currency: string } {
  const servicesTotal = services.reduce((sum, s) => sum + (s.price || 0), 0);
  const productsTotal = products.reduce((sum, p) => sum + (p.price || 0), 0);
  
  return {
    amount: servicesTotal + productsTotal,
    currency: 'USD',
  };
}

/**
 * Calculate tax
 */
function calculateTax(subtotal: { amount: number; currency: string }): { amount: number; currency: string } {
  const taxRate = 0.06; // 6% - should be configurable per jurisdiction
  
  return {
    amount: Math.round(subtotal.amount * taxRate * 100) / 100,
    currency: subtotal.currency,
  };
}
