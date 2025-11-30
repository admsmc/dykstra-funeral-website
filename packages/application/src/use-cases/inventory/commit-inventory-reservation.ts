/**
 * Use Case 2.6: Commit Inventory Reservation
 * 
 * Converts soft inventory reservations to hard commitments when service is delivered:
 * 1. Load case with inventory reservations
 * 2. Commit each reservation (reserved → sold)
 * 3. Get weighted average cost (WAC) for each item
 * 4. Create COGS journal entry (DR: COGS, CR: Inventory Asset)
 * 5. Update case with COGS amount
 * 6. Mark case inventory as delivered
 * 
 * Business Value:
 * - Accurate COGS tracking for $2K-$15K caskets
 * - Real-time case profitability (Revenue - COGS)
 * - Automatic GL postings reduce accounting labor
 * - Inventory asset account stays accurate
 * - Supports case-level P&L reporting
 */

import { Effect } from 'effect';
import {
  GoInventoryPort,
  type GoInventoryPortService,
  GoFinancialPort,
  type GoFinancialPortService,
  NetworkError,
} from '@dykstra/application';
import { CaseRepository as CaseRepositoryTag, type CaseRepository as CaseRepositoryService, PersistenceError } from '../../ports/case-repository';
import { ValidationError, NotFoundError, type CaseId, INVENTORY_ACCOUNTS } from '@dykstra/domain';

// ============================================================================
// Command & Result Types
// ============================================================================

export interface CommitInventoryReservationCommand {
  readonly caseId: string;
  readonly deliveredBy: string;
  readonly deliveryDate: string; // ISO 8601
  readonly notes?: string;
}

export interface CommittedItem {
  readonly reservationId: string;
  readonly itemId: string;
  readonly itemSku: string;
  readonly itemDescription: string;
  readonly quantityReserved: number;
  readonly unitCost: number; // WAC cost
  readonly totalCost: number; // quantity * unitCost
  readonly glAccountNumber: string; // COGS account
}

export interface CommitInventoryReservationResult {
  readonly caseId: string;
  readonly itemsCommitted: ReadonlyArray<CommittedItem>;
  readonly totalItemsCommitted: number;
  readonly cogsAmount: number;
  readonly journalEntryId: string;
  readonly deliveryDate: string;
  readonly inventoryAssetReduction: number; // Amount removed from inventory asset account
  readonly grossProfit?: number; // Revenue - COGS (if case has revenue)
  readonly grossMarginPercent?: number; // (Revenue - COGS) / Revenue * 100
}

// ============================================================================
// Port Dependencies
// ============================================================================

export interface CommitInventoryReservationDeps {
  readonly CaseRepository: CaseRepositoryService;
  readonly GoInventoryPort: GoInventoryPortService;
  readonly GoFinancialPort: GoFinancialPortService;
}

// ============================================================================
// Use Case Implementation
// ============================================================================

/**
 * Commit Inventory Reservation Use Case
 * 
 * Orchestrates the conversion of soft reservations to hard commitments
 * with proper COGS postings for accurate financial reporting.
 */
export const commitInventoryReservation = (
  command: CommitInventoryReservationCommand
): Effect.Effect<
  CommitInventoryReservationResult,
  ValidationError | NotFoundError | NetworkError | PersistenceError,
  CaseRepositoryService | GoInventoryPortService | GoFinancialPortService
> =>
  Effect.gen(function* () {
    // Get dependencies
    const caseRepo = yield* CaseRepositoryTag;
    const inventoryPort = yield* GoInventoryPort;
    const financialPort = yield* GoFinancialPort;
    
    // Step 1: Load case
    const caseEntity = yield* caseRepo.findById(command.caseId as CaseId);
    
    // Validate case is in appropriate status for commitment
    if (caseEntity.status !== 'active' && caseEntity.status !== 'completed') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Cannot commit inventory for case in ${caseEntity.status} status`,
          field: 'caseStatus'
        })
      );
    }
    
    // Step 2: Get full reservation details from Go Inventory system
    const reservations = yield* inventoryPort.getReservationsByCase(command.caseId);
    
    if (reservations.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'No active reservations found in Go Inventory system',
          field: 'reservations'
        })
      );
    }
    
    // Step 3: Commit each reservation and get WAC cost
    const committedItems: CommittedItem[] = [];
    let totalCOGS = 0;
    
    for (const reservation of reservations) {
      // Only commit reservations that are active (not yet committed)
      if (reservation.status !== 'active') {
        continue;
      }
      
      // Commit the reservation (converts from reserved to sold)
      yield* inventoryPort.commitReservation(reservation.id);
      
      // Get item details and balance including current WAC cost
      const item = yield* inventoryPort.getItem(reservation.itemId);
      const balance = yield* inventoryPort.getBalance(reservation.itemId, reservation.locationId);
      
      const unitCost = balance.weightedAverageCost || item.currentCost || 0;
      const totalCost = reservation.quantity * unitCost;
      
      // Determine COGS GL account based on item category
      const cogsAccount = determineCogsAccount(item.category);
      
      committedItems.push({
        reservationId: reservation.id,
        itemId: reservation.itemId,
        itemSku: item.sku,
        itemDescription: item.description,
        quantityReserved: reservation.quantity,
        unitCost,
        totalCost,
        glAccountNumber: cogsAccount,
      });
      
      totalCOGS += totalCost;
    }
    
    if (committedItems.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'No uncommitted reservations found',
          field: 'committedItems'
        })
      );
    }
    
    // Step 4: Create COGS journal entry
    // Debit: COGS (by category)
    // Credit: Inventory Asset
    const journalEntryLines = [
      // Debit COGS accounts (one line per category)
      ...aggregateByCOGSAccount(committedItems).map(({ glAccountNumber, amount }) => ({
        accountId: glAccountNumber,
        debit: amount,
        credit: 0,
        description: `COGS for Case ${caseEntity.decedentName} - ${committedItems.length} items delivered`,
      })),
      // Credit Inventory Asset
      {
        accountId: INVENTORY_ACCOUNTS.ASSET,
        debit: 0,
        credit: totalCOGS,
        description: `Inventory reduction for Case ${caseEntity.decedentName}`,
      },
    ];
    
    const journalEntry = yield* financialPort.createJournalEntry({
      entryDate: new Date(command.deliveryDate),
      description: `COGS for Case ${caseEntity.caseNumber} - ${committedItems.length} items`,
      lines: journalEntryLines,
    });
    
    // Post the journal entry
    yield* financialPort.postJournalEntry(journalEntry.id);
    
    // Step 5: Update case with COGS information
    const caseWithCOGS = yield* caseEntity.updateCOGS({
      cogsAmount: totalCOGS,
      cogsJournalEntryId: journalEntry.id,
      inventoryDeliveredAt: new Date(command.deliveryDate),
      inventoryDeliveredBy: command.deliveredBy,
    });
    
    const updatedCase = yield* caseRepo.update(caseWithCOGS);
    
    // Step 6: Calculate profitability metrics if case has revenue
    let grossProfit: number | undefined;
    let grossMarginPercent: number | undefined;
    
    if (updatedCase.revenueAmount && updatedCase.revenueAmount > 0) {
      grossProfit = updatedCase.revenueAmount - totalCOGS;
      grossMarginPercent = (grossProfit / updatedCase.revenueAmount) * 100;
    }
    
    return {
      caseId: command.caseId,
      itemsCommitted: committedItems,
      totalItemsCommitted: committedItems.reduce((sum, item) => sum + item.quantityReserved, 0),
      cogsAmount: totalCOGS,
      journalEntryId: journalEntry.id,
      deliveryDate: command.deliveryDate,
      inventoryAssetReduction: totalCOGS,
      grossProfit,
      grossMarginPercent,
    };
  });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine COGS GL account based on item category
 */
function determineCogsAccount(category?: string): string {
  if (!category) {
    return INVENTORY_ACCOUNTS.COGS.MERCHANDISE; // Default
  }
  
  switch (category.toLowerCase()) {
    case 'casket':
      return INVENTORY_ACCOUNTS.COGS.MERCHANDISE;
    case 'urn':
      return INVENTORY_ACCOUNTS.COGS.MERCHANDISE;
    case 'vault':
      return INVENTORY_ACCOUNTS.COGS.MERCHANDISE;
    case 'service':
    case 'professional_services':
      return INVENTORY_ACCOUNTS.COGS.PROFESSIONAL_SERVICES;
    case 'facility':
    case 'facility_use':
      return INVENTORY_ACCOUNTS.COGS.FACILITIES;
    case 'transportation':
      return INVENTORY_ACCOUNTS.COGS.TRANSPORTATION;
    default:
      return INVENTORY_ACCOUNTS.COGS.MERCHANDISE;
  }
}

/**
 * Aggregate committed items by COGS GL account
 * (so we have one journal entry line per account)
 */
function aggregateByCOGSAccount(items: CommittedItem[]): Array<{ glAccountNumber: string; amount: number }> {
  const aggregated = new Map<string, number>();
  
  for (const item of items) {
    const current = aggregated.get(item.glAccountNumber) || 0;
    aggregated.set(item.glAccountNumber, current + item.totalCost);
  }
  
  return Array.from(aggregated.entries()).map(([glAccountNumber, amount]) => ({
    glAccountNumber,
    amount,
  }));
}
