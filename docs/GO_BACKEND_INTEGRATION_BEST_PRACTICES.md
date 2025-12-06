# Go Backend Integration Best Practices
## Dykstra Funeral Home ERP System

**Version**: 1.0.0  
**Last Updated**: 2025-12-05  
**Target Audience**: Frontend developers, AI coding assistants, backend integration engineers

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Integration Patterns](#core-integration-patterns)
3. [Funeral Home Business Workflows](#funeral-home-business-workflows)
4. [Idempotency & Correlation](#idempotency--correlation)
5. [Error Handling](#error-handling)
6. [Testing Strategies](#testing-strategies)
7. [Common Anti-Patterns](#common-anti-patterns)
8. [Quick Reference](#quick-reference)

---

## Architecture Overview

### System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js Frontend (dykstra-funeral-website)                     │
│  ├── UI Components (React 19)                                   │
│  ├── tRPC Queries/Mutations (React Query cache)                 │
│  └── Zustand Stores (UI state only)                             │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP/tRPC
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Application Layer (@dykstra/application)                       │
│  ├── Use Cases (Effect-TS orchestration)                        │
│  ├── Ports (TypeScript interfaces)                              │
│  └── Domain Models (@dykstra/domain)                            │
└────────────────┬────────────────────────────────────────────────┘
                 │ Effect.provide(Layer)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Infrastructure Layer (@dykstra/infrastructure)                 │
│  ├── Go Backend Adapters (openapi-fetch)                        │
│  ├── Prisma Repositories (local CRM data)                       │
│  └── External Services (Twilio, SendGrid, etc.)                 │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP (via BFF proxy)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Go Backend API (tigerbeetle-trial-app-1)                       │
│  ├── Pure Domain Builders (functional, no side effects)         │
│  ├── Services (TigerBeetle client abstraction)                  │
│  └── HTTP Handlers (gin router)                                 │
└────────────────┬────────────────────────────────────────────────┘
                 │ Parallel writes
                 ▼
┌──────────────────┬──────────────────┬───────────────────────────┐
│  TigerBeetle     │  KurrentDB       │  PostgreSQL               │
│  (Ledger)        │  (Events)        │  (Read Models)            │
│  • Accounts      │  • Event streams │  • Projected tables       │
│  • Transfers     │  • Immutable log │  • SCD2 temporal          │
│  • Deterministic │  • Correlation   │  • Queryable              │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### Key Principles

1. **TigerBeetle is source of truth for financial balances**
2. **KurrentDB is source of truth for business events**
3. **PostgreSQL is derived state for fast queries**
4. **Frontend never queries TigerBeetle directly**
5. **All writes use idempotency keys**
6. **All transactions store correlation IDs**

---

## Core Integration Patterns

### Pattern 1: Command with Idempotency

**Use Case**: Creating invoices, payments, contracts (any write operation)

**TypeScript Code**:

```typescript
// packages/application/src/use-cases/financial/create-invoice.ts
import { Effect } from 'effect';
import { GoFinancialPort } from '@dykstra/application';

export interface CreateInvoiceCommand {
  readonly caseId: string;
  readonly contractId: string;
  readonly lineItems: readonly InvoiceLineItem[];
  readonly dueDate: Date;
}

export const createInvoiceUseCase = (command: CreateInvoiceCommand) =>
  Effect.gen(function* () {
    const financial = yield* GoFinancialPort;
    
    // ✅ CRITICAL: Generate stable idempotency key
    const idempotencyKey = `invoice-${command.caseId}-${command.contractId}-v1`;
    
    // ✅ Submit to Go backend
    const result = yield* financial.createInvoice({
      caseId: command.caseId,
      contractId: command.contractId,
      lineItems: command.lineItems,
      dueDate: command.dueDate,
      idempotencyKey,  // ✅ Backend computes deterministic TB transfer IDs
    });
    
    // ✅ CRITICAL: Store correlation IDs in Prisma
    yield* Effect.promise(() =>
      prisma.invoice.create({
        data: {
          id: result.id,
          caseId: command.caseId,
          status: result.status,
          // ✅ Store for reconciliation
          tbTransferIds: result.tbTransferIds,
          esdbEventPosition: result.esdbEventPosition,
          tbArAccountId: result.arAccountId,
          // Business fields
          totalAmount: result.totalAmount,
          dueDate: command.dueDate,
        }
      })
    );
    
    return result;
  });
```

**Backend Behavior** (informational):
```
1. Receives request with idempotencyKey
2. Computes deterministic TB transfer ID: SHA256("invoice:{caseId}:{idempotencyKey}:ar")
3. Submits transfer to TigerBeetle (TB deduplicates if retry)
4. Appends event to KurrentDB: InvoiceCreated { tbTransferIds: [...] }
5. Returns response with correlation IDs
6. PG projector (async): Reads event, projects to pg_invoices table
```

**Key Points**:
- ✅ Idempotency key = business context + version
- ✅ Store `tbTransferIds`, `esdbEventPosition` in Prisma
- ✅ Network failure + retry = safe (same TB transfer ID)
- ⚠️ PG read model lags ~100-500ms (eventual consistency)

---

### Pattern 2: Query with Optimistic UI

**Use Case**: Displaying customer transactions, case financials

**TypeScript Code**:

```typescript
// packages/application/src/use-cases/customer/get-customer-transactions.ts
export const getCustomerTransactions = (customerId: string) =>
  Effect.gen(function* () {
    const financial = yield* GoFinancialPort;
    const prisma = yield* PrismaClient;
    
    // 1. ✅ Query local Prisma for fast initial load
    const localInvoices = yield* Effect.promise(() =>
      prisma.invoice.findMany({
        where: { customerId },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          tbTransferIds: true,  // ✅ Have correlation IDs
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    );
    
    // 2. ✅ Query Go backend for current AR balance (from PG read model)
    const balance = yield* financial.getCustomerBalance(customerId);
    
    // 3. ✅ (Optional) Fetch recent transactions (PG read model)
    const recentTransactions = yield* financial.getCustomerPayments({
      customerId,
      limit: 20,
    });
    
    return {
      customerId,
      currentBalance: balance.amount,
      tbAccountId: balance.tbAccountId,  // ✅ Can drill down to TB
      invoices: localInvoices,
      recentPayments: recentTransactions,
    };
  });
```

**UI Pattern** (React component):

```typescript
// src/features/customer-transactions/CustomerTransactionsView.tsx
import { trpc } from '@/utils/trpc';

export function CustomerTransactionsView({ customerId }: Props) {
  const { data, isLoading } = trpc.customer.getTransactions.useQuery(
    { customerId },
    {
      // ✅ React Query caching + refetching
      staleTime: 30_000,        // Consider fresh for 30s
      refetchInterval: 60_000,   // Refetch every 60s in background
    }
  );
  
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      <h2>Current Balance: ${data.currentBalance / 100}</h2>
      <p>TB Account: {data.tbAccountId}</p>
      
      <InvoiceTable invoices={data.invoices} />
      
      {/* ✅ Click to drill down */}
      <button onClick={() => viewTBTransfers(data.tbAccountId)}>
        View Ledger Entries
      </button>
    </div>
  );
}
```

---

### Pattern 3: Optimistic Updates with Rollback

**Use Case**: Instant UI feedback for payments, status changes

**TypeScript Code**:

```typescript
// packages/application/src/use-cases/payment/record-payment.ts
export const recordPaymentUseCase = (command: RecordPaymentCommand) =>
  Effect.gen(function* () {
    const financial = yield* GoFinancialPort;
    const optimisticStore = yield* OptimisticPaymentStore;
    
    // 1. ✅ Add optimistic placeholder (UI shows immediately)
    const tempId = yield* optimisticStore.addOptimisticPayment({
      amount: command.amount,
      method: command.method,
      timestamp: new Date(),
    });
    
    try {
      // 2. ✅ Submit to backend with idempotency key
      const result = yield* financial.recordPayment({
        invoiceId: command.invoiceId,
        amount: command.amount,
        paymentMethod: command.method,
        idempotencyKey: `payment-${command.invoiceId}-${Date.now()}`,
      });
      
      // 3. ✅ Remove optimistic, backend succeeded
      yield* optimisticStore.confirmPayment(tempId);
      
      // 4. ✅ Store correlation in Prisma
      yield* Effect.promise(() =>
        prisma.payment.create({
          data: {
            id: result.id,
            invoiceId: command.invoiceId,
            amount: command.amount,
            tbTransferIds: result.tbTransferIds,  // ✅ Correlation
            esdbEventPosition: result.esdbEventPosition,
          }
        })
      );
      
      return result;
      
    } catch (error) {
      // 4. ❌ Rollback optimistic on error
      yield* optimisticStore.rollbackPayment(tempId);
      return yield* Effect.fail(error);
    }
  });
```

**Zustand Store** (UI state only):

```typescript
// packages/ui/src/stores/optimistic-payment-store.ts
interface OptimisticPaymentState {
  // ✅ TEMPORARY placeholders only, NOT backend data
  optimisticPayments: Map<string, OptimisticPayment>;
  
  addOptimisticPayment: (payment: Payment) => string;
  confirmPayment: (tempId: string) => void;
  rollbackPayment: (tempId: string) => void;
}

export const useOptimisticPaymentStore = create<OptimisticPaymentState>(
  (set) => ({
    optimisticPayments: new Map(),
    
    addOptimisticPayment: (payment) => {
      const tempId = `temp-${Date.now()}`;
      set((state) => ({
        optimisticPayments: new Map(state.optimisticPayments).set(tempId, payment)
      }));
      return tempId;
    },
    
    confirmPayment: (tempId) =>
      set((state) => {
        const next = new Map(state.optimisticPayments);
        next.delete(tempId);
        return { optimisticPayments: next };
      }),
    
    rollbackPayment: (tempId) =>
      set((state) => {
        const next = new Map(state.optimisticPayments);
        next.delete(tempId);
        return { optimisticPayments: next };
      }),
  })
);
```

---

## Funeral Home Business Workflows

### Workflow 1: Case → Contract → Invoice → Payment

```typescript
// Complete funeral home revenue cycle
export const funeralCaseRevenueFlow = (caseId: string) =>
  Effect.gen(function* () {
    const contractService = yield* GoContractPort;
    const financial = yield* GoFinancialPort;
    
    // Step 1: Create contract (service arrangements)
    const contract = yield* contractService.createContract({
      caseId,
      services: [
        { serviceCode: 'BASIC_SERVICES', price: 2500_00 },
        { serviceCode: 'EMBALMING', price: 750_00 },
        { serviceCode: 'CASKET', price: 3000_00 },
      ],
      idempotencyKey: `contract-${caseId}-v1`,  // ✅ Idempotent
    });
    
    // Step 2: Generate invoice (AR)
    const invoice = yield* financial.createInvoice({
      caseId,
      contractId: contract.id,
      lineItems: contract.services.map(s => ({
        description: s.serviceName,
        amount: s.price,
        glAccountId: s.revenueAccountId,
      })),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      idempotencyKey: `invoice-${caseId}-v1`,  // ✅ Idempotent
    });
    
    // Backend posts to TigerBeetle:
    //   DR: Accounts Receivable (Customer AR account)
    //   CR: Revenue (Funeral Services Revenue account)
    // tbTransferIds stored in ESDB event and returned
    
    // Step 3: Record payment (when received)
    const payment = yield* financial.recordPayment({
      invoiceId: invoice.id,
      amount: 6250_00,  // Full payment
      paymentMethod: 'check',
      checkNumber: 'CHK-12345',
      idempotencyKey: `payment-${invoice.id}-${Date.now()}`,  // ✅ Unique
    });
    
    // Backend posts to TigerBeetle:
    //   DR: Cash/Bank
    //   CR: Accounts Receivable (reduces AR balance)
    
    // ✅ All transactions have correlation IDs
    return {
      caseId,
      contract: { id: contract.id, tbTransferIds: contract.tbTransferIds },
      invoice: { id: invoice.id, tbTransferIds: invoice.tbTransferIds },
      payment: { id: payment.id, tbTransferIds: payment.tbTransferIds },
    };
  });
```

**TigerBeetle Ledger Mapping** (informational):

| Business Event | TB Ledger | Accounts Affected |
|----------------|-----------|-------------------|
| Contract Created | Ledger 1 (Money) | None (no financial impact yet) |
| Invoice Posted | Ledger 1 | DR: AR, CR: Revenue |
| Payment Received | Ledger 1 | DR: Cash, CR: AR |
| Case Closed | Ledger 1 | Optional: Close AR account if zero |

**Correlation Storage**:

```sql
-- Prisma schema (for reference)
model Contract {
  id                String   @id
  caseId            String
  status            String
  totalAmount       Int
  
  -- ✅ Correlation IDs
  tbTransferIds     String[]
  esdbEventPosition BigInt?
  
  createdAt         DateTime @default(now())
}

model Invoice {
  id                String   @id
  caseId            String
  contractId        String
  totalAmount       Int
  amountPaid        Int      @default(0)
  
  -- ✅ Correlation IDs
  tbTransferIds     String[]
  tbArAccountId     String?   -- Deterministic AR account ID
  esdbEventPosition BigInt?
}

model Payment {
  id                String   @id
  invoiceId         String
  amount            Int
  method            String
  
  -- ✅ Correlation IDs
  tbTransferIds     String[]
  esdbEventPosition BigInt?
}
```

---

### Workflow 2: Payroll with Case Commissions

```typescript
// Funeral director commissions tied to cases
export const processPayrollWithCommissions = (payPeriodEnd: Date) =>
  Effect.gen(function* () {
    const payroll = yield* GoPayrollPort;
    
    // Step 1: Create payroll run
    const run = yield* payroll.createPayrollRun({
      payPeriodStart: new Date(payPeriodEnd.getTime() - 14 * 24 * 60 * 60 * 1000),
      payPeriodEnd,
      payDate: new Date(payPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000),
    });
    
    // Step 2: Import time entries (from local tracking)
    yield* payroll.importTimeEntries({
      payPeriodId: run.id,
      entries: [
        {
          employeeId: 'EMP-001',
          date: payPeriodEnd,
          hours: 40,
          caseId: 'CASE-123',  // ✅ Tie to case for commission
        },
      ],
    });
    
    // Step 3: Calculate payroll (backend queries case commissions)
    const lineItems = yield* payroll.calculatePayroll(run.id);
    
    // Step 4: Approve payroll
    yield* payroll.approvePayrollRun(run.id, {
      approvedBy: 'MGR-001',
      notes: 'Reviewed case commissions',
    });
    
    // Backend posts to TigerBeetle:
    //   DR: Payroll Expense (by department/case)
    //   CR: Payroll Liability (net pay)
    //   CR: Tax Withholding Liability (federal, state, FICA)
    
    // Step 5: Mark paid (when direct deposit clears)
    yield* payroll.markPayrollPaid(run.id);
    
    // Backend posts to TigerBeetle:
    //   DR: Payroll Liability
    //   CR: Bank (checking account)
    
    return { runId: run.id, employeeCount: lineItems.length };
  });
```

**Backend Data Flow** (informational):

```
1. Frontend creates payroll run
   └─> Go backend: PayrollRunCreated event → KurrentDB
   
2. Frontend imports time entries
   └─> Go backend: TimeEntriesImported event → KurrentDB
   
3. Frontend triggers calculate
   └─> Go backend queries:
       • Employee master data (Prisma or Go DB)
       • Case assignments (for commissions)
       • Tax rates (Michigan state, federal)
   └─> Computes gross, deductions, net
   └─> Returns line items (NO TB posting yet)
   
4. Frontend approves
   └─> Go backend posts to TigerBeetle:
       • Payroll expense entries (by case/department)
       • Liability entries (net pay, taxes)
   └─> PayrollRunApproved event → KurrentDB
   └─> Returns tbTransferIds
   
5. Frontend marks paid
   └─> Go backend posts to TigerBeetle:
       • Bank withdrawal
       • Clears payroll liability
   └─> PayrollRunPaid event → KurrentDB
```

---

## Idempotency & Correlation

### Idempotency Key Patterns

**Rule**: Idempotency key = business context + version/timestamp

| Operation | Idempotency Key Pattern | Example |
|-----------|------------------------|---------|
| Invoice creation | `invoice-{caseId}-{contractId}-v1` | `invoice-CASE123-CONTRACT456-v1` |
| Payment | `payment-{invoiceId}-{timestamp}` | `payment-INV123-1733423871000` |
| Contract | `contract-{caseId}-v1` | `contract-CASE123-v1` |
| Payroll run | `payroll-{periodEnd}-v1` | `payroll-2025-12-15-v1` |
| Journal entry | `journal-{description}-{date}` | `journal-depreciation-2025-12-31` |

**Critical: Never use random UUIDs for idempotency keys**
```typescript
// ❌ BAD - loses idempotency on retry
const idempotencyKey = crypto.randomUUID();

// ✅ GOOD - stable from business context
const idempotencyKey = `invoice-${caseId}-${contractId}-v1`;
```

### Storing Correlation IDs

**Always store these fields in Prisma**:

```typescript
interface CorrelationFields {
  // ✅ MUST store
  tbTransferIds: string[];        // Array of TB transfer hex IDs
  esdbEventPosition: number;      // KurrentDB event position
  
  // ✅ SHOULD store (for queries)
  tbAccountId?: string;           // Deterministic TB account ID (AR, AP, etc.)
}
```

**Prisma migration template**:

```sql
-- Add correlation columns to existing tables
ALTER TABLE invoices ADD COLUMN tb_transfer_ids TEXT[];
ALTER TABLE invoices ADD COLUMN esdb_event_position BIGINT;
ALTER TABLE invoices ADD COLUMN tb_ar_account_id TEXT;

-- Add indexes for correlation queries
CREATE INDEX idx_invoices_tb_transfers ON invoices USING GIN (tb_transfer_ids);
CREATE INDEX idx_invoices_esdb_position ON invoices(esdb_event_position);
```

**Usage example**:

```typescript
// Query invoice, then drill into TB
const invoice = await prisma.invoice.findUnique({
  where: { id: 'INV-123' },
  select: { tbTransferIds: true, tbArAccountId: true }
});

// Call Go backend to get TB transfer details
const transfers = await financial.lookupTransfers(invoice.tbTransferIds);

// Or query TB account balance
const balance = await financial.getAccountBalance(invoice.tbArAccountId);
```

---

## Error Handling

### Error Categories

**1. Network Errors** - Retryable
```typescript
import { NetworkError } from '@dykstra/application';

// ✅ Retry on network errors
const result = yield* financial.createInvoice(command).pipe(
  Effect.retry({
    times: 3,
    schedule: Schedule.exponential(1000),  // 1s, 2s, 4s
  }),
  Effect.catchTag('NetworkError', (error) => {
    // Log and alert
    yield* Effect.log(`Network error: ${error.message}`);
    return yield* Effect.fail(error);
  })
);
```

**2. Not Found Errors** - Don't retry
```typescript
import { NotFoundError } from '@dykstra/application';

const invoice = yield* financial.getInvoice(invoiceId).pipe(
  Effect.catchTag('NotFoundError', (error) => {
    // Show user-friendly message
    return yield* Effect.succeed(null);  // Return null instead of error
  })
);
```

**3. Domain Errors** - Don't retry
```typescript
// Backend returns 400 with domain error
const result = yield* financial.createInvoice(command).pipe(
  Effect.catchAll((error) => {
    if (error.message.includes('INSUFFICIENT_CREDIT')) {
      // Show credit hold warning to user
      yield* showCreditHoldWarning(customerId);
    }
    return yield* Effect.fail(error);
  })
);
```

### Handling Eventual Consistency

**Pattern: Poll until PG projector catches up**

```typescript
// After write, wait for PG read model
const createInvoiceWithConfirmation = (command: CreateInvoiceCommand) =>
  Effect.gen(function* () {
    const financial = yield* GoFinancialPort;
    
    // 1. Submit write (returns after TB + ESDB, before PG)
    const result = yield* financial.createInvoice(command);
    
    // 2. Poll PG read model until available
    const invoice = yield* pollUntilAvailable(
      () => financial.getInvoice(result.id),
      { maxAttempts: 10, delayMs: 100 }
    );
    
    return invoice;
  });

// Helper: Poll with exponential backoff
function pollUntilAvailable<T>(
  query: () => Effect.Effect<T, Error>,
  options: { maxAttempts: number; delayMs: number }
): Effect.Effect<T, Error> {
  return Effect.gen(function* () {
    for (let i = 0; i < options.maxAttempts; i++) {
      const result = yield* query().pipe(
        Effect.catchTag('NotFoundError', () => Effect.succeed(null))
      );
      
      if (result !== null) return result;
      
      // Wait before retry (exponential backoff)
      yield* Effect.sleep(options.delayMs * Math.pow(2, i));
    }
    
    return yield* Effect.fail(new Error('Polling timed out'));
  });
}
```

---

## Testing Strategies

### 1. Unit Tests (Domain Logic)

```typescript
// packages/domain/src/entities/__tests__/case.test.ts
import { describe, it, expect } from 'vitest';
import { Case, CaseStatus } from '../case';

describe('Case', () => {
  it('transitions from inquiry to active', () => {
    const case_ = new Case({
      id: 'CASE-1',
      status: CaseStatus.Inquiry,
      // ...
    });
    
    const result = case_.transitionStatus(CaseStatus.Active);
    
    expect(result).toMatchObject({
      status: CaseStatus.Active,
    });
  });
  
  it('rejects invalid state transitions', () => {
    const case_ = new Case({
      id: 'CASE-1',
      status: CaseStatus.Completed,
    });
    
    expect(() => {
      case_.transitionStatus(CaseStatus.Inquiry);
    }).toThrow('Invalid state transition');
  });
});
```

### 2. Integration Tests (With Go Backend)

```typescript
// packages/infrastructure/src/adapters/go-backend/__tests__/go-financial-adapter.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { GoFinancialAdapter } from '../go-financial-adapter';
import { Effect } from 'effect';

describe('GoFinancialAdapter Integration', () => {
  beforeAll(() => {
    // Ensure Go backend is running on localhost:8080
    // Or use test environment variable: GO_BACKEND_URL
  });
  
  it('creates invoice with idempotency', async () => {
    const command = {
      caseId: 'TEST-CASE-1',
      contractId: 'TEST-CONTRACT-1',
      lineItems: [{ description: 'Test', amount: 100_00 }],
      dueDate: new Date(),
      idempotencyKey: `test-invoice-${Date.now()}`,
    };
    
    // First attempt
    const result1 = await Effect.runPromise(
      GoFinancialAdapter.createInvoice(command)
    );
    
    // Retry with same key (should be idempotent)
    const result2 = await Effect.runPromise(
      GoFinancialAdapter.createInvoice(command)
    );
    
    expect(result1.id).toBe(result2.id);  // ✅ Same invoice
    expect(result1.tbTransferIds).toEqual(result2.tbTransferIds);  // ✅ Same TB transfers
  });
});
```

### 3. E2E Tests (Playwright)

```typescript
// e2e/funeral-case-revenue-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete funeral case revenue cycle', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  // Create case
  await page.goto('/cases/new');
  await page.fill('[name=decedentName]', 'John Doe');
  await page.click('button:has-text("Create Case")');
  await expect(page.locator('text=Case created')).toBeVisible();
  
  const caseId = await page.locator('[data-case-id]').textContent();
  
  // Create contract
  await page.goto(`/cases/${caseId}/contract`);
  await page.click('text=Basic Services');
  await page.click('button:has-text("Generate Contract")');
  await expect(page.locator('text=Contract created')).toBeVisible();
  
  // Generate invoice
  await page.click('button:has-text("Generate Invoice")');
  await expect(page.locator('text=Invoice #')).toBeVisible();
  
  // Record payment
  await page.fill('[name=paymentAmount]', '6250.00');
  await page.selectOption('[name=paymentMethod]', 'check');
  await page.fill('[name=checkNumber]', 'CHK-12345');
  await page.click('button:has-text("Record Payment")');
  await expect(page.locator('text=Payment recorded')).toBeVisible();
  
  // Verify balance (should be $0)
  const balance = await page.locator('[data-ar-balance]').textContent();
  expect(balance).toBe('$0.00');
});
```

---

## Common Anti-Patterns

### ❌ Anti-Pattern 1: Random Idempotency Keys

```typescript
// ❌ BAD - Loses idempotency on retry
const createInvoice = (caseId: string) => {
  const idempotencyKey = crypto.randomUUID();  // ❌ Different every time!
  
  return financial.createInvoice({
    caseId,
    idempotencyKey,
    // ...
  });
};

// ✅ GOOD - Stable idempotency key
const createInvoice = (caseId: string, contractId: string) => {
  const idempotencyKey = `invoice-${caseId}-${contractId}-v1`;  // ✅ Repeatable
  
  return financial.createInvoice({
    caseId,
    idempotencyKey,
    // ...
  });
};
```

### ❌ Anti-Pattern 2: Discarding Correlation IDs

```typescript
// ❌ BAD - Throws away TB transfer IDs
const createInvoice = async (command: Command) => {
  const result = await financial.createInvoice(command);
  
  await prisma.invoice.create({
    data: {
      id: result.id,
      caseId: command.caseId,
      // ❌ Missing: tbTransferIds, esdbEventPosition
    }
  });
};

// ✅ GOOD - Stores correlation IDs
const createInvoice = async (command: Command) => {
  const result = await financial.createInvoice(command);
  
  await prisma.invoice.create({
    data: {
      id: result.id,
      caseId: command.caseId,
      // ✅ Store for reconciliation
      tbTransferIds: result.tbTransferIds,
      esdbEventPosition: result.esdbEventPosition,
      tbArAccountId: result.arAccountId,
    }
  });
};
```

### ❌ Anti-Pattern 3: Storing Backend Data in Zustand

```typescript
// ❌ BAD - Duplicates tRPC cache
interface BadInvoiceState {
  invoices: Invoice[];  // ❌ Gets stale!
  addInvoice: (invoice: Invoice) => void;  // ❌ Manual sync!
}

// ✅ GOOD - Use tRPC for backend data
function InvoiceList({ caseId }: Props) {
  // ✅ Let tRPC + React Query handle caching
  const { data: invoices } = trpc.invoice.list.useQuery({ caseId });
  
  return <InvoiceTable data={invoices} />;
}
```

### ❌ Anti-Pattern 4: Querying TigerBeetle Directly

```typescript
// ❌ BAD - Frontend queries TB directly
const getCustomerBalance = async (customerId: string) => {
  // ❌ No way to compute deterministic account ID from frontend
  const accountId = computeTBAccountID(customerId);  // ❌ Won't match backend!
  
  const balance = await tbClient.lookupAccount(accountId);  // ❌ Wrong!
};

// ✅ GOOD - Query via Go backend API
const getCustomerBalance = (customerId: string) =>
  Effect.gen(function* () {
    const financial = yield* GoFinancialPort;
    
    // ✅ Backend knows deterministic account ID computation
    const balance = yield* financial.getCustomerBalance(customerId);
    
    return balance;
  });
```

### ❌ Anti-Pattern 5: Ignoring Eventual Consistency

```typescript
// ❌ BAD - Assumes immediate consistency
const createAndQueryInvoice = async (command: Command) => {
  await financial.createInvoice(command);
  
  // ❌ PG projector hasn't caught up yet (100-500ms lag)
  const invoice = await financial.getInvoice(command.invoiceId);  // ❌ 404!
};

// ✅ GOOD - Poll or use optimistic UI
const createAndQueryInvoice = (command: Command) =>
  Effect.gen(function* () {
    const result = yield* financial.createInvoice(command);
    
    // ✅ Poll until PG read model is consistent
    const invoice = yield* pollUntilAvailable(
      () => financial.getInvoice(result.id),
      { maxAttempts: 10, delayMs: 100 }
    );
    
    return invoice;
  });
```

---

## Quick Reference

### Go Backend Adapter Checklist

When integrating a new backend operation:

- [ ] Import `GoPort` from `@dykstra/application`
- [ ] Generate stable idempotency key from business context
- [ ] Call adapter method with `Effect.gen`
- [ ] Store `tbTransferIds` and `esdbEventPosition` in Prisma
- [ ] Handle `NetworkError` with retry logic
- [ ] Handle `NotFoundError` gracefully (don't retry)
- [ ] Poll for eventual consistency if querying immediately after write
- [ ] Write integration test with Go backend running
- [ ] Document correlation IDs in Prisma schema comments

### Idempotency Key Patterns

```typescript
// Invoice
`invoice-${caseId}-${contractId}-v1`

// Payment
`payment-${invoiceId}-${Date.now()}`

// Contract
`contract-${caseId}-v1`

// Payroll
`payroll-${periodEnd.toISOString().split('T')[0]}-v1`

// Journal Entry
`journal-${description.toLowerCase().replace(/\s+/g, '-')}-${date}`
```

### Correlation Fields to Store

```prisma
model Transaction {
  id                String   @id
  
  // ✅ MUST store
  tbTransferIds     String[]   @db.Text[]
  esdbEventPosition BigInt?
  
  // ✅ SHOULD store (for queries)
  tbAccountId       String?    -- Deterministic TB account ID
  
  // ✅ OPTIONAL (for audit)
  idempotencyKey    String?    -- What was sent to backend
}
```

### Go Backend Endpoints Reference

| Module | Endpoint | Purpose |
|--------|----------|---------|
| **Financial** | `POST /v1/financial/invoices` | Create AR invoice |
| **Financial** | `POST /v1/financial/payments` | Record payment |
| **Financial** | `GET /v1/financial/trial-balance` | Get trial balance |
| **Financial** | `GET /customers/{id}/balance` | Get customer AR balance |
| **Payroll** | `POST /v1/payroll/runs` | Create payroll run |
| **Payroll** | `POST /v1/payroll/runs/{id}/calculate` | Calculate payroll |
| **Payroll** | `POST /v1/payroll/runs/{id}/approve` | Approve payroll |
| **Contract** | `POST /v1/contracts` | Create service contract |
| **Scheduling** | `POST /v1/scheduling/shifts` | Create shift |

### Effect-TS Patterns

```typescript
// Sequential operations (use yield*)
Effect.gen(function* () {
  const a = yield* operation1();
  const b = yield* operation2(a);
  return b;
});

// Parallel operations (use Effect.all)
Effect.gen(function* () {
  const [a, b, c] = yield* Effect.all([
    operation1(),
    operation2(),
    operation3(),
  ]);
  return { a, b, c };
});

// Retry with exponential backoff
operation().pipe(
  Effect.retry({
    times: 3,
    schedule: Schedule.exponential(1000),
  })
);

// Error handling
operation().pipe(
  Effect.catchTag('NetworkError', (error) => {
    // Handle network errors
  }),
  Effect.catchTag('NotFoundError', (error) => {
    // Handle not found
  })
);
```

---

## Appendix: Architecture Decision Records

### ADR-001: Why Effect-TS?

**Context**: Need type-safe, composable error handling and dependency injection.

**Decision**: Use Effect-TS for application layer.

**Benefits**:
- Type-safe error handling (no unchecked exceptions)
- Dependency injection via Context tags
- Composable effects (retry, timeout, parallel)
- Testable without mocks (provide test layer)

### ADR-002: Why Store Correlation IDs in Prisma?

**Context**: Need to reconcile frontend CRM with backend ledger.

**Decision**: Store `tbTransferIds`, `esdbEventPosition` in Prisma for all financial transactions.

**Benefits**:
- Can query Prisma → drill into TB
- Can replay from ESDB position for audit
- Can reconcile: Prisma amounts = sum(TB transfers)
- Enables point-in-time queries

### ADR-003: Why Idempotency Keys from Business Context?

**Context**: Network failures require retry safety.

**Decision**: Generate idempotency keys from stable business identifiers, never UUIDs.

**Benefits**:
- Network retry = same backend operation (safe)
- Backend computes deterministic TB transfer IDs
- No duplicate transfers in TigerBeetle
- Audit trail shows retries as single logical operation

---

**Document Version**: 1.0.0  
**Last Reviewed**: 2025-12-05  
**Maintained By**: Dykstra ERP Dev Team  
**Questions?**: See [Go Backend Integration Guide](./GO_BACKEND_INTEGRATION_GUIDE.md) or [Architecture](./ARCHITECTURE.md)
