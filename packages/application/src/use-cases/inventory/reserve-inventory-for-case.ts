import { Effect } from 'effect';
import { type Case, ValidationError } from '@dykstra/domain';
import { 
  CaseRepository, 
  type CaseRepository as CaseRepositoryService,
  NotFoundError,
  type PersistenceError,
} from '../../ports/case-repository';
import {
  GoInventoryPort,
  type GoInventoryPortService,
  type ReserveInventoryCommand,
  type GoInventoryReservation,
  type NetworkError,
} from '../../ports/go-inventory-port';

/**
 * Command for reserving inventory for a case
 */
/**
 * Reserve Inventory For Case
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface ReserveInventoryForCaseCommand {
  readonly caseBusinessKey: string;
  readonly items: readonly {
    readonly itemId: string;      // SKU or inventory item ID
    readonly quantity: number;
    readonly locationId: string;  // Warehouse/location
    readonly notes?: string;
  }[];
  readonly reservedBy: string;
}

/**
 * Result of inventory reservation
 */
export interface ReserveInventoryForCaseResult {
  readonly case: Case;
  readonly reservations: readonly GoInventoryReservation[];
}

/**
 * Reserve Inventory for Case (Cross-Domain Orchestration)
 * 
 * This use case orchestrates across TypeScript and Go domains:
 * 1. TypeScript Domain: Load and validate case
 * 2. Go Domain: Reserve inventory items (via GoInventoryPort)
 * 3. TypeScript Domain: Link reservations to case metadata
 * 
 * Use Case: After contract approval, funeral director reserves
 * casket, urn, and other merchandise from inventory for the case.
 * 
 * @example
 * ```typescript
 * const result = pipe(
 *   reserveInventoryForCase({
 *     caseBusinessKey: 'case-456',
 *     items: [
 *       { 
 *         itemId: 'CASKET-OAK-001', 
 *         quantity: 1, 
 *         locationId: 'WAREHOUSE-MAIN',
 *         notes: 'Johnson family - oak casket' 
 *       },
 *       { 
 *         itemId: 'URN-BRASS-002', 
 *         quantity: 1, 
 *         locationId: 'WAREHOUSE-MAIN' 
 *       }
 *     ],
 *     reservedBy: 'staff-user-1'
 *   }),
 *   Effect.provide(InfrastructureLayer),
 *   Effect.runPromise
 * );
 * ```
 */
export const reserveInventoryForCase = (
  command: ReserveInventoryForCaseCommand
): Effect.Effect<
  ReserveInventoryForCaseResult,
  NotFoundError | ValidationError | PersistenceError | NetworkError,
  CaseRepositoryService | GoInventoryPortService
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;
    const goInventoryPort = yield* GoInventoryPort;
    
    // Step 1: Load and validate case (TypeScript domain)
    const case_ = yield* caseRepo.findByBusinessKey(command.caseBusinessKey);
    
    if (!case_) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Case not found',
          entityType: 'Case',
          entityId: command.caseBusinessKey,
        })
      );
    }
    
    // Validate case is active or inquiry
    if (case_.status !== 'active' && case_.status !== 'inquiry') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Can only reserve inventory for active or inquiry cases (current status: ${case_.status})`,
          field: 'status',
        })
      );
    }
    
    // Validate items
    if (command.items.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'At least one item is required for inventory reservation',
          field: 'items',
        })
      );
    }
    
    // Step 2: Reserve inventory in Go ERP (Go domain via port)
    // Reserve items sequentially to maintain proper error handling
    const reservations: GoInventoryReservation[] = [];
    
    for (const item of command.items) {
      const reserveCommand: ReserveInventoryCommand = {
        itemId: item.itemId,
        quantity: item.quantity,
        locationId: item.locationId,
        caseId: case_.businessKey,
        contractId: '', // TODO: Get from case-contract linking table
      };
      
      const reservation = yield* goInventoryPort.reserveInventory(reserveCommand);
      reservations.push(reservation);
    }
    
    // Step 3: Link reservations to case (TypeScript domain)
    // Note: Case doesn't have metadata field
    // In production, store reservations in a separate case-reservation linking table
    
    // For now, just return the case and reservations without linking
    return {
      case: case_,
      reservations,
    };
  });

/**
 * Release Inventory Reservations for Case
 * 
 * Used when case is cancelled or items are changed.
 * Releases all inventory reservations linked to a case.
 */
export interface ReleaseInventoryForCaseCommand {
  readonly caseBusinessKey: string;
  readonly reason: string;
  readonly releasedBy: string;
}

export const releaseInventoryForCase = (
  command: ReleaseInventoryForCaseCommand
): Effect.Effect<
  { case: Case; releasedCount: number },
  NotFoundError | ValidationError | PersistenceError | NetworkError,
  CaseRepositoryService | GoInventoryPortService
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;
    const goInventoryPort = yield* GoInventoryPort;
    
    // Load case
    const case_ = yield* caseRepo.findByBusinessKey(command.caseBusinessKey);
    
    if (!case_) {
      return yield* Effect.fail(
        new NotFoundError({
          message: 'Case not found',
          entityType: 'Case',
          entityId: command.caseBusinessKey,
        })
      );
    }
    
    // Get reservations from separate linking table
    // TODO: Implement proper case-reservation lookup
    // For now, use GoInventoryPort to get reservations by case
    const reservations = yield* goInventoryPort.getReservationsByCase(case_.businessKey);
    
    if (reservations.length === 0) {
      return {
        case: case_,
        releasedCount: 0,
      };
    }
    
    // Release each reservation
    for (const reservation of reservations) {
      yield* goInventoryPort.releaseReservation(reservation.id);
    }
    
    return {
      case: case_,
      releasedCount: reservations.length,
    };
  });
