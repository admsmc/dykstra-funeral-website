# Refactoring Campaign Log: Hardcoded → Configurable Policies

**Campaign Status**: 🚀 STARTED
**Started**: 2025-12-01 15:31:23 UTC
**Target Completion**: 2025-12-22 (6-7 weeks)

---

## Campaign Summary

Systematic refactoring of 96 hardcoded use cases (88% of codebase) to use configurable per-funeral-home policies. Following the 6-phase process documented in ARCHITECTURE.md (lines 1185-1807).

### Progress Overview

| Phase | Domain | Use Cases | Status | Est. Completion |
|-------|--------|-----------|--------|-----------------|
| 1 | CRM (Leads, Notes, Invitations) | 9 | 🟡 IN PROGRESS | 2025-12-08 |
| 2 | Type A Operations | 15 | ⏳ QUEUED | 2025-12-13 |
| 3 | Type B Operations | 47 | ⏳ QUEUED | 2025-12-19 |
| 4 | Type C Go-Owned | 15 | ⏳ QUEUED | 2025-12-22 |
| **TOTAL** | | **108** | | |

---

## Phase 1: High-Impact CRM (Weeks 1-2) - 9 Use Cases

### Week 1: Foundation (Leads & Notes)

#### 1.1: Create-Lead Use Case

**Status**: 🟡 Phase 1.2 COMPLETE - Schema in progress

**6-Phase Progress**:
- [x] Phase 1: Policy Entity Design - COMPLETE
- [x] Phase 2: Database Schema & Migration - SCHEMA ADDED
- [ ] Phase 3: Repository & Adapter
- [ ] Phase 4: Use Case Refactoring
- [ ] Phase 5: Policy Variation Tests
- [ ] Phase 6: Validation

**Files Involved**:
- Domain: `packages/domain/src/entities/lead-scoring-policy.ts` (✅ CREATED)
- Prisma: `packages/infrastructure/prisma/schema.prisma` (✅ MODEL ADDED)
- Port: `packages/application/src/ports/lead-scoring-policy-repository.ts` (NEXT)
- Adapter: `packages/infrastructure/src/database/prisma-lead-scoring-policy-repository.ts` (NEXT)
- Use Case: `packages/application/src/use-cases/leads/create-lead.ts` (REFACTOR)
- Tests: `packages/application/src/use-cases/leads/__tests__/create-lead.test.ts` (ADD)

**Hardcoded Rules Identified**:
- Lead scoring: at-need=80, pre-need=30 (from Lead.create())
- Inactive threshold: 14 days without contact
- Auto-archive: disabled by default, enabled after 90 days
- Contact method bonus: +10 for email+phone
- Referral bonus: +15 points

**Policy Entity**: `LeadScoringPolicy` ✅
- atNeedInitialScore: 80 (default)
- preNeedInitialScore: 30 (default)
- generalInquiryScore: 40 (default)
- hotLeadThreshold: 70
- warmLeadThreshold: 50
- inactiveThresholdDays: 14
- enableAutoArchive: false
- contactMethodBonus: 10
- referralSourceBonus: 15
- Plus 3 pre-configured templates: DEFAULT, AGGRESSIVE, CONSERVATIVE

**Prisma Model**: ✅ Added to schema.prisma
- SCD2 fields: version, validFrom, validTo, isCurrent, businessKey
- 20 configurable fields with sensible defaults
- 5 strategic indexes for performance
- Ready for migration

---

## Remaining Work for Phase 1

### 1.3: LeadScoringPolicyRepository Port & Adapter (IN PROGRESS)

Port interface needed:
- findCurrentByFuneralHome(funeralHomeId)
- getHistory(funeralHomeId)
- save(policy)
- delete(businessKey)

Adapter pattern (object-based):
- PrismaSCD2Adapter with transaction-based save
- Close current version, insert new version
- Proper error handling

### 1.4: Refactor create-lead Use Case

Replace hardcoded scoring with policy loading:
- Load policy: `const policy = yield* policyRepo.findCurrentByFuneralHome(funeralHomeId)`
- Use policy values for initial score
- Apply validation from policy

### 1.5: Policy Variation Tests

Test 3+ configurations:
1. Restrictive: Higher thresholds, smaller bonuses
2. Standard: Current defaults
3. Aggressive: Lower thresholds, larger bonuses

Verify behavior changes with different policies.

---

## Timeline

| Week | Phase | Target | Status |
|------|-------|--------|--------|
| 1-2 | Phase 1 (9 CRM) | 2025-12-08 | 🟡 Phase 1.2 complete |
| 2-3 | Phase 2 (15 Type A) | 2025-12-13 | ⏳ QUEUED |
| 3-5 | Phase 3 (47 Type B) | 2025-12-19 | ⏳ QUEUED |
| 5-6 | Phase 4 (15 Type C) | 2025-12-22 | ⏳ QUEUED |

---

## Resources

- **6-Phase Process**: ARCHITECTURE.md lines 1185-1807
- **Configuration Rules**: ARCHITECTURE.md lines 1003-1125
- **Use Case Tagging**: docs/USE_CASE_TAGGING_SETUP.md

---

*Last Updated: 2025-12-01 16:00:00 UTC*
*Phase 1.1 (create-lead): ✅ COMPLETE - All 6 phases done, 25 tests passing, committed*
*Phase 1.2 (convert-lead-to-case): 🟡 IN PROGRESS - Starting now*
