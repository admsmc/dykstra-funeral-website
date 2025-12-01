import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import {
  generateSalesTaxReport,
  type GenerateSalesTaxReportCommand,
} from '../sales-tax-reporting';
import {
  GoFinancialPort,
  type GoFinancialPortService,
  NetworkError,
  type GoInvoice,
} from '../../../ports/go-financial-port';

// Mock data
const mockInvoices: GoInvoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-001',
    caseId: 'case-1',
    contractId: 'contract-1',
    customerId: 'customer-1',
    customerName: 'John Doe',
    invoiceDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    status: 'paid',
    lineItems: [
      {
        id: 'line-1',
        description: 'Service 1',
        quantity: 1,
        unitPrice: 1000,
        totalPrice: 1000,
        glAccountId: 'gl-4000',
      },
    ],
    subtotal: 1000,
    taxAmount: 60, // 6% tax
    totalAmount: 1060,
    amountPaid: 1060,
    amountDue: 0,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-002',
    caseId: 'case-2',
    contractId: 'contract-2',
    customerId: 'customer-2',
    customerName: 'Jane Smith',
    invoiceDate: new Date('2024-01-20'),
    dueDate: new Date('2024-02-20'),
    status: 'paid',
    lineItems: [
      {
        id: 'line-2',
        description: 'Service 2',
        quantity: 1,
        unitPrice: 2000,
        totalPrice: 2000,
        glAccountId: 'gl-4000',
      },
    ],
    subtotal: 2000,
    taxAmount: 120, // 6% tax
    totalAmount: 2120,
    amountPaid: 2120,
    amountDue: 0,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-003',
    caseId: 'case-3',
    contractId: 'contract-3',
    customerId: 'customer-3',
    customerName: 'Bob Johnson',
    invoiceDate: new Date('2024-01-25'),
    dueDate: new Date('2024-02-25'),
    status: 'partial',
    lineItems: [
      {
        id: 'line-3',
        description: 'Service 3',
        quantity: 1,
        unitPrice: 1500,
        totalPrice: 1500,
        glAccountId: 'gl-4000',
      },
    ],
    subtotal: 1500,
    taxAmount: 90, // 6% tax
    totalAmount: 1590,
    amountPaid: 800,
    amountDue: 790,
    createdAt: new Date('2024-01-25'),
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-004',
    caseId: 'case-4',
    contractId: 'contract-4',
    customerId: 'customer-4',
    customerName: 'Alice Brown',
    invoiceDate: new Date('2024-01-28'),
    dueDate: new Date('2024-02-28'),
    status: 'sent', // Not paid yet, should be excluded
    lineItems: [
      {
        id: 'line-4',
        description: 'Service 4',
        quantity: 1,
        unitPrice: 3000,
        totalPrice: 3000,
        glAccountId: 'gl-4000',
      },
    ],
    subtotal: 3000,
    taxAmount: 180,
    totalAmount: 3180,
    amountPaid: 0,
    amountDue: 3180,
    createdAt: new Date('2024-01-28'),
  },
];

const baseCommand: GenerateSalesTaxReportCommand = {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  generatedBy: 'accountant-123',
};

describe('Use Case 7.1: Sales Tax Reporting', () => {
  describe('Happy Paths', () => {
    it('should generate tax report for period with paid invoices', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.succeed(mockInvoices),
        // Add other required methods as no-ops
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateSalesTaxReport(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      // Should include only paid and partial invoices (3 out of 4)
      expect(result.totals.totalTransactions).toBe(3);
      
      // Total taxable amount: 1000 + 2000 + 1500 = 4500
      expect(result.totals.totalTaxableAmount).toBe(4500);
      
      // Total tax: 60 + 120 + 90 = 270
      expect(result.totals.totalTaxCollected).toBe(270);
      
      // All invoices in Michigan (simplified)
      expect(result.totals.totalJurisdictions).toBe(1);
      expect(result.jurisdictions[0].jurisdiction).toBe('Michigan');
      expect(result.jurisdictions[0].type).toBe('state');
      expect(result.jurisdictions[0].taxRate).toBe(0.06);
      
      // Period matches command
      expect(result.period.startDate).toEqual(baseCommand.startDate);
      expect(result.period.endDate).toEqual(baseCommand.endDate);
      
      // Metadata
      expect(result.metadata.generatedBy).toBe('accountant-123');
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
    });

    it('should filter by jurisdiction when specified', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.succeed(mockInvoices),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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

      const commandWithJurisdiction = {
        ...baseCommand,
        jurisdiction: 'Michigan',
      };

      const result = await Effect.runPromise(
        generateSalesTaxReport(commandWithJurisdiction).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      expect(result.jurisdictions.length).toBe(1);
      expect(result.jurisdictions[0].jurisdiction).toBe('Michigan');
    });

    it('should handle empty invoice list', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.succeed([]),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateSalesTaxReport(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      expect(result.totals.totalTransactions).toBe(0);
      expect(result.totals.totalTaxableAmount).toBe(0);
      expect(result.totals.totalTaxCollected).toBe(0);
      expect(result.totals.totalJurisdictions).toBe(0);
      expect(result.jurisdictions).toEqual([]);
    });
  });

  describe('Validation Errors', () => {
    it('should fail when start date is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        startDate: null as any,
      };

      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.succeed([]),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateSalesTaxReport(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Start date is required');
    });

    it('should fail when end date is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        endDate: null as any,
      };

      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.succeed([]),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateSalesTaxReport(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('End date is required');
    });

    it('should fail when start date is after end date', async () => {
      const invalidCommand = {
        ...baseCommand,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-01-01'),
      };

      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.succeed([]),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateSalesTaxReport(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Start date must be before or equal to end date');
    });

    it('should fail when date range exceeds 366 days', async () => {
      const invalidCommand = {
        ...baseCommand,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-01-02'), // 367 days
      };

      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.succeed([]),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateSalesTaxReport(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Date range cannot exceed 366 days');
    });

    it('should fail when generatedBy is missing', async () => {
      const invalidCommand = {
        ...baseCommand,
        generatedBy: '',
      };

      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.succeed([]),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateSalesTaxReport(invalidCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Generated by user is required');
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from listInvoices', async () => {
      const mockFinancialPort: GoFinancialPortService = {
        listInvoices: () => Effect.fail(new NetworkError('Network failure')),
        getGLAccount: () => Effect.fail(new NetworkError('Not implemented')),
        getGLAccountByNumber: () => Effect.fail(new NetworkError('Not implemented')),
        createJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        postJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        reverseJournalEntry: () => Effect.fail(new NetworkError('Not implemented')),
        listJournalEntries: () => Effect.succeed([]),
        generateFinancialStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getTrialBalance: () => Effect.fail(new NetworkError('Not implemented')),
        generateBalanceSheet: () => Effect.fail(new NetworkError('Not implemented')),
        generateCashFlowStatement: () => Effect.fail(new NetworkError('Not implemented')),
        getAccountBalances: () => Effect.fail(new NetworkError('Not implemented')),
        createInvoice: () => Effect.fail(new NetworkError('Not implemented')),
        getInvoice: () => Effect.fail(new NetworkError('Not implemented')),
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
        generateSalesTaxReport(baseCommand).pipe(
          Effect.provide(Layer.succeed(GoFinancialPort, mockFinancialPort))
        )
      );

      await expect(result).rejects.toThrow('Network failure');
    });
  });
});
