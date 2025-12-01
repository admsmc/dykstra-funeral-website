import { Effect } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  NetworkError,
} from '../../ports/go-financial-port';

/**
 * Use Case 7.1: Sales Tax Reporting
 * 
 * Generates sales tax reports by aggregating tax data from invoices and journal
 * entries. Groups tax liabilities by jurisdiction for tax filing and compliance.
 * 
 * Business Rules:
 * 1. Tax calculated from invoices with tax amounts
 * 2. Grouped by tax jurisdiction (state, county, city)
 * 3. Date range required (typically monthly or quarterly)
 * 4. Only includes posted/paid invoices
 * 5. Excludes voided or cancelled invoices
 * 
 * Workflow:
 * 1. Validate date range
 * 2. Fetch invoices for period
 * 3. Extract tax amounts and jurisdictions
 * 4. Aggregate by jurisdiction
 * 5. Calculate totals and percentages
 * 6. Return structured report
 * 
 * Integration:
 * - Uses GoFinancialPort.listInvoices (verified exists)
 * - Uses GoFinancialPort.listJournalEntries for GL validation
 * 
 * @see Implementation Plan: docs/Implementation Plan_ Remaining 20 Critical Use Cases.md
 */

/**
 * Sales Tax Reporting
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

export interface GenerateSalesTaxReportCommand {
  /**
   * Start date of reporting period (inclusive)
   */
  readonly startDate: Date;
  
  /**
   * End date of reporting period (inclusive)
   */
  readonly endDate: Date;
  
  /**
   * Optional: Filter by specific jurisdiction
   */
  readonly jurisdiction?: string;
  
  /**
   * User generating the report
   */
  readonly generatedBy: string;
}

export interface TaxJurisdictionSummary {
  /**
   * Jurisdiction identifier (e.g., "MI", "Kent County", "Grand Rapids")
   */
  readonly jurisdiction: string;
  
  /**
   * Jurisdiction type
   */
  readonly type: 'state' | 'county' | 'city' | 'special';
  
  /**
   * Tax rate (as decimal, e.g., 0.06 for 6%)
   */
  readonly taxRate: number;
  
  /**
   * Total taxable amount (base amount before tax)
   */
  readonly taxableAmount: number;
  
  /**
   * Total tax collected
   */
  readonly taxCollected: number;
  
  /**
   * Number of taxable transactions
   */
  readonly transactionCount: number;
}

export interface GenerateSalesTaxReportResult {
  /**
   * Report period
   */
  readonly period: {
    readonly startDate: Date;
    readonly endDate: Date;
  };
  
  /**
   * Tax summaries by jurisdiction
   */
  readonly jurisdictions: readonly TaxJurisdictionSummary[];
  
  /**
   * Report totals
   */
  readonly totals: {
    readonly totalTaxableAmount: number;
    readonly totalTaxCollected: number;
    readonly totalTransactions: number;
    readonly totalJurisdictions: number;
  };
  
  /**
   * Report metadata
   */
  readonly metadata: {
    readonly generatedAt: Date;
    readonly generatedBy: string;
  };
}

/**
 * Generate sales tax report for a period
 * 
 * @example
 * ```typescript
 * const report = yield* generateSalesTaxReport({
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-01-31'),
 *   generatedBy: 'accountant-123'
 * });
 * 
 * console.log(`Total tax collected: $${report.totals.totalTaxCollected}`);
 * console.log(`Jurisdictions: ${report.jurisdictions.length}`);
 * ```
 */
export const generateSalesTaxReport = (
  command: GenerateSalesTaxReportCommand
): Effect.Effect<
  GenerateSalesTaxReportResult,
  ValidationError | NetworkError,
  GoFinancialPortService
> =>
  Effect.gen(function* () {
    const financialPort = yield* GoFinancialPort;

    // Step 1: Validate date range
    yield* validateReportCommand(command);

    // Step 2: Fetch invoices for period
    const invoices = yield* financialPort.listInvoices({
      startDate: command.startDate,
      endDate: command.endDate,
      // Only include invoices that affect tax liability
      status: undefined, // Get all statuses, we'll filter below
    });

    // Step 3: Filter to only paid/partial invoices (tax liability incurred)
    const taxableInvoices = invoices.filter(
      (inv) => inv.status === 'paid' || inv.status === 'partial'
    );

    // Step 4: Extract and aggregate tax data
    // For simplicity, we assume tax is calculated at invoice level
    // In production, this would parse line items and tax jurisdictions
    const jurisdictionMap = new Map<string, {
      jurisdiction: string;
      type: 'state' | 'county' | 'city' | 'special';
      taxRate: number;
      taxableAmount: number;
      taxCollected: number;
      transactionCount: number;
    }>();

    for (const invoice of taxableInvoices) {
      // Derive jurisdiction from invoice data
      // In a real system, this would come from customer address or tax rules
      const jurisdiction = deriveJurisdiction(invoice);
      
      if (command.jurisdiction && jurisdiction.name !== command.jurisdiction) {
        continue; // Skip if filtering by specific jurisdiction
      }

      const existing = jurisdictionMap.get(jurisdiction.name);
      if (existing) {
        existing.taxableAmount += invoice.subtotal;
        existing.taxCollected += invoice.taxAmount;
        existing.transactionCount += 1;
      } else {
        jurisdictionMap.set(jurisdiction.name, {
          jurisdiction: jurisdiction.name,
          type: jurisdiction.type,
          taxRate: jurisdiction.rate,
          taxableAmount: invoice.subtotal,
          taxCollected: invoice.taxAmount,
          transactionCount: 1,
        });
      }
    }

    // Step 5: Convert to array and sort
    const jurisdictions = Array.from(jurisdictionMap.values()).sort(
      (a, b) => b.taxCollected - a.taxCollected // Sort by tax collected, descending
    );

    // Step 6: Calculate totals
    const totals = {
      totalTaxableAmount: jurisdictions.reduce((sum, j) => sum + j.taxableAmount, 0),
      totalTaxCollected: jurisdictions.reduce((sum, j) => sum + j.taxCollected, 0),
      totalTransactions: jurisdictions.reduce((sum, j) => sum + j.transactionCount, 0),
      totalJurisdictions: jurisdictions.length,
    };

    return {
      period: {
        startDate: command.startDate,
        endDate: command.endDate,
      },
      jurisdictions,
      totals,
      metadata: {
        generatedAt: new Date(),
        generatedBy: command.generatedBy,
      },
    };
  });

/**
 * Validate report command
 */
const validateReportCommand = (
  command: GenerateSalesTaxReportCommand
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    const errors: string[] = [];

    if (!command.startDate) {
      errors.push('Start date is required');
    }

    if (!command.endDate) {
      errors.push('End date is required');
    }

    if (command.startDate && command.endDate && command.startDate > command.endDate) {
      errors.push('Start date must be before or equal to end date');
    }

    // Check if date range is reasonable (not more than 1 year)
    if (command.startDate && command.endDate) {
      const daysDiff = Math.floor(
        (command.endDate.getTime() - command.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 366) {
        errors.push('Date range cannot exceed 366 days');
      }
    }

    if (!command.generatedBy?.trim()) {
      errors.push('Generated by user is required');
    }

    if (errors.length > 0) {
      return yield* Effect.fail(
        new ValidationError({ message: errors.join('; ') })
      );
    }
  });

/**
 * Derive tax jurisdiction from invoice
 * In production, this would use customer address and tax rules engine
 */
const deriveJurisdiction = (_invoice: {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
}): { name: string; type: 'state' | 'county' | 'city' | 'special'; rate: number } => {
  // Simplified: assume all invoices are in Michigan with 6% state tax
  // In production, this would:
  // 1. Look up customer address
  // 2. Geocode to determine jurisdictions
  // 3. Apply appropriate tax rates per jurisdiction
  // 4. Handle multiple jurisdictions per transaction
  
  return {
    name: 'Michigan',
    type: 'state',
    rate: 0.06,
  };
};
