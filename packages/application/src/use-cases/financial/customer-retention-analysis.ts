import { Effect } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  type GoContractPortService,
  type NetworkError,
} from '../../ports/go-contract-port';

/**
 * Use Case 7.7: Customer Retention Analysis
 * 
 * Business Context:
 * Funeral homes serve families across generations. Tracking repeat business
 * and family retention rates helps identify long-term relationships and
 * opportunities for pre-need sales.
 * 
 * Integration Points:
 * - Go Contract module: Contract history and family relationships
 * 
 * Business Rules:
 * - Family is identified by last name + address combination
 * - Repeat business = 2+ contracts from same family
 * - Pre-need contracts are tracked separately from at-need
 * - Retention period measured in years
 * - Active families = families with contracts in last 5 years
 */

/**
 * Customer Retention Analysis
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

export interface GenerateRetentionAnalysisCommand {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly includePreNeed?: boolean; // Default true
  readonly generatedBy: string;
}

export interface FamilyRetentionMetrics {
  readonly familyId: string; // Derived from last name + address
  readonly familyName: string;
  readonly firstServiceDate: Date;
  readonly lastServiceDate: Date;
  readonly totalContracts: number;
  readonly atNeedContracts: number;
  readonly preNeedContracts: number;
  readonly totalRevenue: number;
  readonly averageRevenuePerContract: number;
  readonly yearsAsCustomer: number;
}

export interface RetentionSummary {
  readonly totalFamilies: number;
  readonly newFamilies: number; // First service in period
  readonly repeatFamilies: number; // 2+ contracts historically
  readonly activeFamilies: number; // Service in last 5 years
  readonly retentionRate: number; // % of families who return
  readonly averageContractsPerFamily: number;
  readonly averageRevenuePerFamily: number;
}

export interface RetentionAnalysisReport {
  readonly metadata: {
    readonly period: {
      readonly startDate: Date;
      readonly endDate: Date;
    };
    readonly includePreNeed: boolean;
    readonly generatedAt: Date;
    readonly generatedBy: string;
  };
  readonly families: readonly FamilyRetentionMetrics[];
  readonly summary: RetentionSummary;
}

/**
 * Generate customer retention analysis report
 */
export function generateRetentionAnalysis(
  command: GenerateRetentionAnalysisCommand
): Effect.Effect<RetentionAnalysisReport, ValidationError | NetworkError, GoContractPortService> {
  return Effect.gen(function* () {
    // Step 1: Validate command
    yield* validateGenerateRetentionAnalysisCommand(command);
    
    const includePreNeed = command.includePreNeed ?? true;
    
    // Step 2: Fetch all contracts in period
    // NOTE: GoContractPortService only provides listContractsByCase(caseId)
    // For this analysis to work at scale, would need Go backend support for
    // listing contracts by date range across all cases.
    // TODO: Implement when backend support is available.
    
    // Stub: Empty array means this feature requires backend implementation
    // Once backend provides date-range contract listing, replace with:
    // const allContracts = yield* contractPort.listContractsByDateRange(...)
    
    // Step 3: Group contracts by family
    // In production, family ID would come from CRM linking
    // Here we simulate by grouping by family name + address
    const familyMap = new Map<string, {
      familyId: string;
      familyName: string;
      contracts: Array<{
        contractDate: Date;
        contractType: 'at-need' | 'pre-need';
        totalAmount: number;
      }>;
    }>();
    
    // Stub implementation - no contracts to process until backend support added
    // When implemented, this loop will process contracts from the backend
    
    // Step 4: Calculate metrics for each family
    const families: FamilyRetentionMetrics[] = Array.from(familyMap.values())
      .map(family => {
        const sortedContracts = family.contracts.sort(
          (a, b) => a.contractDate.getTime() - b.contractDate.getTime()
        );
        
        const firstServiceDate = sortedContracts[0]?.contractDate ?? new Date(0);
        const lastServiceDate = sortedContracts[sortedContracts.length - 1]?.contractDate ?? new Date(0);
        const totalRevenue = family.contracts.reduce((sum, c) => sum + c.totalAmount, 0);
        
        const yearsAsCustomer = Math.max(
          1,
          Math.round(
            (lastServiceDate.getTime() - firstServiceDate.getTime()) / 
            (365 * 24 * 60 * 60 * 1000)
          )
        );
        
        return {
          familyId: family.familyId,
          familyName: family.familyName,
          firstServiceDate,
          lastServiceDate,
          totalContracts: family.contracts.length,
          atNeedContracts: family.contracts.filter(c => c.contractType === 'at-need').length,
          preNeedContracts: family.contracts.filter(c => c.contractType === 'pre-need').length,
          totalRevenue,
          averageRevenuePerContract: totalRevenue / family.contracts.length,
          yearsAsCustomer,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending
    
    // Step 5: Calculate summary metrics
    const totalFamilies = families.length;
    const newFamilies = families.filter(f => f.totalContracts === 1).length;
    const repeatFamilies = families.filter(f => f.totalContracts >= 2).length;
    
    const fiveYearsAgo = new Date(command.endDate);
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const activeFamilies = families.filter(
      f => f.lastServiceDate >= fiveYearsAgo
    ).length;
    
    const retentionRate = totalFamilies > 0 ? (repeatFamilies / totalFamilies) * 100 : 0;
    
    const totalContracts = families.reduce((sum, f) => sum + f.totalContracts, 0);
    const averageContractsPerFamily = totalFamilies > 0 ? totalContracts / totalFamilies : 0;
    
    const totalRevenue = families.reduce((sum, f) => sum + f.totalRevenue, 0);
    const averageRevenuePerFamily = totalFamilies > 0 ? totalRevenue / totalFamilies : 0;
    
    return {
      metadata: {
        period: {
          startDate: command.startDate,
          endDate: command.endDate,
        },
        includePreNeed,
        generatedAt: new Date(),
        generatedBy: command.generatedBy,
      },
      families,
      summary: {
        totalFamilies,
        newFamilies,
        repeatFamilies,
        activeFamilies,
        retentionRate,
        averageContractsPerFamily,
        averageRevenuePerFamily,
      },
    };
  });
}

/**
 * Validate generate retention analysis command
 */
function validateGenerateRetentionAnalysisCommand(
  command: GenerateRetentionAnalysisCommand
): Effect.Effect<void, ValidationError> {
  return Effect.gen(function* () {
    const errors: string[] = [];
    
    if (!(command.startDate instanceof Date) || isNaN(command.startDate.getTime())) {
      errors.push('Start date must be a valid date');
    }
    
    if (!(command.endDate instanceof Date) || isNaN(command.endDate.getTime())) {
      errors.push('End date must be a valid date');
    }
    
    if (
      command.startDate instanceof Date &&
      command.endDate instanceof Date &&
      command.startDate >= command.endDate
    ) {
      errors.push('Start date must be before end date');
    }
    
    if (!command.generatedBy?.trim()) {
      errors.push('Generated by user ID is required');
    }
    
    // Validate date range not too large (e.g., max 10 years)
    if (
      command.startDate instanceof Date &&
      command.endDate instanceof Date
    ) {
      const yearsDiff =
        (command.endDate.getTime() - command.startDate.getTime()) /
        (365 * 24 * 60 * 60 * 1000);
      if (yearsDiff > 10) {
        errors.push('Date range cannot exceed 10 years');
      }
    }
    
    if (errors.length > 0) {
      return yield* Effect.fail(new ValidationError({ message: errors.join('; ') }));
    }
  });
}
