# Financial Operations & Family CRM - Completion Plan

**Date**: December 5, 2025  
**Current Status**: Week 1-2 (75%), Week 3-4 (85%)  
**Goal**: Complete both domains to 100%

---

## Executive Summary

**Total Remaining Work**: 27-37 hours (3.5-5 days)

**Breakdown**:
- Financial Operations: 17-23 hours (2-3 days)
- Family CRM: 10-14 hours (1-2 days)

**Priority Approach**: Quick wins first, then comprehensive features

---

## Financial Operations Completion (17-23 hours)

### Current Status: 75% Complete

**What's Done** ✅:
- Financial router with 17+ endpoints (80%)
- Period close wizard (100%)
- GL trial balance page with fallback (100%)
- Bank reconciliation workspace component exists
- Journal entry modal exists

**What's Remaining** ⚠️:

---

### Task 1: Wire GL Placeholder Endpoints (2-3 hours) 🔴 HIGH PRIORITY

**Files**:
- `packages/api/src/routers/financial.router.ts` (Lines 237-345)

**Current State**: 
- GL endpoints return placeholder data with `// Note: Will be implemented` comments
- Router structure and validation are complete

**Required Changes**:
```typescript
// CURRENT (Line 237-254):
getTrialBalance: staffProcedure
  .input(...)
  .query(async ({ input }) => {
    // Note: This will be implemented when we wire the GL pages
    // For now, returning structure that matches the plan
    return {
      period: input.period,
      accounts: [],  // ❌ Empty placeholder
      totalDebits: 0,
      totalCredits: 0,
      balanced: true,
    };
  }),

// NEEDED:
getTrialBalance: staffProcedure
  .input(...)
  .query(async ({ input }) => {
    return await runEffect(
      getGLTrialBalance({  // Use case from @dykstra/application
        period: input.period,
        funeralHomeId: input.funeralHomeId,
      })
    );
  }),
```

**Endpoints to Wire**:
1. `gl.getTrialBalance` (Line 237) - Wire to `getGLTrialBalance` use case
2. `gl.getAccountHistory` (Line 261) - Wire to `getAccountHistory` use case
3. `gl.getFinancialStatement` (Line 285) - Wire to `getFinancialStatement` use case

**Note**: `gl.postJournalEntry` (Line 308) already has validation logic, just needs use case wiring

**Validation**:
```bash
# Test endpoints
curl -X POST http://localhost:3000/api/trpc/financial.gl.getTrialBalance
# Should return actual account data, not empty arrays
```

**Estimated Time**: 2-3 hours

---

### Task 2: Enhance Bank Reconciliation UI (6-8 hours) 🟡 MEDIUM PRIORITY

**Files**:
- `src/app/staff/finops/page.tsx` (Bank Rec tab)
- `src/components/financial/BankReconciliationWorkspace.tsx`

**Current State**:
- Bank rec tab exists with mock data (Lines 332-340)
- BankReconciliationWorkspace component exists
- No import, no drag-and-drop matching

**Required Features**:

1. **Import Bank Statement** (2-3 hours)
   - Upload CSV/OFX/QBO file
   - Parse bank statement format
   - Validate transactions
   - Display imported transactions

2. **Drag-and-Drop Matching** (2-3 hours)
   - Make bank transactions draggable
   - Make GL entries drop targets
   - Visual feedback during drag
   - Match transactions on drop
   - Undo matching

3. **Matched Transactions View** (1-2 hours)
   - List of matched pairs
   - Unmatch button
   - Confidence scores from AI suggestions
   - Export matched report

**Implementation Pattern**:
```typescript
// Add to BankReconciliationWorkspace.tsx
import { useDroppable, useDraggable } from '@dnd-kit/core';

function BankTransaction({ transaction }: Props) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: transaction.id,
  });
  
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      {/* Transaction card */}
    </div>
  );
}

function GLEntry({ entry }: Props) {
  const { setNodeRef } = useDroppable({
    id: entry.id,
  });
  
  return (
    <div ref={setNodeRef}>
      {/* GL entry card */}
    </div>
  );
}
```

**Dependencies**:
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable
```

**Estimated Time**: 6-8 hours

---

### Task 3: Implement Financial Reports Page (6-8 hours) 🟡 MEDIUM PRIORITY

**File**: `src/app/staff/finops/reports/page.tsx` ✅ EXISTS (placeholder)

**Current State**: Page exists but needs report implementations

**Required Reports** (per plan):

1. **Profit & Loss Statement** (1 hour)
   - Revenue vs Expenses
   - Monthly/Quarterly/Annual views
   - Date range selector
   - Export to PDF/Excel

2. **Balance Sheet** (1 hour)
   - Assets = Liabilities + Equity
   - Point-in-time view
   - Comparative periods

3. **Cash Flow Statement** (1 hour)
   - Operating, Investing, Financing activities
   - Direct or Indirect method selector

4. **AR Aging Report** (0.5 hour)
   - 0-30, 31-60, 61-90, 90+ day buckets
   - Customer breakdown
   - Priority scores

5. **AP Aging Report** (0.5 hour)
   - Vendor breakdown
   - Payment due dates
   - Discount opportunities

6. **Budget vs Actual Variance** (1 hour)
   - Compare actual to budget
   - Variance percentages
   - Drill-down by account

7. **Revenue by Service Type** (0.5 hour)
   - Traditional burial, cremation, memorial, etc.
   - Pie chart + table

8. **Expense by Category** (0.5 hour)
   - Operating, COGS, payroll, etc.
   - Bar chart + table

**Implementation Pattern**:
```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';

type ReportType = 'income_statement' | 'balance_sheet' | 'cash_flow' | 'ar_aging' | 'ap_aging' | 'budget_variance' | 'revenue_by_service' | 'expense_by_category';

export default function FinancialReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('income_statement');
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
  
  // Query for selected report
  const { data: reportData, isLoading } = trpc.financial.gl.getFinancialStatement.useQuery({
    type: selectedReport === 'income_statement' ? 'income_statement' : 
          selectedReport === 'balance_sheet' ? 'balance_sheet' : 'cash_flow',
    startDate: dateRange.start,
    endDate: dateRange.end,
    funeralHomeId: 'default',
  }, {
    enabled: ['income_statement', 'balance_sheet', 'cash_flow'].includes(selectedReport),
  });
  
  // AR aging report query
  const { data: arAging } = trpc.financial.ar.getAgingReport.useQuery({
    asOfDate: new Date(),
    funeralHomeId: 'default',
  }, {
    enabled: selectedReport === 'ar_aging',
  });
  
  return (
    <div className="space-y-6">
      <ReportSelector value={selectedReport} onChange={setSelectedReport} />
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <ReportViewer report={reportData} type={selectedReport} />
      <ExportButtons onExportPDF={() => {}} onExportExcel={() => {}} />
    </div>
  );
}
```

**Estimated Time**: 6-8 hours

---

### Task 4: Wire Remaining FinOps Pages (3-4 hours) 🟢 LOW PRIORITY

**Files to Update**:
1. `src/app/staff/finops/page.tsx` - Remove ALL mock data fallbacks
2. `src/app/staff/finops/ap/page.tsx` - Replace mock AP data
3. `src/app/staff/analytics/page.tsx` - Replace mock analytics
4. `src/app/staff/payments/page.tsx` - Already mostly wired (verify)

**Current Pattern** (finops/page.tsx):
```typescript
// CURRENT: Fallback to mock
const accounts = useMemo(() => {
  if (trialBalanceData?.accounts) {
    return trialBalanceData.accounts as GLAccount[];
  }
  return MOCK_ACCOUNTS;  // ❌ Remove this
}, [trialBalanceData]);

// NEEDED: Error handling instead
const accounts = useMemo(() => {
  if (!trialBalanceData?.accounts) {
    return [];  // Show empty state with retry
  }
  return trialBalanceData.accounts as GLAccount[];
}, [trialBalanceData]);
```

**Changes Per Page**:
- Remove all `MOCK_*` constants
- Add proper loading skeletons
- Add error states with retry button
- Add optimistic updates for mutations
- Add success/error toast notifications

**Estimated Time**: 3-4 hours (1 hour per page)

---

### Financial Operations Summary

| Task | Priority | Hours | Files |
|------|----------|-------|-------|
| Wire GL endpoints | 🔴 HIGH | 2-3 | financial.router.ts |
| Bank rec UI | 🟡 MEDIUM | 6-8 | page.tsx, BankReconciliationWorkspace.tsx |
| Reports page | 🟡 MEDIUM | 6-8 | reports/page.tsx |
| Wire pages | 🟢 LOW | 3-4 | finops/page.tsx, ap/page.tsx, analytics/page.tsx |

**Total**: 17-23 hours

**Recommended Order**:
1. Wire GL endpoints (2-3h) - Enables all other pages
2. Wire remaining pages (3-4h) - Quick wins
3. Reports page (6-8h) - High business value
4. Bank rec UI (6-8h) - Nice-to-have enhancement

---

## Family CRM Completion (10-14 hours)

### Current Status: 85% Complete

**What's Done** ✅:
- Family hierarchy router (100%)
- Contact management router (100%)
- Family tree visualization component (100%)
- Family manager page `/staff/families/[id]/page.tsx` exists
- Contact list page `/staff/families/page.tsx` exists

**What's Remaining** ⚠️:

---

### Task 5: Enhanced Member Details Panel (2-3 hours) 🟡 MEDIUM PRIORITY

**File**: `src/app/staff/families/[id]/page.tsx`

**Current State**: Page exists but needs enhanced member panel

**Required Features**:

1. **Interactive Member Details** (1-2 hours)
   - Click member in tree → show details panel
   - Edit member inline
   - Add tags
   - Add notes
   - Update contact info

2. **Relationships Management** (1 hour)
   - List all relationships for selected member
   - Add new relationship (dropdown selector)
   - Edit relationship type
   - Remove relationship with confirmation

**Implementation**:
```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import { FamilyTreeVisualization } from '@/components/family/FamilyTreeVisualization';

export default function FamilyDetailsPage({ params }: { params: { id: string } }) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // Fetch family tree
  const { data: familyTree } = trpc.familyHierarchy.getFamilyTree.useQuery({
    familyId: params.id,
  });
  
  // Fetch selected member details
  const { data: memberDetails } = trpc.contact.getById.useQuery({
    contactId: selectedMemberId!,
  }, {
    enabled: !!selectedMemberId,
  });
  
  // Update member mutation
  const updateMutation = trpc.contact.update.useMutation();
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Family Tree */}
      <FamilyTreeVisualization
        familyTree={familyTree}
        onMemberClick={(member) => setSelectedMemberId(member.id)}
      />
      
      {/* Right: Member Details */}
      {selectedMemberId && (
        <MemberDetailsPanel
          member={memberDetails}
          onUpdate={(data) => updateMutation.mutate(data)}
        />
      )}
    </div>
  );
}
```

**Estimated Time**: 2-3 hours

---

### Task 6: Case History Integration (2-3 hours) 🟡 MEDIUM PRIORITY

**File**: `src/app/staff/families/[id]/page.tsx`

**Required Features**:

1. **Case History List** (1-2 hours)
   - Show all cases where family members are involved
   - Decedent name
   - Case status
   - Service date
   - Link to case details

2. **Case Timeline** (1 hour)
   - Chronological view of family's cases
   - Visual timeline with dots
   - Hover for case details

**Implementation**:
```typescript
// Add to family details page
const { data: familyCases } = trpc.case.listByFamily.useQuery({
  familyId: params.id,
});

// Display component
<CaseHistoryList cases={familyCases} />
```

**New tRPC Endpoint Needed**:
```typescript
// Add to case.router.ts
listByFamily: staffProcedure
  .input(z.object({ familyId: z.string() }))
  .query(async ({ input }) => {
    // Query cases where any case member has family relationship to familyId
    return await runEffect(getCasesByFamily(input.familyId));
  }),
```

**Estimated Time**: 2-3 hours

---

### Task 7: Advanced Contact Search (4-5 hours) 🟢 LOW PRIORITY

**File**: `src/app/staff/families/page.tsx`

**Current State**: Basic list with search

**Required Features**:

1. **Bulk Actions** (2 hours)
   - Select multiple contacts (checkboxes)
   - Bulk tag (modal with tag selector)
   - Bulk delete (with confirmation)
   - Bulk export (CSV/Excel)
   - Toolbar when contacts selected

2. **Duplicate Detection** (1-2 hours)
   - Fuzzy match on name, email, phone
   - "Potential Duplicates" section
   - Confidence scores
   - Merge modal with field selection

3. **Import CSV** (1-2 hours)
   - Upload CSV file
   - Column mapping
   - Preview import
   - Validate and import
   - Error handling

**Implementation**:
```typescript
'use client';

import { useState } from 'react';

export default function FamiliesPage() {
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Bulk delete mutation
  const bulkDeleteMutation = trpc.contact.bulkDelete.useMutation();
  
  // Duplicate detection
  const { data: duplicates } = trpc.contact.findDuplicates.useQuery({});
  
  return (
    <div>
      {/* Bulk Actions Toolbar */}
      {selectedContactIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedContactIds.length}
          onTag={() => {}}
          onDelete={() => bulkDeleteMutation.mutate({ ids: selectedContactIds })}
          onExport={() => {}}
        />
      )}
      
      {/* Duplicate Detection Panel */}
      {duplicates && duplicates.length > 0 && (
        <DuplicateDetectionPanel duplicates={duplicates} />
      )}
      
      {/* Contact List */}
      <ContactList onSelectionChange={setSelectedContactIds} />
    </div>
  );
}
```

**New tRPC Endpoints Needed**:
```typescript
// contact.router.ts
bulkDelete: staffProcedure
  .input(z.object({ ids: z.array(z.string()) }))
  .mutation(async ({ input }) => {
    return await runEffect(bulkDeleteContacts(input.ids));
  }),

findDuplicates: staffProcedure
  .query(async () => {
    return await runEffect(findDuplicateContacts());
  }),
```

**Estimated Time**: 4-5 hours

---

### Task 8: Final Wiring & Testing (2-3 hours) 🟢 LOW PRIORITY

**Activities**:

1. **Complete tRPC Wiring** (1 hour)
   - Verify all mutations have optimistic updates
   - Add loading states everywhere
   - Add error handling with retry
   - Add success/error toasts

2. **CRUD Testing** (1 hour)
   - Create family → verify in list
   - Add member → verify in tree
   - Edit member → verify updates
   - Delete member → verify removal
   - Add relationship → verify in tree

3. **Performance Testing** (0.5 hour)
   - Large family tree (20+ members)
   - Complex relationships
   - Check React Query caching
   - Verify no unnecessary refetches

4. **Bug Fixes** (0.5 hour)
   - Fix any discovered issues
   - Polish edge cases

**Estimated Time**: 2-3 hours

---

### Family CRM Summary

| Task | Priority | Hours | Files |
|------|----------|-------|-------|
| Member details panel | 🟡 MEDIUM | 2-3 | families/[id]/page.tsx |
| Case history | 🟡 MEDIUM | 2-3 | families/[id]/page.tsx |
| Advanced search | 🟢 LOW | 4-5 | families/page.tsx |
| Final wiring | 🟢 LOW | 2-3 | Various |

**Total**: 10-14 hours

**Recommended Order**:
1. Member details panel (2-3h) - Core UX improvement
2. Case history (2-3h) - High business value
3. Final wiring & testing (2-3h) - Solidify existing features
4. Advanced search (4-5h) - Nice-to-have enhancements

---

## Overall Completion Strategy

### Phase 1: Quick Wins (8-10 hours, 1 day)
**Goal**: Get Financial Operations to 90%

1. Wire GL endpoints (2-3h) 🔴
2. Wire FinOps pages (3-4h) 🔴
3. Member details panel (2-3h) 🟡

**Result**: Financial operations fully functional, Family CRM more polished

---

### Phase 2: High-Value Features (8-11 hours, 1 day)
**Goal**: Complete core business features

4. Reports page (6-8h) 🟡
5. Case history integration (2-3h) 🟡

**Result**: Financial reporting complete, Family CRM shows case context

---

### Phase 3: Polish & Enhancements (11-16 hours, 1.5-2 days)
**Goal**: Production-ready with all features

6. Bank rec UI (6-8h) 🟡
7. Advanced contact search (4-5h) 🟢
8. Final testing (2-3h) 🟢

**Result**: 100% complete per plan

---

## Success Metrics

### Financial Operations (Week 1-2)
- [x] Financial router with 17+ endpoints ✅
- [x] Period close wizard (5 steps) ✅
- [ ] GL endpoints wired to use cases
- [ ] Bank reconciliation UI with drag-and-drop
- [ ] 8 financial reports implemented
- [ ] All pages using real API data (no mock)
- [ ] Loading/error states everywhere

### Family CRM (Week 3-4)
- [x] Family hierarchy router ✅
- [x] Contact management router ✅
- [x] Family tree visualization ✅
- [ ] Enhanced member details panel
- [ ] Case history integration
- [ ] Bulk actions on contacts
- [ ] Duplicate detection
- [ ] CSV import

---

## Next Steps

**Immediate (Today)**:
1. Start with Task 1: Wire GL endpoints (2-3h)
2. Continue with Task 4: Wire FinOps pages (3-4h)

**Tomorrow**:
3. Task 5: Member details panel (2-3h)
4. Task 3: Reports page (6-8h)

**Day 3**:
5. Task 6: Case history (2-3h)
6. Task 2: Bank rec UI (6-8h)

**Day 4**:
7. Task 7: Advanced search (4-5h)
8. Task 8: Final testing (2-3h)

---

## Decision Point

**Question**: Do we want 100% completion (27-37 hours) or acceptable completion (16-21 hours)?

**Option A: Complete Everything** (27-37 hours, 3.5-5 days)
- All 8 tasks completed
- 100% per original plan
- All nice-to-have features

**Option B: Core Features Only** (16-21 hours, 2-3 days)
- Tasks 1, 3, 4, 5, 6 (skip 2, 7, 8)
- 90% functional
- Missing: Bank rec drag-and-drop, bulk contact actions
- **Recommended for faster production deployment**

---

**Document Created**: December 5, 2025  
**Ready for Execution**: Yes  
**Next Action**: Choose Option A or B, then start Task 1
