# Go ERP Integration - Phase 3 Progress Report
**Infrastructure Adapter Implementation Status**

---

## Overview

Phase 3 involves implementing object-based infrastructure adapters that wrap the OpenAPI client and implement the port interfaces defined in Phase 2.

**Architecture**: All adapters follow ARCHITECTURE.md object-based pattern (NOT class-based)
- Located in: `packages/infrastructure/src/adapters/go-backend/`
- Pattern: Object implementing port interface methods
- Effect.tryPromise for async operations
- Routes through BFF proxy (`/api/go-proxy`)

---

## Completed Adapters (1/20)

### ✅ 1. GoContractAdapter
**File**: `packages/infrastructure/src/adapters/go-backend/go-contract-adapter.ts`  
**Lines**: 251  
**Status**: Complete

**Implements**: `GoContractPortService` from `@dykstra/application`

**Methods Implemented** (8):
1. `createContract` - POST `/v1/contracts`
2. `getContract` - GET `/v1/contracts/{id}` with 404 handling
3. `listContractsByCase` - GET `/v1/contracts?case_id={id}`
4. `updateContract` - PATCH `/v1/contracts/{id}`
5. `approveContract` - POST `/v1/contracts/{id}/approve`
6. `signContract` - POST `/v1/contracts/{id}/sign`
7. `cancelContract` - POST `/v1/contracts/{id}/cancel`
8. `getApprovalHistory` - GET `/v1/contracts/{id}/approvals`

**Features**:
- snake_case to camelCase mapping (`mapToGoContract` helper)
- 404 error detection (returns NotFoundError)
- Network error wrapping with NetworkError
- Type-safe OpenAPI request/response handling

**Example Method**:
```typescript
createContract: (command: CreateContractCommand) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/v1/contracts', {
        body: {
          case_id: command.caseId,
          services: command.services.map(s => ({
            description: s.description,
            quantity: s.quantity,
            unit_price: s.unitPrice,
            total_price: s.totalPrice,
            gl_account_id: s.glAccountId,
          })),
          products: command.products.map(p => ({ ...similar })),
        }
      });
      
      const data = unwrapResponse(res);
      return mapToGoContract(data);
    },
    catch: (error) => new NetworkError('Failed to create contract', error as Error)
  })
```

---

## Supporting Infrastructure

### ✅ OpenAPI Client (`client.ts`)
**File**: `packages/infrastructure/src/adapters/go-backend/client.ts`  
**Lines**: 53  
**Status**: Complete

**Exports**:
- `goClient` - OpenAPI fetch client configured with `/api/go-proxy` baseUrl
- `hasError<T>()` - Type guard for OpenAPI error responses
- `unwrapResponse<T>()` - Extract data or throw error

**Usage**:
```typescript
import { goClient, unwrapResponse } from './client';

const res = await goClient.POST('/v1/endpoint', { body });
const data = unwrapResponse(res); // Throws on error, returns data on success
```

### ✅ Index Exports
**File**: `packages/infrastructure/src/adapters/go-backend/index.ts`  
**Status**: Complete

Exports:
- `goClient`, `unwrapResponse` (shared utilities)
- `GoContractAdapter` (implemented adapter)
- TODO comments for remaining 19 adapters

### ✅ Infrastructure Layer Export
**File**: `packages/infrastructure/src/index.ts`  
**Status**: Updated

Added:
```typescript
// Go Backend Adapters
export * from './adapters/go-backend';
```

---

## Remaining Adapters (19/20)

### High Priority (4 adapters)
- [ ] **GoPayrollAdapter** (2-3 days)
  - 13 methods: Payroll runs, employee management, W-2/1099 generation
- [ ] **GoInventoryAdapter** (2-3 days)
  - 17 methods: Items, reservations, receiving, transfers, WAC
- [ ] **GoFinancialAdapter** (3-4 days)
  - 30+ methods: GL, AR, AP combined (largest adapter)
- [ ] **GoProcurementAdapter** (2-3 days)
  - 25 methods: Purchase requisitions, POs, receipts, vendors

### Medium Priority (6 adapters)
- [ ] **GoProfessionalServicesAdapter** (1-2 days)
- [ ] **GoApprovalWorkflowAdapter** (1-2 days)
- [ ] **GoFixedAssetsAdapter** (2 days)
- [ ] **GoReconciliationsAdapter** (2 days)
- [ ] **GoBudgetAdapter** (1-2 days)
- [ ] **GoSegmentReportingAdapter** (1 day)

### Low Priority (9 adapters - HCM & Advanced)
- [ ] **GoConsolidationsAdapter** (1 day)
- [ ] **GoEmployeeOnboardingAdapter** (1-2 days)
- [ ] **GoEmployeeTerminationAdapter** (1-2 days)
- [ ] **GoPositionManagementAdapter** (1-2 days)
- [ ] **GoPTOAdapter** (1-2 days)
- [ ] **GoHCMCommonAdapter** (2-3 days) - Performance, Training, Rehire, Timesheets

---

## Architecture Compliance

All adapters follow ARCHITECTURE.md patterns:

✅ **Object-Based Pattern**:
```typescript
// ✅ CORRECT: Object-based adapter
export const GoContractAdapter: GoContractPortService = {
  method: (params) => Effect.tryPromise({ ... })
};

// ❌ WRONG: Class-based (old pattern)
export class GoContractAdapter implements GoContractPortService {
  constructor(private client: OpenAPIClient) {} // ❌ NO!
}
```

✅ **Effect Error Handling**:
- All async operations wrapped in `Effect.tryPromise`
- NetworkError for HTTP failures
- NotFoundError for 404 responses
- Type-safe error unions

✅ **Mapper Functions**:
- Convert snake_case API responses to camelCase domain types
- Handle optional fields with `?:` and `undefined`
- Parse date strings to Date objects
- Extract nested arrays/objects

✅ **BFF Proxy Routing**:
- All requests go through `/api/go-proxy`
- No direct access to Go infrastructure
- Auth/tenant headers injected by BFF
- Clean separation of concerns

---

## Next Steps (Phase 3 Continuation)

### Immediate Actions
1. Implement **GoInventoryAdapter** (high priority, complex reservations logic)
2. Implement **GoPayrollAdapter** (high priority, Michigan tax complexity)
3. Implement **GoFinancialAdapter** (highest priority, largest adapter ~500 lines)
4. Implement **GoProcurementAdapter** (high priority, P2P workflow)

### Implementation Order
**Week 1-2**: High-priority adapters (Financial, Payroll, Inventory, Procurement)  
**Week 3**: Medium-priority adapters (PS, Approvals, Assets, Reconciliations, Budget)  
**Week 4**: Low-priority adapters (HCM lifecycle, Consolidations, Segment Reporting)

### Efficiency Strategy
For the remaining 19 adapters, we can:
1. **Template-based generation**: Most adapters follow same pattern
2. **Batch similar adapters**: Group HCM adapters together
3. **Reuse mapper patterns**: snake_case conversion is consistent
4. **Share validation logic**: Error handling is standardized

---

## Testing Strategy

Once adapters are implemented, each adapter needs:

### Unit Tests
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
      data: { id: 'contract-1', ... },
      response: {} as any
    });
    
    const result = await Effect.runPromise(
      GoContractAdapter.createContract({ caseId: 'case-1', ... })
    );
    
    expect(result.id).toBe('contract-1');
  });
  
  it('should handle 404 errors', async () => {
    vi.mocked(goClient.GET).mockResolvedValue({
      error: { message: 'Not found' },
      response: { status: 404 } as any
    });
    
    const result = await Effect.runPromiseExit(
      GoContractAdapter.getContract('nonexistent')
    );
    
    expect(Exit.isFailure(result)).toBe(true);
    // Verify NotFoundError type
  });
});
```

### Integration Tests
Once Go backend is running, test against real API:
```typescript
describe('GoContractAdapter Integration', () => {
  it('should create and retrieve contract', async () => {
    const created = await Effect.runPromise(
      GoContractAdapter.createContract({
        caseId: 'test-case',
        services: [{ description: 'Test', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        products: []
      })
    );
    
    const retrieved = await Effect.runPromise(
      GoContractAdapter.getContract(created.id)
    );
    
    expect(retrieved.id).toBe(created.id);
  });
});
```

---

## Dependency Injection Setup

Once adapters are complete, add to `InfrastructureLayer`:

```typescript
// packages/infrastructure/src/index.ts

import { 
  GoContractPort,
  GoPayrollPort,
  GoInventoryPort,
  // ... all Go ports
} from '@dykstra/application';

import {
  GoContractAdapter,
  GoPayrollAdapter,
  GoInventoryAdapter,
  // ... all Go adapters
} from './adapters/go-backend';

export const InfrastructureLayer = Layer.mergeAll(
  // Existing TypeScript adapters...
  
  // Go ERP Adapters
  Layer.succeed(GoContractPort, GoContractAdapter),
  Layer.succeed(GoPayrollPort, GoPayrollAdapter),
  Layer.succeed(GoInventoryPort, GoInventoryAdapter),
  // ... remaining 17 adapters
);
```

---

## Summary

**Phase 3 Status**: 5% complete (1 of 20 adapters + supporting infrastructure)

**Completed**:
- ✅ OpenAPI client setup (`client.ts`)
- ✅ GoContractAdapter (251 lines, 8 methods)
- ✅ Export infrastructure (index files updated)

**Foundation Established**:
- ✅ Object-based adapter pattern proven
- ✅ Effect error handling working
- ✅ BFF proxy routing confirmed
- ✅ Mapper functions pattern established

**Remaining**: 19 adapters (~4,000 lines estimated)

**Timeline**: 3-4 weeks to complete all 20 adapters

**Next Phase**: Phase 4 - Cross-Domain Use Cases (orchestrate TypeScript + Go)
