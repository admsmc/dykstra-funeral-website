# Backend Contract Validation

**Status**: ✅ Production Ready  
**Added**: November 30, 2025

## Overview

Automated validation system that ensures TypeScript ports and adapters correctly map to Go backend API endpoints. This prevents runtime errors caused by missing adapter implementations or mismatched API contracts.

## Purpose

As the application grows, it becomes critical to maintain consistency between:
1. **Go Backend API** - The source of truth (EventStoreDB + TigerBeetle)
2. **TypeScript Port Interfaces** - The contracts (in `packages/application/src/ports`)
3. **TypeScript Adapters** - The implementations (in `packages/infrastructure/src/adapters`)

This validation catches discrepancies **before deployment** rather than at runtime.

---

## What It Validates

### 1. Port Coverage
- ✅ All Go backend port files have corresponding adapters
- ✅ No orphaned ports without implementations

### 2. Method Coverage
- ✅ Every port method has an adapter implementation
- ✅ Method names match between port and adapter
- ✅ Adapter objects fully implement port interfaces

### 3. Endpoint Extraction (Informational)
- 📋 Extracts HTTP method (GET, POST, PATCH, DELETE)
- 📋 Extracts endpoint path (e.g., `/v1/financial/invoices`)
- 📋 Provides visibility into API surface

### 4. Future: OpenAPI Compliance (Planned)
- 🔮 Compare extracted endpoints against OpenAPI spec
- 🔮 Validate request/response types match spec
- 🔮 Detect breaking changes in API versions

---

## Usage

### Run Validation Standalone
```bash
pnpm validate:contracts
```

### Run Full Pre-Commit Validation
```bash
pnpm validate
```

The validation runs automatically as part of:
- ✅ Pre-commit hooks (via `./scripts/pre-commit.sh`)
- ✅ CI/CD pipeline (via `pnpm validate`)
- ✅ Manual developer checks

---

## Example Output

### Successful Validation
```
🚀 Starting Backend Contract Validation...

📋 Analyzing 21 Go backend port files...

🔍 go-financial-port (27 methods)
  ✅ getChartOfAccounts: GET /v1/financial/chart-of-accounts
  ✅ createJournalEntry: POST /v1/financial/journal-entries
  ✅ postJournalEntry: POST /v1/financial/journal-entries/{id}/post
  ✅ createInvoice: POST /v1/financial/invoices
  ✅ approveAPPaymentRun: POST /ap/payment-runs/{id}/approve
  ✅ executeAPPaymentRun: POST /ap/payment-runs/{id}/execute
  ...

🔍 go-inventory-port (16 methods)
  ✅ createItem: POST /v1/inventory/items
  ✅ getItemBySku: GET /v1/inventory/items/by-sku/{sku}
  ...

═══════════════════════════════════════════════════════════════
📊 Backend Contract Validation Summary
═══════════════════════════════════════════════════════════════

  Total Ports Analyzed:          21
  Total Port Methods:            142
  Methods with Adapters:         142 ✅
  Methods without Adapters:      0 ✅
  Endpoints Extracted:           120

═══════════════════════════════════════════════════════════════
✅ All backend contracts validated successfully!
   All port methods have corresponding adapter implementations.
═══════════════════════════════════════════════════════════════
```

### Failed Validation
```
🔍 go-financial-port (27 methods)
  ✅ getChartOfAccounts: GET /v1/financial/chart-of-accounts
  ❌ approveAPPaymentRun: NOT IMPLEMENTED
  ❌ executeAPPaymentRun: NOT IMPLEMENTED

═══════════════════════════════════════════════════════════════
📊 Backend Contract Validation Summary
═══════════════════════════════════════════════════════════════

  Total Ports Analyzed:          21
  Total Port Methods:            142
  Methods with Adapters:         140 ✅
  Methods without Adapters:      2 ❌
  Endpoints Extracted:           118

❌ Errors:
  ❌ go-financial-port.approveAPPaymentRun missing adapter implementation in go-financial-adapter.ts
  ❌ go-financial-port.executeAPPaymentRun missing adapter implementation in go-financial-adapter.ts

═══════════════════════════════════════════════════════════════
❌ Backend contract validation FAILED!
   2 error(s) found.

💡 To fix:
   1. Implement missing adapter methods in the appropriate adapter file
   2. Ensure method names match between port and adapter
   3. Verify adapter objects implement the full port interface
═══════════════════════════════════════════════════════════════
```

---

## How It Works

### 1. Port Analysis
```typescript
// Scans port files: packages/application/src/ports/go-*-port.ts
// Extracts interface methods:

export interface GoFinancialPortService {
  readonly createInvoice: (command: CreateInvoiceCommand) => 
    Effect.Effect<GoInvoice, NetworkError>;
  readonly approveAPPaymentRun: (id: string) => 
    Effect.Effect<GoAPPaymentRun, NetworkError>;
  // ...
}
```

### 2. Adapter Verification
```typescript
// Checks adapter files: packages/infrastructure/src/adapters/go-backend/*-adapter.ts
// Verifies method implementations:

export const GoFinancialAdapter: GoFinancialPortService = {
  createInvoice: (command) => Effect.tryPromise({ ... }),
  approveAPPaymentRun: (id) => Effect.tryPromise({ ... }),
  // Must implement ALL port methods
};
```

### 3. Endpoint Extraction
```typescript
// Parses adapter implementation to extract HTTP calls:

approveAPPaymentRun: (id) =>
  Effect.tryPromise({
    try: async () => {
      const res = await goClient.POST('/ap/payment-runs/{id}/approve', { ... });
      //                         ^^^^ Extracted: POST /ap/payment-runs/{id}/approve
    }
  })
```

---

## Architecture Integration

### Validation Flow
```
┌─────────────────────────────────────────────────────────────┐
│                   Development Workflow                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  pnpm validate  │
                    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Type Check   │    │ ESLint       │    │ Circular Dep │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │ Layer Validation│
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ DI Validation   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Prisma Types    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Backend         │ ◄── NEW!
                    │ Contracts       │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   ✅ All Pass   │
                    │   Commit Ready  │
                    └─────────────────┘
```

### Clean Architecture Boundaries
```
┌─────────────────────────────────────────────────────────────┐
│                        Domain Layer                          │
│  (Pure business logic - no validation needed)               │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Port Interfaces (GoFinancialPortService, etc.)      │  │
│  │  ◄── Validated by contract validator                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Adapters (GoFinancialAdapter, etc.)                 │  │
│  │  ◄── Validated by contract validator                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Go Backend ERP │
                    │  (EventStoreDB) │
                    │  (TigerBeetle)  │
                    └─────────────────┘
```

---

## Benefits

### 1. **Early Error Detection**
Catches missing implementations before deployment:
- ❌ **Without Validation**: Discover at runtime when use case calls missing method
- ✅ **With Validation**: Discover at commit time before code even runs

### 2. **Documentation**
Provides visibility into API surface:
- 142 port methods across 21 modules
- 120+ extracted endpoints
- Clear mapping of TypeScript → Go backend

### 3. **Refactoring Safety**
Prevents breaking changes:
- Adding new port method → Validation fails until adapter implements it
- Renaming port method → Validation catches mismatch
- Consolidating adapters → Validation ensures completeness

### 4. **Onboarding**
New developers can:
- Run `pnpm validate:contracts` to see all endpoints
- Understand the API surface without reading Go code
- Verify their adapter implementations are complete

---

## Common Failure Scenarios

### Scenario 1: Missing Adapter Method
**Cause**: Added port method but forgot to implement in adapter

**Error**:
```
❌ go-financial-port.newMethod missing adapter implementation in go-financial-adapter.ts
```

**Fix**:
```typescript
// In packages/infrastructure/src/adapters/go-backend/go-financial-adapter.ts
export const GoFinancialAdapter: GoFinancialPortService = {
  // ... existing methods
  newMethod: (params) => 
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/new-endpoint', { ... });
        return mapToNewType(res.data);
      },
      catch: (error) => new NetworkError('Failed to call new method', error)
    }),
};
```

### Scenario 2: Method Name Mismatch
**Cause**: Typo or refactoring inconsistency

**Error**:
```
❌ go-inventory-port.reserveInventory missing adapter implementation
```

**Reality**: Adapter has `reserveInvenory` (typo)

**Fix**: Rename adapter method to match port exactly

### Scenario 3: Consolidated Adapter Not Found
**Cause**: Port file not mapped to correct consolidated adapter

**Error**:
```
❌ No adapter found for go-new-module-port
```

**Fix**: Update `findAdapterFile()` in validation script to include new pattern

---

## Future Enhancements

### Phase 2: OpenAPI Spec Integration
When Go backend OpenAPI spec is available:

```bash
# Generate types from OpenAPI spec
pnpm generate:go-types

# Validate against spec
pnpm validate:contracts --with-openapi
```

**Additional Validations**:
- ✅ Endpoint paths match OpenAPI spec
- ✅ HTTP methods match spec
- ✅ Request/response types match spec (via openapi-typescript)
- ✅ Detect breaking changes between API versions

### Phase 3: Contract Testing
Complement static validation with runtime tests:

```typescript
// packages/infrastructure/__tests__/contracts/go-financial-adapter.contract.test.ts
describe('GoFinancialAdapter Contract Tests', () => {
  it('should implement all GoFinancialPortService methods', () => {
    const portMethods = Object.keys(GoFinancialPortService);
    const adapterMethods = Object.keys(GoFinancialAdapter);
    
    expect(adapterMethods).toEqual(expect.arrayContaining(portMethods));
  });
  
  it('createInvoice should call POST /v1/financial/invoices', async () => {
    // Mock goClient
    // Verify correct endpoint is called
  });
});
```

### Phase 4: Breaking Change Detection
Track API versions and warn on breaking changes:

```bash
# Compare current adapters against v1.2.0 OpenAPI spec
pnpm validate:contracts --baseline v1.2.0
```

---

## Maintenance

### Adding New Ports
1. Create port file: `packages/application/src/ports/go-new-module-port.ts`
2. Define interface: `export interface GoNewModulePortService { ... }`
3. Create adapter: `packages/infrastructure/src/adapters/go-backend/go-new-module-adapter.ts`
4. Run validation: `pnpm validate:contracts`
5. Validation will automatically detect and verify new port

### Updating Validation Script
Location: `scripts/validate-backend-contracts.ts`

To add new adapter patterns:
```typescript
function findAdapterFile(portFile: string): string | null {
  const adapterPatterns = [
    // Add new pattern here
    'go-new-consolidated-adapters.ts',
  ];
  // ...
}
```

---

## Related Documentation

- [PHASE_1_BACKEND_VERIFICATION.md](./PHASE_1_BACKEND_VERIFICATION.md) - Initial manual verification
- [GO_BACKEND_API_COVERAGE.md](./GO_BACKEND_API_COVERAGE.md) - Complete API coverage report
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Clean Architecture patterns
- [WARP.md](../WARP.md) - Development commands

---

## Troubleshooting

### Script Fails to Find Adapters
**Problem**: `❌ No adapter found for go-module-port`

**Solution**: Check adapter file naming and update `findAdapterFile()` patterns

### Regex Not Extracting Endpoint
**Problem**: Endpoint shows as "(endpoint not extracted)"

**Solution**: Adapter uses non-standard HTTP client call pattern. Update `extractEndpointFromAdapter()` regex.

### False Positive: Method Not Found
**Problem**: Method exists but validation says it's missing

**Solution**: Check for exact name match including casing. Validation is case-sensitive.

---

## Conclusion

Backend contract validation is now a **first-class validation** in the development workflow, running alongside TypeScript compilation, ESLint, and circular dependency checks.

This prevents an entire class of runtime errors and maintains architectural integrity as the system scales from 5 use cases to 35+ use cases across 20 ERP modules.

**Status**: ✅ **Production Ready - Integrated into CI/CD**
