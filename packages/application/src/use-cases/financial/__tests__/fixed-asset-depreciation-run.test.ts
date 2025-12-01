import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  runMonthlyDepreciation,
  type RunMonthlyDepreciationCommand,
} from '../fixed-asset-depreciation-run';
import {
  GoFixedAssetsPort,
  type GoFixedAssetsPortService,
  NetworkError,
} from '../../../ports/go-fixed-assets-port';
import {
  GoFinancialPort,
  type GoFinancialPortService,
} from '../../../ports/go-financial-port';

const baseCommand: RunMonthlyDepreciationCommand = {
  periodMonth: new Date('2024-01-31'),
  initiatedBy: 'system-scheduler',
  autoPost: false,
};

describe('Use Case 7.4: Fixed Asset Depreciation Run', () => {
  describe('Happy Paths', () => {
    it('should run depreciation and create journal entry', async () => {
      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () =>
          Effect.succeed({
            periodMonth: new Date('2024-01-31'),
            assets: [
              {
                id: 'asset-1',
                name: 'Hearse Vehicle',
                tag: 'VEH-001',
                acquisitionDate: new Date('2020-01-01'),
                acquisitionCost: 60000,
                depreciationMethod: 'straight_line' as const,
                usefulLife: 120, // 10 years in months
                salvageValue: 10000,
                priorAccumulatedDepreciation: 20000,
                currentDepreciation: 416.67, // (60000-10000)/120
                newAccumulatedDepreciation: 20416.67,
                remainingBookValue: 39583.33,
                isFullyDepreciated: false,
              },
              {
                id: 'asset-2',
                name: 'Embalming Equipment',
                tag: 'EQ-042',
                acquisitionDate: new Date('2022-06-01'),
                acquisitionCost: 15000,
                depreciationMethod: 'straight_line' as const,
                usefulLife: 60, // 5 years
                salvageValue: 1000,
                priorAccumulatedDepreciation: 4666.67,
                currentDepreciation: 233.33, // (15000-1000)/60
                newAccumulatedDepreciation: 4900,
                remainingBookValue: 10100,
                isFullyDepreciated: false,
              },
            ],
          }),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: (cmd) => {
          // Verify journal entry structure
          expect(cmd.lineItems.length).toBe(2);
          expect(cmd.lineItems[0].accountNumber).toBe('6500'); // Depreciation Expense
          expect(cmd.lineItems[0].debit).toBeCloseTo(650, 2); // 416.67 + 233.33
          expect(cmd.lineItems[1].accountNumber).toBe('1750'); // Accumulated Depreciation
          expect(cmd.lineItems[1].credit).toBeCloseTo(650, 2);

          return Effect.succeed({
            id: 'je-001',
            entryNumber: 'JE-202401-001',
            entryDate: cmd.entryDate,
            description: cmd.description,
            reference: cmd.reference,
            status: 'draft' as const,
            lineItems: cmd.lineItems.map((li, idx) => ({
              ...li,
              id: `line-${idx + 1}`,
            })),
            createdAt: new Date(),
            createdBy: cmd.createdBy,
          });
        },
        postJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      // Verify result structure
      expect(result.metadata.periodMonth).toEqual(baseCommand.periodMonth);
      expect(result.metadata.initiatedBy).toBe('system-scheduler');
      expect(result.metadata.autoPosted).toBe(false);

      // Verify assets
      expect(result.assets.length).toBe(2);
      expect(result.assets[0].assetName).toBe('Hearse Vehicle');
      expect(result.assets[0].currentDepreciation).toBeCloseTo(416.67, 2);
      expect(result.assets[1].assetName).toBe('Embalming Equipment');
      expect(result.assets[1].currentDepreciation).toBeCloseTo(233.33, 2);

      // Verify journal entry created
      expect(result.journalEntry).toBeDefined();
      expect(result.journalEntry?.status).toBe('draft');
      expect(result.journalEntry?.totalDebit).toBeCloseTo(650, 2);
      expect(result.journalEntry?.totalCredit).toBeCloseTo(650, 2);

      // Verify summary
      expect(result.summary.totalAssets).toBe(2);
      expect(result.summary.depreciableAssets).toBe(2);
      expect(result.summary.fullyDepreciatedAssets).toBe(0);
      expect(result.summary.totalDepreciation).toBeCloseTo(650, 2);
    });

    it('should auto-post journal entry when autoPost is true', async () => {
      const commandWithAutoPost = {
        ...baseCommand,
        autoPost: true,
      };

      let postCalled = false;

      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () =>
          Effect.succeed({
            periodMonth: new Date('2024-01-31'),
            assets: [
              {
                id: 'asset-1',
                name: 'Test Asset',
                tag: 'TEST-001',
                acquisitionDate: new Date('2023-01-01'),
                acquisitionCost: 10000,
                depreciationMethod: 'straight_line' as const,
                usefulLife: 60,
                salvageValue: 1000,
                priorAccumulatedDepreciation: 1500,
                currentDepreciation: 150,
                newAccumulatedDepreciation: 1650,
                remainingBookValue: 8350,
                isFullyDepreciated: false,
              },
            ],
          }),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: () =>
          Effect.succeed({
            id: 'je-002',
            entryNumber: 'JE-202401-002',
            entryDate: new Date('2024-01-31'),
            description: 'Monthly depreciation',
            reference: 'DEP-202401',
            status: 'draft' as const,
            lineItems: [],
            createdAt: new Date(),
            createdBy: 'system-scheduler',
          }),
        postJournalEntry: (cmd) => {
          postCalled = true;
          expect(cmd.journalEntryId).toBe('je-002');
          expect(cmd.postedBy).toBe('system-scheduler');
          return Effect.void;
        },
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(commandWithAutoPost).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      expect(postCalled).toBe(true);
      expect(result.journalEntry?.status).toBe('posted');
      expect(result.metadata.autoPosted).toBe(true);
    });

    it('should handle fully depreciated assets', async () => {
      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () =>
          Effect.succeed({
            periodMonth: new Date('2024-01-31'),
            assets: [
              {
                id: 'asset-1',
                name: 'Old Equipment',
                tag: 'OLD-001',
                acquisitionDate: new Date('2014-01-01'),
                acquisitionCost: 10000,
                depreciationMethod: 'straight_line' as const,
                usefulLife: 120,
                salvageValue: 1000,
                priorAccumulatedDepreciation: 9000,
                currentDepreciation: 0,
                newAccumulatedDepreciation: 9000,
                remainingBookValue: 1000, // Salvage value
                isFullyDepreciated: true,
              },
              {
                id: 'asset-2',
                name: 'Active Equipment',
                tag: 'ACT-001',
                acquisitionDate: new Date('2023-01-01'),
                acquisitionCost: 12000,
                depreciationMethod: 'straight_line' as const,
                usefulLife: 60,
                salvageValue: 2000,
                priorAccumulatedDepreciation: 2000,
                currentDepreciation: 166.67,
                newAccumulatedDepreciation: 2166.67,
                remainingBookValue: 9833.33,
                isFullyDepreciated: false,
              },
            ],
          }),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: () =>
          Effect.succeed({
            id: 'je-003',
            entryNumber: 'JE-202401-003',
            entryDate: new Date('2024-01-31'),
            description: 'Monthly depreciation',
            reference: 'DEP-202401',
            status: 'draft' as const,
            lineItems: [],
            createdAt: new Date(),
            createdBy: 'system-scheduler',
          }),
        postJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      expect(result.summary.totalAssets).toBe(2);
      expect(result.summary.depreciableAssets).toBe(1);
      expect(result.summary.fullyDepreciatedAssets).toBe(1);
      expect(result.summary.totalDepreciation).toBeCloseTo(166.67, 2);
    });

    it('should handle no depreciation when all assets fully depreciated', async () => {
      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () =>
          Effect.succeed({
            periodMonth: new Date('2024-01-31'),
            assets: [
              {
                id: 'asset-1',
                name: 'Fully Depreciated Asset',
                tag: 'FD-001',
                acquisitionDate: new Date('2014-01-01'),
                acquisitionCost: 10000,
                depreciationMethod: 'straight_line' as const,
                usefulLife: 120,
                salvageValue: 1000,
                priorAccumulatedDepreciation: 9000,
                currentDepreciation: 0,
                newAccumulatedDepreciation: 9000,
                remainingBookValue: 1000,
                isFullyDepreciated: true,
              },
            ],
          }),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        postJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      expect(result.summary.totalDepreciation).toBe(0);
      expect(result.journalEntry).toBeUndefined(); // No JE created when no depreciation
      expect(result.summary.fullyDepreciatedAssets).toBe(1);
      expect(result.summary.depreciableAssets).toBe(0);
    });
  });

  describe('Validation Errors', () => {
    it('should fail when period month is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        periodMonth: null as any,
      };

      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () => Effect.fail(new NetworkError('Should not be called')),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        postJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Period month is required');
    });

    it('should fail when period month is in the future', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 2);

      const invalidCommand = {
        ...baseCommand,
        periodMonth: futureDate,
      };

      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () => Effect.fail(new NetworkError('Should not be called')),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        postJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Period month cannot be in the future');
    });

    it('should fail when initiatedBy is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        initiatedBy: '',
      };

      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () => Effect.fail(new NetworkError('Should not be called')),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        postJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Initiated by user is required');
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from runMonthlyDepreciation', async () => {
      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () => Effect.fail(new NetworkError('Depreciation service unavailable')),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        postJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Depreciation service unavailable');
    });

    it('should handle network error from createJournalEntry', async () => {
      const mockFixedAssetsPort: GoFixedAssetsPortService = {
        runMonthlyDepreciation: () =>
          Effect.succeed({
            periodMonth: new Date('2024-01-31'),
            assets: [
              {
                id: 'asset-1',
                name: 'Test Asset',
                tag: 'TEST-001',
                acquisitionDate: new Date('2023-01-01'),
                acquisitionCost: 10000,
                depreciationMethod: 'straight_line' as const,
                usefulLife: 60,
                salvageValue: 1000,
                priorAccumulatedDepreciation: 1500,
                currentDepreciation: 150,
                newAccumulatedDepreciation: 1650,
                remainingBookValue: 8350,
                isFullyDepreciated: false,
              },
            ],
          }),
        getAsset: () => Effect.fail(new NetworkError('Not implemented')),
        listAssets: () => Effect.fail(new NetworkError('Not implemented')),
        createAsset: () => Effect.fail(new NetworkError('Not implemented')),
        updateAsset: () => Effect.fail(new NetworkError('Not implemented')),
        disposeAsset: () => Effect.fail(new NetworkError('Not implemented')),
      };

      const mockFinancialPort: GoFinancialPortService = {
        createJournalEntry: () => Effect.fail(new NetworkError('Journal entry creation failed')),
        postJournalEntry: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        listInvoices: () => Effect.succeed([]),
        recordPayment: () => Effect.fail(new NetworkError('Not implemented')),
        getARAgingReport: () => Effect.fail(new NetworkError('Not implemented')),
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
        runMonthlyDepreciation(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFixedAssetsPort, mockFixedAssetsPort)),
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Journal entry creation failed');
    });
  });
});
