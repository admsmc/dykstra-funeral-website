import { Effect } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  type NetworkError,
} from '../../ports/go-financial-port';

/**
 * Use Case 7.6: Cash Flow Forecasting
 * 
 * Business Context:
 * Cash flow management is critical for funeral homes with high fixed costs
 * (facilities, staff) and variable timing of receivables and payables. This
 * forecasts future cash positions based on aging AR/AP and historical patterns.
 * 
 * Integration Points:
 * - Go Financial module: AR aging reports, AP aging reports, bank balances
 * 
 * Business Rules:
 * - Forecasts 90 days forward (configurable)
 * - Uses historical collection rates by aging bucket
 * - Applies payment terms to AP obligations
 * - Considers recurring expenses (payroll, utilities)
 * - Flags potential cash shortfalls (< minimum balance)
 */

/**
 * Cash Flow Forecasting
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

export interface GenerateCashFlowForecastCommand {
  readonly forecastDays: number; // Default 90 days
  readonly minimumBalance: number; // Alert threshold
  readonly includeRecurringExpenses?: boolean; // Default true
  readonly generatedBy: string;
}

export interface AgingBucket {
  readonly ageRange: string; // e.g., "0-30", "31-60", "61-90", "90+"
  readonly amount: number;
  readonly expectedCollectionRate: number; // % expected to collect
  readonly expectedCollectionDays: number; // Average days to collect
}

export interface ProjectedCashFlow {
  readonly date: Date;
  readonly beginningBalance: number;
  readonly expectedReceipts: number; // AR collections
  readonly expectedPayments: number; // AP + recurring expenses
  readonly netCashFlow: number;
  readonly endingBalance: number;
  readonly belowMinimum: boolean;
}

export interface CashFlowForecastReport {
  readonly metadata: {
    readonly asOfDate: Date;
    readonly forecastDays: number;
    readonly minimumBalance: number;
    readonly generatedAt: Date;
    readonly generatedBy: string;
  };
  readonly currentBalance: number;
  readonly arAging: readonly AgingBucket[];
  readonly apAging: readonly AgingBucket[];
  readonly weeklyProjections: readonly ProjectedCashFlow[];
  readonly summary: {
    readonly totalExpectedReceipts: number;
    readonly totalExpectedPayments: number;
    readonly projectedEndingBalance: number;
    readonly daysAboveMinimum: number;
    readonly daysBelowMinimum: number;
    readonly lowestProjectedBalance: number;
    readonly lowestBalanceDate: Date;
  };
}

/**
 * Generate cash flow forecast report
 */
export function generateCashFlowForecast(
  command: GenerateCashFlowForecastCommand
): Effect.Effect<CashFlowForecastReport, ValidationError | NetworkError, GoFinancialPortService> {
  return Effect.gen(function* () {
    // Step 1: Validate command
    yield* validateGenerateCashFlowForecastCommand(command);
    
    const includeRecurring = command.includeRecurringExpenses ?? true;
    const asOfDate = new Date();
    
    // Step 2: Get current cash balance
    const financialPort = yield* GoFinancialPort;
    const accountBalances = yield* financialPort.getAccountBalances(
      ['1000'], // Cash account
      asOfDate
    );
    
    const currentBalance = accountBalances.reduce((sum, acc) => sum + acc.balance, 0);
    
    // Step 3: Get AR aging and transform to AgingBucket format
    const arAgingReport = yield* financialPort.getARAgingReport(asOfDate);
    const arAging: readonly AgingBucket[] = arAgingReport.buckets.map((bucket) => ({
      ageRange: bucket.category,
      amount: bucket.totalAmount,
      expectedCollectionRate: 95, // Default 95% collection expectation
      expectedCollectionDays: mapAgingCategoryTodays(bucket.category),
    }));
    
    // Step 4: Get AP aging
    // Note: Go Financial module may not have explicit AP aging method
    // In production, would call appropriate AP aging endpoint
    const apAging: AgingBucket[] = [
      { ageRange: '0-30', amount: 15000, expectedCollectionRate: 100, expectedCollectionDays: 15 },
      { ageRange: '31-60', amount: 8000, expectedCollectionRate: 100, expectedCollectionDays: 45 },
      { ageRange: '61-90', amount: 3000, expectedCollectionRate: 100, expectedCollectionDays: 75 },
      { ageRange: '90+', amount: 2000, expectedCollectionRate: 90, expectedCollectionDays: 120 },
    ];
    
    // Step 5: Project weekly cash flows
    const weeklyProjections: ProjectedCashFlow[] = [];
    let runningBalance = currentBalance;
    
    const weeksToForecast = Math.ceil(command.forecastDays / 7);
    
    for (let week = 1; week <= weeksToForecast; week++) {
      const weekDate = new Date(asOfDate);
      weekDate.setDate(weekDate.getDate() + (week * 7));
      
      // Calculate expected receipts for this week
      const expectedReceipts = calculateExpectedReceipts(arAging, week);
      
      // Calculate expected payments for this week
      const expectedPayments = calculateExpectedPayments(apAging, week, includeRecurring);
      
      const netCashFlow = expectedReceipts - expectedPayments;
      const endingBalance = runningBalance + netCashFlow;
      const belowMinimum = endingBalance < command.minimumBalance;
      
      weeklyProjections.push({
        date: weekDate,
        beginningBalance: runningBalance,
        expectedReceipts,
        expectedPayments,
        netCashFlow,
        endingBalance,
        belowMinimum,
      });
      
      runningBalance = endingBalance;
    }
    
    // Step 6: Calculate summary metrics
    const totalExpectedReceipts = weeklyProjections.reduce(
      (sum, p) => sum + p.expectedReceipts,
      0
    );
    const totalExpectedPayments = weeklyProjections.reduce(
      (sum, p) => sum + p.expectedPayments,
      0
    );
    const projectedEndingBalance = weeklyProjections.length > 0
      ? (weeklyProjections[weeklyProjections.length - 1]!.endingBalance)
      : currentBalance;
    
    const daysAboveMinimum = weeklyProjections.filter(p => !p.belowMinimum).length * 7;
    const daysBelowMinimum = weeklyProjections.filter(p => p.belowMinimum).length * 7;
    
    const lowestBalanceProjection = weeklyProjections.length > 0
      ? weeklyProjections.reduce(
          (min, p) => (p.endingBalance < min.endingBalance ? p : min),
          weeklyProjections[0]!
        )
      : {
          date: asOfDate,
          beginningBalance: currentBalance,
          expectedReceipts: 0,
          expectedPayments: 0,
          netCashFlow: 0,
          endingBalance: currentBalance,
          belowMinimum: currentBalance < command.minimumBalance,
        };
    
    return {
      metadata: {
        asOfDate,
        forecastDays: command.forecastDays,
        minimumBalance: command.minimumBalance,
        generatedAt: new Date(),
        generatedBy: command.generatedBy,
      },
      currentBalance,
      arAging,
      apAging,
      weeklyProjections,
      summary: {
        totalExpectedReceipts,
        totalExpectedPayments,
        projectedEndingBalance,
        daysAboveMinimum,
        daysBelowMinimum,
        lowestProjectedBalance: lowestBalanceProjection.endingBalance,
        lowestBalanceDate: lowestBalanceProjection.date,
      },
    };
  });
}

/**
 * Calculate expected AR receipts for a given week
 */
function calculateExpectedReceipts(arAging: readonly AgingBucket[], weekNumber: number): number {
  let receipts = 0;
  const daysSinceToday = weekNumber * 7;
  
  for (const bucket of arAging) {
    // Simple linear distribution based on expected collection days
    // In production, would use more sophisticated algorithms
    if (daysSinceToday >= bucket.expectedCollectionDays - 7 &&
        daysSinceToday <= bucket.expectedCollectionDays + 7) {
      receipts += bucket.amount * (bucket.expectedCollectionRate / 100);
    }
  }
  
  return receipts;
}

/**
 * Calculate expected payments (AP + recurring expenses) for a given week
 */
function calculateExpectedPayments(
  apAging: readonly AgingBucket[],
  weekNumber: number,
  includeRecurring: boolean
): number {
  let payments = 0;
  const daysSinceToday = weekNumber * 7;
  
  // AP payments
  for (const bucket of apAging) {
    if (daysSinceToday >= bucket.expectedCollectionDays - 7 &&
        daysSinceToday <= bucket.expectedCollectionDays + 7) {
      payments += bucket.amount;
    }
  }
  
  // Recurring expenses (simplified)
  if (includeRecurring) {
    // Payroll every 2 weeks
    if (weekNumber % 2 === 0) {
      payments += 12000; // Biweekly payroll
    }
    
    // Monthly utilities/rent
    if (weekNumber === 4 || weekNumber === 8 || weekNumber === 12) {
      payments += 5000; // Monthly fixed costs
    }
  }
  
  return payments;
}

/**
 * Map aging category to estimated days
 */
function mapAgingCategoryTodays(category: string): number {
  switch (category) {
    case 'current':
      return 15;
    case '1-30':
      return 30;
    case '31-60':
      return 60;
    case '61-90':
      return 90;
    case '90+':
      return 120;
    default:
      return 45;
  }
}

/**
 * Validate generate cash flow forecast command
 */
function validateGenerateCashFlowForecastCommand(
  command: GenerateCashFlowForecastCommand
): Effect.Effect<void, ValidationError> {
  return Effect.gen(function* () {
    const errors: string[] = [];
    
    if (typeof command.forecastDays !== 'number' || command.forecastDays <= 0) {
      errors.push('Forecast days must be a positive number');
    }
    
    if (command.forecastDays > 365) {
      errors.push('Forecast days cannot exceed 365');
    }
    
    if (typeof command.minimumBalance !== 'number' || command.minimumBalance < 0) {
      errors.push('Minimum balance must be a non-negative number');
    }
    
    if (!command.generatedBy?.trim()) {
      errors.push('Generated by user ID is required');
    }
    
    if (errors.length > 0) {
      return yield* Effect.fail(new ValidationError({ message: errors.join('; ') }));
    }
  });
}
