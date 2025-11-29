# Integration Design: Funeral CRM + Go ERP/HCM/Payroll

**Status**: Phase 0 - Foundation  
**Last Updated**: 2025-11-29

## Executive Summary

This document defines the integration architecture for unifying the Dykstra Funeral Home CRM (TypeScript/Effect-TS/Next.js) with the comprehensive Go-based ERP system (TigerBeetle/EventStoreDB/PostgreSQL) to create a world-class funeral home management system with a unified user experience.

## Architecture Principles

### Non-Negotiable Constraints
1. **No Architectural Compromise**: Both systems maintain their architectural integrity
   - Go ERP: Hexagonal architecture with TigerBeetle hot-path principles
   - TypeScript CRM: Clean Architecture with Effect-TS patterns
2. **Backend Federation**: Systems remain independently deployable
3. **Anti-Corruption Layer**: BFF prevents cross-contamination
4. **Type Safety**: End-to-end type safety from frontend → BFF, strong contracts with Go

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│           Unified Next.js Frontend (apps/web)               │
│    Cases | Contracts | FinOps | Payroll | Procurement      │
└──────────────────┬──────────────────────────────────────────┘
                   │ tRPC
                   ↓
┌─────────────────────────────────────────────────────────────┐
│        Backend-for-Frontend (BFF) - services/bff            │
│         (Fastify + tRPC + Effect-TS + OpenAPI)              │
│                                                             │
│  • Authentication (Clerk unified across both backends)      │
│  • Request aggregation (combine CRM + ERP data)            │
│  • DTO transformation (backend → frontend contracts)        │
│  • Caching layer (React Query on frontend, memory on BFF)  │
└──────────────┬────────────────────────────┬─────────────────┘
               │                            │
               ↓ tRPC                       ↓ HTTP/OpenAPI
┌──────────────────────────┐  ┌────────────────────────────┐
│   Funeral CRM Backend    │  │   ERP/HCM/Payroll Backend │
│   (TypeScript/Effect-TS) │  │   (Go/Hexagonal)          │
│                          │  │                            │
│   • Case management      │  │   • GL (General Ledger)   │
│   • Contracts/docs       │  │   • AP (Accounts Payable) │
│   • Memorials            │  │   • Payroll/HCM           │
│   • Stripe payments      │  │   • Procurement (P2P)     │
│   • Storage (S3)         │  │   • Inventory/WMS         │
│                          │  │   • Manufacturing (MES)    │
│   PostgreSQL + Prisma    │  │   TigerBeetle + PG/ESDB   │
└──────────────────────────┘  └────────────────────────────┘
```

## Integration Points

### Phase 1: Case-to-GL Bridge (Weeks 3-5)

**Business Value**: Link funeral case expenses to general ledger for unified financial reporting.

#### Use Case: Post Case Expenses to GL

**Trigger**: User finalizes a funeral case in CRM  
**Flow**:
1. Frontend → BFF: `finalizeCase({ businessKey: "CASE-123" })`
2. BFF → CRM: tRPC call to finalize case (returns line items)
3. BFF → ERP: HTTP POST to `/gl/journals` with mapped entries
4. BFF → Frontend: Success response with case + GL journal ID

#### Data Mapping

Funeral CRM Line Items → GL Chart of Accounts:

```typescript
// CRM Line Item
{
  type: "casket" | "embalming" | "facility" | "professional_services",
  description: string,
  amount: number, // cents
}

// Maps to GL Accounts (in Go ERP)
{
  casket: "5001",              // COGS - Merchandise
  embalming: "5100",           // COGS - Services  
  facility: "5200",            // COGS - Facilities
  professional_services: "5300" // COGS - Professional Services
}
```

#### BFF Implementation

```typescript
// services/bff/src/routers/cases.router.ts
import { router, staffProcedure } from '../trpc'
import { z } from 'zod'

export const casesRouter = router({
  finalizeCase: staffProcedure
    .input(z.object({ businessKey: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Finalize case in CRM (tRPC call)
      const case_ = await ctx.crmClient.case.finalize.mutate({
        businessKey: input.businessKey
      })
      
      // 2. Map line items to GL entries
      const glEntries = case_.lineItems.map(item => ({
        account_code: mapItemTypeToGLAccount(item.type),
        amount_minor: item.amount,
        narrative: `Case ${case_.businessKey} - ${item.description}`
      }))
      
      // 3. Post to GL in Go ERP
      const journal = await ctx.erpClient.POST('/v1/gl/journals', {
        body: {
          book: "MAIN",
          entity_id: case_.legalEntity,
          accounting_date: new Date().toISOString().split('T')[0],
          currency: "USD",
          description: `Funeral Case ${case_.businessKey}`,
          lines: glEntries
        }
      })
      
      // 4. Store GL reference in CRM
      await ctx.crmClient.case.updateGLReference.mutate({
        businessKey: input.businessKey,
        glJournalId: journal.data.journal_id
      })
      
      return {
        caseId: case_.id,
        glJournalId: journal.data.journal_id,
        status: 'finalized'
      }
    })
})
```

### Phase 2: Payroll Integration (Weeks 6-8)

**Business Value**: Track funeral director hours in CRM, process via Go payroll.

#### Data Flow

1. **Time Entry** (CRM): Funeral director logs hours against a case
2. **Aggregation** (BFF): Collect time entries per pay period
3. **Import** (ERP): POST to `/v1/payroll/import-time-entries`
4. **Payroll Run** (ERP): Process payroll with imported hours

#### CRM Schema Addition

```prisma
model TimeEntry {
  id          String   @id @default(cuid())
  businessKey String   @unique
  employeeId  String   // Links to Go ERP employee
  caseId      String
  hours       Decimal
  date        DateTime
  approved    Boolean  @default(false)
  
  case Case @relation(fields: [caseId], references: [id])
}
```

#### BFF Orchestration

```typescript
// services/bff/src/routers/payroll.router.ts
export const payrollRouter = router({
  runPayroll: adminProcedure
    .input(z.object({ 
      payPeriodId: z.string(),
      legalEntity: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Fetch approved time entries from CRM
      const timeEntries = await ctx.crmClient.timeEntry.listByPayPeriod.query({
        payPeriodId: input.payPeriodId,
        approved: true
      })
      
      // 2. Transform to Go ERP format
      const erpTimeEntries = timeEntries.map(te => ({
        employee_id: te.employeeId,
        hours: te.hours.toString(),
        date: te.date.toISOString(),
        reference: `CASE-${te.caseId}`
      }))
      
      // 3. Import to Go payroll
      await ctx.erpClient.POST('/v1/payroll/import-time-entries', {
        body: {
          entries: erpTimeEntries,
          pay_period_id: input.payPeriodId
        }
      })
      
      // 4. Trigger payroll run
      const run = await ctx.erpClient.POST('/v1/payroll/runs', {
        body: {
          pay_period_id: input.payPeriodId,
          legal_entity: input.legalEntity
        }
      })
      
      return {
        payrollRunId: run.data.run_id,
        entriesImported: erpTimeEntries.length
      }
    })
})
```

### Phase 3: Procurement & Inventory (Weeks 9-12)

**Business Value**: Funeral supplies (caskets, urns, embalming supplies) managed in Go inventory, available for case selection in CRM.

#### Data Flow

1. **Product Catalog** (ERP): Products managed in `/v1/inventory/products`
2. **Read Model** (BFF): Cache product catalog with TTL
3. **Case Selection** (CRM): Select products from cached inventory
4. **Reservation** (ERP): Reserve inventory when case is allocated

#### BFF Product Adapter

```typescript
// services/bff/src/adapters/inventory-adapter.ts
import { Effect } from 'effect'
import type { ProductCategory } from '@dykstra/domain'

export interface InventoryAdapter {
  readonly listAvailableProducts: (
    category: ProductCategory
  ) => Effect.Effect<Product[], InventoryError>
}

export const GoInventoryAdapter: InventoryAdapter = {
  listAvailableProducts: (category) =>
    Effect.tryPromise({
      try: async () => {
        const response = await erpClient.GET('/v1/inventory/products', {
          params: {
            query: {
              category,
              status: 'available'
            }
          }
        })
        
        if (!response.data) {
          throw new Error('No data returned')
        }
        
        return response.data.items.map(toDomainProduct)
      },
      catch: (error) => new InventoryError({
        message: 'Failed to fetch products',
        cause: error
      })
    })
}
```

### Phase 4: Unified Reporting (Weeks 13-15)

**Business Value**: Executive dashboards combining CRM metrics (active cases, revenue pipeline) with ERP financials (GL, payroll expense, margin analysis).

#### BFF Aggregation Example

```typescript
// services/bff/src/routers/dashboard.router.ts
export const dashboardRouter = router({
  executiveSummary: adminProcedure
    .input(z.object({
      legalEntity: z.string(),
      period: z.string()
    }))
    .query(async ({ input, ctx }) => {
      // Parallel queries to both backends
      const [crmMetrics, glSummary, payrollExpense] = await Promise.all([
        ctx.crmClient.analytics.caseSummary.query({
          legalEntity: input.legalEntity,
          period: input.period
        }),
        ctx.erpClient.GET('/v1/gl/statements/profit-loss', {
          body: {
            book: 'MAIN',
            entity_id: input.legalEntity,
            period_key: input.period,
            currency: 'USD'
          }
        }),
        ctx.erpClient.GET('/v1/payroll/expense-summary', {
          params: {
            query: {
              legal_entity: input.legalEntity,
              period: input.period
            }
          }
        })
      ])
      
      return {
        activeCases: crmMetrics.active,
        completedCases: crmMetrics.completed,
        revenue: glSummary.data.total_revenue_minor / 100,
        payrollExpense: payrollExpense.data.total_minor / 100,
        grossMargin: calculateMargin(crmMetrics, glSummary.data)
      }
    })
})
```

## Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 App Router | Unified workspace UI |
| **UI Components** | `packages/ui` (Tailwind v4 + Radix) | Shared design system |
| **BFF** | Fastify + tRPC + Effect-TS | Orchestration layer |
| **OpenAPI Client** | openapi-typescript + openapi-fetch | Type-safe Go ERP client |
| **CRM Backend** | TypeScript + Effect-TS + Prisma | Funeral operations |
| **ERP Backend** | Go + TigerBeetle + EventStoreDB | Back office |
| **Auth** | Clerk | SSO across both systems |
| **Cache** | TanStack Query (frontend) | Request deduplication |

## BFF Package Structure

```
services/bff/
├── src/
│   ├── routers/
│   │   ├── cases.router.ts        # Routes to TS CRM
│   │   ├── contracts.router.ts    # Routes to TS CRM
│   │   ├── finops.router.ts       # Routes to Go ERP (GL)
│   │   ├── payroll.router.ts      # Routes to Go ERP
│   │   ├── procurement.router.ts  # Routes to Go ERP
│   │   ├── dashboard.router.ts    # Aggregates both
│   │   └── index.ts
│   ├── clients/
│   │   ├── crm-client.ts          # tRPC client to CRM backend
│   │   └── erp-client.ts          # OpenAPI client to Go ERP
│   ├── middleware/
│   │   ├── auth.ts                # Clerk JWT validation
│   │   └── tenant.ts              # Multi-tenant routing
│   ├── adapters/
│   │   └── inventory-adapter.ts   # Port implementation
│   └── index.ts                   # Server entrypoint
├── package.json
└── tsconfig.json
```

## Data Ownership Boundaries

| Domain | Owner | Access Pattern |
|--------|-------|---------------|
| Cases | CRM | Direct write, BFF read |
| Contracts | CRM | Direct write, BFF read |
| Memorials | CRM | Direct write, BFF read |
| Family data | CRM | Direct write (PII), BFF read |
| GL accounts | ERP | Direct write, BFF read |
| Payroll | ERP | Direct write, BFF orchestrates import |
| Inventory | ERP | Direct write, BFF read (cached) |
| Purchase orders | ERP | Direct write, BFF read |

## Shared Reference Data

Both systems will reference common identifiers:

- **Employee IDs**: Managed in Go ERP HCM, referenced in CRM time entries
- **Product SKUs**: Managed in Go ERP inventory, referenced in CRM case line items
- **GL Account Codes**: Defined in Go ERP chart of accounts, mapped in BFF
- **Legal Entity IDs**: Shared identifier for multi-entity support

## Event-Driven Integration (Future - Phase 5)

For real-time synchronization:

```
TypeScript CRM → EventStoreDB → Go ERP projectors
Go ERP → EventStoreDB → TypeScript CRM projectors
```

Example event streams:
- `case-finalized|{caseId}` → Triggers GL posting in Go ERP
- `payroll-completed|{runId}` → Updates CRM with processed hours
- `inventory-reserved|{sku}` → Updates CRM product availability

## Authentication & Authorization

### Single Sign-On (Clerk)

- **CRM Backend**: Uses `@clerk/nextjs` middleware
- **Go ERP**: Validates Clerk JWT via custom middleware
- **BFF**: Validates Clerk session, forwards JWT to both backends

### Role-Based Access Control

Unified roles across both systems:
- `funeral_director`: CRM case management + time entry
- `accountant`: ERP GL access + CRM reporting
- `payroll_admin`: ERP payroll + CRM time entry approval
- `admin`: Full access to both systems

## Caching Strategy

### Frontend (TanStack Query)

```typescript
// apps/web/lib/queries/inventory.ts
export const useAvailableProducts = (category: ProductCategory) => {
  return useQuery({
    queryKey: ['inventory', 'products', category],
    queryFn: () => trpc.inventory.listAvailable.query({ category }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}
```

### BFF (In-Memory LRU)

```typescript
// services/bff/src/cache/inventory-cache.ts
import { LRUCache } from 'lru-cache'

const inventoryCache = new LRUCache<string, Product[]>({
  max: 500,
  ttl: 5 * 60 * 1000 // 5 minutes
})

export const getCachedProducts = async (category: ProductCategory) => {
  const key = `products:${category}`
  
  let products = inventoryCache.get(key)
  if (!products) {
    products = await fetchFromGoERP(category)
    inventoryCache.set(key, products)
  }
  
  return products
}
```

## Observability

### Distributed Tracing

```typescript
// services/bff/src/tracing.ts
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('bff')

export const tracedFetch = async (url: string, options: RequestInit) => {
  const span = tracer.startSpan('bff.http.request', {
    attributes: {
      'http.url': url,
      'http.method': options.method || 'GET'
    }
  })
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-Trace-ID': span.spanContext().traceId
      }
    })
    
    span.setAttributes({
      'http.status_code': response.status
    })
    
    return response
  } finally {
    span.end()
  }
}
```

### Metrics

```typescript
// services/bff/src/metrics.ts
import { Counter, Histogram } from 'prom-client'

export const bffRequestDuration = new Histogram({
  name: 'bff_request_duration_seconds',
  help: 'BFF request duration',
  labelNames: ['router', 'procedure']
})

export const erpCallsTotal = new Counter({
  name: 'bff_erp_calls_total',
  help: 'Total calls to Go ERP',
  labelNames: ['endpoint', 'status']
})
```

## Deployment Strategy

### Phase 0-2: Parallel Deployment

```
┌─────────────────┐   ┌─────────────────┐
│  Funeral CRM    │   │   Go ERP (new)  │
│  (existing)     │   │   (separate)    │
│  localhost:3000 │   │   localhost:8080│
└─────────────────┘   └─────────────────┘
         ↑                     ↑
         └──────┬──────────────┘
                │
        ┌───────┴───────┐
        │  BFF (local)  │
        │ localhost:4000│
        └───────────────┘
```

### Phase 3+: Unified Deployment

```
                ┌─────────────┐
                │  Frontend   │
                │  (Next.js)  │
                └──────┬──────┘
                       │
                ┌──────┴──────┐
                │     BFF     │
                │  (Fastify)  │
                └──────┬──────┘
                       │
         ┌─────────────┴─────────────┐
         ↓                           ↓
┌─────────────────┐         ┌─────────────────┐
│  CRM Backend    │         │   ERP Backend   │
│ (TypeScript)    │         │     (Go)        │
└─────────────────┘         └─────────────────┘
```

## Success Metrics

- **Type Safety**: 100% type coverage from frontend → BFF
- **Performance**: BFF p95 latency < 200ms
- **Availability**: 99.9% uptime for BFF
- **Cache Hit Rate**: > 80% for product catalog
- **Integration Test Coverage**: > 90% for cross-system flows

## Rollout Plan

1. **Week 1-2**: BFF scaffolding + health checks
2. **Week 3-5**: Case-to-GL bridge (first revenue-generating integration)
3. **Week 6-8**: Payroll time tracking integration
4. **Week 9-12**: Inventory/procurement integration
5. **Week 13-15**: Unified dashboard + reporting
6. **Week 16+**: Event-driven sync, advanced analytics

## Appendix A: GL Account Mapping

| Funeral Service Type | GL Account Code | Description |
|---------------------|----------------|-------------|
| Casket | 5001 | COGS - Merchandise |
| Vault | 5002 | COGS - Merchandise |
| Urn | 5003 | COGS - Merchandise |
| Embalming | 5100 | COGS - Services |
| Cosmetology | 5101 | COGS - Services |
| Facility Use | 5200 | COGS - Facilities |
| Viewing Room | 5201 | COGS - Facilities |
| Professional Services | 5300 | COGS - Professional Services |
| Transportation | 5400 | COGS - Transportation |
| Death Certificates | 5500 | COGS - Documentation |

## Appendix B: Go ERP Endpoints Used

### General Ledger
- `POST /v1/gl/journals` - Create journal entry
- `GET /v1/gl/trial-balance` - Get trial balance
- `POST /v1/gl/statements/profit-loss` - P&L report
- `POST /v1/gl/statements/balance-sheet` - Balance sheet

### Payroll
- `POST /v1/payroll/import-time-entries` - Import time entries
- `POST /v1/payroll/runs` - Execute payroll run
- `GET /v1/payroll/expense-summary` - Payroll expense by period

### Procurement
- `GET /v1/inventory/products` - List products
- `POST /v1/inventory/reserve` - Reserve inventory
- `POST /v1/po` - Create purchase order

### Accounts Payable
- `POST /v1/ap/invoices` - Create AP invoice
- `POST /v1/ap/payment-runs` - Create payment run
