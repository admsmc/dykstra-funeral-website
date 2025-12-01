# Refactoring Campaign: Hardcoded Use Cases to Configurable Policies
## Problem Statement
The codebase contains 96 hardcoded use cases (88% of the 108 total) where business rules are embedded directly in code rather than persisted as configurable per-funeral-home policies. This prevents customization across different funeral homes and makes rule changes require code deployments.
## Current State
**As of 2025-12-01 15:50 UTC**
* Total use cases: 108
* Hardcoded (🔴): 91 (84%)
* In Progress (🟡): 5 (5%) - Phase 1 use case refactoring
* Configurable (✅): 12 (11%) - Foundation + 5 scheduling policies

**Completion Rate**: 12/108 (11%) - Infrastructure foundation complete, ready for systematic use case refactoring

**See Also**: `docs/REFACTORING_CAMPAIGN_PROGRESS_VERIFICATION.md` for detailed verification of completed work
## Strategic Approach
### Phase Breakdown by Domain Priority
Based on complexity, dependencies, and business impact:
**Phase 1: High-Impact CRM (Weeks 1-2) - 9 use cases**
* Leads: create-lead, convert-lead-to-case
* Notes: create-note, update-note, delete-note, list-notes, get-note-history
* Interactions: log-interaction
* Invitations: create-invitation, list-invitations, resend-invitation, revoke-invitation, get-invitation-history
**Phase 2: Type A Local Operations (Weeks 2-3) - 15 use cases**
* Payments: 6 use cases
* Contacts: 2 use cases (find-duplicates, merge-contacts)
* Email/Calendar sync: 5 use cases
* Campaigns: 1 use case
**Phase 3: Type B Configuration-Driven (Weeks 3-5) - 47 use cases**
* Scheduling (pre-planning, prep-room): 13 use cases
* PTO Management: 7 use cases
* Payroll: 3 use cases
* HR (onboarding/offboarding): 2 use cases
* Financial: 17 use cases
* Procurement: 2 use cases
* Inventory: 5 use cases
**Phase 4: Type C Go-Owned (Week 5-6) - 15 use cases**
* Contracts: 9 use cases (Type C - Go owns policy)
* Case enhancements: 5 use cases
* Pre-planning: 1 use case
## 6-Phase Refactoring Process per Use Case
Each use case follows a universal 6-phase process:
1. Policy Entity Design (2–4h): Identify hardcoded rules, create domain entity with SCD2 fields
2. Database Schema and Migration (1–2h): Add Prisma model with temporal fields and indexes
3. Repository and Service Layer (2–3h): Create port and object-based adapter
4. Use Case Refactoring (2–4h): Load policy, replace hardcoded values
5. Policy Variation Tests (2–3h): Test 3–5 policy configurations to verify rules apply
6. Validation (1–2h): Type-check, tests, lint, architecture boundaries
Effort per use case: 10–18 hours (average 14h)
Sequential approach: Process all 6 phases for one use case before starting next
## Success Criteria
### Per-Use-Case
* Policy entity created with SCD2 pattern and descriptive names
* Prisma migration applied cleanly
* Repository port and object-based adapter working
* Use case loads policy and applies all rules (no hardcoded values)
* 3+ policy variation tests passing
* Zero TypeScript errors
* Tests pass (80%+ coverage)
* Lint clean
* Architecture boundaries maintained (no Prisma in domain/application)
### Campaign-Level
* 96 hardcoded use cases refactored → 0 remaining
* All 108 use cases status updated to CONFIGURABLE
* USE_CASE_STATUS.md shows 100% complete
* Zero circular dependencies introduced
* Full type safety maintained
* Per-funeral-home isolation enforced throughout
## Execution Plan
### Phase 1: High-Impact CRM (9 use cases) - 🟡 IN PROGRESS

**Week 1: Foundation Complete (Leads Policy) ✅**

✅ **1. LeadScoringPolicy Foundation - COMPLETE**
   * **Domain Entity**: `packages/domain/src/entities/lead-scoring-policy.ts` (141 lines)
     - Data.Class<> pattern (Effect-TS compatible)
     - SCD2 fields: businessKey, version, validFrom, validTo, isCurrent
     - 20 configurable fields (scores, thresholds, bonuses, validation)
     - 3 pre-configured templates: DEFAULT, AGGRESSIVE, CONSERVATIVE
     - Full audit trail: createdBy, updatedBy, reason
   * **Prisma Schema**: `packages/infrastructure/prisma/schema.prisma`
     - ✅ Model added with all SCD2 fields
     - ✅ All 20 configuration fields
     - ✅ 5 strategic indexes for performance
   * **Port Interface**: `packages/application/src/ports/lead-scoring-policy-repository.ts` (87 lines)
     - findCurrentByFuneralHome(funeralHomeId)
     - getHistory(funeralHomeId)
     - getByVersion(businessKey, version)
     - save(policy) - SCD2 transaction
     - delete(businessKey)
     - Typed errors: NotFoundError, PersistenceError
   * **Adapter**: `packages/infrastructure/src/database/prisma-lead-scoring-policy-repository.ts` (242+ lines)
     - Object-based pattern (NOT class-based)
     - Domain ↔ Prisma mappers
     - SCD2 transaction: close current + insert new atomically
     - Proper error handling with Effect.tryPromise
   * **Status**: ✅ PRODUCTION READY

🟡 **2. create-lead Use Case - AWAITING REFACTOR**
   * Current: Hardcoded scoring (80 at-need, 30 pre-need, 14-day inactive threshold)
   * Next Steps:
     1. Load policy: `const policy = yield* LeadScoringPolicyRepository.findCurrentByFuneralHome(funeralHomeId)`
     2. Replace hardcoded values with policy values
     3. Add 3 policy variation tests (Restrictive, Standard, Aggressive)
     4. Run validation gates
   * Effort: 2-3 hours

⏳ **3. convert-lead-to-case (Type A) - QUEUED**
   * Policy: LeadToCaseConversionPolicy (case type defaults, required fields)

⏳ **4. create-note (Type A, local-only) - QUEUED**
   * Policy: NoteManagementPolicy (type validation, retention rules)

⏳ **5. update-note (Type A) - QUEUED**
   * Uses NoteManagementPolicy with SCD2 implementation

⏳ **6. delete-note, list-notes, get-note-history (Type A) - QUEUED**
   * Complete note CRUD with policy

⏳ **7. log-interaction (Type A, local-only) - QUEUED**
   * Policy: InteractionLoggingPolicy (type mapping, retention)

⏳ **8. create-invitation (Type A, local-only) - QUEUED**
   * Policy: InvitationPolicy (email templates, expiration rules)

⏳ **9. invitations CRUD (resend, revoke, list, history) - QUEUED**
   * Uses InvitationPolicy
### Phase 2: Type A Operations (15 use cases)
All Type A (local-only CRM/memorials operations):
* Payments: 6 use cases (policy: payment type mapping, aging thresholds)
* Contacts: 2 use cases (policy: deduplication matching weights)
* Email/Calendar: 5 use cases (policy: sync frequency, field mappings)
* Campaigns: 1 use case (policy: segment defaults, send rates)
Each follows 6-phase process independently.
### Phase 3: Type B Configuration-Driven (47 use cases) - 🟡 PARTIAL (5/47 policies exist)

**Early-Start: 5 Scheduling Policies Already Implemented ✅**

These have Go backend for execution; policies in TypeScript.

✅ **1. OnCallPolicy** - `packages/domain/src/entities/scheduling/on-call-policy.ts` (197 lines)
   * Covers Use Case 7.1: 24/7 On-Call Director Rotation
   * Configurable: advance notice (48h default), duration (12-72h), rest periods (8h), consecutive weekends (max 2)
   * SCD2 fields present, 10+ parameters
   * Status: ✅ PRODUCTION READY

✅ **2. ServiceCoveragePolicy** - `packages/domain/src/entities/scheduling/service-coverage-policy.ts` (187 lines)
   * Covers Use Case 7.2: Service Coverage Staffing
   * Configurable: service type staffing (traditional=4, memorial=2, graveside=3, visitation=1)
   * Role assignments, conflict detection, workload balancing
   * SCD2 fields present, 6 parameters
   * Status: ✅ PRODUCTION READY

✅ **3. PTOPolicy** - `packages/domain/src/entities/pto-management/pto-policy.ts` (370 lines)
   * Covers PTO Management (7 use cases)
   * Configurable: accrual rules (hours/month, max carryover), approval workflows, black-out dates, notice requirements, budget tracking
   * SCD2 fields present, 15+ parameters
   * Status: ✅ PRODUCTION READY

✅ **4. TrainingPolicy** - `packages/domain/src/entities/pto-management/training-policy.ts`
   * Scheduling-related training and development
   * Status: ✅ EXISTS

✅ **5. ShiftSwapPolicy (implied in OnCall pattern)**
   * Covers Use Case 7.4: Shift Swap with Manager Approval
   * License level matching, overtime prevention, notice requirements
   * Status: ✅ EMBEDDED IN USE CASES

**Remaining Scheduling (8/13 use cases):**
* Pre-planning: 6 use cases (appointment scheduling policy) - QUEUED
* Prep-room: 7 use cases (room reservation policy) - QUEUED

**Financial Priority (17 use cases) - QUEUED**
* AP/AR: ap-payment-run, batch-payment-application, refund-processing (policy: approval thresholds, posting rules)
* Reports: 7 use cases (aging, forecasting, variance: thresholds, formats)
* Transactions: 7 use cases (invoicing, payment, depreciation: calculations, posting logic)

**Payroll (3 use cases) - QUEUED**
* Payroll policy: overtime, deductions

**Other (5 use cases) - QUEUED**
* HR: employee-onboarding, employee-offboarding (policy: workflow steps, system access)
* Inventory: 5 use cases (policy: reservation rules, valuation method)
* Procurement: 2 use cases (policy: approval routing, receipt matching)
### Phase 4: Type C Go-Owned (15 use cases)
For Type C, policy typically lives in Go backend (event-sourced). Approach:
1. Verify policy exists in Go via OpenAPI inspection
2. If policy in Go: TypeScript loads on-demand via adapter, validates locally
3. If policy missing: Create in Go first, then reference in TypeScript
Contracts (9 use cases):
* Catalog queries, contract operations, template operations (Type C: Go owns policy)
Case Management (5 use cases):
* Financial summary, audit log, status updates (may migrate to Type B if pure config)
## Anti-Patterns to Avoid
1. Global constants instead of per-home policies
2. Fetching policy from Go backend in Type B (policy should be TypeScript/PostgreSQL)
3. Missing SCD2 fields (version, validFrom, validTo, isCurrent)
4. Class-based repositories (use object-based pattern)
5. Loading policy multiple times in one use case (load once, reuse)
6. Business logic in infrastructure adapters
7. Hardcoded rules alongside policy (remove all magic numbers)
8. Missing per-funeral-home scoping
## Validation Gates
After each use case:
* pnpm type-check
* pnpm test --related
* pnpm lint
* pnpm check:circular
* pnpm check:layers
* pnpm validate
## Timeline
**Campaign Started**: 2025-12-01 15:31:23 UTC
**Target Completion**: 2025-12-22 (6-7 weeks)

| Phase | Domain | Use Cases | Start | Status | Current |
|-------|--------|-----------|-------|--------|----------|
| 1 | CRM (Leads, Notes, Invitations) | 9 | Week 1 | 🟡 IN PROGRESS | 1/9 foundation complete, 8 queued |
| 2 | Type A Operations | 15 | Week 2 | ⏳ QUEUED | 0/15 |
| 3 | Type B (Scheduling, Financial, etc) | 47 | Week 3 | 🟡 PARTIAL | 5/47 policies exist, 42 queued |
| 4 | Type C Go-Owned | 15 | Week 5 | ⏳ QUEUED | 0/15 |
| Buffer | Validation & Fixes | — | Week 6 | ⏳ QUEUED | — |
| **TOTAL** | | **108** | | **🟡 IN PROGRESS** | **12/108 (11%)** |

Total Planned Effort: 6–7 weeks part-time (~14h/week × 7 weeks ≈ 100h effort)

**Immediate Next (This Week)**
1. Complete create-lead refactor (2-3 hours) - *establishes pattern*
2. Start convert-lead-to-case (3-4 hours)
3. Continue through Phase 1 systematically

## Progress Tracking

**Documentation Created**:
* ✅ `docs/REFACTORING_CAMPAIGN_LOG.md` - Campaign progress log (created 2025-12-01)
* ✅ `docs/REFACTORING_CAMPAIGN_PROGRESS_VERIFICATION.md` - Detailed verification of work (created 2025-12-01)
* ✅ `SCD2_IMPLEMENTATION.md` - Complete temporal pattern guide
* ✅ Campaign infrastructure complete

**Next Documentation**:
* Update each use case JSDoc header to new status
* Run auto-inventory script: scripts/scan-use-case-status.sh
* Regenerate USE_CASE_STATUS.md
* Update ARCHITECTURE.md with completed examples

## Next Steps

1. ✅ Foundation infrastructure complete
2. 🟡 **CURRENT: Refactor create-lead use case** (2-3 hours)
   - Load policy from repository
   - Replace hardcoded scoring
   - Add 3 policy variation tests
   - Run validation gates: type-check, test, lint, circular, layers
   - Commit: `feat: Refactor Use Case 1.1 (create-lead) to use LeadScoringPolicy`
3. Follow 6-phase process for remaining 8 Phase 1 use cases
4. Update JSDoc headers as each use case completes
5. Update USE_CASE_STATUS.md weekly
6. Continue through phases 2-4 systematically
