# Transaction Button Wiring Audit

**Date**: December 5, 2025  
**Status**: 🔴 **CRITICAL ISSUES FOUND**

## Executive Summary

The transaction creation buttons (Record Payment, Create Transaction, etc.) are **not working** due to **missing backend dependencies**. While the code architecture is correct, the application layer depends on repositories and policies that are **not implemented or wired up** in the infrastructure layer.

## Critical Finding

**Root Cause**: Missing Effect-TS dependency injection layers for required repositories

**Impact**: All payment recording, refunds, and financial transactions fail silently or throw dependency injection errors.

## Detailed Analysis

### 1. Record Payment Button (`/staff/payments`)

**Location**: `src/app/staff/payments/page.tsx:322-329`

**Code**:
```typescript
<button
  onClick={() => setIsManualPaymentModalOpen(true)}
  className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg"
>
  <Plus className="w-4 h-4" />
  Record Payment
</button>
```

**Modal**: `src/app/staff/payments/_components/ManualPaymentModal.tsx`

**tRPC Endpoint**: `packages/api/src/routers/payment.router.ts:238-262`
- ✅ Router endpoint exists: `payment.recordManual`
- ✅ Properly defined with staffProcedure
- ✅ Input validation with Zod schema

**Use Case**: `packages/application/src/use-cases/payments/record-manual-payment.ts`
- ✅ Use case exists and is properly implemented
- ✅ Exported from application package index (line 141)
- ✅ Domain validation and business logic correct

**Dependencies Required** (from use case line 65):
```typescript
Effect.Effect<
  RecordManualPaymentResult,
  ValidationError | NotFoundError | BusinessRuleViolationError | InvalidStateTransitionError | PersistenceError,
  PaymentRepository | PaymentManagementPolicyRepositoryService
>
```

### 2. Missing Infrastructure Wiring

#### ❌ PaymentRepository Layer

**Expected**: `packages/infrastructure/src/layers/repositories/payment-repository-layer.ts`
**Status**: ❓ **NEEDS VERIFICATION**

**Required Methods** (from port definition):
- `save(payment: Payment): Effect<void, PersistenceError>`
- `findByBusinessKey(businessKey: string): Effect<Payment | null, PersistenceError>`
- `findById(id: string): Effect<Payment | null, PersistenceError>`
- `findByCaseId(caseId: string): Effect<Payment[], PersistenceError>`
- `list(filters): Effect<PaymentListResult, PersistenceError>`

**Implementation File**: `packages/infrastructure/src/repositories/payment-repository-prisma.ts`

#### ❌ PaymentManagementPolicyRepository Layer

**Expected**: `packages/infrastructure/src/layers/policies/payment-management-policy-repository-layer.ts`
**Status**: ❓ **NEEDS VERIFICATION**

**Required Methods**:
- `findByFuneralHome(funeralHomeId: string): Effect<PaymentManagementPolicy, NotFoundError | PersistenceError>`
- `save(policy: PaymentManagementPolicy): Effect<void, PersistenceError>`
- `getHistory(policyBusinessKey: string): Effect<PaymentManagementPolicy[], PersistenceError>`

**Implementation File**: `packages/infrastructure/src/repositories/payment-management-policy-repository-prisma.ts`

### 3. Main AppRouter Layer Configuration

**File**: `packages/api/src/trpc.ts` (or main app layer setup)

**Required**: Layer composition that provides all dependencies

**Expected Pattern**:
```typescript
const mainLayer = Layer.mergeAll(
  PrismaClientLive,
  PaymentRepositoryLive,
  PaymentManagementPolicyRepositoryLive,
  // ... other repository layers
);

export const createContext = async (opts: CreateNextContextOptions) => {
  // ... context setup with mainLayer
};
```

### 4. Other Transaction Buttons (Similar Issues)

All these buttons likely have the same wiring issues:

1. **Process Refund** (`/staff/payments/[id]`)
   - Endpoint: `payment.processRefund`
   - Use case: `processRefund`
   - Dependencies: `PaymentRepository`, `PaymentManagementPolicyRepository`

2. **Record AP Payment** (`/staff/finops/ap`)
   - Endpoint: `financial.payVendorBill`
   - Use case: `payVendorBill`
   - Dependencies: `VendorBillRepository`, `GoFinancialPort`, etc.

3. **Create Payment Plan** (`/staff/payments` - Payment Plans tab)
   - Endpoint: `payment.createPlan`
   - Use case: `createPaymentPlan`
   - Dependencies: `PaymentPlanRepository`, etc.

## Verification Steps

Run the following commands to check what's missing:

### 1. Check if repository implementations exist:
```bash
find packages/infrastructure/src/repositories -name "*payment*.ts"
find packages/infrastructure/src/repositories -name "*policy*.ts"
```

### 2. Check if layers are defined:
```bash
find packages/infrastructure/src/layers -name "*payment*.ts"
find packages/infrastructure/src/layers -name "*policy*.ts"
```

### 3. Check main layer composition:
```bash
grep -r "Layer.mergeAll" packages/api/src/
grep -r "mainLayer" packages/api/src/
```

### 4. Test dependency injection in dev:
```bash
# Start dev server with debug logging
DEBUG=effect:* pnpm dev
```

## Symptoms Users Experience

When clicking "Record Payment":

1. ✅ Modal opens successfully
2. ✅ Form fields render correctly
3. ✅ Client-side validation works (Zod schema)
4. ❌ **Submission fails** with one of:
   - "Service not available" error
   - "Dependency not found" error
   - Silent failure (no feedback)
   - Network error 500 with Effect error trace

**Console Error (Expected)**:
```
Error: Service not available: PaymentRepository
  at Effect.gen
  at runEffect
```

## Fix Priority

**Priority**: 🔥 **CRITICAL** - Blocks all payment recording functionality

**Estimated Effort**: 2-4 hours

**Fix Steps**:
1. Verify repository implementations exist (30 min)
2. Create missing Effect Layer wrappers (1 hour)
3. Wire layers into main app context (30 min)
4. Test all transaction buttons (1 hour)
5. Add error boundary for better UX (30 min)

## Recommended Solution

### Phase 1: Verify Existing Implementations (30 min)

Check if these files exist and are complete:
- `packages/infrastructure/src/repositories/payment-repository-prisma.ts`
- `packages/infrastructure/src/repositories/payment-management-policy-repository-prisma.ts`

### Phase 2: Create Layer Wrappers (1 hour)

Create Layer wrappers for dependency injection:

**File**: `packages/infrastructure/src/layers/payment-repository-layer.ts`
```typescript
import { Layer } from 'effect';
import { PaymentRepository } from '@dykstra/application';
import { PaymentRepositoryPrisma } from '../repositories/payment-repository-prisma';
import { PrismaClient } from './prisma-client-layer';

export const PaymentRepositoryLive = Layer.effect(
  PaymentRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaClient;
    return PaymentRepositoryPrisma(prisma);
  })
);
```

**File**: `packages/infrastructure/src/layers/payment-management-policy-repository-layer.ts`
```typescript
import { Layer } from 'effect';
import { PaymentManagementPolicyRepository } from '@dykstra/application';
import { PaymentManagementPolicyRepositoryPrisma } from '../repositories/payment-management-policy-repository-prisma';
import { PrismaClient } from './prisma-client-layer';

export const PaymentManagementPolicyRepositoryLive = Layer.effect(
  PaymentManagementPolicyRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaClient;
    return PaymentManagementPolicyRepositoryPrisma(prisma);
  })
);
```

### Phase 3: Wire Into Main Layer (30 min)

**File**: `packages/api/src/trpc.ts` (or app context setup)

```typescript
import { PaymentRepositoryLive } from '@dykstra/infrastructure/layers/payment-repository-layer';
import { PaymentManagementPolicyRepositoryLive } from '@dykstra/infrastructure/layers/payment-management-policy-repository-layer';

const mainLayer = Layer.mergeAll(
  PrismaClientLive,
  PaymentRepositoryLive,
  PaymentManagementPolicyRepositoryLive,
  // ... other layers
);

// Use mainLayer in runEffect calls
export const runEffect = <R, E, A>(
  effect: Effect.Effect<R, E, A>
): Promise<A> => {
  return Effect.runPromise(
    Effect.provide(effect, mainLayer)
  );
};
```

### Phase 4: Test & Validate (1 hour)

1. Start dev server
2. Navigate to `/staff/payments`
3. Click "Record Payment"
4. Fill out form and submit
5. Verify:
   - ✅ No console errors
   - ✅ Success toast appears
   - ✅ Payment appears in table
   - ✅ Database record created

### Phase 5: Error Boundaries (30 min)

Add better error handling:

**File**: `src/app/staff/payments/_components/ManualPaymentModal.tsx`

```typescript
onError: (error: any) => {
  // Better error messages based on error type
  if (error.message?.includes('Service not available')) {
    toast.error('Payment system is currently unavailable. Please contact support.');
  } else if (error.message?.includes('not enabled')) {
    toast.error(error.message); // Policy violation - show to user
  } else {
    toast.error(`Failed to record payment: ${error.message}`);
  }
  form.setError("caseId", { message: error.message });
}
```

## Testing Checklist

After implementing fixes, test all transaction buttons:

- [ ] Record Manual Payment (`/staff/payments`)
- [ ] Process Refund (`/staff/payments/[id]`)
- [ ] Create Payment Plan (`/staff/payments` - Plans tab)
- [ ] Pay Vendor Bill (`/staff/finops/ap`)
- [ ] Record Insurance Claim (`/staff/finops/ar`)
- [ ] Apply Batch Payment (`/staff/payments` - bulk actions)

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Clean Architecture guidelines
- [Backend Contract Validation](./BACKEND_CONTRACT_VALIDATION_COMPLETE.md) - API validation
- [Implementation Plan](./Implementation%20Plan_%20Remaining%2020%20Critical%20Use%20Cases.md) - Use case progress

## Follow-Up Actions

1. **Immediate**: Verify repository implementations exist
2. **Next Session**: Create missing layers and wire dependencies
3. **After Fix**: Add integration tests for payment recording flow
4. **Documentation**: Update architecture docs with layer patterns

---

**Next Steps**: Run verification commands to determine scope of missing infrastructure.
