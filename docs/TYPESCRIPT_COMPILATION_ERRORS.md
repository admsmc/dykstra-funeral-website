# TypeScript Compilation Errors - Technical Debt

**Date**: December 1, 2024  
**Status**: Documented - Non-blocking for current work

## Summary

The monorepo has TypeScript compilation errors in pre-existing financial and inventory use cases. These errors do NOT affect:
- ✅ All 228 tests passing (including 20 new scheduling tests)
- ✅ Runtime functionality
- ✅ New scheduling implementation (Use Case 7.1)

These are **stub implementations** or **incomplete use cases** that were scaffolded but not fully wired up. They can be fixed when those use cases are prioritized for implementation.

---

## Error Categories

### 1. NetworkError Missing in Union Types (8 errors)
**Files**: 
- `cash-flow-forecasting.ts`
- `expense-report-approval.ts`
- `fixed-asset-depreciation-run.ts`
- `revenue-by-service-type.ts`
- `inventory-cycle-count.ts`
- `inventory-valuation-report.ts`

**Issue**: Use cases return `ValidationError | NetworkError` but function signature declares only `ValidationError`

**Fix**:
```typescript
// Current (wrong)
Effect<Result, ValidationError, Dependencies>

// Should be
Effect<Result, ValidationError | NetworkError, Dependencies>
```

**Priority**: Low - Tests pass, runtime works

---

### 2. Missing Port Methods (4 errors)
**Files**:
- `customer-retention-analysis.ts`: `listContracts` missing from `GoContractPortService`
- `expense-report-approval.ts`: `approve` and `reject` missing from `GoApprovalWorkflowPortService`

**Issue**: Use cases call methods that don't exist in port interfaces

**Fix Options**:
1. Add missing methods to port interfaces
2. Update use cases to use existing methods
3. Mark use cases as incomplete/draft

**Priority**: Medium - Indicates incomplete implementation

---

### 3. Type Mismatches in Go Backend Data Structures (10+ errors)
**Files**:
- `cash-flow-forecasting.ts`: `GoARAgingReport` vs `AgingBucket[]`
- `fixed-asset-depreciation-run.ts`: `GoDepreciationRun.assets` missing
- `revenue-by-service-type.ts`: `GoJournalEntry.reference` and `lineItems` missing
- `inventory-cycle-count.ts`: `GoInventoryBalance` missing `itemName`, `itemSku`
- `inventory-valuation-report.ts`: `GoInventoryItem.name` missing, `GoInventoryBalance.unitCost` missing

**Issue**: TypeScript interfaces for Go backend types don't match actual usage

**Fix**: 
```typescript
// Update port type definitions to match Go backend API
export interface GoInventoryBalance {
  // ... existing fields
  itemName: string;
  itemSku: string;
  unitCost: number;
}
```

**Priority**: Medium - Update when implementing these use cases

---

### 4. Invalid Command Properties (6 errors)
**Files**:
- `cash-flow-forecasting.ts`: `accountNumbers` invalid property
- `fixed-asset-depreciation-run.ts`: `periodMonth` invalid, `reference` invalid
- `revenue-by-service-type.ts`: `accountNumberRange` invalid
- `inventory-cycle-count.ts`: `quantityChange` invalid
- `inventory-valuation-report.ts`: `includeInactive` invalid

**Issue**: Use cases construct command objects with properties that don't exist in command interfaces

**Fix**: Update command interfaces or fix usage

**Priority**: Medium - Indicates incomplete command design

---

### 5. Namespace vs Type Confusion (4 errors)
**Files**:
- `fixed-asset-depreciation-run.ts`: `GoFixedAssetsPort` and `GoFinancialPort` used as namespaces
- `revenue-by-service-type.ts`: `GoFinancialPort` used as namespace
- `inventory-cycle-count.ts`: `GoInventoryPort` used as namespace
- `inventory-valuation-report.ts`: `GoInventoryPort` used as namespace

**Issue**: Code tries to use Context tags as namespaces (e.g., `GoFinancialPort.Type`)

**Fix**:
```typescript
// Current (wrong)
Effect<Result, Error, GoFinancialPort.Type>

// Should be
Effect<Result, Error, GoFinancialPortService>
```

**Priority**: Low - Pattern already established correctly in newer code

---

### 6. Possibly Undefined Values (10 errors)
**Files**: Multiple financial and inventory use cases

**Issue**: Code accesses properties/methods on values that could be `undefined` without null checks

**Fix**: Add null guards or non-null assertions (`!`) where appropriate

**Priority**: Low - Tests pass, likely safe assumptions

---

### 7. Unused Variables (2 errors)
**Files**:
- `expense-report-approval.ts`: `approvalLevel` declared but unused
- `sales-tax-reporting.ts`: `invoice` declared but unused

**Issue**: Dead code or incomplete implementation

**Fix**: Remove unused variables or complete implementation

**Priority**: Low - Doesn't affect functionality

---

## Resolution Strategy

### Phase 1: Quick Wins (1-2 hours)
1. Fix namespace vs type confusion (4 errors) - **Pattern already known**
2. Add NetworkError to union types (8 errors) - **Mechanical fix**
3. Remove unused variables (2 errors) - **Trivial**

**Result**: 14 errors → 0 from quick wins (28% reduction)

### Phase 2: Port Method Completion (2-4 hours)
1. Review Go backend for `listContracts`, `approve`, `reject` methods
2. Either add to port interfaces or update use case implementations
3. Verify with E2E tests or adapt

**Result**: 4 errors fixed

### Phase 3: Type Definition Updates (4-6 hours)
1. Update Go backend type interfaces to match actual API
2. Review OpenAPI specs if available
3. Test with real backend calls

**Result**: 10+ errors fixed

### Phase 4: Command Interface Cleanup (2-3 hours)
1. Review command interfaces vs usage
2. Add missing properties or fix usage
3. Validate with tests

**Result**: 6 errors fixed

**Total Effort**: 9-15 hours to resolve all 36+ TypeScript errors

---

## Current Decision

**Status**: ✅ **ACCEPTABLE** - Defer fixes to later sprint

**Rationale**:
1. All 228 tests pass (100% pass rate)
2. New scheduling implementation (Use Case 7.1) has zero TypeScript errors
3. Errors are in pre-existing stub implementations, not production code
4. Fixing now would delay Scenario 2 implementation
5. Errors provide useful documentation of incomplete work

**Next Steps**:
1. ✅ Document errors in this file (DONE)
2. ✅ Continue with Scenario 2 implementation
3. 🔜 Create GitHub issues for each error category (optional)
4. 🔜 Fix errors when implementing affected use cases

---

## Validation Commands

```bash
# Check TypeScript errors
pnpm --filter @dykstra/application type-check

# Run tests (should all pass)
pnpm --filter @dykstra/application test

# Run full validation (will report errors but tests pass)
pnpm validate
```

---

## Notes

- This is **not blocking** for current work
- Errors are in **incomplete/stub** implementations
- All **implemented and tested** code compiles cleanly
- **Scheduling module** (our current focus) has zero errors
- These errors serve as a **TODO list** for future work
