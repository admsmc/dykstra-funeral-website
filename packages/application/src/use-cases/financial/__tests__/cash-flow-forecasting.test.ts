import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  generateCashFlowForecast,
  type GenerateCashFlowForecastCommand,
  type AgingBucket,
} from '../cash-flow-forecasting';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  NetworkError,
} from '../../../ports/go-financial-port';

const mockAccountBalances = [
  {
    accountNumber: '1000',
    accountName: 'Cash - Operating Account',
    balance: 75000,
    asOfDate: new Date(),
  },
];

const mockARAging: AgingBucket[] = [
  { ageRange: '0-30', amount: 25000, expectedCollectionRate: 95, expectedCollectionDays: 21 },
  { ageRange: '31-60', amount: 15000, expectedCollectionRate: 85, expectedCollectionDays: 49 },
  { ageRange: '61-90', amount: 8000, expectedCollectionRate: 70, expectedCollectionDays: 77 },
  { ageRange: '90+', amount: 5000, expectedCollectionRate: 40, expectedCollectionDays: 120 },
];

const baseCommand: GenerateCashFlowForecastCommand = {
  forecastDays: 90,
  minimumBalance: 50000,
  includeRecurringExpenses: true,
  generatedBy: 'cfo-123',
};

describe('Use Case 7.6: Cash Flow Forecasting', () => {
  describe('Happy Paths', () => {
    it('should generate 90-day cash flow forecast', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        getAccountBalances: () => Effect.succeed(mockAccountBalances),
        getARAgingReport: () => Effect.succeed(mockARAging),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
        createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
        generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
        createRefund: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateCashFlowForecast(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      // Verify metadata
      expect(result.metadata.forecastDays).toBe(90);
      expect(result.metadata.minimumBalance).toBe(50000);
      expect(result.metadata.generatedBy).toBe('cfo-123');
      
      // Verify current balance
      expect(result.currentBalance).toBe(75000);
      
      // Verify AR aging included
      expect(result.arAging.length).toBe(4);
      expect(result.arAging[0].ageRange).toBe('0-30');
      
      // Verify AP aging included
      expect(result.apAging.length).toBeGreaterThan(0);
      
      // Verify weekly projections (90 days = ~13 weeks)
      expect(result.weeklyProjections.length).toBeGreaterThanOrEqual(12);
      expect(result.weeklyProjections.length).toBeLessThanOrEqual(14);
      
      // Verify each projection has required fields
      const firstWeek = result.weeklyProjections[0];
      expect(firstWeek.beginningBalance).toBe(75000);
      expect(firstWeek.expectedReceipts).toBeGreaterThanOrEqual(0);
      expect(firstWeek.expectedPayments).toBeGreaterThanOrEqual(0);
      expect(typeof firstWeek.belowMinimum).toBe('boolean');
      
      // Verify summary metrics
      expect(result.summary.totalExpectedReceipts).toBeGreaterThan(0);
      expect(result.summary.totalExpectedPayments).toBeGreaterThan(0);
      expect(result.summary.projectedEndingBalance).toBeDefined();
      expect(result.summary.lowestProjectedBalance).toBeDefined();
      expect(result.summary.lowestBalanceDate).toBeInstanceOf(Date);
    });

    it('should flag periods below minimum balance', async () => {
      const commandWithHighMinimum = {
        ...baseCommand,
        minimumBalance: 100000, // Higher than starting balance
      };

      const mockFinancialPort: GoFinancialPortService = {
        getAccountBalances: () => Effect.succeed(mockAccountBalances),
        getARAgingReport: () => Effect.succeed(mockARAging),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
        createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
        generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
        createRefund: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateCashFlowForecast(commandWithHighMinimum).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      // Should have periods below minimum
      const belowMinimumWeeks = result.weeklyProjections.filter(p => p.belowMinimum);
      expect(belowMinimumWeeks.length).toBeGreaterThan(0);
      
      // Days below minimum should be tracked
      expect(result.summary.daysBelowMinimum).toBeGreaterThan(0);
    });

    it('should exclude recurring expenses when requested', async () => {
      const commandWithoutRecurring = {
        ...baseCommand,
        includeRecurringExpenses: false,
      };

      const mockFinancialPort: GoFinancialPortService = {
        getAccountBalances: () => Effect.succeed(mockAccountBalances),
        getARAgingReport: () => Effect.succeed(mockARAging),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
        createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
        generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
        createRefund: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const resultWithRecurring = await Effect.runPromise(
        generateCashFlowForecast(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      const resultWithoutRecurring = await Effect.runPromise(
        generateCashFlowForecast(commandWithoutRecurring).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      // Without recurring expenses, payments should be lower
      expect(resultWithoutRecurring.summary.totalExpectedPayments).toBeLessThan(
        resultWithRecurring.summary.totalExpectedPayments
      );
    });

    it('should handle custom forecast periods', async () => {
      const shortForecast = {
        ...baseCommand,
        forecastDays: 28, // 4 weeks
      };

      const mockFinancialPort: GoFinancialPortService = {
        getAccountBalances: () => Effect.succeed(mockAccountBalances),
        getARAgingReport: () => Effect.succeed(mockARAging),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
        createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
        generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
        createRefund: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = await Effect.runPromise(
        generateCashFlowForecast(shortForecast).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      // Should have exactly 4 weeks of projections
      expect(result.weeklyProjections.length).toBe(4);
    });
  });

  describe('Validation Errors', () => {
    it('should fail when forecast days is zero', async () => {
      const invalidCommand = {
        ...baseCommand,
        forecastDays: 0,
      };

      const mockPort: GoFinancialPortService = {
        getAccountBalances: () => Effect.fail(new NetworkError('Should not be called')),
        getARAgingReport: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
        createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
        generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
        createRefund: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateCashFlowForecast(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockPort))
        )
      );

      await expect(result).rejects.toThrow('Forecast days must be a positive number');
    });

    it('should fail when forecast days exceeds 365', async () => {
      const invalidCommand = {
        ...baseCommand,
        forecastDays: 400,
      };

      const mockPort: GoFinancialPortService = {
        getAccountBalances: () => Effect.fail(new NetworkError('Should not be called')),
        getARAgingReport: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
        createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
        generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
        createRefund: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateCashFlowForecast(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockPort))
        )
      );

      await expect(result).rejects.toThrow('Forecast days cannot exceed 365');
    });

    it('should fail when minimum balance is negative', async () => {
      const invalidCommand = {
        ...baseCommand,
        minimumBalance: -1000,
      };

      const mockPort: GoFinancialPortService = {
        getAccountBalances: () => Effect.fail(new NetworkError('Should not be called')),
        getARAgingReport: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
        createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
        generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
        createRefund: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateCashFlowForecast(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockPort))
        )
      );

      await expect(result).rejects.toThrow('Minimum balance must be a non-negative number');
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from getAccountBalances', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        getAccountBalances: () => Effect.fail(new NetworkError('Connection timeout')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.fail(new NetworkError('Not implemented')),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.fail(new NetworkError('Not implemented')),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getCustomerPayments: () => Effect.fail(new NetworkError('Not implemented')),
        createVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        uploadAndScanBill: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        approveVendorBill: () => Effect.fail(new NetworkError('Not implemented')),
        payVendorBills: () => Effect.fail(new NetworkError('Not implemented')),
        getVendorPayment: () => Effect.fail(new NetworkError('Not implemented')),
        listVendorPayments: () => Effect.fail(new NetworkError('Not implemented')),
        generateNACHAFile: () => Effect.fail(new NetworkError('Not implemented')),
        createRefund: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const result = Effect.runPromise(
        generateCashFlowForecast(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Connection timeout');
    });
  });
});
