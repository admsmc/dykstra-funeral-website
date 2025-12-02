# Effect 3.x Test Migration Guide

## Problem
Many test files use deprecated Effect API patterns that don't exist in Effect 3.x:
- `Effect.contextFromEnvironment(() => mockService)` - **DOES NOT EXIST**
- `Effect.mergeContexts(ctx1, ctx2)` - **DOES NOT EXIST**

## Solution: Use Layer.succeed with Service Tags

### Pattern: Single Service

**❌ OLD (Deprecated)**
```typescript
const result = await Effect.runPromise(
  Effect.provide(
    useCase(command),
    Effect.contextFromEnvironment(() => mockService)
  )
);
```

**✅ NEW (Effect 3.x)**
```typescript
const result = await Effect.runPromise(
  useCase(command).pipe(
    Effect.provide(Layer.succeed(ServiceTag, mockService))
  )
);
```

### Pattern: Multiple Services

**❌ OLD (Deprecated)**
```typescript
const result = await Effect.runPromise(
  Effect.provide(
    useCase(command),
    Effect.mergeContexts(
      Effect.contextFromEnvironment(() => mockService1),
      Effect.contextFromEnvironment(() => mockService2)
    )
  )
);
```

**✅ NEW (Effect 3.x)**
```typescript
const layer = Layer.mergeAll(
  Layer.succeed(Service1Tag, mockService1),
  Layer.succeed(Service2Tag, mockService2)
);

const result = await Effect.runPromise(
  useCase(command).pipe(Effect.provide(layer))
);
```

## Required Imports

```typescript
import { Effect, Layer } from 'effect';
import { ServiceTag, type ServiceInterface } from '../../../ports/service-port';
```

## Real Example: Calendar Sync Tests

**Before:**
```typescript
import { Effect } from 'effect';
import { type CalendarSyncServicePort } from '../../../ports/calendar-sync-port';

const result = await Effect.runPromise(
  Effect.provide(
    getStaffAvailability(command),
    Effect.mergeContexts(
      Effect.contextFromEnvironment(() => mockCalendarSync),
      Effect.contextFromEnvironment(() => mockPolicyRepo)
    )
  )
);
```

**After:**
```typescript
import { Effect, Layer } from 'effect';
import { CalendarSyncPort, type CalendarSyncServicePort } from '../../../ports/calendar-sync-port';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../../ports/email-calendar-sync-policy-repository';

const layer = Layer.mergeAll(
  Layer.succeed(CalendarSyncPort, mockCalendarSync),
  Layer.succeed(EmailCalendarSyncPolicyRepository, mockPolicyRepo)
);

const result = await Effect.runPromise(
  getStaffAvailability(command).pipe(Effect.provide(layer))
);
```

## Files Needing Migration

### High Priority (Calendar/Email Sync - 5 files)
- [ ] `calendar-sync/__tests__/get-staff-availability.test.ts` (11 occurrences)
- [ ] `calendar-sync/__tests__/suggest-meeting-times.test.ts`
- [ ] `calendar-sync/__tests__/sync-interaction-to-calendar.test.ts`
- [ ] `email-sync/__tests__/match-email-to-entity.test.ts`
- [ ] `email-sync/__tests__/sync-user-emails.test.ts`

### Medium Priority (Contacts/Invitations - 5 files)
- [ ] `contacts/__tests__/find-duplicates.test.ts`
- [ ] `contacts/__tests__/merge-contacts.test.ts`
- [ ] `invitations/__tests__/list-invitations.test.ts`
- [ ] `invitations/__tests__/resend-invitation.test.ts`
- [ ] `invitations/__tests__/revoke-invitation.test.ts`

### Other Files with Issues (10 files)
- Financial: cash-flow-forecasting, customer-retention-analysis, expense-report-approval, fixed-asset-depreciation-run, revenue-by-service-type
- Inventory: inventory-cycle-count (1 test), inventory-valuation-report
- Payments: record-manual-payment
- Prep-room: prep-room
- Scheduling: driver-vehicle-coordination

## Migration Checklist

For each test file:
1. ✅ Add `Layer` to import from 'effect'
2. ✅ Import service tags (e.g., `CalendarSyncPort`, not just the interface)
3. ✅ Replace `Effect.contextFromEnvironment(() => mock)` with `Layer.succeed(ServiceTag, mock)`
4. ✅ Replace `Effect.mergeContexts(...)` with `Layer.mergeAll(...)`
5. ✅ Change `Effect.provide(useCase(...), contexts)` to `useCase(...).pipe(Effect.provide(layer))`
6. ✅ For multiple Effect.runPromise calls in same test, reuse layer or create separate layers with different variable names

## Testing
After migration, run tests:
```bash
pnpm --filter @dykstra/application test <test-file-name>
```
