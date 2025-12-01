import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  generateRevenueByServiceType,
  type GenerateRevenueByServiceTypeCommand,
} from '../revenue-by-service-type';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  NetworkError,
  type GoJournalEntry,
} from '../../../ports/go-financial-port';

const mockJournalEntries: GoJournalEntry[] = [
  {
    id: 'je-1',
    entryNumber: 'JE-001',
    entryDate: new Date('2024-01-15'),
    description: 'Traditional funeral service - Smith family',
    reference: 'CASE-001',
    status: 'posted',
    lineItems: [
      { id: 'li-1', accountNumber: '4100', description: 'Funeral service revenue', debit: 0, credit: 5000 },
      { id: 'li-2', accountNumber: '1200', description: 'AR', debit: 5000, credit: 0 },
    ],
    createdAt: new Date('2024-01-15'),
    createdBy: 'user-1',
  },
  {
    id: 'je-2',
    entryNumber: 'JE-002',
    entryDate: new Date('2024-01-20'),
    description: 'Cremation service - Jones family',
    reference: 'CASE-002',
    status: 'posted',
    lineItems: [
      { id: 'li-3', accountNumber: '4100', description: 'Cremation revenue', debit: 0, credit: 2500 },
      { id: 'li-4', accountNumber: '1200', description: 'AR', debit: 2500, credit: 0 },
    ],
    createdAt: new Date('2024-01-20'),
    createdBy: 'user-1',
  },
  {
    id: 'je-3',
    entryNumber: 'JE-003',
    entryDate: new Date('2024-01-25'),
    description: 'Memorial service - Williams family',
    reference: 'CASE-003',
    status: 'posted',
    lineItems: [
      { id: 'li-5', accountNumber: '4100', description: 'Memorial revenue', debit: 0, credit: 1500 },
      { id: 'li-6', accountNumber: '1200', description: 'AR', debit: 1500, credit: 0 },
    ],
    createdAt: new Date('2024-01-25'),
    createdBy: 'user-1',
  },
  {
    id: 'je-4',
    entryNumber: 'JE-004',
    entryDate: new Date('2024-01-28'),
    description: 'Traditional burial - Brown family',
    reference: 'CASE-004',
    status: 'posted',
    lineItems: [
      { id: 'li-7', accountNumber: '4100', description: 'Burial revenue', debit: 0, credit: 6000 },
      { id: 'li-8', accountNumber: '1200', description: 'AR', debit: 6000, credit: 0 },
    ],
    createdAt: new Date('2024-01-28'),
    createdBy: 'user-1',
  },
];

const baseCommand: GenerateRevenueByServiceTypeCommand = {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  generatedBy: 'analyst-123',
};

describe('Use Case 7.8: Revenue by Service Type Report', () => {
  describe('Happy Paths', () => {
    it('should generate revenue report by service type', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        listJournalEntries: () => Effect.succeed(mockJournalEntries),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateRevenueByServiceType(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      // Verify service types identified
      expect(result.serviceTypes.length).toBe(2); // Traditional and Cremation/Memorial
      
      const traditional = result.serviceTypes.find(st => st.serviceType === 'Traditional Funeral');
      expect(traditional?.serviceCount).toBe(2); // 2 traditional services
      expect(traditional?.totalRevenue).toBe(11000); // 5000 + 6000
      expect(traditional?.averageRevenue).toBe(5500);
      expect(traditional?.percentageOfTotal).toBeCloseTo(73.33, 2);

      // Verify totals
      expect(result.totals.totalServices).toBe(4);
      expect(result.totals.totalRevenue).toBe(15000); // 5000 + 2500 + 1500 + 6000
      expect(result.totals.averageRevenuePerService).toBe(3750);
    });

    it('should filter by specific service type', async () => {
      const commandWithFilter = {
        ...baseCommand,
        serviceType: 'Cremation',
      };

      const mockFinancialPort: GoFinancialPortService = {
        listJournalEntries: () => Effect.succeed(mockJournalEntries),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateRevenueByServiceType(commandWithFilter).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      // Should only include cremation/memorial services (now grouped together)
      expect(result.serviceTypes.length).toBe(1);
      expect(result.serviceTypes[0].serviceType).toBe('Cremation');
      expect(result.serviceTypes[0].serviceCount).toBe(2); // Cremation + Memorial
      expect(result.serviceTypes[0].totalRevenue).toBe(4000); // 2500 + 1500
      expect(result.totals.totalServices).toBe(2);
    });

    it('should handle empty results', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        listJournalEntries: () => Effect.succeed([]),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateRevenueByServiceType(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      expect(result.serviceTypes).toEqual([]);
      expect(result.totals.totalServices).toBe(0);
      expect(result.totals.totalRevenue).toBe(0);
      expect(result.totals.averageRevenuePerService).toBe(0);
    });
  });

  describe('Validation Errors', () => {
    it('should fail when start date is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        startDate: null as any,
      };

      const mockFinancialPort: GoFinancialPortService = {
        listJournalEntries: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateRevenueByServiceType(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Start date is required');
    });

    it('should fail when date range exceeds 2 years', async () => {
      const invalidCommand = {
        ...baseCommand,
        startDate: new Date('2022-01-01'),
        endDate: new Date('2025-01-01'), // > 2 years
      };

      const mockFinancialPort: GoFinancialPortService = {
        listJournalEntries: () => Effect.fail(new NetworkError('Should not be called')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateRevenueByServiceType(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Date range cannot exceed 2 years');
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from listJournalEntries', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        listJournalEntries: () => Effect.fail(new NetworkError('Network failure')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateRevenueByServiceType(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Network failure');
    });
  });
});
