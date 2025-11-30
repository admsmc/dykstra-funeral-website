# Go ERP Integration Implementation Plan
**Migrating 20 Go Modules to Funeral Home Management System**

---

## Executive Summary

**Objective**: Integrate production-ready Go ERP backend (Contracts, GL/AR/AP, Inventory, Payroll, P2P, HCM, Fixed Assets, etc.) with TypeScript Next.js funeral home CRM through Clean Architecture boundaries.

**Timeline**: 22-31 months (MVP in 12-15 months)  
**Architecture**: BFF proxy pattern with OpenAPI clients, separate PostgreSQL databases, unified Next.js UI  
**Compliance**: Maintains hexagonal boundaries per ARCHITECTURE.md

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Next.js 15 Unified UI                                   │
│ - TypeScript CRM (leads, contacts, campaigns)          │
│ - Go ERP UI (payroll, inventory, financial, etc.)      │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┼───────┐
         │       │       │
┌────────┴──────┐│  ┌───┴──────────────────────────────┐
│ TypeScript    ││  │ BFF Proxy (Next.js API Routes)  │
│ tRPC APIs     ││  │ /api/go-proxy/[...path]         │
└───────────────┘│  └────────┬────────────────────────┘
                 │           │
                 │           │ HTTP/JSON (OpenAPI)
                 │           │
                 │  ┌────────┴─────────────────────────┐
                 │  │ Go ERP Backend                   │
                 │  │ http://localhost:8080            │
                 │  └────────┬─────────────────────────┘
                 │           │
         ┌───────┴───────────┴───────┐
         │                           │
┌────────┴──────────┐  ┌────────────┴─────────────┐
│ PostgreSQL 1      │  │ PostgreSQL 2              │
│ funeral_home_crm  │  │ funeral_home_erp          │
│ (TypeScript)      │  │ (Go projectors)           │
└───────────────────┘  └───────────────────────────┘
```

---

## 20 Go Modules to Integrate

**Source**: Funeral home management system UI requirements (from FUNERAL_HOME_UI_DEPLOYMENT_PLAN.md)

### Group 1: Core Operations (High Complexity)
1. **Contract Management** (4-5 weeks)
   - UI: Case list, builder, approval, signatures
   - Backend: Contract lifecycle, GPL pricing, signature events, provisioning

2. **Financial (GL/AR/AP)** (3-4 weeks)
   - UI: Invoice list, payments, AR aging, GL reports
   - Backend: General ledger, accounts receivable, accounts payable, OCR scanning

### Group 2: Inventory & Services (Medium Complexity)
3. **Inventory** (2-3 weeks)
   - UI: Catalog, availability, receiving, cycle counts
   - Backend: Multi-location, WAC costing, reservations, transfers

4. **Payroll** (2-3 weeks)
   - UI: Timesheets, case assignments, payroll review
   - Backend: Michigan tax compliance, W-2/1099, direct deposit (NACHA)

5. **Procurement (P2P)** (2-3 weeks)
   - UI: PO creation, approval, OCR review, payments
   - Backend: Purchase requisitions, POs, receiving, vendor management

6. **Professional Services** (1-2 weeks)
   - UI: Staff assignment, time tracking
   - Backend: Time tracking, expense reimbursement, case-based billing

### Group 3: Workflows & Approvals (Medium Complexity)
7. **Approval Workflows** (2-3 weeks)
   - UI: Approval queue, multi-level UI, history
   - Backend: Multi-level approvals, delegation, history

### Group 4: Advanced Financial (Medium Complexity)
8. **Fixed Assets** (2-3 weeks)
   - UI: Asset register, depreciation schedule, disposal
   - Backend: Asset tracking, depreciation, disposal

9. **GL Reconciliations** (2-3 weeks)
   - UI: Bank rec UI, account rec workflows
   - Backend: Bank recs, account recs

10. **Budget vs. Actual** (1-2 weeks)
    - UI: Budget entry, variance reports
    - Backend: Budget management, variance analysis

11. **Consolidations** (1-2 weeks)
    - UI: Multi-entity consolidation views
    - Backend: Multi-entity consolidation

12. **Segment Reporting** (1 week)
    - UI: Segment filters, P&L by segment
    - Backend: Departmental/location reporting

### Group 5: HCM (Human Capital Management) - All Medium Complexity
13. **Employee Onboarding** (2-3 weeks)
    - UI: Hire form, dual-ledger creation, position assignment
    - Backend: New hire workflow, dual-ledger (HCM + Payroll)

14. **Employee Termination** (2-3 weeks)
    - UI: Termination form, exit checklist, PTO payout
    - Backend: Termination workflow, exit processes

15. **Position Management** (2-3 weeks)
    - UI: Promotion wizard, transfer UI, comp change
    - Backend: Job changes, promotions, transfers

16. **PTO/Leave Management** (2-3 weeks)
    - UI: PTO accrual dashboard, request/approval, balances
    - Backend: Accrual policies, balances, requests

17. **Performance & Discipline** (2-3 weeks)
    - UI: Review forms, disciplinary action tracker
    - Backend: Performance reviews, disciplinary actions

18. **Training & Certifications** (1-2 weeks)
    - UI: Training log, cert tracker, compliance dashboard
    - Backend: Training records, certification tracking

19. **Employee Rehire** (1-2 weeks)
    - UI: Rehire workflow, eligibility check
    - Backend: Rehire logic, eligibility validation

### Group 6: Timekeeping (Medium Complexity)
20. **Timesheets** (2-3 weeks)
    - UI: Timesheet entry, approval, project aggregation
    - Backend: Time capture, approval workflows, project tracking

---

## Phase 1: Foundation Setup (Weeks 1-3)

### 1.1 Go Backend Preparation

**Objective**: Ensure Go backend is running and accessible with OpenAPI docs.

**Tasks**:
1. Start Go backend API server
   ```bash
   cd /Users/andrewmathers/tigerbeetle-trial-app-1
   go run cmd/api/main.go
   # Should start on http://localhost:8080
   ```

2. Verify OpenAPI specification exists
   ```bash
   # Check for OpenAPI spec (usually at /docs/openapi.yaml or /api/docs)
   curl http://localhost:8080/api/docs/openapi.yaml > openapi.yaml
   ```

3. Document Go API endpoints for each module
   - Contracts: `/v1/contracts`, `/v1/contracts/{id}`, `/v1/contracts/{id}/approve`, etc.
   - GL: `/v1/accounts`, `/v1/journal-entries`, `/v1/financial-statements`
   - Inventory: `/v1/inventory/items`, `/v1/inventory/reservations`
   - Payroll: `/v1/payroll/runs`, `/v1/payroll/employees`
   - etc.

### 1.2 BFF Proxy Implementation

**Location**: `src/app/api/go-proxy/[...path]/route.ts`

**Implementation**:
```typescript
// src/app/api/go-proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const path = params.path.join('/');
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  
  const response = await fetch(
    `${GO_BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ''}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getGoBackendToken(userId)}`,
        'X-Tenant-Id': await getTenantId(userId),
        'Content-Type': 'application/json',
      }
    }
  );
  
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const path = params.path.join('/');
  const body = await req.json();
  
  const response = await fetch(`${GO_BACKEND_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getGoBackendToken(userId)}`,
      'X-Tenant-Id': await getTenantId(userId),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// Helper functions
async function getGoBackendToken(userId: string): Promise<string> {
  // TODO: Implement token exchange logic
  // For now, return a placeholder token
  return 'go-backend-token';
}

async function getTenantId(userId: string): Promise<string> {
  // TODO: Lookup funeral home tenant ID from user
  return 'tenant-1';
}
```

**Supporting Files**:
```typescript
// src/lib/go-client.ts
import createClient from 'openapi-fetch';
import type { paths } from '@/generated/go-api'; // Will be generated

export const goClient = createClient<paths>({ 
  baseUrl: '/api/go-proxy' 
});
```

**Environment Variables**:
```bash
# .env.local
GO_BACKEND_URL=http://localhost:8080
```

### 1.3 OpenAPI Client Generation

**Install Dependencies**:
```bash
pnpm add -D openapi-typescript openapi-fetch
```

**Generate TypeScript Types**:
```bash
# Add to package.json scripts
"generate:go-types": "openapi-typescript http://localhost:8080/api/docs/openapi.yaml -o src/generated/go-api.ts"
```

**Run Generation**:
```bash
pnpm generate:go-types
```

---

## Phase 2: Port Definitions (Weeks 4-6)

### 2.1 Define Port Interfaces

**Location**: `packages/application/src/ports/`

**Structure**:
```
packages/application/src/ports/
  go-contract-port.ts
  go-gl-port.ts
  go-ar-port.ts
  go-ap-port.ts
  go-inventory-port.ts
  go-payroll-port.ts
  go-p2p-port.ts
  go-hcm-port.ts
  go-fixed-assets-port.ts
  go-reconciliations-port.ts
  go-subscriptions-port.ts
  go-approvals-port.ts
  index.ts
```

**Example: Contract Port**:
```typescript
// packages/application/src/ports/go-contract-port.ts
import { Effect, Context } from 'effect';
import { NetworkError, NotFoundError } from '@dykstra/domain';

// Domain types (these should mirror Go backend types)
export interface GoContract {
  readonly id: string;
  readonly caseId: string;
  readonly version: number;
  readonly status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'completed';
  readonly services: GoContractItem[];
  readonly products: GoContractItem[];
  readonly totalAmount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GoContractItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

export interface CreateContractData {
  readonly caseId: string;
  readonly services: Omit<GoContractItem, 'id'>[];
  readonly products: Omit<GoContractItem, 'id'>[];
}

// Port interface
export interface GoContractPortService {
  readonly createContract: (data: CreateContractData) => 
    Effect.Effect<GoContract, NetworkError>;
  
  readonly getContract: (id: string) => 
    Effect.Effect<GoContract, NotFoundError | NetworkError>;
  
  readonly approveContract: (id: string) => 
    Effect.Effect<void, NetworkError>;
  
  readonly updateContract: (id: string, data: Partial<CreateContractData>) => 
    Effect.Effect<GoContract, NetworkError>;
  
  readonly listContractsByCase: (caseId: string) => 
    Effect.Effect<GoContract[], NetworkError>;
}

// Context tag
export const GoContractPort = Context.GenericTag<GoContractPortService>(
  '@dykstra/GoContractPort'
);
```

**Example: Payroll Port**:
```typescript
// packages/application/src/ports/go-payroll-port.ts
import { Effect, Context } from 'effect';
import { NetworkError, NotFoundError } from '@dykstra/domain';

export interface GoPayrollRun {
  readonly id: string;
  readonly payPeriodStart: Date;
  readonly payPeriodEnd: Date;
  readonly payDate: Date;
  readonly status: 'draft' | 'calculated' | 'approved' | 'paid';
  readonly totalGross: number;
  readonly totalNet: number;
  readonly totalTaxes: number;
  readonly employeeCount: number;
}

export interface GoEmployee {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly employmentType: 'W2_HOURLY' | 'W2_SALARY' | '1099_CONTRACTOR';
  readonly status: 'active' | 'terminated' | 'on_leave';
  readonly hireDate: Date;
  readonly terminationDate?: Date;
}

export interface GoPayrollPortService {
  readonly createPayrollRun: (data: { 
    payPeriodStart: Date; 
    payPeriodEnd: Date; 
    payDate: Date; 
  }) => Effect.Effect<GoPayrollRun, NetworkError>;
  
  readonly getPayrollRun: (id: string) => 
    Effect.Effect<GoPayrollRun, NotFoundError | NetworkError>;
  
  readonly approvePayrollRun: (id: string) => 
    Effect.Effect<void, NetworkError>;
  
  readonly listEmployees: () => 
    Effect.Effect<GoEmployee[], NetworkError>;
}

export const GoPayrollPort = Context.GenericTag<GoPayrollPortService>(
  '@dykstra/GoPayrollPort'
);
```

### 2.2 Export All Ports

```typescript
// packages/application/src/ports/index.ts
export * from './go-contract-port';
export * from './go-gl-port';
export * from './go-ar-port';
export * from './go-ap-port';
export * from './go-inventory-port';
export * from './go-payroll-port';
export * from './go-p2p-port';
export * from './go-hcm-port';
export * from './go-fixed-assets-port';
export * from './go-reconciliations-port';
export * from './go-subscriptions-port';
export * from './go-approvals-port';

// TypeScript domain ports (already exist)
export * from './case-repository';
export * from './lead-repository';
export * from './contact-repository';
export * from './campaign-repository';
export * from './storage-port';
export * from './email-port';
export * from './payment-port';
```

---

## Phase 3: Infrastructure Adapters (Weeks 7-10)

### 3.1 Implement OpenAPI Client Adapters

**Location**: `packages/infrastructure/src/adapters/go-backend/`

**Structure**:
```
packages/infrastructure/src/adapters/go-backend/
  go-contract-adapter.ts
  go-gl-adapter.ts
  go-ar-adapter.ts
  go-ap-adapter.ts
  go-inventory-adapter.ts
  go-payroll-adapter.ts
  go-p2p-adapter.ts
  go-hcm-adapter.ts
  go-fixed-assets-adapter.ts
  go-reconciliations-adapter.ts
  go-subscriptions-adapter.ts
  go-approvals-adapter.ts
  client.ts
  index.ts
```

**Example: Contract Adapter**:
```typescript
// packages/infrastructure/src/adapters/go-backend/go-contract-adapter.ts
import { Effect } from 'effect';
import { goClient } from './client';
import type { 
  GoContractPortService, 
  GoContract, 
  CreateContractData 
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/domain';

export const GoContractAdapter: GoContractPortService = {
  createContract: (data: CreateContractData) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts', {
          body: {
            case_id: data.caseId,
            services: data.services.map(s => ({
              description: s.description,
              quantity: s.quantity,
              unit_price: s.unitPrice,
              total_price: s.totalPrice
            })),
            products: data.products.map(p => ({
              description: p.description,
              quantity: p.quantity,
              unit_price: p.unitPrice,
              total_price: p.totalPrice
            }))
          }
        });
        
        if (res.error) {
          throw new Error(res.error.message || 'Failed to create contract');
        }
        
        return mapToGoContract(res.data);
      },
      catch: (error) => new NetworkError({
        message: 'Failed to create contract',
        cause: error as Error
      })
    }),
  
  getContract: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/contracts/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ entityType: 'Contract', id });
          }
          throw new Error(res.error.message || 'Failed to get contract');
        }
        
        return mapToGoContract(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError({
          message: 'Failed to get contract',
          cause: error as Error
        });
      }
    }),
  
  approveContract: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts/{id}/approve', {
          params: { path: { id } }
        });
        
        if (res.error) {
          throw new Error(res.error.message || 'Failed to approve contract');
        }
      },
      catch: (error) => new NetworkError({
        message: 'Failed to approve contract',
        cause: error as Error
      })
    }),
  
  updateContract: (id: string, data: Partial<CreateContractData>) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PATCH('/v1/contracts/{id}', {
          params: { path: { id } },
          body: {
            services: data.services?.map(s => ({
              description: s.description,
              quantity: s.quantity,
              unit_price: s.unitPrice,
              total_price: s.totalPrice
            })),
            products: data.products?.map(p => ({
              description: p.description,
              quantity: p.quantity,
              unit_price: p.unitPrice,
              total_price: p.totalPrice
            }))
          }
        });
        
        if (res.error) {
          throw new Error(res.error.message || 'Failed to update contract');
        }
        
        return mapToGoContract(res.data);
      },
      catch: (error) => new NetworkError({
        message: 'Failed to update contract',
        cause: error as Error
      })
    }),
  
  listContractsByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/contracts', {
          params: { query: { case_id: caseId } }
        });
        
        if (res.error) {
          throw new Error(res.error.message || 'Failed to list contracts');
        }
        
        return res.data.contracts.map(mapToGoContract);
      },
      catch: (error) => new NetworkError({
        message: 'Failed to list contracts',
        cause: error as Error
      })
    })
};

// Mapper function (Go API response -> Domain type)
function mapToGoContract(data: any): GoContract {
  return {
    id: data.id,
    caseId: data.case_id,
    version: data.version,
    status: data.status,
    services: data.services?.map((s: any) => ({
      id: s.id,
      description: s.description,
      quantity: s.quantity,
      unitPrice: s.unit_price,
      totalPrice: s.total_price
    })) || [],
    products: data.products?.map((p: any) => ({
      id: p.id,
      description: p.description,
      quantity: p.quantity,
      unitPrice: p.unit_price,
      totalPrice: p.total_price
    })) || [],
    totalAmount: data.total_amount,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}
```

### 3.2 OpenAPI Client Configuration

```typescript
// packages/infrastructure/src/adapters/go-backend/client.ts
import createClient from 'openapi-fetch';
import type { paths } from '@/generated/go-api';

export const goClient = createClient<paths>({ 
  baseUrl: '/api/go-proxy' // Routes through BFF proxy
});
```

### 3.3 Export Adapters

```typescript
// packages/infrastructure/src/adapters/go-backend/index.ts
export { GoContractAdapter } from './go-contract-adapter';
export { GoGLAdapter } from './go-gl-adapter';
export { GoARAdapter } from './go-ar-adapter';
export { GoAPAdapter } from './go-ap-adapter';
export { GoInventoryAdapter } from './go-inventory-adapter';
export { GoPayrollAdapter } from './go-payroll-adapter';
export { GoP2PAdapter } from './go-p2p-adapter';
export { GoHCMAdapter } from './go-hcm-adapter';
export { GoFixedAssetsAdapter } from './go-fixed-assets-adapter';
export { GoReconciliationsAdapter } from './go-reconciliations-adapter';
export { GoSubscriptionsAdapter } from './go-subscriptions-adapter';
export { GoApprovalsAdapter } from './go-approvals-adapter';
```

---

## Phase 4: Cross-Domain Use Cases (Weeks 11-14)

### 4.1 Implement Use Cases

**Location**: `packages/application/src/use-cases/`

**Structure**:
```
packages/application/src/use-cases/
  case-management/
    convert-lead-to-case.ts       # TypeScript + Go orchestration
    create-case-with-contract.ts  # TypeScript + Go
  financial/
    process-payment.ts            # TypeScript + Go AR
    create-invoice.ts             # Go AR
  inventory/
    reserve-casket.ts             # Go Inventory
  payroll/
    run-payroll.ts                # Go Payroll
```

**Example: Convert Lead to Case with Contract**:
```typescript
// packages/application/src/use-cases/case-management/convert-lead-to-case.ts
import { Effect } from 'effect';
import { 
  LeadRepository, 
  CaseRepository, 
  GoContractPort 
} from '@dykstra/application';
import { NotFoundError, ValidationError } from '@dykstra/domain';

export interface ConvertLeadToCaseCommand {
  readonly leadId: string;
  readonly requestedServices: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export const convertLeadToCase = (command: ConvertLeadToCaseCommand) =>
  Effect.gen(function* () {
    // 1. TypeScript domain: Load lead
    const leadRepo = yield* LeadRepository;
    const lead = yield* leadRepo.findByBusinessKey(command.leadId);
    
    if (!lead) {
      return yield* Effect.fail(
        new NotFoundError({ entityType: 'Lead', id: command.leadId })
      );
    }
    
    if (lead.status !== 'qualified') {
      return yield* Effect.fail(
        new ValidationError({ 
          message: 'Lead must be qualified before conversion',
          field: 'status'
        })
      );
    }
    
    // 2. TypeScript domain: Create case
    const caseRepo = yield* CaseRepository;
    const case_ = yield* caseRepo.create({
      decedentName: lead.decedentName,
      familyContactId: lead.contactId,
      type: 'at-need',
      status: 'inquiry'
    });
    
    // 3. Go domain: Create contract (via port)
    const goContractPort = yield* GoContractPort;
    const contract = yield* goContractPort.createContract({
      caseId: case_.id,
      services: command.requestedServices.map(s => ({
        description: s.description,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        totalPrice: s.quantity * s.unitPrice
      })),
      products: []
    });
    
    // 4. TypeScript domain: Link case to contract
    const updatedCase = yield* caseRepo.update({
      ...case_,
      goContractId: contract.id,
      status: 'active'
    });
    
    // 5. TypeScript domain: Mark lead as converted
    yield* leadRepo.update({
      ...lead,
      status: 'converted',
      convertedToCaseId: case_.id
    });
    
    return { 
      caseId: case_.id, 
      contractId: contract.id 
    };
  });
```

---

## Phase 5: UI Implementation (Weeks 15-28)

### 5.1 Staff Dashboard Routes

**Location**: `src/app/(staff)/`

**Routes to Implement** (20 Go modules):

1. **Financial Module** (`/staff/financial`)
   - `/staff/financial/invoices` - AR invoice list
   - `/staff/financial/payments` - Payment processing
   - `/staff/financial/aging` - AR aging report
   - `/staff/financial/bills` - AP bill entry
   - `/staff/financial/ocr` - OCR invoice scanning
   - `/staff/financial/gl` - GL accounts, journal entries
   - `/staff/financial/reports` - Financial statements

2. **Contracts** (`/staff/contracts`)
   - `/staff/contracts` - Contract list
   - `/staff/contracts/[id]` - Contract detail
   - `/staff/contracts/builder` - Contract builder

3. **Inventory** (`/staff/inventory`)
   - `/staff/inventory/items` - Inventory master
   - `/staff/inventory/receiving` - Receiving screen
   - `/staff/inventory/transfers` - Transfer orders
   - `/staff/inventory/counts` - Cycle counts

4. **Payroll** (`/staff/payroll`)
   - `/staff/payroll/runs` - Payroll run list
   - `/staff/payroll/runs/[id]` - Payroll detail
   - `/staff/payroll/employees` - Employee list
   - `/staff/payroll/timesheets` - Timesheet entry

5. **Procurement** (`/staff/procurement`)
   - `/staff/procurement/requisitions` - Purchase requisitions
   - `/staff/procurement/pos` - Purchase orders
   - `/staff/procurement/vendors` - Vendor management

6. **HR** (`/staff/hr`)
   - `/staff/hr/employees` - Employee lifecycle
   - `/staff/hr/onboarding` - Onboarding workflows
   - `/staff/hr/pto` - PTO requests/balances

7. **Fixed Assets** (`/staff/fixed-assets`)
   - `/staff/fixed-assets` - Asset list
   - `/staff/fixed-assets/[id]` - Asset detail
   - `/staff/fixed-assets/depreciation` - Depreciation schedule

8. **Reconciliations** (`/staff/reconciliations`)
   - `/staff/reconciliations/bank` - Bank reconciliations
   - `/staff/reconciliations/accounts` - Account reconciliations

### 5.2 Example UI Component: Contract List

```typescript
// src/app/(staff)/contracts/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { goClient } from '@/lib/go-client';
import { DataTable } from '@/components/ui/data-table';

export default function ContractsPage() {
  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const res = await goClient.GET('/v1/contracts');
      if (res.error) throw new Error(res.error.message);
      return res.data.contracts;
    }
  });
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Contracts</h1>
      
      <DataTable
        data={contracts || []}
        columns={[
          { header: 'ID', accessorKey: 'id' },
          { header: 'Case ID', accessorKey: 'case_id' },
          { header: 'Status', accessorKey: 'status' },
          { header: 'Total', accessorKey: 'total_amount', 
            cell: ({ value }) => `$${value.toFixed(2)}` },
          { header: 'Created', accessorKey: 'created_at',
            cell: ({ value }) => new Date(value).toLocaleDateString() }
        ]}
        onRowClick={(contract) => router.push(`/staff/contracts/${contract.id}`)}
      />
    </div>
  );
}
```

---

## Phase 6: Testing & Validation (Weeks 29-31)

### 6.1 Unit Tests

**Test Adapters**:
```typescript
// packages/infrastructure/src/adapters/go-backend/__tests__/go-contract-adapter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Effect } from 'effect';
import { GoContractAdapter } from '../go-contract-adapter';
import { goClient } from '../client';

vi.mock('../client');

describe('GoContractAdapter', () => {
  it('should create contract successfully', async () => {
    vi.mocked(goClient.POST).mockResolvedValue({
      data: {
        id: 'contract-1',
        case_id: 'case-1',
        version: 1,
        status: 'draft',
        services: [],
        products: [],
        total_amount: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      response: {} as any
    });
    
    const result = await Effect.runPromise(
      GoContractAdapter.createContract({
        caseId: 'case-1',
        services: [],
        products: []
      })
    );
    
    expect(result.id).toBe('contract-1');
    expect(result.caseId).toBe('case-1');
  });
});
```

### 6.2 Integration Tests

**Test BFF Proxy**:
```typescript
// src/app/api/go-proxy/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../[...path]/route';
import { NextRequest } from 'next/server';

describe('BFF Proxy', () => {
  it('should proxy GET requests to Go backend', async () => {
    const req = new NextRequest('http://localhost:3000/api/go-proxy/v1/contracts');
    const params = { path: ['v1', 'contracts'] };
    
    const response = await GET(req, { params });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('contracts');
  });
});
```

### 6.3 CI Validation

**Add CI Checks**:
```yaml
# .github/workflows/arch-validation.yml
name: Architecture Validation
on: [pull_request]
jobs:
  enforce-boundaries:
    runs-on: ubuntu-latest
    steps:
      - name: Check no direct Go infrastructure access
        run: |
          if grep -r "from 'tigerbeetle" packages/; then
            echo "ERROR: Direct TigerBeetle import!"
            exit 1
          fi
          if grep -r "from '@eventstore" packages/; then
            echo "ERROR: Direct EventStoreDB import!"
            exit 1
          fi
      
      - name: Check application layer doesn't import infrastructure
        run: |
          if grep -r "from '@prisma/client'" packages/application/; then
            echo "ERROR: Prisma import in application layer!"
            exit 1
          fi
          if grep -r "goClient" packages/application/; then
            echo "ERROR: Direct Go client import in application layer!"
            exit 1
          fi
```

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Start Go backend API server
- [ ] Verify OpenAPI spec accessibility
- [ ] Implement BFF proxy (`/api/go-proxy/[...path]`)
- [ ] Set up OpenAPI client generation
- [ ] Generate TypeScript types from Go OpenAPI spec
- [ ] Configure environment variables

### Phase 2: Ports ✅
- [ ] Define GoContractPort interface
- [ ] Define GoGLPort interface
- [ ] Define GoARPort interface
- [ ] Define GoAPPort interface
- [ ] Define GoInventoryPort interface
- [ ] Define GoPayrollPort interface
- [ ] Define GoP2PPort interface
- [ ] Define GoHCMPort interface
- [ ] Define GoFixedAssetsPort interface
- [ ] Define GoReconciliationsPort interface
- [ ] Define GoSubscriptionsPort interface
- [ ] Define GoApprovalsPort interface

### Phase 3: Adapters ✅
- [ ] Implement GoContractAdapter
- [ ] Implement GoGLAdapter
- [ ] Implement GoARAdapter
- [ ] Implement GoAPAdapter
- [ ] Implement GoInventoryAdapter
- [ ] Implement GoPayrollAdapter
- [ ] Implement GoP2PAdapter
- [ ] Implement GoHCMAdapter
- [ ] Implement GoFixedAssetsAdapter
- [ ] Implement GoReconciliationsAdapter
- [ ] Implement GoSubscriptionsAdapter
- [ ] Implement GoApprovalsAdapter

### Phase 4: Use Cases ✅
- [ ] Implement convertLeadToCase
- [ ] Implement createCaseWithContract
- [ ] Implement processPayment
- [ ] Implement reserveCasket
- [ ] Implement runPayroll

### Phase 5: UI ✅
- [ ] Implement /staff/contracts routes
- [ ] Implement /staff/financial routes
- [ ] Implement /staff/inventory routes
- [ ] Implement /staff/payroll routes
- [ ] Implement /staff/procurement routes
- [ ] Implement /staff/hr routes
- [ ] Implement /staff/fixed-assets routes
- [ ] Implement /staff/reconciliations routes

### Phase 6: Testing ✅
- [ ] Write adapter unit tests
- [ ] Write use case integration tests
- [ ] Write BFF proxy tests
- [ ] Set up CI boundary enforcement
- [ ] Perform end-to-end testing
- [ ] Validate Clean Architecture compliance

---

## Success Criteria

1. ✅ All 20 Go modules accessible via BFF proxy
2. ✅ Type-safe integration (no `any` types)
3. ✅ Clean Architecture boundaries maintained
4. ✅ No direct Go infrastructure access from TypeScript
5. ✅ Separate PostgreSQL databases maintained
6. ✅ Unified UI seamlessly integrates both domains
7. ✅ CI validation passes
8. ✅ All tests pass

---

## Timeline Summary

- **Phase 1**: Weeks 1-3 (Foundation)
- **Phase 2**: Weeks 4-6 (Ports)
- **Phase 3**: Weeks 7-10 (Adapters)
- **Phase 4**: Weeks 11-14 (Use Cases)
- **Phase 5**: Weeks 15-28 (UI)
- **Phase 6**: Weeks 29-31 (Testing)

**Total**: 31 weeks (~7 months for MVP, ~22 months for full system)

---

## Next Steps

**Immediate Actions**:
1. Start Go backend API server
2. Verify OpenAPI spec exists
3. Implement BFF proxy
4. Generate OpenAPI TypeScript types
5. Define first port (GoContractPort)
6. Implement first adapter (GoContractAdapter)
7. Test end-to-end with simple contract creation

**Ready to begin Phase 1?**
