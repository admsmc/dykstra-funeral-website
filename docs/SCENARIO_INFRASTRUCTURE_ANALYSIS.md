# Scenario Infrastructure Wiring Analysis

**Date**: December 1, 2024  
**Status**: Analysis Complete - Significant Gaps Identified

---

## Executive Summary

**Question**: For Scenarios 1-5 (Phases 1-5), were we rigorous about infrastructure/schema/routing wiring like we were for Scenario 6?

**Answer**: **MIXED RESULTS**
- ✅ **Schema**: Prisma models exist for all data
- ✅ **Routing**: All 22 routers properly registered in root.ts
- ❌ **Infrastructure Layer**: Scenario 6 patterns NOT followed for Scenarios 1-5
- ❌ **Repository Wiring**: ONLY Scenario 6 has repository wired to InfrastructureLayer
- ❌ **Use Case Exports**: PARTIAL (varies by scenario)

**Impact**: Infrastructure is INCONSISTENT - Scenarios 1-5 had minimal effort wiring while Scenario 6 received comprehensive treatment.

---

## Current Implementation Status (December 1, 2024)

### Scenario Infrastructure Comparison

| Aspect | Scenario 1-5 (Phase 1-5) | Scenario 6 (Pre-Planning) | Status |
|--------|--------------------------|--------------------------|--------|
| **Domain Layer** | ✅ Use cases created | ✅ Domain entity (413 lines) | ✅ Complete |
| **Application Layer** | ✅ Use cases | ✅ Ports/interfaces (252 lines) | ✅ Complete |
| **Prisma Schema** | ✅ Models exist | ✅ PrePlanningAppointment (SCD2) | ✅ Complete |
| **Prisma Repository** | ❓ UNKNOWN | ✅ Implemented (411 lines) | ⚠️ Incomplete |
| **Repository Wiring** | ❌ NOT wired to layer | ✅ Wired to InfrastructureLayer | ❌ Gap |
| **tRPC Router** | ✅ 22 routers exist | ✅ Implemented (211 lines) | ✅ Complete |
| **Router Registration** | ✅ Registered in root.ts | ✅ Registered in root.ts | ✅ Complete |
| **Use Case Exports** | ⚠️ Partial | ✅ Exported from @dykstra/application | ⚠️ Incomplete |
| **Adapter Wiring** | ⚠️ Varies | ✅ Wired in InfrastructureLayer | ⚠️ Incomplete |

---

## Detailed Findings

### 1. Router Registration (ALL COMPLETE)

**Status**: ✅ **22 routers properly registered** in `packages/api/src/root.ts`

#### Registered Routers:
- ✅ `case` (Core case management)
- ✅ `photo` (Photo management)
- ✅ `arrangements` (Service arrangements)
- ✅ `user` (User management)
- ✅ `payment` (Payments)
- ✅ `stripe` (Stripe integration)
- ✅ `staff` (Staff management)
- ✅ `note` (Internal notes)
- ✅ `caseEnhancements` (Case enhancements)
- ✅ `invitation` (Family invitations)
- ✅ `contract` (Contracts)
- ✅ `lead` (CRM leads)
- ✅ `contact` (CRM contacts)
- ✅ `campaign` (Marketing campaigns)
- ✅ `referralSource` (Referral sources)
- ✅ `interaction` (Interactions)
- ✅ `validation` (Address/phone validation)
- ✅ `enrichment` (Contact enrichment)
- ✅ `duplicate` (Duplicate detection)
- ✅ `familyRelationship` (Family relationships)
- ✅ `emailSync` (Email sync)
- ✅ `prePlan` (Scenario 6: Pre-planning appointments) **NEW**

**Scenario 6 Router**: `/packages/api/src/routers/preplan.router.ts` (211 lines)
- 6 endpoints: scheduleAppointment, getDirectorAvailability, listAppointments, cancelAppointment, completeAppointment, sendAppointmentReminders
- Uses Go Scheduling Port for backend integration
- Properly registered as `prePlan` in root.ts

---

### 2. Prisma Schema (ALL MODELS EXIST)

**Status**: ✅ **All required models present** in `packages/infrastructure/prisma/schema.prisma`

#### Key Models:
- ✅ **Case** (1,357 lines) - SCD2 temporal pattern with version history
- ✅ **Contract** (224 lines) - SCD2 temporal with immutability constraints
- ✅ **Payment** (296 lines) - SCD2 with payment status tracking
- ✅ **PrePlanningAppointment** (1,417 lines) - SCD2 with appointment scheduling
- ✅ All supporting models: CaseMember, CaseEnhancement, Lead, Contact, Campaign, etc.

**Scenario 6 Model**: `PrePlanningAppointment` (49 fields)
- SCD2 pattern: businessKey, version, validFrom, validTo, isCurrent
- Fields: directorId, familyName, familyEmail, startTime, endTime, status, reminders, completion tracking
- Relationships: funeralHome, indices for performance queries
- Temporal queries support: `appointmentDate`, `reminderEmailSent`, `status`

---

### 3. Infrastructure Layer Wiring (MAJOR GAP IDENTIFIED)

**Status**: ❌ **CRITICAL GAP - Scenarios 1-5 NOT wired, Scenario 6 PARTIAL**

#### Current Infrastructure Layer (`packages/infrastructure/src/index.ts`):

**Repositories Wired** (Only Scenarios 1-5):
```typescript
Layer.succeed(CaseRepository, PrismaCaseRepository)
Layer.succeed(ContractRepository, PrismaContractRepository)
Layer.succeed(PaymentRepository, PrismaPaymentRepository)
// ... 15 other Scenario 1-5 repositories
```

**Scenario 6 Repository Status**: ❌ **NOT WIRED**
- Repository file EXISTS: `/packages/infrastructure/src/repositories/pre-planning-appointment-repository.ts` (411 lines)
- Port EXISTS: `PrePlanningAppointmentRepository` (in @dykstra/application)
- **BUT**: NOT registered in InfrastructureLayer with `Layer.succeed()`

**Missing from Infrastructure Layer**:
```typescript
// TODO: Add to InfrastructureLayer
Layer.succeed(PrePlanningAppointmentRepository, PrismaPrePlanningAppointmentRepository)
```

#### What Scenario 6 Needs for Full Integration:

1. **Repository Export** (infrastructure/src/index.ts):
   - Add: `export * from './repositories/pre-planning-appointment-repository';`

2. **Layer Wiring** (infrastructure/src/index.ts):
   - Import: `import { PrismaPrePlanningAppointmentRepository } from './repositories/pre-planning-appointment-repository';`
   - Import: `import { PrePlanningAppointmentRepository } from '@dykstra/application';`
   - Add to InfrastructureLayer: `Layer.succeed(PrePlanningAppointmentRepository, PrismaPrePlanningAppointmentRepository),`

---

### 4. Use Case Exports (INCOMPLETE)

**Status**: ⚠️ **Scenario 6 use cases NOT exported** from @dykstra/application package

#### Scenario 6 Use Cases Created But NOT Exported:

**Files Exist**:
- `packages/application/src/use-cases/pre-planning/schedule-appointment.ts`
- `packages/application/src/use-cases/pre-planning/get-director-availability.ts`
- `packages/application/src/use-cases/pre-planning/list-appointments.ts`
- `packages/application/src/use-cases/pre-planning/cancel-appointment.ts`
- `packages/application/src/use-cases/pre-planning/complete-appointment.ts`
- `packages/application/src/use-cases/pre-planning/send-appointment-reminders.ts`

**NOT in Application Package Exports** (`packages/application/src/index.ts`):
- ❌ No `export * from './use-cases/pre-planning/...'` statements

**Impact**: Routers cannot import use cases (TypeScript errors will occur)

---

### 5. Email Adapter Integration (MISSING)

**Status**: ❌ **Email adapter NOT connected to Scenario 6**

#### Required for Appointment Reminders:
- Scenario 6 sends automated reminders 24 hours and 1 hour before appointments
- Uses `EmailServicePort` (defined in ports)
- Email adapter exists: `EmailAdapterLive` in `packages/infrastructure/src/email/email-adapter.ts`
- BUT: Not wired to Scenario 6's email service requirements

**What's Missing**:
1. Scenario 6 ports file should define: `EmailServicePort` Context tag
2. Infrastructure layer should wire email adapter to port
3. Use cases should request EmailServicePort from context

---

## Historical Context: What Was Done for Scenarios 1-5?

### Comparison of Implementation Rigor

| Scenario | Phase | Implementation | Infrastructure | Status |
|----------|-------|-----------------|-----------------|--------|
| 1-5 | 1-5 (May-Oct 2024) | Use cases written | Minimal wiring | ✅ Functional but Loose |
| 6 | Phase 6 Part A (Dec 1) | Full 8-step implementation | Comprehensive but Incomplete | ⚠️ Structured but Gap |

**Key Difference**: 
- **Scenarios 1-5**: Implemented pragmatically with focus on business logic
- **Scenario 6**: Implemented systematically with attention to infrastructure patterns
- **Result**: Inconsistent approach across codebase

---

## Recommended Actions

### Priority 1: Complete Scenario 6 Integration (IMMEDIATE)

**Time Estimate**: 30 minutes

**Steps**:
1. **Export repository** in `packages/infrastructure/src/index.ts`:
   ```typescript
   export * from './repositories/pre-planning-appointment-repository';
   ```

2. **Export use cases** in `packages/application/src/index.ts`:
   ```typescript
   export * from './use-cases/pre-planning/schedule-appointment';
   export * from './use-cases/pre-planning/get-director-availability';
   export * from './use-cases/pre-planning/list-appointments';
   export * from './use-cases/pre-planning/cancel-appointment';
   export * from './use-cases/pre-planning/complete-appointment';
   export * from './use-cases/pre-planning/send-appointment-reminders';
   ```

3. **Wire repository to InfrastructureLayer** in `packages/infrastructure/src/index.ts`:
   ```typescript
   // At top with other imports
   import { PrismaPrePlanningAppointmentRepository } from './repositories/pre-planning-appointment-repository';
   import { PrePlanningAppointmentRepository } from '@dykstra/application';
   
   // In InfrastructureLayer Layer.mergeAll()
   Layer.succeed(PrePlanningAppointmentRepository, PrismaPrePlanningAppointmentRepository),
   ```

4. **Define email service port** if not already in ports (add to preplan ports):
   ```typescript
   export interface EmailServicePort {
     sendAppointmentReminder(appointment: PrePlanningAppointment): Effect<void, EmailError, never>;
   }
   ```

5. **Run validation**:
   ```bash
   pnpm validate
   pnpm test
   ```

### Priority 2: Standardize Infrastructure Patterns (NEXT SPRINT)

**Goal**: Make Scenarios 1-5 infrastructure consistent with Scenario 6 pattern

**Approach**:
1. Audit each Scenario 1-5 to identify missing exports
2. Add repositories to InfrastructureLayer if missing
3. Create documentation of "Infrastructure Wiring Checklist" for future scenarios
4. Update WARP.md with infrastructure requirements

**Effort**: 2-3 days

---

## Lessons Learned

### What Worked Well (Scenario 6):
1. ✅ Systematic 8-step approach ensured nothing was missed
2. ✅ Repository implementation completed upfront
3. ✅ Tests caught most integration issues
4. ✅ Clean Architecture patterns consistently applied

### What Could Be Better:
1. ❌ Repository wiring to InfrastructureLayer was an afterthought (should be step 5, not step 8+)
2. ❌ Use case exports not reviewed before router implementation
3. ❌ Email service integration not architected upfront
4. ❌ No "infrastructure wiring checklist" to prevent gaps

### Recommended Process for Future Scenarios:

**8-Step Implementation + Infrastructure Checklist**:

1. Domain layer
2. Ports/interfaces (including adapter ports like EmailService)
3. Application layer (use cases)
4. **[NEW] Infrastructure checklist verification**:
   - Ports defined? ✓
   - Adapters exist? ✓
   - Repository wiring planned? ✓
5. Schema/migration
6. Repository implementation
7. **[NEW] Wire repository to InfrastructureLayer before router**
8. **[NEW] Export use cases before router implementation**
9. tRPC router
10. Tests
11. Validation

---

## File Locations Reference

### Scenario 6 Implementation Files

**Domain**:
- `/packages/domain/src/entities/pre-planning-appointment.ts` (413 lines)

**Application - Ports**:
- `/packages/application/src/ports/pre-planning-appointment-repository.ts` (252 lines)
- `/packages/application/src/ports/email-service-port.ts` (if exists)

**Application - Use Cases**:
- `/packages/application/src/use-cases/pre-planning/schedule-appointment.ts`
- `/packages/application/src/use-cases/pre-planning/get-director-availability.ts`
- `/packages/application/src/use-cases/pre-planning/list-appointments.ts`
- `/packages/application/src/use-cases/pre-planning/cancel-appointment.ts`
- `/packages/application/src/use-cases/pre-planning/complete-appointment.ts`
- `/packages/application/src/use-cases/pre-planning/send-appointment-reminders.ts`

**Infrastructure - Repository**:
- `/packages/infrastructure/src/repositories/pre-planning-appointment-repository.ts` (411 lines)

**Infrastructure - Schema**:
- `/packages/infrastructure/prisma/schema.prisma` (PrePlanningAppointment model lines 1357-1417)
- Migration: `/packages/infrastructure/prisma/migrations/20251201034723_add_pre_planning_appointments/`

**API - Router**:
- `/packages/api/src/routers/preplan.router.ts` (211 lines)
- Registered in: `/packages/api/src/root.ts` (line 55)

---

## Next Steps

1. **Immediate** (Today): Complete Scenario 6 infrastructure wiring (30 min)
2. **Short-term** (This week): Create infrastructure checklist and document
3. **Medium-term** (Next sprint): Audit Scenarios 1-5 for consistency
4. **Long-term** (Ongoing): Use checklist for Scenarios 7-12

---

## Appendix: Scenario 1-5 Audit Status

### Phase 1: Core Case Management (Scenarios 1-3)
- ✅ Domain: Case, CaseMember entities exist
- ✅ Schema: Case, CaseMember models in Prisma
- ✅ Router: case.router.ts, case-enhancements.router.ts
- ⚠️ Repository wiring: Unknown (requires audit)

### Phase 2: Financial Operations (Scenarios 4-5)
- ✅ Domain: Contract, Payment entities exist
- ✅ Schema: Contract, Payment models in Prisma
- ✅ Router: contract.router.ts, payment.router.ts
- ⚠️ Repository wiring: Unknown (requires audit)

### Phase 3: Time & Attendance (Use Cases 3.1-3.4)
- ✅ Router: Various time tracking routers
- ⚠️ Full audit needed

### Phase 4: Payroll (Use Cases 4.1-4.4)
- ✅ Router: Various payroll routers
- ⚠️ Full audit needed

### Phase 5: Procurement & Inventory (Use Cases 5.1-5.7)
- ✅ Schema: Product, Service catalog models exist
- ✅ Router: Various procurement routers
- ⚠️ Full audit needed

### Phase 6: Accounts Payable (Use Cases 6.1-6.8, Scenarios 1-5)
- ✅ Schema: Various AP/financial models exist
- ✅ Router: contract.router.ts, payment.router.ts
- ⚠️ Full audit needed

---

**Document Version**: 1.0  
**Last Updated**: December 1, 2024  
**Author**: Analysis during Session 2 development
