import { describe, it, expect, vi } from 'vitest';
import { Effect } from 'effect';
import { GoFinancialPort, type GoFinancialPortService, type GoARAgingReport, NetworkError } from '../../../ports/go-financial-port';
import { GoBudgetPort, type GoBudgetPortService, type GoBudgetVarianceReport } from '../../../ports/go-budget-port';
import { generateARAgingReport } from '../ar-aging-report';
import { generateBudgetVarianceReport } from '../budget-variance-report';

/**
 * Integration tests for Phase 4: Reporting & Compliance use cases
 * 
 * Tests cover:
 * 1. AR Aging Report Generation (1.7) - 2 tests
 * 2. Budget vs. Actual Variance Report (1.11) - 2 tests
 */

describe('Phase 4: Reporting & Compliance Use Cases', () => {
  describe('Use Case 1.7: AR Aging Report Generation', () => {
    it('should generate AR aging report with priority scoring and recommendations', async () => {
      // Mock AR aging data
      const mockAgingReport: GoARAgingReport = {
        asOfDate: new Date('2025-01-31'),
        customers: [
          {
            customerId: 'cust-001',
            customerName: 'Family Johnson',
            current: 1000.0,
            days1to30: 500.0,
            days31to60: 0,
            days61to90: 0,
            days90Plus: 0,
            totalOutstanding: 1500.0,
          },
          {
            customerId: 'cust-002',
            customerName: 'Family Smith',
            current: 0,
            days1to30: 0,
            days31to60: 2000.0,
            days61to90: 1000.0,
            days90Plus: 0,
            totalOutstanding: 3000.0,
          },
          {
            customerId: 'cust-003',
            customerName: 'Family Williams',
            current: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            days90Plus: 6000.0,
            totalOutstanding: 6000.0,
          },
        ],
        buckets: [
          { category: 'current', invoiceCount: 1, totalAmount: 1000.0 },
          { category: '1-30', invoiceCount: 1, totalAmount: 500.0 },
          { category: '31-60', invoiceCount: 1, totalAmount: 2000.0 },
          { category: '61-90', invoiceCount: 1, totalAmount: 1000.0 },
          { category: '90+', invoiceCount: 1, totalAmount: 6000.0 },
        ],
        totalOutstanding: 10500.0,
      };

      const mockFinancialPort: GoFinancialPortService = {
        getARAgingReport: vi.fn(() => Effect.succeed(mockAgingReport)),
        getChartOfAccounts: vi.fn(() => Effect.succeed([])),
        getGLAccount: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getGLAccountByNumber: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        postJournalEntry: vi.fn(() => Effect.void),
        reverseJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listJournalEntries: vi.fn(() => Effect.succeed([])),
        generateFinancialStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getTrialBalance: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateBalanceSheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateIncomeStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateCashFlowStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listInvoices: vi.fn(() => Effect.succeed([])),
        recordPayment: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listVendorBills: vi.fn(() => Effect.succeed([])),
        payVendorBills: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        executeAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        startReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        addReconciliationItem: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        initiateMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        runDepreciation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      const result = await Effect.runPromise(
        generateARAgingReport({
          asOfDate: new Date('2025-01-31'),
        }).pipe(Effect.provideService(GoFinancialPort, mockFinancialPort))
      );

      // Assertions
      expect(result.totalOutstanding).toBe(10500.0);
      expect(result.overdueCount).toBe(3); // All 3 families have overdue balances (days1to30, days31to60, days90Plus)
      expect(result.customers).toHaveLength(3);

      // Verify customers are sorted by priority score (highest first)
      expect(result.customers[0].customerName).toBe('Family Williams'); // 90+ days, highest priority
      expect(result.customers[0].priorityScore).toBeGreaterThan(result.customers[1].priorityScore);
      expect(result.customers[0].recommendedAction).toContain('URGENT');

      // Verify recommendations are generated
      expect(result.customers.every(c => c.recommendedAction.length > 0)).toBe(true);

      // Verify aging buckets are mapped correctly
      expect(result.agingBuckets.current.totalAmount).toBe(1000.0);
      expect(result.agingBuckets.days90Plus.totalAmount).toBe(6000.0);

      expect(mockFinancialPort.getARAgingReport).toHaveBeenCalledWith(new Date('2025-01-31'));
    });

    it('should handle empty aging report gracefully', async () => {
      const mockEmptyReport: GoARAgingReport = {
        asOfDate: new Date('2025-01-31'),
        customers: [],
        buckets: [],
        totalOutstanding: 0,
      };

      const mockFinancialPort: GoFinancialPortService = {
        getARAgingReport: vi.fn(() => Effect.succeed(mockEmptyReport)),
        getChartOfAccounts: vi.fn(() => Effect.succeed([])),
        getGLAccount: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getGLAccountByNumber: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        postJournalEntry: vi.fn(() => Effect.void),
        reverseJournalEntry: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listJournalEntries: vi.fn(() => Effect.succeed([])),
        generateFinancialStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getTrialBalance: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateBalanceSheet: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateIncomeStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        generateCashFlowStatement: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getInvoice: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listInvoices: vi.fn(() => Effect.succeed([])),
        recordPayment: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getVendorBill: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        listVendorBills: vi.fn(() => Effect.succeed([])),
        payVendorBills: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        createAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        executeAPPaymentRun: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        startReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        addReconciliationItem: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeReconciliation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        initiateMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        runDepreciation: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        finalizeMonthEndClose: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
      };

      const result = await Effect.runPromise(
        generateARAgingReport({
          asOfDate: new Date('2025-01-31'),
        }).pipe(Effect.provideService(GoFinancialPort, mockFinancialPort))
      );

      expect(result.totalOutstanding).toBe(0);
      expect(result.overdueCount).toBe(0);
      expect(result.customers).toHaveLength(0);
      expect(result.agingBuckets.current.totalAmount).toBe(0);
    });
  });

  describe('Use Case 1.11: Budget vs. Actual Variance Report', () => {
    it('should generate budget variance report with categorization and recommendations', async () => {
      const mockVarianceReport: GoBudgetVarianceReport = {
        period: new Date('2025-01-31'),
        accounts: [
          {
            accountNumber: '4100',
            accountName: 'Professional Services Revenue',
            budgetAmount: 100000.0,
            actualAmount: 111000.0,
            variance: 11000.0,
            variancePercent: 11.0, // >10% to be significant
          },
          {
            accountNumber: '5200',
            accountName: 'Payroll Expense',
            budgetAmount: 50000.0,
            actualAmount: 60000.0,
            variance: 10000.0,
            variancePercent: 20.0,
          },
          {
            accountNumber: '5600',
            accountName: 'Marketing Expense',
            budgetAmount: 10000.0,
            actualAmount: 8000.0,
            variance: -2000.0,
            variancePercent: -20.0,
          },
        ],
      };

      const mockBudgetPort: GoBudgetPortService = {
        getBudgetVarianceReport: vi.fn(() => Effect.succeed(mockVarianceReport)),
        createBudget: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getBudget: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        updateBudgetAccount: vi.fn(() => Effect.void),
        approveBudget: vi.fn(() => Effect.void),
      };

      const result = await Effect.runPromise(
        generateBudgetVarianceReport({
          period: new Date('2025-01-31'),
        }).pipe(Effect.provideService(GoBudgetPort, mockBudgetPort))
      );

      // Assertions
      expect(result.totalBudget).toBe(160000.0);
      expect(result.totalActual).toBe(179000.0); // 111000 + 60000 + 8000
      expect(result.totalVariance).toBe(19000.0);
      expect(result.accounts).toHaveLength(3);

      // Verify revenue account categorization
      const revenueAccount = result.accounts.find(a => a.accountNumber === '4100');
      expect(revenueAccount?.category).toBe('revenue');
      expect(revenueAccount?.isFavorable).toBe(true); // Positive variance is favorable for revenue
      expect(revenueAccount?.isSignificant).toBe(true); // 10% variance is significant

      // Verify expense account categorization
      const payrollAccount = result.accounts.find(a => a.accountNumber === '5200');
      expect(payrollAccount?.category).toBe('expense');
      expect(payrollAccount?.isFavorable).toBe(false); // Positive variance is unfavorable for expense
      expect(payrollAccount?.isSignificant).toBe(true); // 20% variance is significant
      expect(payrollAccount?.recommendation).toContain('Over budget');

      const marketingAccount = result.accounts.find(a => a.accountNumber === '5600');
      expect(marketingAccount?.category).toBe('expense');
      expect(marketingAccount?.isFavorable).toBe(true); // Negative variance is favorable for expense
      expect(marketingAccount?.isSignificant).toBe(true); // 20% variance is significant

      // Verify summary statistics
      expect(result.summary.significantVarianceCount).toBe(3);
      expect(result.summary.favorableVarianceCount).toBe(2); // Revenue and Marketing
      expect(result.summary.unfavorableVarianceCount).toBe(1); // Payroll

      expect(mockBudgetPort.getBudgetVarianceReport).toHaveBeenCalledWith(new Date('2025-01-31'));
    });

    it('should handle report with no significant variances', async () => {
      const mockVarianceReport: GoBudgetVarianceReport = {
        period: new Date('2025-01-31'),
        accounts: [
          {
            accountNumber: '4100',
            accountName: 'Professional Services Revenue',
            budgetAmount: 100000.0,
            actualAmount: 102000.0,
            variance: 2000.0,
            variancePercent: 2.0, // Below 10% threshold
          },
          {
            accountNumber: '5200',
            accountName: 'Payroll Expense',
            budgetAmount: 50000.0,
            actualAmount: 51000.0,
            variance: 1000.0,
            variancePercent: 2.0, // Below 10% threshold
          },
        ],
      };

      const mockBudgetPort: GoBudgetPortService = {
        getBudgetVarianceReport: vi.fn(() => Effect.succeed(mockVarianceReport)),
        createBudget: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        getBudget: vi.fn(() => Effect.fail(new NetworkError({ message: 'Not implemented' }))),
        updateBudgetAccount: vi.fn(() => Effect.void),
        approveBudget: vi.fn(() => Effect.void),
      };

      const result = await Effect.runPromise(
        generateBudgetVarianceReport({
          period: new Date('2025-01-31'),
        }).pipe(Effect.provideService(GoBudgetPort, mockBudgetPort))
      );

      // All variances should be categorized as non-significant
      expect(result.accounts.every(a => !a.isSignificant)).toBe(true);
      expect(result.accounts.every(a => a.recommendation.includes('within acceptable range'))).toBe(true);
      expect(result.summary.significantVarianceCount).toBe(0);
      expect(result.summary.favorableVarianceCount).toBe(0);
      expect(result.summary.unfavorableVarianceCount).toBe(0);
    });
  });
});
