# Go Scheduling Integration Summary

**Date**: December 1, 2024  
**Status**: ✅ Complete - Port and Adapter Created

## Overview

Successfully integrated Go backend staff scheduling functionality into the Dykstra Funeral Home monorepo to support critical funeral home roster management use cases.

## What Was Created

### 1. Go Scheduling Port (`go-scheduling-port.ts`)
**Location**: `packages/application/src/ports/go-scheduling-port.ts`  
**Lines**: 463 lines  
**Methods**: 25 port methods

**Port Interface** (`GoSchedulingPortService`):
- ✅ Shift template management (create, get, list)
- ✅ Shift assignment operations (assign, complete, cancel)
- ✅ Shift swap workflow (request, review, get, list)
- ✅ On-call management (assign, activate, get, list)
- ✅ Staff schedule queries (getStaffSchedule)
- ✅ Coverage tracking (getShiftCoverage, rules)
- ✅ Rotating schedules (create, get)

**Domain Types Defined**:
- `GoShiftTemplate` - Shift patterns with differentials
- `GoShiftAssignment` - Individual shift assignments
- `GoShiftSwap` - Shift swap requests and approvals
- `GoOnCallAssignment` - On-call duty tracking
- `GoOnCallActivation` - Callback/activation records
- `GoStaffSchedule` - Complete employee schedule
- `GoShiftCoverageStatus` - Staffing adequacy metrics
- `GoRotatingSchedule` - Multi-week rotation patterns
- `GoShiftCoverageRule` - Minimum/maximum staffing rules

**Shift Types Supported**:
- `regular` - Standard day shift
- `night` - Night shift (6pm-6am)
- `weekend` - Weekend shift
- `oncall` - On-call availability
- `holiday` - Holiday shift
- `overtime` - Overtime/extra shift

### 2. Go Scheduling Adapter (`go-scheduling-adapter.ts`)
**Location**: `packages/infrastructure/src/adapters/go-backend/go-scheduling-adapter.ts`  
**Lines**: 637 lines  
**Pattern**: Object-based adapter (NOT class-based)

**Implementation Details**:
- ✅ All 25 methods implemented
- ✅ Complete snake_case → camelCase mapping
- ✅ Effect-TS patterns for error handling
- ✅ Typed errors (NetworkError, NotFoundError)
- ✅ Proper HTTP client integration

**API Endpoints Mapped**:
```
POST   /v1/scheduling/templates
GET    /v1/scheduling/templates
GET    /v1/scheduling/templates/{id}
POST   /v1/scheduling/shifts/assign
GET    /v1/scheduling/shifts
GET    /v1/scheduling/shifts/{id}
POST   /v1/scheduling/shifts/{id}/complete
POST   /v1/scheduling/shifts/{id}/cancel
POST   /v1/scheduling/shifts/swap/request
POST   /v1/scheduling/shifts/swap/{id}/review
GET    /v1/scheduling/shifts/swap
GET    /v1/scheduling/shifts/swap/{id}
POST   /v1/scheduling/oncall/assign
POST   /v1/scheduling/oncall/{id}/activate
GET    /v1/scheduling/oncall
GET    /v1/scheduling/oncall/{id}
GET    /v1/scheduling/staff/{employeeId}/schedule
GET    /v1/scheduling/coverage
POST   /v1/scheduling/rotating
GET    /v1/scheduling/rotating/{id}
PUT    /v1/scheduling/coverage/rules
GET    /v1/scheduling/coverage/rules
```

## Go Backend Functionality Leveraged

**Source Files** (tigerbeetle-trial-app-1):
- `internal/domain/scheduling_builders.go` - Domain model (200+ lines)
- `internal/service/scheduling_service.go` - Service layer (200+ lines)

**Key Features**:
- ✅ TigerBeetle-backed transactional scheduling
- ✅ Shift differential tracking (pay premiums)
- ✅ Conflict detection
- ✅ Coverage validation
- ✅ Event sourcing (ShiftAssigned, ShiftSwapRequested, etc.)

## Funeral Home Use Cases Enabled

### 1. Staff Roster Management
**Use Case**: Assign funeral directors, embalmers, drivers to shifts  
**Methods**: `assignShift`, `listShiftAssignments`, `getStaffSchedule`

### 2. On-Call Rotation
**Use Case**: 24/7 on-call coverage for after-hours death calls  
**Methods**: `assignOnCall`, `activateOnCall`, `listOnCallAssignments`

### 3. Service Coverage Planning
**Use Case**: Ensure adequate staffing for scheduled services  
**Methods**: `getShiftCoverage`, `setShiftCoverageRule`

### 4. Shift Swap Workflow
**Use Case**: Staff request shift trades with manager approval  
**Methods**: `requestShiftSwap`, `reviewShiftSwap`, `listShiftSwaps`

### 5. Rotating Schedules
**Use Case**: Fair distribution of night/weekend shifts  
**Methods**: `createRotatingSchedule`, `getRotatingSchedule`

## Compilation Status

✅ **TypeScript Compilation**: Port and adapter compile without errors  
⚠️ **Note**: Existing Phase 7 use cases have 49 errors (unrelated to scheduling)

## Next Steps

### Phase 1: Use Case Implementation (Week 1-2)
Create funeral home-specific scheduling use cases:

1. **Assign On-Call Director for Weekend**
   - File: `packages/application/src/use-cases/scheduling/assign-oncall-director.ts`
   - Validates director eligibility
   - Checks for conflicts
   - Creates on-call assignment

2. **Schedule Embalmer for Service Prep**
   - File: `packages/application/src/use-cases/scheduling/schedule-embalmer.ts`
   - Links to case ID
   - Validates prep time requirements
   - Assigns shift

3. **View Weekly Staff Roster**
   - File: `packages/application/src/use-cases/scheduling/get-weekly-roster.ts`
   - Aggregates all staff schedules
   - Groups by shift type
   - Shows coverage gaps

4. **Request Shift Swap with Approval**
   - File: `packages/application/src/use-cases/scheduling/request-shift-swap.ts`
   - Validates eligible swap partners
   - Creates swap request
   - Notifies manager

### Phase 2: Integration Layer (Week 3)
Wire scheduling into infrastructure:

1. **Add to Infrastructure Layer Registration**
   - File: `packages/infrastructure/src/layers/go-backend-layer.ts`
   - Add `GoSchedulingPort` → `GoSchedulingAdapter` mapping

2. **Export from Infrastructure Package**
   - File: `packages/infrastructure/src/index.ts`
   - Export scheduling adapter and types

### Phase 3: API Layer (Week 4)
Expose scheduling via API endpoints:

1. **Create tRPC Scheduling Router**
   - File: `packages/api/src/routers/scheduling.ts`
   - Procedures: assignShift, getSchedule, requestSwap, etc.

2. **Add to Main Router**
   - File: `packages/api/src/routers/index.ts`
   - Mount scheduling router

### Phase 4: Testing (Week 5)
Comprehensive test coverage:

1. **Port Tests** (mocked backend)
2. **Adapter Tests** (real HTTP calls to test server)
3. **Use Case Tests** (business logic validation)
4. **E2E Tests** (full flow testing)

## Example Usage (Future)

```typescript
import { Effect } from 'effect';
import { GoSchedulingPort } from '@dykstra/application';

// Assign on-call director for weekend
const assignWeekendOnCall = Effect.gen(function* () {
  const scheduling = yield* GoSchedulingPort;
  
  // Create on-call assignment
  const assignment = yield* scheduling.assignOnCall({
    employeeId: 'director-001',
    startTime: new Date('2024-12-07T18:00:00Z'), // Friday 6pm
    endTime: new Date('2024-12-09T08:00:00Z'),   // Sunday 8am
  });
  
  console.log(`On-call assigned: ${assignment.id}`);
  
  // If activated (death call received)
  const activation = yield* scheduling.activateOnCall({
    onCallId: assignment.id,
    activationTime: new Date(),
    durationMinutes: 180, // 3 hours
    reason: 'Death call - home removal',
    caseId: 'case-12345',
  });
  
  return { assignment, activation };
});
```

## Benefits

1. **24/7 Coverage**: Ensures on-call director availability for after-hours death calls
2. **Fair Scheduling**: Rotating schedules prevent burnout
3. **Transparency**: Staff can view schedules and request swaps
4. **Compliance**: Accurate time tracking for payroll and labor law compliance
5. **Efficiency**: Automated conflict detection and coverage validation
6. **Flexibility**: Manager-approved shift swaps accommodate personal needs

## Architecture Compliance

✅ **Hexagonal Architecture**: Clean separation of port and adapter  
✅ **Object-Based Pattern**: No classes, pure functional composition  
✅ **Effect-TS Integration**: Proper error handling with typed errors  
✅ **Naming Convention**: `ServicePort` interface, `Port` context tag  
✅ **Domain Separation**: No Go-specific types in domain layer

## Related Documentation

- **Go Backend Source**: `/Users/andrewmathers/tigerbeetle-trial-app-1/internal/domain/scheduling_builders.go`
- **Project Architecture**: `ARCHITECTURE.md`
- **Port Pattern Guide**: Port interfaces must use `Service` suffix
- **Backend Contract Validation**: `docs/BACKEND_CONTRACT_VALIDATION_COMPLETE.md`

## Completion Checklist

- [x] Create `go-scheduling-port.ts` with 25 methods
- [x] Define all domain types (8 interfaces, 2 enums)
- [x] Create `go-scheduling-adapter.ts` with full implementation
- [x] Map all 22 API endpoints
- [x] Verify TypeScript compilation (zero errors in new code)
- [ ] Create use case: Assign on-call director
- [ ] Create use case: Schedule embalmer for service
- [ ] Create use case: View weekly roster
- [ ] Create use case: Request shift swap
- [ ] Add to infrastructure layer registration
- [ ] Create tRPC router
- [ ] Write comprehensive tests
- [ ] Document funeral home-specific workflows

## Notes

- **TigerBeetle Integration**: Scheduling uses TigerBeetle for transactional shift tracking
- **Event Sourcing**: All state changes emit events (ShiftAssigned, ShiftCompleted, etc.)
- **Differentials**: Supports pay premiums for night/weekend/holiday shifts
- **Coverage Rules**: Configurable minimum/maximum staffing by shift type
- **Rotating Patterns**: Supports multi-week rotation cycles (e.g., 2 weeks day, 2 weeks night)

## Success Metrics

**Target Outcomes**:
- ✅ 100% on-call coverage (no gaps in 24/7 rotation)
- ✅ <30 minute response time to after-hours death calls
- ✅ 90%+ staff satisfaction with schedule flexibility
- ✅ Zero payroll discrepancies from scheduling errors
- ✅ 50% reduction in manual schedule coordination time
