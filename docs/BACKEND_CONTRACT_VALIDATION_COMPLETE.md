# Backend Contract Validation - Complete System

This document describes the complete backend contract validation system implemented for the Dykstra Funeral Home Management System. The system ensures TypeScript adapters correctly implement Go backend API contracts through four phases of validation.

## Overview

The validation system consists of four integrated phases:

1. **Phase 1: Static Validation** (Baseline) - Verifies adapters implement all port methods
2. **Phase 2: OpenAPI Integration** (NEW) - Validates endpoints against Go OpenAPI specification
3. **Phase 3: Contract Testing** (NEW) - Runtime tests for adapter implementations
4. **Phase 4: Breaking Change Detection** (NEW) - Tracks API changes over time

## Phase 1: Static Validation (Baseline)

**Purpose**: Ensure every port method has a corresponding adapter implementation.

### Command
```bash
pnpm validate:contracts
```

### What It Validates
- ✅ All 21 Go backend ports have matching adapters
- ✅ Every port method has an adapter implementation
- ✅ HTTP endpoints are extractable from adapter code
- ✅ No missing implementations

### Output Example
```
📋 Analyzing 21 Go backend port files...

🔍 go-financial-port (27 methods)
  ✅ createInvoice: POST /v1/financial/invoices
  ✅ approveAPPaymentRun: POST /ap/payment-runs/{id}/approve
  ...

📊 Backend Contract Validation Summary
  Total Ports Analyzed:          21
  Total Port Methods:            142
  Methods with Adapters:         142 ✅
  Methods without Adapters:      0 ✅
  Endpoints Extracted:           142

✅ All backend contracts validated successfully!
```

### Implementation
- **Script**: `scripts/validate-backend-contracts.ts`
- **Method**: Static analysis via regex parsing
- **Validation**: Method name matching between ports and adapters
- **Exit code**: Non-zero on missing implementations

---

## Phase 2: OpenAPI Integration (NEW)

**Purpose**: Validate TypeScript endpoints match Go backend OpenAPI specification.

### Command
```bash
# Auto-discover OpenAPI spec in common locations
pnpm validate:contracts:openapi

# Specify OpenAPI spec path
pnpm validate:contracts:openapi --openapi-path=../go-erp/docs/openapi.yaml

# URL (requires manual download first)
pnpm validate:contracts:openapi --openapi-url=http://localhost:8080/openapi.yaml
```

### What It Validates
- ✅ TypeScript adapters cover all OpenAPI endpoints
- ✅ HTTP methods match (GET/POST/PUT/PATCH/DELETE)
- ✅ Endpoint paths match (normalized for comparison)
- ⚠️  Adapter endpoints not in OpenAPI spec (warnings)
- ❌ OpenAPI endpoints missing from adapters (errors)

### Auto-Discovery Locations
The script automatically checks for OpenAPI specs in:
1. `docs/openapi.yaml`
2. `docs/openapi/openapi.yaml`
3. `openapi.yaml`
4. `../go-erp/docs/openapi.yaml` (sibling repo pattern)

### Path Normalization
Handles different path parameter styles:
- Go style: `/users/{id}/profile`
- TypeScript style: `/users/:id/profile`
- Normalized: `/users/{param}/profile` (for comparison)

### Output Example
```
═══════════════════════════════════════════════════════════════
🔗 OpenAPI Specification Comparison
═══════════════════════════════════════════════════════════════

  OpenAPI Endpoints:             156
  Matched in Adapters:           142 ✅
  Missing from Adapters:         14 ❌
  Adapter-only (not in spec):    0 ✅

❌ OpenAPI Endpoints Missing from Adapters:
  GET /v1/employees/{id}/benefits
    Summary: Get employee benefits
  POST /v1/payroll/runs/{id}/void
    Summary: Void payroll run
  ...

💡 To fix:
   1. Add missing port methods for unmapped endpoints
   2. Implement adapters for those methods
   3. Or verify endpoints are intentionally not implemented (e.g., admin-only)
```

### Implementation
- **Script**: `scripts/validate-backend-contracts-openapi.ts`
- **Dependencies**: `js-yaml` (already available via transitive dependency)
- **Method**: Parse YAML → Extract endpoints → Compare with adapter endpoints
- **Exit code**: Warning only (doesn't fail build yet, informational)

### Integration with Phase 1
Phase 2 **extends** Phase 1 by:
1. Running base validation first
2. Extracting adapter endpoint data from Phase 1 results
3. Comparing against OpenAPI spec
4. Reporting discrepancies

---

## Phase 3: Contract Testing (NEW)

**Purpose**: Runtime tests to verify adapter implementations at the code level.

### Command
```bash
# Run all tests (includes contract tests)
pnpm test

# Run contract tests specifically
pnpm --filter @dykstra/infrastructure test contract-validation
```

### What It Tests
- ✅ All adapter objects implement their port interface
- ✅ All required methods are present
- ✅ Methods are callable functions
- ✅ Consistent error handling patterns (Effect.tryPromise)
- ✅ Consistent response mapping patterns

### Test Structure
```typescript
describe('Go Backend Adapter Contract Validation', () => {
  describe('High Priority Adapters', () => {
    describe('GoContractAdapter', () => {
      const expectedMethods: (keyof GoContractPortService)[] = [
        'createContract',
        'updateContract',
        // ...
      ];
      
      verifyImplementsInterface(GoContractAdapter, 'GoContractPortService', expectedMethods);
    });
  });
});
```

### Benefits
- Catches missing methods at test time
- Verifies TypeScript type conformance
- Documents expected interface in test code
- Complements static validation with runtime checks

### Implementation
- **File**: `packages/infrastructure/src/adapters/go-backend/__tests__/contract-validation.test.ts`
- **Framework**: Jest (via `@jest/globals`)
- **Coverage**: All 21 adapters, 142 methods
- **Method**: Runtime introspection of adapter objects

---

## Phase 4: Breaking Change Detection (NEW)

**Purpose**: Track API changes over time and detect breaking changes before they reach production.

### Commands
```bash
# Check for breaking changes (compares against baseline)
pnpm validate:breaking-changes

# Update baseline after reviewing changes
pnpm validate:breaking-changes --update-baseline
```

### What It Detects

#### Breaking Changes (Fail Build)
- ❌ **Removed Port**: Entire port interface deleted
- ❌ **Removed Method**: Method removed from port
- ❌ **Removed Endpoint**: Endpoint no longer exists
- ❌ **Changed Endpoint**: HTTP method or path changed

#### Non-Breaking Changes (Warning Only)
- ℹ️  **Added Method**: New method added to port
- ℹ️  **Added Port**: New port interface created

### Baseline Storage
- **Location**: `.baseline/backend-contracts.json`
- **Format**: JSON snapshot of all ports, methods, and endpoints
- **Version Control**: **Committed to Git** (not in .gitignore)
- **Updates**: Manual via `--update-baseline` flag

### Workflow
1. **Initial Setup**: First run creates baseline automatically
2. **Development**: Changes detected on subsequent runs
3. **Review**: Breaking changes fail validation
4. **Approval**: After review, update baseline with `--update-baseline`
5. **Commit**: Commit updated baseline with code changes

### Output Example
```
═══════════════════════════════════════════════════════════════
🔍 Breaking Change Detection
═══════════════════════════════════════════════════════════════

  Breaking Changes:     3 ❌
  Non-Breaking Changes: 5 ⚠️

❌ Breaking Changes Detected:

  CHANGED_ENDPOINT: go-financial-port.approveAPPaymentRun
    Endpoint for approveAPPaymentRun changed
    Before: POST /ap/payment-runs/{id}/approve
    After:  PUT /ap/payment-runs/{id}/approve

  REMOVED_METHOD: go-payroll-port.voidPayrollRun
    Method voidPayrollRun was removed from go-payroll-port

ℹ️  Non-Breaking Changes:

  ADDED_METHOD: go-financial-port.createCreditMemo
    Method createCreditMemo was added to go-financial-port

═══════════════════════════════════════════════════════════════
❌ BREAKING CHANGES DETECTED!

💡 Actions:
   1. Review changes carefully - breaking changes may affect consumers
   2. Coordinate with Go backend team to verify changes are intentional
   3. Update adapters to match new backend contracts
   4. After review, update baseline: pnpm validate:breaking-changes --update-baseline

⚠️  Do NOT update baseline until breaking changes are resolved!
═══════════════════════════════════════════════════════════════
```

### Implementation
- **Script**: `scripts/detect-breaking-changes.ts`
- **Storage**: `.baseline/backend-contracts.json`
- **Method**: JSON diff comparison with semantic change detection
- **Exit code**: Non-zero on breaking changes

---

## Integration with CI/CD

### Pre-Commit Hook
The validation system is integrated into `scripts/pre-commit.sh`:

```bash
#!/bin/bash
# ...existing checks...

# Phase 1: Backend contract validation
echo "Validating backend contracts..."
pnpm validate:contracts || exit 1

# Phase 4: Breaking change detection
echo "Checking for breaking changes..."
pnpm validate:breaking-changes || exit 1
```

### Full Validation Command
```bash
pnpm validate
```

This runs:
1. TypeScript compilation
2. ESLint with Effect rules
3. Circular dependency detection
4. Effect Layer validation
5. Dependency injection validation
6. Prisma type validation
7. **Backend contract validation** (Phase 1)
8. **Breaking change detection** (Phase 4)

### Optional: OpenAPI Validation
To enable OpenAPI validation in CI:

```bash
# In .github/workflows/ci.yml or similar
- name: Validate OpenAPI Contracts
  run: pnpm validate:contracts:openapi --openapi-path=path/to/openapi.yaml
```

**Note**: Phase 2 (OpenAPI) is currently informational only and doesn't fail builds.

---

## File Structure

```
dykstra-funeral-website/
├── .baseline/
│   └── backend-contracts.json          # Phase 4 baseline snapshot (committed)
├── scripts/
│   ├── validate-backend-contracts.ts    # Phase 1: Static validation
│   ├── validate-backend-contracts-openapi.ts  # Phase 2: OpenAPI integration
│   ├── detect-breaking-changes.ts       # Phase 4: Breaking change detection
│   └── pre-commit.sh                    # CI integration
├── packages/
│   └── infrastructure/
│       └── src/
│           └── adapters/
│               └── go-backend/
│                   └── __tests__/
│                       └── contract-validation.test.ts  # Phase 3: Runtime tests
├── docs/
│   ├── BACKEND_CONTRACT_VALIDATION.md   # Phase 1 documentation (original)
│   ├── PHASE_1_BACKEND_VERIFICATION.md  # Use case verification
│   ├── BACKEND_REALITY_CHECK.md         # Initial verification notes
│   └── BACKEND_CONTRACT_VALIDATION_COMPLETE.md  # This file
└── package.json                         # Scripts: validate:contracts, etc.
```

---

## Usage Examples

### Daily Development Workflow
```bash
# 1. Make code changes to adapters/ports
# 2. Run validation before commit
pnpm validate

# If breaking changes detected, review and update baseline
pnpm validate:breaking-changes --update-baseline

# 3. Commit changes including updated baseline
git add .baseline/backend-contracts.json
git commit -m "feat: add createCreditMemo endpoint"
```

### OpenAPI Validation (Optional)
```bash
# One-time setup: place OpenAPI spec in common location
cp ../go-erp/docs/openapi.yaml docs/openapi.yaml

# Run with auto-discovery
pnpm validate:contracts:openapi

# Or specify path explicitly
pnpm validate:contracts:openapi --openapi-path=docs/openapi.yaml
```

### Initial Baseline Creation
```bash
# First run automatically creates baseline
pnpm validate:breaking-changes

# Output:
# ℹ️  No baseline found - creating initial baseline
# ✅ Initial baseline created
#    Future runs will compare against this baseline
```

### Contract Testing
```bash
# Run during development
pnpm --filter @dykstra/infrastructure test

# Or in watch mode
pnpm --filter @dykstra/infrastructure test --watch
```

---

## Troubleshooting

### Phase 1: Missing Adapter Implementation
**Error**: `❌ go-financial-port.createInvoice missing adapter implementation`

**Fix**:
1. Check adapter file exists: `packages/infrastructure/src/adapters/go-backend/go-financial-adapter.ts`
2. Verify method name matches exactly: `createInvoice: (command) => Effect.tryPromise(...)`
3. Run validation again: `pnpm validate:contracts`

### Phase 2: OpenAPI Spec Not Found
**Warning**: `ℹ️  No OpenAPI spec found (checked common locations)`

**Fix**:
1. Place OpenAPI spec in `docs/openapi.yaml`
2. Or specify path: `pnpm validate:contracts:openapi --openapi-path=path/to/spec.yaml`
3. Or download from URL: `curl -o docs/openapi.yaml http://localhost:8080/openapi.yaml`

### Phase 3: Contract Test Failures
**Error**: `Expected methods [...] to equal [...]`

**Fix**:
1. Check port interface for expected method list
2. Update adapter to implement missing methods
3. Update test file if interface changed legitimately

### Phase 4: False Positive Breaking Changes
**Error**: Breaking changes detected but changes are intentional

**Fix**:
1. Review changes carefully with team
2. Verify Go backend changes are deployed
3. Update baseline: `pnpm validate:breaking-changes --update-baseline`
4. Commit updated baseline

### Phase 4: Baseline Merge Conflicts
**Conflict**: `.baseline/backend-contracts.json` conflicts during merge

**Fix**:
1. Accept both changes (merge conflict)
2. Regenerate baseline: `pnpm validate:breaking-changes --update-baseline`
3. Commit resolved baseline

---

## Benefits

### Phase 1: Static Validation
- ✅ Catches missing implementations at build time
- ✅ Prevents deployment of incomplete adapters
- ✅ Zero runtime overhead
- ✅ Fast (runs in ~2 seconds)

### Phase 2: OpenAPI Integration
- ✅ Validates against canonical API documentation
- ✅ Catches endpoint path mismatches
- ✅ Identifies unused endpoints
- ✅ Ensures TypeScript mirrors Go backend exactly

### Phase 3: Contract Testing
- ✅ Runtime verification of implementations
- ✅ Documents expected interfaces in tests
- ✅ Catches type mismatches
- ✅ Complements static checks

### Phase 4: Breaking Change Detection
- ✅ Prevents accidental API breakages
- ✅ Forces review of breaking changes
- ✅ Tracks API evolution over time
- ✅ Enables safe refactoring

---

## Future Enhancements

### Completed
- ✅ Phase 1: Static validation
- ✅ Phase 2: OpenAPI integration
- ✅ Phase 3: Contract testing
- ✅ Phase 4: Breaking change detection

### Potential Future Work
- 🔄 **Phase 5: Integration Testing** - E2E tests against live Go backend
- 🔄 **Phase 6: Mock Generation** - Auto-generate mocks from OpenAPI spec
- 🔄 **Phase 7: Contract Versioning** - Support multiple API versions
- 🔄 **Phase 8: Performance Tracking** - Track endpoint response times
- 🔄 **Phase 9: OpenAPI Spec Generation** - Generate TypeScript types from OpenAPI

---

## Summary

The complete backend contract validation system provides four layers of protection:

1. **Build Time** (Phase 1) - Static validation catches missing implementations
2. **Documentation** (Phase 2) - OpenAPI integration ensures spec conformance
3. **Test Time** (Phase 3) - Runtime tests verify implementations
4. **Change Time** (Phase 4) - Breaking change detection protects API stability

Together, these phases ensure the TypeScript frontend always correctly implements Go backend contracts, preventing runtime errors and API mismatches in production.

**Commands Quick Reference**:
- `pnpm validate:contracts` - Phase 1 static validation
- `pnpm validate:contracts:openapi` - Phase 2 OpenAPI comparison
- `pnpm test` - Phase 3 contract tests
- `pnpm validate:breaking-changes` - Phase 4 change detection
- `pnpm validate` - All validations (includes Phase 1 + 4)
