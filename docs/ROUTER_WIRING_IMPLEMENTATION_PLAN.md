# Router Wiring Implementation Plan
## 9 High-Priority Gaps

**Date**: December 5, 2024  
**Est. Duration**: 1-2 weeks (80-160 hours)  
**Priority**: HIGH  
**Goal**: Wire existing UI pages to their backend routers for full functionality

---

## 1. Timesheet Router → `/staff/payroll/time`

**Current State**:
- ✅ Router exists with 7 endpoints
- ✅ UI page exists with beautiful weekly calendar
- ✅ One endpoint wired: `timesheet.list`
- ❌ 6 endpoints NOT wired

**Router Endpoints**:
1. ✅ `list` - WIRED (used in page)
2. ❌ `create` - NOT WIRED (Add Entry button does nothing)
3. ❌ `submit` - NOT WIRED (Submit Timesheet button does nothing)
4. ❌ `approve` - PARTIALLY WIRED (modal exists but needs work)
5. ❌ `reject` - NOT WIRED
6. ❌ `getWeekSummary` - NOT WIRED
7. ❌ `requestPTO` - NOT WIRED (Request PTO button does nothing)

**Implementation Tasks** (Est: 4-6 hours):

### Task 1.1: Wire Create Time Entry (1.5 hours)
**File**: `src/app/staff/payroll/time/page.tsx`

```typescript
// Add mutation hook
const createEntry = trpc.timesheet.create.useMutation({
  onSuccess: () => refetch(),
});

// Wire "Add Entry" button
<button 
  onClick={() => setShowCreateModal(true)}
  className="..."
>
  <Plus className="w-4 h-4" />
  Add Entry
</button>

// Create modal component
<CreateTimeEntryModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onSubmit={(data) => createEntry.mutate(data)}
  selectedDate={selectedDate}
/>
```

**New Component**: `src/app/staff/payroll/_components/CreateTimeEntryModal.tsx` (100-150 lines)
- Date picker (pre-filled if day clicked)
- Hours input with validation (0-24)
- Project code dropdown (optional)
- Case ID selector (optional)
- Notes textarea
- Validation and error handling

### Task 1.2: Wire Submit Timesheet (1 hour)
**File**: `src/app/staff/payroll/time/page.tsx`

```typescript
// Add mutation hook
const submitTimesheet = trpc.timesheet.submit.useMutation({
  onSuccess: () => {
    refetch();
    toast.success('Timesheet submitted for approval');
  },
});

// Wire "Submit Timesheet" button
<button 
  onClick={() => {
    const draftIds = entries
      .filter(e => e.status === 'draft')
      .map(e => e.id);
    
    if (draftIds.length === 0) {
      toast.error('No draft entries to submit');
      return;
    }
    
    submitTimesheet.mutate({ entryIds: draftIds });
  }}
  disabled={entries.filter(e => e.status === 'draft').length === 0}
  className="..."
>
  Submit Timesheet
</button>
```

### Task 1.3: Complete Approve/Reject Flow (1.5 hours)
**File**: `src/app/staff/payroll/_components/ApproveTimesheetModal.tsx`

```typescript
// Add mutation hooks
const approveTimesheet = trpc.timesheet.approve.useMutation({
  onSuccess: () => {
    onSuccess();
    toast.success('Timesheet approved');
  },
});

const rejectTimesheet = trpc.timesheet.reject.useMutation({
  onSuccess: () => {
    onSuccess();
    toast.success('Timesheet rejected');
  },
});

// Wire buttons
<button onClick={() => approveTimesheet.mutate({ entryIds })}>
  Approve
</button>

<button onClick={() => {
  if (!reason) {
    toast.error('Please provide a reason for rejection');
    return;
  }
  rejectTimesheet.mutate({ entryIds, reason });
}}>
  Reject
</button>
```

### Task 1.4: Wire PTO Request (1 hour)
**File**: `src/app/staff/payroll/time/page.tsx`

```typescript
// Add mutation hook
const requestPTO = trpc.timesheet.requestPTO.useMutation({
  onSuccess: () => {
    refetch();
    toast.success('PTO request submitted');
  },
});

// Wire "Request PTO" button
<button onClick={() => setShowPTOModal(true)}>
  Request PTO
</button>

// Create PTO modal
<RequestPTOModal
  isOpen={showPTOModal}
  onClose={() => setShowPTOModal(false)}
  onSubmit={(data) => requestPTO.mutate(data)}
/>
```

**New Component**: `src/app/staff/payroll/_components/RequestPTOModal.tsx` (150-200 lines)
- Date range picker (start/end date)
- PTO type selector (vacation, sick, personal)
- Hours calculator (business days * 8)
- Notes textarea
- Validation

### Task 1.5: Wire Week Summary (30 min)
**File**: `src/app/staff/payroll/time/page.tsx`

```typescript
// Replace local calculations with API call
const { data: weekSummary } = trpc.timesheet.getWeekSummary.useQuery({
  weekOf: getWeekStart(),
});

// Use API data instead of local calculations
const totalHours = weekSummary?.totalHours ?? 0;
const approvedHours = weekSummary?.approvedHours ?? 0;
const pendingHours = weekSummary?.pendingHours ?? 0;
const overtimeHours = weekSummary?.overtimeHours ?? 0;
```

**Deliverables**:
- 2 new modal components (Create Entry, Request PTO)
- 6 endpoints fully wired
- End-to-end time tracking workflow functional
- Toast notifications for all actions

---

## 2. Scheduling Router → `/staff/scheduling`

**Current State**:
- ✅ Router exists with 25 methods (Use Cases 7.1-7.4)
- ✅ UI page exists with staff scheduler
- ❌ Minimal wiring (1 usage found)

**Router Endpoints** (25 total from Use Cases):
- On-call rotation management (7.1)
- Service coverage staffing (7.2)
- Embalmer shift assignment (7.3)
- Shift swap with approval (7.4)

**Implementation Tasks** (Est: 8-12 hours):

### Task 2.1: Audit Scheduling Router (1 hour)
- Read router file completely
- Document all 25 endpoints
- Map to UI requirements
- Create endpoint checklist

### Task 2.2: Wire Core Shift Operations (4 hours)
- List shifts (calendar view)
- Create shift assignment
- Update shift
- Delete shift
- Get on-call schedule

### Task 2.3: Wire On-Call Rotation (2 hours)
- Assign on-call duty
- View rotation schedule
- Conflict detection
- Rest period validation

### Task 2.4: Wire Service Coverage (2 hours)
- Assign service staff
- Check coverage adequacy
- Role-based assignments

### Task 2.5: Wire Shift Swap (2 hours)
- Request shift swap
- Approve/reject swap
- Validation (license level, overtime)

**Deliverables**:
- 15-20 endpoints wired
- Drag-and-drop shift assignments
- On-call calendar view
- Shift swap approval workflow

---

## 3. Payroll Router → `/staff/payroll`

**Current State**:
- ✅ Router exists with Use Cases 4.1-4.4
- ✅ UI page exists
- ⚠️ Partial wiring (2 usages found)

**Router Endpoints** (from Use Cases):
- Calculate biweekly payroll (4.1)
- Generate direct deposit file (4.2)
- Create payroll journal entry (4.3)
- Generate W-2 forms (4.4)

**Implementation Tasks** (Est: 6-8 hours):

### Task 3.1: Audit Payroll Router (1 hour)
- Read router file
- Document endpoints
- Map to UI components

### Task 3.2: Wire Payroll Calculation (3 hours)
- Run payroll calculation endpoint
- Display payroll summary
- Employee breakdown
- Deductions and taxes
- Approval workflow

### Task 3.3: Wire Direct Deposit (2 hours)
- Generate ACH file endpoint
- Download functionality
- File validation
- Approval required check

### Task 3.4: Wire Journal Entry & W-2 (2 hours)
- Create journal entry endpoint
- Generate W-2 forms endpoint
- Download W-2s
- Year-end processing

**Deliverables**:
- Full payroll processing workflow
- Direct deposit file generation
- Journal entry creation
- W-2 generation

---

## 4. Inventory Router → `/staff/inventory`

**Current State**:
- ✅ Router exists with Use Cases 5.7, 6.5, 5.4
- ✅ Beautiful UI with multi-location view
- ⚠️ Minimal wiring (1-2 usages)

**Router Endpoints** (from Use Cases):
- List inventory by location (5.7)
- Transfer between locations (6.5)
- Adjust inventory levels (5.4)
- Low stock alerts
- Inventory valuation

**Implementation Tasks** (Est: 4-6 hours):

### Task 4.1: Wire Inventory List (1 hour)
- Replace mock data with API
- Filter by location
- Low stock indicator
- Search and sort

### Task 4.2: Wire Transfer Modal (2 hours)
**File**: `src/app/staff/inventory/_components/TransferInventoryModal.tsx`
- Already exists but may need full wiring
- Source/destination locations
- Quantity validation
- Real-time availability check

### Task 4.3: Wire Adjustment Operations (2 hours)
- Adjust inventory levels
- Reason codes (damage, theft, recount)
- Audit trail
- Manager approval for large adjustments

### Task 4.4: Wire Low Stock Alerts (1 hour)
- Get alerts endpoint
- Display notifications
- Set thresholds
- Auto-reorder suggestions

**Deliverables**:
- Live inventory data
- Working transfers
- Adjustment tracking
- Alert system

---

## 5. Procurement Router → `/staff/procurement`

**Current State**:
- ✅ Router with Use Cases 5.1-5.3
- ✅ Kanban PO UI exists
- ⚠️ Partial wiring (2-3 usages)

**Router Endpoints** (from Use Cases):
- Create purchase order (5.1)
- Record receipt (5.2)
- Process vendor return (5.3)
- PO approval workflow
- 3-way matching

**Implementation Tasks** (Est: 6-8 hours):

### Task 5.1: Wire PO Creation (3 hours)
**File**: `src/app/staff/procurement/_components/NewPurchaseOrderModal.tsx`
- Create PO endpoint
- Line items with validation
- Supplier selection
- Budget checking
- Approval routing

### Task 5.2: Wire Receipt Recording (2 hours)
- Record receipt endpoint
- Match to PO
- Quantity verification
- Quality check
- Partial receipts

### Task 5.3: Wire Vendor Returns (2 hours)
- Create return endpoint
- Return reason codes
- RMA number generation
- Credit memo creation

### Task 5.4: Wire Supplier Management (1 hour)
**File**: `src/app/staff/procurement/suppliers/page.tsx`
- List suppliers endpoint
- Add/edit supplier
- Supplier ratings
- Performance metrics

**Deliverables**:
- Complete PO workflow
- Receipt processing
- Return management
- Supplier database

---

## 6. Shipment Router → `/staff/scm`

**Current State**:
- ✅ Router exists
- ✅ UI with status timeline
- ⚠️ Minimal wiring (1 usage)

**Router Endpoints**:
- List shipments
- Create shipment
- Update status
- Track shipment
- Delivery confirmation

**Implementation Tasks** (Est: 3-4 hours):

### Task 6.1: Wire Shipment List (1 hour)
- Replace mock data with API
- Filter by status
- Search functionality
- Sort by date

### Task 6.2: Wire Status Updates (2 hours)
- Update shipment status
- Add tracking notes
- Delivery confirmation
- Photo upload for proof

### Task 6.3: Wire Creation (1 hour)
- Create new shipment
- Link to PO or case
- Carrier selection
- Tracking number

**Deliverables**:
- Live shipment tracking
- Status updates
- Creation workflow

---

## 7. Prep Room Router → `/staff/prep-room`

**Current State**:
- ✅ Router exists
- ✅ UI page exists
- ⚠️ Minimal wiring (1 usage)

**Router Endpoints** (from Use Case 7.3):
- Assign embalmer shift
- Get embalmer workload
- Check capacity
- Schedule preparations
- Break time tracking

**Implementation Tasks** (Est: 4-5 hours):

### Task 7.1: Wire Assignment (2 hours)
- Assign embalmer endpoint
- Workload validation (max 3 per shift)
- Break time checking
- Case linking

### Task 7.2: Wire Scheduling (2 hours)
- Schedule preparation
- Time slot selection
- Conflict detection
- Duration estimation

### Task 7.3: Wire Capacity Check (1 hour)
- Real-time capacity display
- Workload distribution
- Availability calendar

**Deliverables**:
- Embalmer assignments
- Workload management
- Capacity planning

---

## 8. Communication Router → `/staff/communication/*`

**Current State**:
- ✅ Router exists
- ✅ 4 UI pages exist (campaigns, templates, history, analytics)
- ❌ Unknown wiring status

**Router Endpoints**:
- Email campaigns
- SMS campaigns
- Template management
- Send history
- Analytics/metrics

**Implementation Tasks** (Est: 8-10 hours):

### Task 8.1: Audit Communication Router (1 hour)
- Read router file
- Document all endpoints
- Check existing usage

### Task 8.2: Wire Campaign Pages (3 hours)
**Files**: `/staff/communication/page.tsx`
- Create campaign endpoint
- List campaigns
- Send email/SMS
- Recipient management

### Task 8.3: Wire Templates (2 hours)
**File**: `/staff/communication/templates/page.tsx`
- List templates
- Create/edit template
- Variables/placeholders
- Preview functionality

### Task 8.4: Wire History (2 hours)
**File**: `/staff/communication/history/page.tsx`
- Message history endpoint
- Filter by type/status
- Resend functionality
- Delivery status

### Task 8.5: Wire Analytics (2 hours)
**File**: `/staff/communication/analytics/page.tsx`
- Campaign metrics
- Open rates
- Click rates
- Engagement charts

**Deliverables**:
- Campaign management
- Template library
- Send history
- Analytics dashboard

---

## 9. Analytics Router → `/staff/analytics`

**Current State**:
- ✅ Router exists
- ✅ UI page exists
- ⚠️ Minimal wiring (2 usages)

**Router Endpoints**:
- Dashboard KPIs
- Case metrics
- Revenue analytics
- Performance trends
- Custom reports

**Implementation Tasks** (Est: 4-6 hours):

### Task 9.1: Wire Dashboard KPIs (2 hours)
- Active cases count
- Revenue this month
- Avg case value
- Completion rate

### Task 9.2: Wire Charts (2 hours)
- Revenue trend chart
- Case volume chart
- Service type breakdown
- Time-series data

### Task 9.3: Wire Custom Reports (2 hours)
- Report builder
- Date range selection
- Export functionality
- Save custom views

**Deliverables**:
- Live dashboard metrics
- Interactive charts
- Report generation

---

## Implementation Strategy

### Phase 1: Quick Wins (Week 1 - 40 hours)
**Priority**: Get user-facing features working ASAP

1. **Timesheet Router** (6 hours) - High user value
2. **Inventory Router** (6 hours) - Simple, visible impact
3. **Procurement Router** (8 hours) - Business critical
4. **Shipment Router** (4 hours) - Quick win
5. **Analytics Router** (6 hours) - Executive visibility
6. **Prep Room Router** (5 hours) - Operational necessity
**Total**: 35 hours

### Phase 2: Complex Features (Week 2 - 45 hours)
**Priority**: Complete remaining workflows

7. **Scheduling Router** (12 hours) - Most complex
8. **Payroll Router** (8 hours) - Compliance critical
9. **Communication Router** (10 hours) - Multi-page integration
**Total**: 30 hours

### Phase 3: Polish & Testing (Remaining time)
- Integration testing
- Bug fixes
- Documentation
- User acceptance testing

---

## Success Metrics

### Completion Criteria
- [ ] All 9 routers fully wired (100% endpoint coverage)
- [ ] All buttons/forms functional (zero mock interactions)
- [ ] End-to-end workflows tested
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Toast notifications for all actions
- [ ] Smoke tests passing for all routes
- [ ] Documentation updated

### User Impact
- **Before**: 9 features with "coming soon" functionality
- **After**: 9 fully functional features
- **Value**: ~80-100 hours of user-facing functionality activated
- **ROI**: Unlock existing UI investment

---

## Risk Mitigation

### Known Risks
1. **Router endpoints may have bugs** - Test each endpoint before wiring
2. **Backend may return unexpected data** - Add type validation
3. **Some endpoints may not exist** - Document and create tickets
4. **UI may need adjustments** - Plan for UI tweaks

### Mitigation Strategies
- Test each endpoint with API client first
- Add comprehensive error handling
- Create fallbacks for missing data
- Maintain mock data as backup
- Incremental rollout per feature

---

## Next Steps

1. **Start with Timesheet** (highest user value, well-defined)
2. **Create tracking sheet** for progress
3. **Set up daily standup** to review progress
4. **Test each feature** before moving to next
5. **Document issues** as you go
6. **Update smoke tests** with new interactions

**Estimated Total**: 80-160 hours (1-2 weeks with 1-2 developers)
