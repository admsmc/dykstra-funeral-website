import { Effect, Context } from 'effect';
import { ValidationError, NotFoundError, type CaseId } from '@dykstra/domain';
import {
  GoContractPort,
  type GoContractPortService,
  NetworkError,
  type GoContract,
  type GoContractItem,
} from '../../ports/go-contract-port';
import {
  CaseRepository as CaseRepositoryTag,
  type CaseRepository as CaseRepositoryService,
  PersistenceError,
} from '../../ports/case-repository';

/**
 * Use Case 6.6: Contract Renewal Management
 * 
 * Manages renewal of pre-need funeral contracts that are nearing expiration or
 * require updated terms. Common for pre-need contracts with changing prices,
 * services, or family circumstances.
 * 
 * Business Rules:
 * 1. Only active or completed contracts can be renewed
 * 2. Original contract must exist and be retrievable
 * 3. Renewed contract inherits services/products from original (can be modified)
 * 4. Renewed contract is created on the same case (maintains history)
 * 5. Price adjustments can be applied for inflation or service changes
 * 6. Renewal metadata references original contract ID for audit trail
 * 
 * Workflow:
 * 1. Retrieve original contract
 * 2. Validate contract is eligible for renewal
 * 3. Apply price adjustments if specified
 * 4. Create new contract with updated terms
 * 5. Calculate price comparison
 * 6. Return renewal summary with metadata
 * 
 * Integration:
 * - Uses GoContractPort.getContract (verified exists)
 * - Uses GoContractPort.createContract (verified exists)
 * - Uses CaseRepository for new case creation
 * 
 * @see Implementation Plan: docs/Implementation Plan_ Remaining 20 Critical Use Cases.md
 */

/**
 * Contract Renewal
 *
 * Policy Type: Type C
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface RenewContractCommand {
  /**
   * ID of original contract to renew
   */
  readonly originalContractId: string;
  
  /**
   * Reason for renewal (e.g., "Annual renewal", "Price update", "Service changes")
   */
  readonly renewalReason: string;
  
  /**
   * Optional price adjustment factor (e.g., 1.05 for 5% increase)
   * Default: 1.0 (no adjustment)
   */
  readonly priceAdjustmentFactor?: number;
  
  /**
   * Optional service modifications
   */
  readonly updatedServices?: readonly Omit<GoContractItem, 'id'>[];
  
  /**
   * Optional product modifications
   */
  readonly updatedProducts?: readonly Omit<GoContractItem, 'id'>[];
  
  /**
   * User initiating the renewal
   */
  readonly renewedBy: string;
  
  /**
   * Additional notes for renewal
   */
  readonly notes?: string;
}

export interface RenewContractResult {
  /**
   * Newly created contract
   */
  readonly newContract: GoContract;
  
  /**
   * Original contract that was renewed
   */
  readonly originalContract: GoContract;
  
  /**
   * New case ID created for renewal
   */
  readonly newCaseId: string;
  
  /**
   * Price comparison
   */
  readonly priceComparison: {
    readonly originalTotal: number;
    readonly newTotal: number;
    readonly difference: number;
    readonly percentChange: number;
  };
  
  /**
   * Renewal metadata
   */
  readonly renewalMetadata: {
    readonly renewalReason: string;
    readonly renewedBy: string;
    readonly renewedAt: Date;
    readonly originalContractId: string;
    readonly priceAdjustmentFactor: number;
  };
}

/**
 * Renew a pre-need funeral contract with updated terms
 * 
 * @example
 * ```typescript
 * const result = yield* renewContract({
 *   originalContractId: 'contract-123',
 *   renewalReason: 'Annual price adjustment',
 *   priceAdjustmentFactor: 1.03, // 3% increase
 *   renewedBy: 'user-456',
 *   notes: 'Standard inflation adjustment'
 * });
 * 
 * console.log(`Original: $${result.priceComparison.originalTotal}`);
 * console.log(`New: $${result.priceComparison.newTotal}`);
 * console.log(`Increase: ${result.priceComparison.percentChange.toFixed(1)}%`);
 * ```
 */
export const renewContract = (
  command: RenewContractCommand
): Effect.Effect<
  RenewContractResult,
  ValidationError | NotFoundError | NetworkError | PersistenceError,
  GoContractPortService | CaseRepositoryService
> =>
  Effect.gen(function* () {
    const contractPort = yield* GoContractPort;
    const caseRepo = yield* CaseRepositoryTag;

    // Validate command
    yield* validateRenewalCommand(command);

    // Step 1: Retrieve original contract
    const originalContract = yield* contractPort.getContract(
      command.originalContractId
    );

    // Step 2: Validate contract is eligible for renewal
    yield* validateContractEligibility(originalContract);

    // Step 3: Retrieve original case
    // Note: For simplicity, renewed contract stays on the same case
    // In production, you might create a new case or version the contract
    const originalCase = yield* caseRepo.findById(originalContract.caseId as CaseId);

    // Step 5: Apply price adjustments and prepare items
    const priceAdjustmentFactor = command.priceAdjustmentFactor ?? 1.0;

    const renewedServices = command.updatedServices
      ? command.updatedServices
      : applyPriceAdjustment(originalContract.services, priceAdjustmentFactor);

    const renewedProducts = command.updatedProducts
      ? command.updatedProducts
      : applyPriceAdjustment(originalContract.products, priceAdjustmentFactor);

    // Step 4: Create new contract with updated terms on the same case
    const newContract = yield* contractPort.createContract({
      caseId: originalCase.id,
      services: renewedServices,
      products: renewedProducts,
    });

    // Step 5: Calculate price comparison
    const originalTotal = originalContract.totalAmount;
    const newTotal = newContract.totalAmount;
    const difference = newTotal - originalTotal;
    const percentChange = originalTotal > 0 ? (difference / originalTotal) * 100 : 0;

    return {
      newContract,
      originalContract,
      newCaseId: originalCase.id, // Same case ID
      priceComparison: {
        originalTotal,
        newTotal,
        difference,
        percentChange,
      },
      renewalMetadata: {
        renewalReason: command.renewalReason,
        renewedBy: command.renewedBy,
        renewedAt: new Date(),
        originalContractId: command.originalContractId,
        priceAdjustmentFactor,
      },
    };
  });

/**
 * Validate renewal command business rules
 */
const validateRenewalCommand = (
  command: RenewContractCommand
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    // Validate original contract ID
    if (!command.originalContractId || command.originalContractId.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Original contract ID is required',
        })
      );
    }

    // Validate renewal reason
    if (!command.renewalReason || command.renewalReason.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Renewal reason is required',
        })
      );
    }

    // Validate renewed by
    if (!command.renewedBy || command.renewedBy.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Renewed by (user ID) is required',
        })
      );
    }

    // Validate price adjustment factor if provided
    if (
      command.priceAdjustmentFactor !== undefined &&
      command.priceAdjustmentFactor !== null
    ) {
      if (command.priceAdjustmentFactor <= 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Price adjustment factor must be positive, got: ${command.priceAdjustmentFactor}`,
          })
        );
      }

      // Warn about extreme adjustments (more than 50% change)
      if (
        command.priceAdjustmentFactor < 0.5 ||
        command.priceAdjustmentFactor > 1.5
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Price adjustment factor ${command.priceAdjustmentFactor} is outside reasonable range (0.5-1.5). ` +
              `Please verify this is intentional.`,
          })
        );
      }
    }

    // Validate updated services if provided
    if (command.updatedServices) {
      if (command.updatedServices.length === 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Updated services array cannot be empty. Omit the field to keep original services.',
          })
        );
      }

      // Validate each service item
      for (const service of command.updatedServices) {
        if (!service.description || service.description.trim() === '') {
          return yield* Effect.fail(
            new ValidationError({
              message: 'Service description is required',
            })
          );
        }

        if (service.quantity <= 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: `Service quantity must be positive: ${service.description}`,
            })
          );
        }

        if (service.unitPrice < 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: `Service unit price cannot be negative: ${service.description}`,
            })
          );
        }
      }
    }

    // Validate updated products if provided
    if (command.updatedProducts) {
      if (command.updatedProducts.length === 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Updated products array cannot be empty. Omit the field to keep original products.',
          })
        );
      }

      // Validate each product item
      for (const product of command.updatedProducts) {
        if (!product.description || product.description.trim() === '') {
          return yield* Effect.fail(
            new ValidationError({
              message: 'Product description is required',
            })
          );
        }

        if (product.quantity <= 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: `Product quantity must be positive: ${product.description}`,
            })
          );
        }

        if (product.unitPrice < 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: `Product unit price cannot be negative: ${product.description}`,
            })
          );
        }
      }
    }
  });

/**
 * Validate contract is eligible for renewal
 */
const validateContractEligibility = (
  contract: GoContract
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    // Only active or completed contracts can be renewed
    if (contract.status !== 'active' && contract.status !== 'completed') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Contract cannot be renewed in ${contract.status} status. ` +
            `Only active or completed contracts can be renewed.`,
        })
      );
    }

    // Additional business rule: contract must have at least one service or product
    if (contract.services.length === 0 && contract.products.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Contract has no services or products. Cannot renew empty contract.',
        })
      );
    }
  });

/**
 * Apply price adjustment to contract items
 */
const applyPriceAdjustment = (
  items: readonly GoContractItem[],
  adjustmentFactor: number
): readonly Omit<GoContractItem, 'id'>[] => {
  return items.map((item) => {
    const adjustedUnitPrice = Math.round(item.unitPrice * adjustmentFactor * 100) / 100; // Round to 2 decimals
    const adjustedTotalPrice = Math.round(adjustedUnitPrice * item.quantity * 100) / 100;

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: adjustedUnitPrice,
      totalPrice: adjustedTotalPrice,
      glAccountId: item.glAccountId,
    };
  });
};

/**
 * Service tag for dependency injection
 */
export interface RenewContractService {
  readonly renewContract: typeof renewContract;
}

export const RenewContractService = Context.GenericTag<RenewContractService>(
  '@dykstra/RenewContractService'
);
