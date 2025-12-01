import { Effect } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  GoFixedAssetsPort,
  type GoFixedAssetsPortService,
} from '../../ports/go-fixed-assets-port';
import {
  GoFinancialPort,
  type GoFinancialPortService,
} from '../../ports/go-financial-port';

/**
 * Use Case 7.4: Fixed Asset Depreciation Run
 * 
 * Executes monthly depreciation calculations for all active fixed assets and
 * creates corresponding journal entries to record depreciation expense. This
 * use case is typically run as part of month-end close procedures.
 * 
 * Business Logic:
 * - Calculates depreciation for all depreciable assets
 * - Supports multiple depreciation methods (straight-line, declining balance)
 * - Creates journal entries automatically
 * - Provides detailed depreciation schedule
 * - Handles partial month depreciation
 * 
 * Typical Use: Monthly financial close, automated depreciation processing
 */

/**
 * Fixed Asset Depreciation Run
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

export interface RunMonthlyDepreciationCommand {
  /** Month to calculate depreciation for (YYYY-MM format or Date) */
  periodMonth: Date;
  
  /** User/system initiating the run */
  initiatedBy: string;
  
  /** Optional: Post journal entries automatically */
  autoPost?: boolean;
}

export interface AssetDepreciationDetail {
  assetId: string;
  assetName: string;
  assetTag: string;
  acquisitionDate: Date;
  acquisitionCost: number;
  depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
  usefulLife: number; // In months
  salvageValue: number;
  
  /** Depreciation calculation */
  priorAccumulatedDepreciation: number;
  currentDepreciation: number;
  newAccumulatedDepreciation: number;
  remainingBookValue: number;
  
  /** Status */
  isFullyDepreciated: boolean;
}

export interface RunMonthlyDepreciationResult {
  /** Run metadata */
  metadata: {
    periodMonth: Date;
    runDate: Date;
    initiatedBy: string;
    autoPosted: boolean;
  };
  
  /** Individual asset depreciation details */
  assets: AssetDepreciationDetail[];
  
  /** Journal entry created */
  journalEntry?: {
    id: string;
    entryNumber: string;
    totalDebit: number;
    totalCredit: number;
    status: 'draft' | 'posted';
  };
  
  /** Summary */
  summary: {
    totalAssets: number;
    depreciableAssets: number;
    fullyDepreciatedAssets: number;
    totalDepreciation: number;
  };
}

function validateCommand(
  command: RunMonthlyDepreciationCommand
): Effect.Effect<void, ValidationError> {
  return Effect.gen(function* () {
    const errors: string[] = [];
    
    if (!command.periodMonth) {
      errors.push('Period month is required');
    }
    
    if (command.periodMonth && command.periodMonth > new Date()) {
      errors.push('Period month cannot be in the future');
    }
    
    if (!command.initiatedBy || command.initiatedBy.trim() === '') {
      errors.push('Initiated by user is required');
    }
    
    if (errors.length > 0) {
      return yield* Effect.fail(new ValidationError({ message: errors.join('; ') }));
    }
  });
}

export function runMonthlyDepreciation(
  command: RunMonthlyDepreciationCommand
): Effect.Effect<
  RunMonthlyDepreciationResult,
  ValidationError,
  GoFixedAssetsPortService | GoFinancialPortService
> {
  return Effect.gen(function* () {
    // Step 1: Validate command
    yield* validateCommand(command);
    
    const fixedAssetsPort = yield* GoFixedAssetsPort;
    const financialPort = yield* GoFinancialPort;
    
    const autoPost = command.autoPost ?? false;
    
    // Step 2: Run depreciation calculation in Go backend
    // The Go backend handles all the complex depreciation logic
    const depreciationResult = yield* fixedAssetsPort.runMonthlyDepreciation({
      periodMonth: command.periodMonth,
      initiatedBy: command.initiatedBy,
    });
    
    // Step 3: Extract asset details
    const assetDetails: AssetDepreciationDetail[] = depreciationResult.assets.map(asset => ({
      assetId: asset.id,
      assetName: asset.name,
      assetTag: asset.tag,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCost: asset.acquisitionCost,
      depreciationMethod: asset.depreciationMethod,
      usefulLife: asset.usefulLife,
      salvageValue: asset.salvageValue,
      priorAccumulatedDepreciation: asset.priorAccumulatedDepreciation,
      currentDepreciation: asset.currentDepreciation,
      newAccumulatedDepreciation: asset.newAccumulatedDepreciation,
      remainingBookValue: asset.remainingBookValue,
      isFullyDepreciated: asset.isFullyDepreciated,
    }));
    
    // Step 4: Create journal entry for depreciation expense
    let journalEntry: { id: string; entryNumber: string; totalDebit: number; totalCredit: number; status: 'draft' | 'posted' } | undefined;
    
    const totalDepreciation = assetDetails.reduce((sum, asset) => sum + asset.currentDepreciation, 0);
    
    if (totalDepreciation > 0) {
      // Create JE: Debit Depreciation Expense, Credit Accumulated Depreciation
      const je = yield* financialPort.createJournalEntry({
        entryDate: command.periodMonth,
        description: `Monthly depreciation for ${formatMonth(command.periodMonth)}`,
        reference: `DEP-${formatMonthRef(command.periodMonth)}`,
        createdBy: command.initiatedBy,
        lineItems: [
          {
            accountNumber: '6500', // Depreciation Expense
            description: 'Monthly depreciation expense',
            debit: totalDepreciation,
            credit: 0,
          },
          {
            accountNumber: '1750', // Accumulated Depreciation
            description: 'Monthly accumulated depreciation',
            debit: 0,
            credit: totalDepreciation,
          },
        ],
      });
      
      journalEntry = {
        id: je.id,
        entryNumber: je.entryNumber,
        totalDebit: totalDepreciation,
        totalCredit: totalDepreciation,
        status: 'draft',
      };
      
      // Step 5: Post journal entry if auto-post enabled
      if (autoPost) {
        yield* financialPort.postJournalEntry({
          journalEntryId: je.id,
          postedBy: command.initiatedBy,
          postDate: new Date(),
        });
        journalEntry.status = 'posted';
      }
    }
    
    // Step 6: Calculate summary
    const depreciableAssets = assetDetails.filter(a => !a.isFullyDepreciated).length;
    const fullyDepreciatedAssets = assetDetails.filter(a => a.isFullyDepreciated).length;
    
    return {
      metadata: {
        periodMonth: command.periodMonth,
        runDate: new Date(),
        initiatedBy: command.initiatedBy,
        autoPosted: autoPost && journalEntry !== undefined,
      },
      assets: assetDetails,
      journalEntry,
      summary: {
        totalAssets: assetDetails.length,
        depreciableAssets,
        fullyDepreciatedAssets,
        totalDepreciation,
      },
    };
  });
}

/**
 * Format month for display (e.g., "January 2024")
 */
function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format month for reference (e.g., "202401")
 */
function formatMonthRef(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}
