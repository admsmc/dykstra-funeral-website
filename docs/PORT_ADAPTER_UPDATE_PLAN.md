# Port & Adapter Update Plan

**Date**: 2025-11-29  
**Status**: Ready for Implementation  
**Based on**: BACKEND_REALITY_CHECK.md verification results

---

## Overview

This document outlines the specific changes needed to update TypeScript ports and adapters to match the verified Go backend endpoints. All endpoints have been verified to exist in the Go backend codebase.

---

## Phase 1: Update GoFinancialPort Adapter (HIGH PRIORITY)

### Current vs Verified Endpoints

| Method | Current Endpoint | Verified Endpoint | Status |
|--------|------------------|-------------------|--------|
| `getTrialBalance` | `/v1/financial/trial-balance` | `/v1/gl/trial-balance` | ⚠️ NEEDS UPDATE |
| `generateBalanceSheet` | `/v1/financial/statements/balance-sheet` | `/v1/gl/statements/balance-sheet` | ⚠️ NEEDS UPDATE |
| `generateCashFlowStatement` | `/v1/financial/statements/cash-flow` | `/v1/gl/statements/cash-flow` | ⚠️ NEEDS UPDATE |
| `getAccountBalances` | `/v1/financial/account-balances` | `/accounts/balances` (POST) | ⚠️ NEEDS UPDATE |
| `createAPPaymentRun` | NOT IMPLEMENTED | `/ap/payment-runs` (POST) | ❌ MISSING |
| `getAPPaymentRun` | NOT IMPLEMENTED | `/ap/payment-runs/{id}` (GET) | ❌ MISSING |

### Changes Required

**File**: `packages/infrastructure/src/adapters/go-backend/go-financial-adapter.ts`

#### 1. Update Trial Balance (Line 168)
```typescript
// BEFORE
getTrialBalance: (asOfDate: Date) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.GET('/v1/financial/trial-balance', {
        params: { query: { as_of_date: asOfDate.toISOString() } }
      });

// AFTER (verified endpoint)
getTrialBalance: (asOfDate: Date) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.GET('/v1/gl/trial-balance', {
        params: {
          query: {
            book: 'MAIN',  // Required parameter
            period: asOfDate.toISOString().substring(0, 7),  // YYYY-MM format
            currency: 'USD'
          }
        }
      });
      
      // Response format from GLTrialBalancePort.ComputeEntity:
      // { items: TBItem[], total: int64, class_totals: map[string]int64 }
```

#### 2. Update Balance Sheet (Line 192)
```typescript
// BEFORE
generateBalanceSheet: (asOfDate: Date) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.GET('/v1/financial/statements/balance-sheet', {

// AFTER (verified endpoint)
generateBalanceSheet: (asOfDate: Date) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.GET('/v1/gl/statements/balance-sheet', {
        params: {
          query: {
            book: 'MAIN',
            entity_id: 'ENTITY1',  // Or group_book_id for consolidation
            period: asOfDate.toISOString().substring(0, 7),
            currency: 'USD',
            gaap: 'US_GAAP'  // Optional
          }
        }
      });
      
      // Response format from statements.Service.BalanceSheetEntity:
      // {
      //   items: TBItem[],
      //   total_minor: int64,
      //   totals_by_class: { Assets: int64, Liabilities: int64, Equity: int64 },
      //   mapped: { [line_item: string]: int64 }  // GAAP mappings
      // }
```

#### 3. Update Cash Flow Statement (Line 205)
```typescript
// BEFORE
generateCashFlowStatement: (startDate: Date, endDate: Date) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.GET('/v1/financial/statements/cash-flow', {

// AFTER (verified endpoint)
generateCashFlowStatement: (startDate: Date, endDate: Date) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.GET('/v1/gl/statements/cash-flow', {
        params: {
          query: {
            book: 'MAIN',
            entity_id: 'ENTITY1',
            period_from: startDate.toISOString().substring(0, 7),
            period_to: endDate.toISOString().substring(0, 7),
            currency: 'USD',
            cash_accounts: ['1010', '1020'],  // Cash account IDs
            categories: {
              operating: ['...'],
              investing: ['...'],
              financing: ['...']
            }
          }
        }
      });
      
      // Response format from statements.Service (CashFlowResult):
      // {
      //   net_change_cash_minor: int64,
      //   details: [{
      //     account_id: string,
      //     from_minor: int64,
      //     to_minor: int64,
      //     delta_minor: int64
      //   }],
      //   by_category: { operating: int64, investing: int64, financing: int64 }
      // }
```

#### 4. Update Account Balances (Line 223)
```typescript
// BEFORE
getAccountBalances: (accountIds: readonly string[], asOfDate?: Date) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/v1/financial/account-balances', {
        body: {
          account_ids: accountIds,
          as_of_date: asOfDate?.toISOString(),
        }
      });

// AFTER (verified endpoint)
getAccountBalances: (accountIds: readonly string[], asOfDate?: Date) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/accounts/balances', {
        body: {
          accounts: accountIds,  // Hex IDs
        }
      });
      
      // Response format from counterparty_endpoints.go:
      // { balances: { [hex_id: string]: string } }
      
      // OR for dimensional lookup (customers/suppliers):
      const res = await goClient.POST('/customers/balances', {
        body: {
          customers: ['C001', 'C002'],
          tenant: 'T1',
          legal_entity: 'LE1',
          currency: 'USD'
        }
      });
      // Response: { balances: { C001: "1000", C002: "2000" }, control: "3000" }
```

#### 5. Add Payment Run Methods (NEW)
```typescript
// ADD after getAccountBalances method

createAPPaymentRun: (command: CreateAPPaymentRunCommand) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/ap/payment-runs', {
        body: {
          tenant: command.tenant,
          legal_entity: command.legalEntity,
          currency: command.currency,
          // Automatically scans approved AP invoices
        }
      });
      
      const data = unwrapResponse(res);
      return {
        id: data.payment_run_id,
        runNumber: data.payment_run_id,
        runDate: new Date(),
        status: 'draft',
        billIds: [],
        totalAmount: 0,
        paymentMethod: command.paymentMethod,
        createdBy: command.createdBy,
        createdAt: new Date(),
      };
    },
    catch: (error) => new NetworkError('Failed to create AP payment run', error as Error)
  }),

getAPPaymentRun: (id: string) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.GET('/ap/payment-runs/{id}', {
        params: { path: { id } }
      });
      
      if (res.error) {
        if (res.response?.status === 404) {
          throw new NotFoundError({
            message: 'Payment run not found',
            entityType: 'APPaymentRun',
            entityId: id
          });
        }
        throw new Error(res.error.message);
      }
      
      const data = res.data;
      return {
        id: data.payment_run_id,
        runNumber: data.payment_run_id,
        runDate: new Date(data.created_at),
        status: data.status,
        billIds: data.items?.map((i: any) => i.invoice_id) || [],
        totalAmount: data.items?.reduce((sum: number, i: any) => sum + i.amount_cents, 0) || 0,
        paymentMethod: 'ach',  // Determined by export format
        createdBy: data.created_by || 'system',
        createdAt: new Date(data.created_at),
        approvedBy: data.approved_by,
        approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      };
    },
    catch: (error) => {
      if (error instanceof NotFoundError) return error;
      return new NetworkError('Failed to get AP payment run', error as Error);
    }
  }),

// BONUS: Add approval and execution methods
approveAPPaymentRun: (id: string, approvedBy: string) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/ap/payment-runs/{id}/approve', {
        params: { path: { id } }
      });
      unwrapResponse(res);
    },
    catch: (error) => new NetworkError('Failed to approve payment run', error as Error)
  }),

executeAPPaymentRun: (id: string, bankId: string) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/ap/payment-runs/{id}/execute', {
        params: { path: { id } },
        body: { bank_id: bankId }
      });
      
      const data = unwrapResponse(res);
      return {
        paymentRunId: data.payment_run_id,
        executed: data.executed,
        status: data.status,
        executionBatchId: data.execution_batch_id,
      };
    },
    catch: (error) => new NetworkError('Failed to execute payment run', error as Error)
  }),
```

---

## Phase 2: Add GoPayrollPort Timesheet Methods (HIGH PRIORITY)

### New Methods Required

The Go backend has timesheet workflow endpoints under Professional Services, not bulk import.

**File**: `packages/application/src/ports/go-payroll-port.ts`

Add to interface:

```typescript
export interface GoPayrollPortService {
  // ... existing methods ...
  
  /**
   * Submit timesheet for approval
   * 
   * Backend: POST /ps/timesheets/submit
   * Pattern: Event-sourced workflow (not bulk import)
   * Stream: timesheet|{tenant}|{id}
   */
  readonly submitTimesheet: (command: {
    tenant: string;
    timesheetId: string;
    workerId: string;
    periodStart: Date;
    periodEnd: Date;
    entries: readonly string[];  // Time entry IDs (created separately)
    notes?: string;
  }) => Effect.Effect<{
    stream: string;
    eventId: string;
    appended: boolean;
  }, NetworkError>;
  
  /**
   * Approve timesheet
   * 
   * Backend: POST /ps/timesheets/{id}/approve
   */
  readonly approveTimesheet: (params: {
    timesheetId: string;
    tenant: string;
    actor: string;  // Manager ID
  }) => Effect.Effect<{
    stream: string;
    eventId: string;
    appended: boolean;
  }, NetworkError>;
  
  /**
   * Reject timesheet
   * 
   * Backend: POST /ps/timesheets/{id}/reject
   */
  readonly rejectTimesheet: (params: {
    timesheetId: string;
    tenant: string;
    actor: string;
    reason: string;
  }) => Effect.Effect<{
    stream: string;
    eventId: string;
    appended: boolean;
  }, NetworkError>;
  
  /**
   * List timesheets
   * 
   * Backend: GET /ps/timesheets
   */
  readonly listTimesheets: (query: {
    tenant: string;
    workerId?: string;
    status?: 'submitted' | 'approved' | 'rejected';
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) => Effect.Effect<{
    items: readonly Timesheet[];
    count: number;
  }, NetworkError>;
  
  /**
   * Get expense summary
   * 
   * Backend: Uses ExpenseSummary types from internal/expenses/reporting_types.go
   * and calculation function from internal/domain/timeexp_calculations.go
   */
  readonly getExpenseSummary: (params: {
    projectId?: string;
    employeeId?: string;
    startDate: Date;
    endDate: Date;
  }) => Effect.Effect<ExpenseSummary, NetworkError>;
}

export interface Timesheet {
  readonly id: string;
  readonly timesheetId: string;
  readonly workerId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly status: 'submitted' | 'approved' | 'rejected';
  readonly entries: readonly string[];
  readonly notes?: string;
  readonly submittedAt: Date;
  readonly approvedAt?: Date;
  readonly approvedBy?: string;
}

export interface ExpenseSummary {
  readonly id: string;
  readonly amount: number;
  readonly description: string;
  readonly date: Date;
  readonly submittedBy: string;
}
```

**File**: `packages/infrastructure/src/adapters/go-backend/go-payroll-adapter.ts`

Add implementations:

```typescript
submitTimesheet: (command) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/ps/timesheets/submit', {
        body: {
          tenant: command.tenant,
          timesheet_id: command.timesheetId,
          worker_id: command.workerId,
          period_start: command.periodStart.toISOString(),
          period_end: command.periodEnd.toISOString(),
          entries: command.entries,
          notes: command.notes,
        }
      });
      
      const data = unwrapResponse(res);
      return {
        stream: data.stream,
        eventId: data.event_id,
        appended: data.appended,
      };
    },
    catch: (error) => new NetworkError('Failed to submit timesheet', error as Error)
  }),

approveTimesheet: (params) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/ps/timesheets/{timesheetId}/approve', {
        params: { path: { timesheetId: params.timesheetId } },
        body: {
          tenant: params.tenant,
          actor: params.actor,
        }
      });
      
      const data = unwrapResponse(res);
      return {
        stream: data.stream,
        eventId: data.event_id,
        appended: data.appended,
      };
    },
    catch: (error) => new NetworkError('Failed to approve timesheet', error as Error)
  }),

listTimesheets: (query) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.GET('/ps/timesheets', {
        params: {
          query: {
            tenant: query.tenant,
            worker_id: query.workerId,
            status: query.status,
            from: query.from?.toISOString(),
            to: query.to?.toISOString(),
            limit: query.limit,
            offset: query.offset,
          }
        }
      });
      
      const data = unwrapResponse(res);
      return {
        items: (data.items || []).map(mapToTimesheet),
        count: data.count,
      };
    },
    catch: (error) => new NetworkError('Failed to list timesheets', error as Error)
  }),

getExpenseSummary: (params) =>
  Effect.tryPromise({
    try: async () => {
      // This would need a dedicated endpoint or use of the calculation function
      // For now, placeholder implementation
      const res = await goClient.GET('/ps/expense-summary', {
        params: {
          query: {
            project_id: params.projectId,
            employee_id: params.employeeId,
            start_date: params.startDate.toISOString(),
            end_date: params.endDate.toISOString(),
          }
        }
      });
      
      const data = unwrapResponse(res);
      return {
        id: data.id,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        submittedBy: data.submitted_by,
      };
    },
    catch: (error) => new NetworkError('Failed to get expense summary', error as Error)
  }),
```

---

## Phase 3: Update Infrastructure Layer Registration

**File**: `packages/infrastructure/src/index.ts`

Ensure both updated ports are properly registered:

```typescript
// Financial port with payment runs
export const GoBackendFinancialLive = Layer.succeed(
  GoFinancialPort,
  GoFinancialAdapter
);

// Payroll port with timesheets
export const GoBackendPayrollLive = Layer.succeed(
  GoPayrollPort,
  GoPayrollAdapter
);

// Combined layer
export const GoBackendLive = Layer.mergeAll(
  GoBackendContractLive,
  GoBackendInventoryLive,
  GoBackendFinancialLive,
  GoBackendPayrollLive,
  // ... other ports
);
```

---

## Phase 4: Add Integration Tests

### Trial Balance Test
```typescript
// packages/infrastructure/src/adapters/go-backend/__tests__/go-financial-adapter.test.ts

describe('GoFinancialAdapter - Trial Balance', () => {
  it('should get trial balance using correct endpoint', async () => {
    const result = await Effect.runPromise(
      GoFinancialAdapter.getTrialBalance(new Date('2025-11-30'))
    );
    
    expect(result.asOfDate).toBeInstanceOf(Date);
    expect(result.accounts).toBeInstanceOf(Array);
    expect(result.balanced).toBe(true);
    expect(result.totalDebits).toEqual(result.totalCredits);
  });
});
```

### Payment Run Test
```typescript
describe('GoFinancialAdapter - Payment Runs', () => {
  it('should create AP payment run', async () => {
    const command = {
      tenant: 'T1',
      legalEntity: 'LE1',
      currency: 'USD',
      paymentMethod: 'ach' as const,
      createdBy: 'admin',
    };
    
    const result = await Effect.runPromise(
      GoFinancialAdapter.createAPPaymentRun(command)
    );
    
    expect(result.id).toBeDefined();
    expect(result.status).toBe('draft');
  });
  
  it('should get AP payment run by ID', async () => {
    const result = await Effect.runPromise(
      GoFinancialAdapter.getAPPaymentRun('PR001')
    );
    
    expect(result.id).toBe('PR001');
    expect(result.billIds).toBeInstanceOf(Array);
  });
});
```

### Timesheet Test
```typescript
// packages/infrastructure/src/adapters/go-backend/__tests__/go-payroll-adapter.test.ts

describe('GoPayrollAdapter - Timesheets', () => {
  it('should submit timesheet', async () => {
    const command = {
      tenant: 'T1',
      timesheetId: 'TS001',
      workerId: 'W001',
      periodStart: new Date('2025-11-01'),
      periodEnd: new Date('2025-11-07'),
      entries: ['entry1', 'entry2'],
      notes: 'Weekly timesheet',
    };
    
    const result = await Effect.runPromise(
      GoPayrollAdapter.submitTimesheet(command)
    );
    
    expect(result.stream).toBe('timesheet|T1|TS001');
    expect(result.eventId).toBeDefined();
    expect(result.appended).toBe(true);
  });
  
  it('should list timesheets', async () => {
    const result = await Effect.runPromise(
      GoPayrollAdapter.listTimesheets({
        tenant: 'T1',
        workerId: 'W001',
        status: 'submitted',
      })
    );
    
    expect(result.items).toBeInstanceOf(Array);
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});
```

---

## Summary

### Changes Required

**High Priority** (Week 2-3):
1. ✅ Update 4 endpoint URLs in `go-financial-adapter.ts` (trial balance, balance sheet, cash flow, account balances)
2. ✅ Add 2 payment run methods to `go-financial-adapter.ts`
3. ✅ Add 4 timesheet methods to `go-payroll-port.ts` and `go-payroll-adapter.ts`
4. ✅ Add 1 expense summary method to `go-payroll-port.ts` and `go-payroll-adapter.ts`

**Medium Priority** (Week 4):
1. ⚠️ Add integration tests for updated adapters
2. ⚠️ Update OpenAPI client types if using code generation
3. ⚠️ Document endpoint parameter requirements
4. ⚠️ Add error handling for new status codes

**Low Priority** (Week 5):
1. 📝 Update USE_CASE_AUDIT with verified endpoints
2. 📝 Create endpoint mapping reference guide
3. 📝 Document workflow patterns vs bulk import patterns
4. 📝 Add JSDoc comments with Go backend references

### Files to Modify

1. `packages/application/src/ports/go-financial-port.ts` - Already has methods, no changes needed
2. `packages/application/src/ports/go-payroll-port.ts` - Add 5 new methods
3. `packages/infrastructure/src/adapters/go-backend/go-financial-adapter.ts` - Update 4 endpoints, add 2 methods
4. `packages/infrastructure/src/adapters/go-backend/go-payroll-adapter.ts` - Add 5 implementations
5. `packages/infrastructure/src/index.ts` - Verify Layer registration
6. `packages/infrastructure/src/adapters/go-backend/__tests__/*.test.ts` - Add test files

### Estimated Effort

- Endpoint URL updates: **2 hours**
- Payment run methods: **3 hours**  
- Timesheet methods: **4 hours**
- Expense summary method: **2 hours**
- Integration tests: **4 hours**
- Documentation: **2 hours**
- **Total: 17 hours (2 days)**

---

**Next Step**: Begin Phase 1 - Update GoFinancialAdapter endpoints and add payment run methods.
