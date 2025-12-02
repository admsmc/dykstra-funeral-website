# Infrastructure Package TypeScript Errors - Technical Debt

**Date**: December 2, 2024  
**Status**: In Progress - Reduced from 645 to 325 errors (50% reduction)

## Progress Summary

### Initial State
- **645 errors** in infrastructure package
- Root causes: Missing port exports, outdated Prisma client, stub implementations

### Current State (After Phase 1)
- **325 errors** remaining (50% reduction achieved)
- ✅ Fixed missing port exports from @dykstra/application (136 errors fixed)
- ✅ Regenerated Prisma Client (184 errors fixed)
- 🔧 Remaining: Stub adapter implementations need cleanup

---

## Remaining Error Categories

### Error Type Breakdown (325 total)

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2304 | 51 | Cannot find name (e.g., `RepositoryError`) |
| TS2305 | 33 | Module has no exported member |
| TS2339 | 31 | Property does not exist on type |
| TS2322 | 29 | Type not assignable |
| TS2345 | 27 | Argument type not assignable |
| TS2554 | 24 | Expected X arguments, got Y |
| TS2551 | 23 | Property misspelled or renamed |
| TS6133 | 16 | Variable declared but never used |
| TS2358 | 13 | Invalid instanceof expression |
| TS6196 | 11 | Variable declared but never used |
| TS2769 | 11 | No overload matches this call |
| TS7006 | 10 | Implicit any type |
| Others | 46 | Various type/module issues |

### Files with Most Errors

| File | Errors | Issue Type |
|------|--------|------------|
| `adapters/repositories/vehicle-repository.ts` | 45 | Missing `RepositoryError`, Prisma field mismatches |
| `repositories/pre-planning-appointment-repository.ts` | 33 | Field name mismatches, missing exports |
| `adapters/email-calendar-sync-policy-adapter.ts` | 26 | Incorrect `NotFoundError` constructor usage |
| `adapters/contact-management-policy-adapter.ts` | 26 | Incorrect `NotFoundError` constructor usage |
| `adapters/repositories/driver-assignment-repository.ts` | 25 | Missing `RepositoryError`, field mismatches |
| `routers/prep-room-router.ts` | 22 | Missing imports/exports |
| `prep-room-index.ts` | 22 | Missing exports |
| `adapters/pto-management/training-management-adapter.ts` | 22 | Unused imports, implicit any types |
| `adapters/invitation-management-policy-adapter.ts` | 19 | Missing Prisma model, error constructor issues |
| `adapters/interaction-management-policy-adapter.ts` | 19 | Missing Prisma model, error constructor issues |

---

## Detailed Issue Analysis

### 1. NotFoundError Constructor Misuse (50+ instances)

**Problem**: `NotFoundError` requires `{ message, entityType, entityId }` object, but code passes just a string.

**Example**:
```typescript
// ❌ Current (wrong)
throw new NotFoundError(`No policy found for funeral home: ${funeralHomeId}`);

// ✅ Should be
throw new NotFoundError({
  message: `No policy found for funeral home: ${funeralHomeId}`,
  entityType: 'ContactManagementPolicy',
  entityId: funeralHomeId
});
```

**Affected Files**:
- `contact-management-policy-adapter.ts`
- `email-calendar-sync-policy-adapter.ts`
- `invitation-management-policy-adapter.ts`
- `interaction-management-policy-adapter.ts`
- `payment-management-policy-adapter.ts`
- And ~10 more policy adapters

**Fix Strategy**: Systematic search-and-replace across all adapters.

---

### 2. Missing RepositoryError Import (40+ instances)

**Problem**: Repository implementations reference `RepositoryError` but don't import it.

**Example**:
```typescript
// ❌ Missing import
Effect.fail(new RepositoryError('Failed to save')); // TS2304: Cannot find name 'RepositoryError'

// ✅ Should import
import { RepositoryError } from '@dykstra/application';
```

**Affected Files**:
- `vehicle-repository.ts` (15 instances)
- `driver-assignment-repository.ts` (10 instances)
- `pre-planning-appointment-repository.ts` (8 instances)

**Fix Strategy**: Add import statement to each affected file.

---

### 3. Prisma Field Name Mismatches (45+ instances)

**Problem**: Code references Prisma fields that don't exist or have different names.

**Examples**:
```typescript
// vehicle-repository.ts
❌ vehicle.nextMaintenanceDate  // Field doesn't exist
✅ vehicle.lastMaintenanceDate   // Actual field name

❌ vehicle.nextInspectionDate    // Field doesn't exist
✅ vehicle.inspectionDueDate     // Actual field name

❌ vehicle.acquisitionDate       // Field doesn't exist
✅ vehicle.createdAt            // Closest equivalent

❌ vehicle.vehicleType           // Field doesn't exist
✅ vehicle.type                  // Actual field name
```

**Fix Strategy**: 
1. Run `grep` to find actual Prisma field names in schema
2. Update all references to match schema
3. OR update Prisma schema if domain model is correct

---

### 4. Missing Prisma Models (20+ instances)

**Problem**: Some adapters reference Prisma models that don't exist yet.

**Status**: 
- ✅ `TrainingPolicy` exists
- ✅ `TrainingRecord` exists
- ✅ `PtoPolicy` exists
- ✅ `PtoRequest` exists
- ✅ `BackfillAssignment` exists
- ❌ `InteractionManagementPolicy` missing
- ❌ `InvitationManagementPolicy` missing
- ❌ Others TBD

**Fix Strategy**: Either:
1. Create missing Prisma models, OR
2. Convert adapters to use existing models/in-memory storage

---

### 5. Unused Imports and Variables (27 instances)

**Problem**: Dead code from scaffolded stubs.

**Example**:
```typescript
❌ import { TrainingRecordId } from '@dykstra/domain'; // TS6196: never used
❌ const unused = ...; // TS6133: never read
```

**Fix Strategy**: Remove all unused imports/variables.

---

### 6. Implicit Any Parameters (10 instances)

**Problem**: Function parameters missing type annotations in stub implementations.

**Example**:
```typescript
// ❌ Current
createTrainingPolicy: (funeralHomeId, policyData, createdBy) => // TS7006: implicit any

// ✅ Should be
createTrainingPolicy: (
  funeralHomeId: string,
  policyData: Partial<TrainingPolicy>,
  createdBy: string
) =>
```

**Fix Strategy**: Add explicit type annotations.

---

### 7. Duplicate Export Warnings (6 instances)

**Problem**: `NotFoundError` and `PersistenceError` exported from multiple modules.

**Location**: `packages/application/src/index.ts` lines 38-40

**Example**:
```typescript
error TS2308: Module './ports/case-repository' has already exported a member named 'NotFoundError'.
```

**Fix Strategy**: 
1. Export errors from one central location (domain package), OR
2. Use explicit re-exports with aliases

---

## Resolution Strategy

### Phase 1: ✅ COMPLETE (320 errors fixed)
1. ✅ Add missing port exports to application package index
2. ✅ Regenerate Prisma Client

**Result**: 645 → 325 errors (50% reduction)

### Phase 2: Quick Wins (Estimated: 100 errors fixed, 2-3 hours)
1. Fix `NotFoundError` constructor calls (50+ instances)
   - Systematic search-replace across all policy adapters
   - Pattern: `new NotFoundError(string)` → `new NotFoundError({ message, entityType, entityId })`

2. Add missing `RepositoryError` imports (40+ instances)
   - Add `import { RepositoryError } from '@dykstra/application';` to affected files

3. Remove unused imports/variables (27 instances)
   - Run automated cleanup

**Expected Result**: 325 → 225 errors

### Phase 3: Prisma Field Fixes (Estimated: 80 errors fixed, 3-4 hours)
1. Audit Prisma schema for actual field names
2. Update vehicle-repository.ts field references (15 errors)
3. Update driver-assignment-repository.ts field references (10 errors)
4. Update other repository field references (55 errors)

**Expected Result**: 225 → 145 errors

### Phase 4: Stub Cleanup (Estimated: 145 errors fixed, 4-6 hours)
1. Add explicit type annotations (10 errors)
2. Fix remaining type mismatches (29 errors)
3. Fix argument count issues (24 errors)
4. Address missing Prisma models (20 errors)
5. Fix module export issues (39 errors)
6. Resolve duplicate export warnings (6 errors)
7. Address remaining misc errors (17 errors)

**Expected Result**: 145 → 0 errors

### Total Estimated Effort
- **Phase 2**: 2-3 hours (Quick wins)
- **Phase 3**: 3-4 hours (Prisma fixes)
- **Phase 4**: 4-6 hours (Stub cleanup)
- **Total**: 9-13 hours to zero errors

---

## Current Decision

**Status**: 🔧 Phase 3 In Progress - 68% total error reduction achieved

**Progress**:
1. ✅ Phase 1 Complete: 645 → 325 errors (320 fixed - 50%)
   - Added missing port exports (training, PTO, backfill, policy repos)
   - Regenerated Prisma Client

2. ✅ Phase 2 Complete: 325 → 247 errors (78 fixed - 24%)
   - ✅ Fixed RepositoryError imports in vehicle/driver repositories (11 errors)
   - ✅ Fixed Prisma↔Domain mapping in vehicle-repository (41 errors)
   - ✅ Fixed NotFoundError constructors in 8 files (26 errors)

3. 🔧 Phase 3 In Progress: 247 → 203 errors (44 fixed - 18%)
   - ✅ Fixed Effect error handling pattern in 2 policy adapters (44 errors)
     - contact-management-policy-adapter (22 fixes)
     - email-calendar-sync-policy-adapter (22 fixes)
   - 🔧 Converted Effect.sync + .pipe(catchTag/catchAll) → Effect.try pattern
   - 🔜 Remaining: payment-management (10 errors), interaction (16 errors), invitation (16 errors)

4. 🔜 Phase 4: Final stub cleanup (203 errors remaining)

**Total Progress**: 645 → 203 errors (442 fixed - 68% reduction)

**Rationale**:
- Errors are in stub implementations, not production code
- All tests still pass (280 tests)
- New scheduling implementation has zero errors
- Systematic fixes will be more efficient than ad-hoc changes
- Clear path to zero errors in 9-13 hours

---

## Validation Commands

```bash
# Check current error count
npx tsc --noEmit --project packages/infrastructure/tsconfig.json 2>&1 | grep "error TS" | wc -l

# List files by error count
npx tsc --noEmit --project packages/infrastructure/tsconfig.json 2>&1 | grep "\.ts(" | sed 's/(.*//' | sort | uniq -c | sort -rn | head -20

# Check specific error types
npx tsc --noEmit --project packages/infrastructure/tsconfig.json 2>&1 | grep "error TS2304" | wc -l  # Cannot find name
npx tsc --noEmit --project packages/infrastructure/tsconfig.json 2>&1 | grep "error TS2339" | wc -l  # Property doesn't exist

# Run tests (should all pass despite errors)
pnpm test
```

---

## Notes

- ✅ All 280 tests passing
- ✅ Production code (scheduling use cases 7.1-7.4) has zero errors
- ✅ Errors isolated to stub/incomplete implementations
- ✅ Clear resolution path documented
- 🔧 Systematic fixes more efficient than ad-hoc
- 📊 50% progress achieved in Phase 1
