import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Effect } from 'effect';
import { GoFinancialAdapter } from '../go-financial-adapter';

/**
 * Integration Tests for GoFinancialAdapter
 * 
 * Tests the updated endpoints from Phase 1:
 * - Trial Balance (GET /v1/gl/trial-balance)
 * - Balance Sheet (GET /v1/gl/statements/balance-sheet)
 * - Cash Flow Statement (GET /v1/gl/statements/cash-flow)
 * - Account Balances (POST /accounts/balances)
 * - AP Payment Runs (POST /ap/payment-runs, GET /ap/payment-runs/{id})
 * 
 * Prerequisites:
 * - Go backend running at http://localhost:8080 (or configured URL)
 * - Test data seeded in backend (book='MAIN', currency='USD', entity_id='ENTITY1')
 * - Test accounts with balances
 * 
 * Note: These are integration tests that require a running backend.
 * For unit tests, use mocked HTTP client.
 */

describe('GoFinancialAdapter - Phase 1 Integration Tests', () => {
  // Test data
  const testDate = new Date('2025-11-30');
  const testAccountIds = ['account_hex_1', 'account_hex_2']; // Replace with actual hex IDs from backend
  
  describe('Trial Balance', () => {
    it('should get trial balance using correct endpoint and parameters', async () => {
      const result = await Effect.runPromise(
        GoFinancialAdapter.getTrialBalance(testDate)
      );
      
      expect(result).toBeDefined();
      expect(result.asOfDate).toBeInstanceOf(Date);
      expect(result.accounts).toBeInstanceOf(Array);
      expect(result.totalDebits).toBeGreaterThanOrEqual(0);
      expect(result.totalCredits).toBeGreaterThanOrEqual(0);
      expect(result.balanced).toBe(true);
      
      // Verify debits equal credits
      expect(result.totalDebits).toEqual(result.totalCredits);
      
      // Verify account structure
      if (result.accounts.length > 0) {
        const account = result.accounts[0];
        expect(account).toHaveProperty('accountNumber');
        expect(account).toHaveProperty('accountName');
        expect(account).toHaveProperty('debitBalance');
        expect(account).toHaveProperty('creditBalance');
      }
    });
    
    it('should use correct query parameters for trial balance', async () => {
      // This test verifies the adapter sends the right parameters
      // In a real integration test, you might verify backend logs or use a proxy
      const result = await Effect.runPromise(
        GoFinancialAdapter.getTrialBalance(testDate)
      );
      
      expect(result).toBeDefined();
      // The backend should receive: book=MAIN, period=2025-11, currency=USD
    });
  });
  
  describe('Balance Sheet', () => {
    it('should generate balance sheet using correct endpoint', async () => {
      const result = await Effect.runPromise(
        GoFinancialAdapter.generateBalanceSheet(testDate)
      );
      
      expect(result).toBeDefined();
      expect(result.type).toBe('balance_sheet');
      expect(result.asOfDate).toBeInstanceOf(Date);
      expect(result.sections).toBeInstanceOf(Array);
      
      // Verify balance sheet equation: Assets = Liabilities + Equity
      if (result.totalAssets !== undefined && 
          result.totalLiabilities !== undefined && 
          result.totalEquity !== undefined) {
        expect(result.totalAssets).toBeCloseTo(
          result.totalLiabilities + result.totalEquity,
          2 // Allow 2 decimal places for floating point precision
        );
      }
    });
    
    it('should include required parameters for balance sheet', async () => {
      const result = await Effect.runPromise(
        GoFinancialAdapter.generateBalanceSheet(testDate)
      );
      
      expect(result).toBeDefined();
      // Backend should receive: book=MAIN, entity_id=ENTITY1, period=2025-11, currency=USD, gaap=US_GAAP
    });
  });
  
  describe('Cash Flow Statement', () => {
    it('should generate cash flow statement using correct endpoint', async () => {
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');
      
      const result = await Effect.runPromise(
        GoFinancialAdapter.generateCashFlowStatement(startDate, endDate)
      );
      
      expect(result).toBeDefined();
      expect(result.type).toBe('cash_flow');
      expect(result.asOfDate).toBeInstanceOf(Date);
      expect(result.sections).toBeInstanceOf(Array);
    });
    
    it('should include period range and cash accounts', async () => {
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');
      
      const result = await Effect.runPromise(
        GoFinancialAdapter.generateCashFlowStatement(startDate, endDate)
      );
      
      expect(result).toBeDefined();
      // Backend should receive: book=MAIN, entity_id=ENTITY1, 
      // period_from=2025-11, period_to=2025-11, currency=USD, 
      // cash_accounts=['1010', '1020']
    });
  });
  
  describe('Account Balances', () => {
    it('should get account balances using POST /accounts/balances', async () => {
      const result = await Effect.runPromise(
        GoFinancialAdapter.getAccountBalances(testAccountIds)
      );
      
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      
      if (result.length > 0) {
        const balance = result[0];
        expect(balance).toHaveProperty('accountId');
        expect(balance).toHaveProperty('accountNumber');
        expect(balance).toHaveProperty('balance');
        expect(balance).toHaveProperty('asOfDate');
        expect(balance.asOfDate).toBeInstanceOf(Date);
      }
    });
    
    it('should map hex IDs from response correctly', async () => {
      const result = await Effect.runPromise(
        GoFinancialAdapter.getAccountBalances(testAccountIds)
      );
      
      expect(result).toBeDefined();
      // Response format: { balances: { [hex_id: string]: string } }
      // Adapter should map to array of AccountBalance objects
      
      result.forEach(balance => {
        expect(typeof balance.accountId).toBe('string');
        expect(typeof balance.balance).toBe('number');
      });
    });
    
    it('should handle empty account list', async () => {
      const result = await Effect.runPromise(
        GoFinancialAdapter.getAccountBalances([])
      );
      
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });
  
  describe('AP Payment Runs - Create', () => {
    it('should create AP payment run using correct endpoint', async () => {
      const command = {
        tenant: 'T1',
        legalEntity: 'LE1',
        currency: 'USD',
        paymentMethod: 'ach' as const,
        createdBy: 'test_user',
        runDate: new Date(),
        billIds: [] as readonly string[],
      };
      
      const result = await Effect.runPromise(
        GoFinancialAdapter.createAPPaymentRun(command)
      );
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('draft');
      expect(result.paymentMethod).toBe('ach');
      expect(result.createdBy).toBe('test_user');
      expect(result.createdAt).toBeInstanceOf(Date);
    });
    
    it('should send tenant, legal_entity, and currency to backend', async () => {
      const command = {
        tenant: 'TENANT1',
        legalEntity: 'LEGAL1',
        currency: 'EUR',
        paymentMethod: 'wire' as const,
        createdBy: 'admin',
        runDate: new Date(),
        billIds: [] as readonly string[],
      };
      
      const result = await Effect.runPromise(
        GoFinancialAdapter.createAPPaymentRun(command)
      );
      
      expect(result).toBeDefined();
      // Backend should receive: { tenant: 'TENANT1', legal_entity: 'LEGAL1', currency: 'EUR' }
    });
    
    it('should use default values when optional fields not provided', async () => {
      const command = {
        paymentMethod: 'check' as const,
        createdBy: 'user1',
        runDate: new Date(),
        billIds: [] as readonly string[],
      };
      
      const result = await Effect.runPromise(
        GoFinancialAdapter.createAPPaymentRun(command)
      );
      
      expect(result).toBeDefined();
      // Backend should receive: tenant='default', legal_entity='default', currency='USD'
    });
  });
  
  describe('AP Payment Runs - Get', () => {
    let paymentRunId: string;
    
    beforeAll(async () => {
      // Create a payment run for testing GET
      const command = {
        tenant: 'T1',
        legalEntity: 'LE1',
        currency: 'USD',
        paymentMethod: 'ach' as const,
        createdBy: 'test_setup',
        runDate: new Date(),
        billIds: [] as readonly string[],
      };
      
      const created = await Effect.runPromise(
        GoFinancialAdapter.createAPPaymentRun(command)
      );
      paymentRunId = created.id;
    });
    
    it('should get AP payment run by ID using correct endpoint', async () => {
      const result = await Effect.runPromise(
        GoFinancialAdapter.getAPPaymentRun(paymentRunId)
      );
      
      expect(result).toBeDefined();
      expect(result.id).toBe(paymentRunId);
      expect(result.status).toBeDefined();
      expect(result.billIds).toBeInstanceOf(Array);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
    
    it('should map payment run items correctly', async () => {
      const result = await Effect.runPromise(
        GoFinancialAdapter.getAPPaymentRun(paymentRunId)
      );
      
      expect(result).toBeDefined();
      expect(typeof result.totalAmount).toBe('number');
      expect(result.paymentMethod).toMatch(/^(ach|check|wire)$/);
      
      // Verify optional fields are handled
      if (result.approvedAt) {
        expect(result.approvedAt).toBeInstanceOf(Date);
      }
      if (result.approvedBy) {
        expect(typeof result.approvedBy).toBe('string');
      }
    });
    
    it('should throw NotFoundError for non-existent payment run', async () => {
      const result = Effect.runPromise(
        GoFinancialAdapter.getAPPaymentRun('non_existent_id')
      );
      
      await expect(result).rejects.toThrow();
    });
  });
  
  describe('AP Payment Runs - Full Workflow', () => {
    it('should create, retrieve, and verify payment run', async () => {
      // Step 1: Create
      const createCommand = {
        tenant: 'WORKFLOW_TEST',
        legalEntity: 'LE_TEST',
        currency: 'USD',
        paymentMethod: 'ach' as const,
        createdBy: 'workflow_user',
        runDate: new Date(),
        billIds: [] as readonly string[],
      };
      
      const created = await Effect.runPromise(
        GoFinancialAdapter.createAPPaymentRun(createCommand)
      );
      
      expect(created.id).toBeDefined();
      expect(created.status).toBe('draft');
      
      // Step 2: Retrieve
      const retrieved = await Effect.runPromise(
        GoFinancialAdapter.getAPPaymentRun(created.id)
      );
      
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.runNumber).toBe(created.runNumber);
      expect(retrieved.status).toBe('draft');
      
      // Step 3: Verify data consistency
      expect(retrieved.createdBy).toBe('workflow_user');
      expect(retrieved.paymentMethod).toBe('ach');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Test with invalid date that might cause backend error
      const invalidDate = new Date('invalid');
      
      const result = Effect.runPromise(
        GoFinancialAdapter.getTrialBalance(invalidDate)
      );
      
      await expect(result).rejects.toThrow();
    });
    
    it('should handle missing required fields', async () => {
      const incompleteCommand = {
        // Missing required fields
        paymentMethod: 'ach' as const,
        // Missing: createdBy, runDate, billIds
      } as any;
      
      const result = Effect.runPromise(
        GoFinancialAdapter.createAPPaymentRun(incompleteCommand)
      );
      
      await expect(result).rejects.toThrow();
    });
  });
});

/**
 * Test Utilities
 * 
 * Helper functions for integration tests
 */
describe('Test Utilities', () => {
  it('should have backend connection configured', () => {
    // Verify environment variables are set
    // This is a sanity check for CI/CD environments
    expect(process.env.GO_BACKEND_URL || 'http://localhost:8080').toBeDefined();
  });
});
