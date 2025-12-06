# Phase 2: Complex Routers - Detailed Implementation Plan

**Date**: December 5, 2024  
**Duration**: 30 hours (Week 2)  
**Priority**: HIGH - Compliance & Operations Critical

---

## Router #1: Scheduling (12 hours)

### Current State Analysis

**Router Status**: 7 endpoints (NOT 25 - that was a miscount)
- ✅ Router file: `packages/api/src/routers/scheduling.router.ts`
- ✅ UI file: `src/app/staff/scheduling/page.tsx`
- ✅ One endpoint wired: `scheduling.list`
- ❌ 6 endpoints NOT wired

**Actual Router Endpoints**:
1. ✅ `list` - **WIRED** (fetching schedule data)
2. ❌ `createShift` - NOT WIRED (Add Shift button does nothing)
3. ❌ `updateShift` - NOT WIRED
4. ❌ `deleteShift` - NOT WIRED
5. ❌ `requestShiftSwap` - NOT WIRED
6. ❌ `reviewShiftSwap` - NOT WIRED
7. ❌ `getOnCallRotation` - NOT WIRED

### Implementation Tasks

#### Task 1: Wire Create Shift (3 hours)

**File**: `src/app/staff/scheduling/page.tsx`

```typescript
// Add mutation hooks
const createShift = trpc.scheduling.createShift.useMutation({
  onSuccess: () => {
    refetch();
    toast.success('Shift created successfully');
    setShowCreateModal(false);
  },
  onError: (error) => {
    toast.error(`Failed to create shift: ${error.message}`);
  },
});

// Wire Add Shift button
<button 
  onClick={() => setShowCreateModal(true)}
  className="..."
>
  <Plus className="w-4 h-4" />
  Add Shift
</button>
```

**New Component**: `src/app/staff/scheduling/_components/CreateShiftModal.tsx` (200-250 lines)

```typescript
interface CreateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftData) => void;
  preselectedDate?: string;
  preselectedStaff?: string;
}

export function CreateShiftModal({ isOpen, onClose, onSubmit, preselectedDate, preselectedStaff }: CreateShiftModalProps) {
  const [formData, setFormData] = useState({
    staffId: preselectedStaff || '',
    date: preselectedDate || '',
    startTime: '',
    endTime: '',
    type: 'regular' as 'regular' | 'on-call' | 'service',
    location: '',
    notes: '',
  });

  // Fetch staff list
  const { data: staffList } = trpc.staff.list.useQuery();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.staffId || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Conflict check
    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Create New Shift</DialogTitle>
      <form onSubmit={handleSubmit}>
        {/* Staff selector */}
        <Select 
          value={formData.staffId}
          onChange={(staffId) => setFormData({ ...formData, staffId })}
          placeholder="Select staff member"
        >
          {staffList?.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name} - {staff.role}
            </option>
          ))}
        </Select>

        {/* Date picker */}
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />

        {/* Time pickers */}
        <input
          type="time"
          value={formData.startTime}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          required
        />
        <input
          type="time"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          required
        />

        {/* Shift type */}
        <Select
          value={formData.type}
          onChange={(type) => setFormData({ ...formData, type })}
        >
          <option value="regular">Regular Shift</option>
          <option value="on-call">On-Call</option>
          <option value="service">Service Coverage</option>
        </Select>

        {/* Location (conditional for regular/service) */}
        {formData.type !== 'on-call' && (
          <input
            type="text"
            placeholder="Location (e.g. Main Chapel)"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        )}

        {/* Notes */}
        <textarea
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className="flex gap-2">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Create Shift</button>
        </div>
      </form>
    </Dialog>
  );
}
```

#### Task 2: Wire Update/Delete Shifts (2 hours)

**Files**: Same page + new modals

```typescript
// Add mutation hooks
const updateShift = trpc.scheduling.updateShift.useMutation({
  onSuccess: () => {
    refetch();
    toast.success('Shift updated');
  },
});

const deleteShift = trpc.scheduling.deleteShift.useMutation({
  onSuccess: () => {
    refetch();
    toast.success('Shift deleted');
  },
});
```

**Enhance Shift Cards** to be clickable and editable:

```typescript
function ShiftCard({ shift }: { shift: Shift }) {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className="shift-card">
      {/* Shift details */}
      <div>{shift.staffName}</div>
      <div>{shift.startTime} - {shift.endTime}</div>
      
      {/* Context menu */}
      <button onClick={() => setShowMenu(!showMenu)}>
        <MoreVertical className="w-4 h-4" />
      </button>
      
      {showMenu && (
        <div className="context-menu">
          <button onClick={() => {
            setEditingShift(shift);
            setShowEditModal(true);
          }}>
            Edit Shift
          </button>
          <button onClick={() => {
            if (confirm('Delete this shift?')) {
              deleteShift.mutate({ shiftId: shift.id });
            }
          }}>
            Delete Shift
          </button>
        </div>
      )}
    </div>
  );
}
```

#### Task 3: Wire Shift Swap Workflow (4 hours)

**New Components**:
1. `RequestShiftSwapModal.tsx` (150 lines)
2. `ReviewShiftSwapModal.tsx` (180 lines)
3. `ShiftSwapRequestsPanel.tsx` (200 lines)

**Workflow**:
1. Employee clicks "Request Swap" on their shift
2. Modal opens with list of eligible employees
3. Employee selects colleague and adds reason
4. Request sent to manager
5. Manager reviews in pending swaps panel
6. Manager approves/rejects with validation

```typescript
// In scheduling page
const requestSwap = trpc.scheduling.requestShiftSwap.useMutation({
  onSuccess: () => {
    toast.success('Swap request sent to manager');
    refetch();
  },
});

const reviewSwap = trpc.scheduling.reviewShiftSwap.useMutation({
  onSuccess: (data) => {
    toast.success(`Swap ${data.status}`);
    refetch();
  },
});

// Add panel for pending swaps (manager view)
<ShiftSwapRequestsPanel
  requests={pendingSwaps}
  onReview={(swapId, approved, notes) => {
    reviewSwap.mutate({ swapId, approved, notes });
  }}
/>
```

#### Task 4: Wire On-Call Rotation View (3 hours)

**New Component**: `OnCallRotationPanel.tsx` (250 lines)

```typescript
// In scheduling page - add tab for on-call view
const [activeTab, setActiveTab] = useState<'shifts' | 'on-call'>('shifts');

const { data: onCallSchedule } = trpc.scheduling.getOnCallRotation.useQuery({
  startDate: weekStart,
  endDate: weekEnd,
});

{activeTab === 'on-call' && (
  <OnCallRotationPanel schedule={onCallSchedule} />
)}
```

**Features**:
- Calendar view of on-call assignments
- Highlight current on-call director
- Show rotation pattern (e.g. weeknight, weekend)
- Rest period indicators
- Consecutive weekend warnings

**Deliverables**:
- 4 new components (Create, Edit, Swap Request, Swap Review)
- 1 new panel (On-Call Rotation)
- 6 endpoints fully wired
- Drag-and-drop (optional - Phase 3)

---

## Router #2: Payroll (8 hours)

### Current State Analysis

**Router Status**: 8 endpoints
- ✅ Router file: `packages/api/src/routers/payroll.router.ts`
- ✅ UI file: `src/app/staff/payroll/page.tsx`
- ⚠️ Partial wiring (2 usages found)
- ❌ 6 endpoints NOT fully wired

**Router Endpoints**:
1. ⚠️ `list` - Partially wired
2. ❌ `getById` - NOT WIRED
3. ❌ `getEmployees` - NOT WIRED
4. ❌ `runPayroll` - NOT WIRED
5. ❌ `approve` - NOT WIRED
6. ❌ `generateDirectDeposit` - NOT WIRED
7. ❌ `generateJournalEntry` - NOT WIRED
8. ❌ `generateW2s` - NOT WIRED

### Implementation Tasks

#### Task 1: Wire Payroll List & Details (2 hours)

**File**: `src/app/staff/payroll/page.tsx`

```typescript
// Already partially wired - enhance it
const { data: payrollRuns = [] } = trpc.payroll.list.useQuery({
  status: statusFilter,
  year: selectedYear,
});

// Add detail view on click
const [selectedRun, setSelectedRun] = useState<string | null>(null);

const { data: runDetails } = trpc.payroll.getById.useQuery(
  { id: selectedRun! },
  { enabled: !!selectedRun }
);

const { data: employees } = trpc.payroll.getEmployees.useQuery(
  { payrollRunId: selectedRun! },
  { enabled: !!selectedRun }
);

// Display in modal or side panel
{selectedRun && (
  <PayrollRunDetailsModal
    run={runDetails}
    employees={employees}
    onClose={() => setSelectedRun(null)}
  />
)}
```

#### Task 2: Wire Run Payroll (2 hours)

**New Component**: `RunPayrollModal.tsx` (already exists - needs full wiring)

**File**: `src/app/staff/payroll/_components/RunPayrollModal.tsx`

```typescript
const runPayroll = trpc.payroll.runPayroll.useMutation({
  onSuccess: (data) => {
    toast.success(`Payroll ${data.id} created`);
    onSuccess();
  },
  onError: (error) => {
    toast.error(`Failed to run payroll: ${error.message}`);
  },
});

const handleSubmit = () => {
  // Validation
  if (!periodStart || !periodEnd || !payDate) {
    toast.error('Please fill in all dates');
    return;
  }
  
  if (periodStart >= periodEnd) {
    toast.error('End date must be after start date');
    return;
  }
  
  if (payDate < periodEnd) {
    toast.error('Pay date must be after period end');
    return;
  }
  
  runPayroll.mutate({
    periodStart,
    periodEnd,
    payDate,
    funeralHomeId,
  });
};
```

#### Task 3: Wire Approval Workflow (1 hour)

```typescript
const approvePayroll = trpc.payroll.approve.useMutation({
  onSuccess: () => {
    toast.success('Payroll approved');
    refetch();
  },
});

// In payroll run card/details
<button
  onClick={() => {
    if (confirm('Approve this payroll run? This cannot be undone.')) {
      approvePayroll.mutate({ payrollRunId: run.id });
    }
  }}
  disabled={run.status !== 'draft'}
  className="..."
>
  Approve Payroll
</button>
```

#### Task 4: Wire Direct Deposit Generation (1 hour)

```typescript
const generateDD = trpc.payroll.generateDirectDeposit.useMutation({
  onSuccess: (data) => {
    toast.success(`ACH file generated: ${data.fileName}`);
    // Trigger download
    window.open(data.downloadUrl, '_blank');
  },
});

<button
  onClick={() => generateDD.mutate({ payrollRunId: run.id })}
  disabled={run.status !== 'approved'}
>
  Generate Direct Deposit File
</button>
```

#### Task 5: Wire Journal Entry & W-2 Generation (2 hours)

```typescript
const generateJE = trpc.payroll.generateJournalEntry.useMutation({
  onSuccess: (data) => {
    toast.success(`Journal entry ${data.journalEntryId} created`);
    setShowJEModal(true);
  },
});

const generateW2s = trpc.payroll.generateW2s.useMutation({
  onSuccess: (data) => {
    toast.success(`${data.w2sGenerated} W-2s generated`);
    window.open(data.downloadUrl, '_blank');
  },
});

// In year-end section
<button onClick={() => generateW2s.mutate({ year: selectedYear })}>
  Generate W-2s for {selectedYear}
</button>

// Show journal entry details modal after generation
{showJEModal && (
  <JournalEntryModal
    entries={journalEntryData.entries}
    onClose={() => setShowJEModal(false)}
  />
)}
```

**Deliverables**:
- Enhanced payroll list with details
- Working Run Payroll modal
- Approval workflow
- Direct deposit file generation
- Journal entry creation
- W-2 generation
- 8 endpoints fully wired

---

## Router #3: Communication (10 hours)

### Current State Analysis

**Router Status**: 11 endpoints
- ✅ Router file: `packages/api/src/routers/communication.router.ts`
- ✅ 4 UI pages exist
- ❌ Unknown wiring status (likely minimal)

**Router Endpoints**:
1. ❌ `listTemplates` - NOT WIRED
2. ❌ `getTemplate` - NOT WIRED
3. ❌ `createTemplate` - NOT WIRED
4. ❌ `updateTemplate` - NOT WIRED
5. ❌ `deleteTemplate` - NOT WIRED
6. ❌ `sendEmail` - NOT WIRED
7. ❌ `sendSMS` - NOT WIRED
8. ❌ `getCommunicationHistory` - NOT WIRED
9. ❌ `getCommunicationStats` - NOT WIRED

### Implementation Tasks

#### Task 1: Wire Templates Page (3 hours)

**File**: `src/app/staff/communication/templates/page.tsx`

```typescript
// Fetch templates
const { data: templates = [], refetch } = trpc.communication.listTemplates.useQuery({
  type: filterType, // 'email' | 'sms' | undefined
  search: searchQuery,
});

// Create template
const createTemplate = trpc.communication.createTemplate.useMutation({
  onSuccess: () => {
    toast.success('Template created');
    refetch();
    setShowCreateModal(false);
  },
});

// Update template
const updateTemplate = trpc.communication.updateTemplate.useMutation({
  onSuccess: () => {
    toast.success('Template updated');
    refetch();
    setShowEditModal(false);
  },
});

// Delete template
const deleteTemplate = trpc.communication.deleteTemplate.useMutation({
  onSuccess: () => {
    toast.success('Template deleted');
    refetch();
  },
});

// Display templates
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {templates.map((template) => (
    <TemplateCard
      key={template.id}
      template={template}
      onEdit={() => {
        setEditingTemplate(template);
        setShowEditModal(true);
      }}
      onDelete={() => {
        if (confirm('Delete this template?')) {
          deleteTemplate.mutate({ id: template.id });
        }
      }}
      onUse={() => {
        setSelectedTemplate(template);
        setShowComposeModal(true);
      }}
    />
  ))}
</div>
```

**New Components**:
1. `CreateTemplateModal.tsx` (200 lines)
2. `EditTemplateModal.tsx` (220 lines)
3. `TemplateCard.tsx` (150 lines)

#### Task 2: Wire Campaign/Compose Page (3 hours)

**File**: `src/app/staff/communication/page.tsx`

```typescript
// Send email
const sendEmail = trpc.communication.sendEmail.useMutation({
  onSuccess: (data) => {
    toast.success(`Email sent to ${data.sent} recipients`);
    setShowComposeModal(false);
  },
});

// Send SMS
const sendSMS = trpc.communication.sendSMS.useMutation({
  onSuccess: (data) => {
    toast.success(`SMS sent to ${data.sent} recipients`);
    setShowComposeModal(false);
  },
});

// Compose modal
<ComposeMessageModal
  isOpen={showComposeModal}
  onClose={() => setShowComposeModal(false)}
  preselectedTemplate={selectedTemplate}
  preselectedType={messageType}
  onSendEmail={(data) => sendEmail.mutate(data)}
  onSendSMS={(data) => sendSMS.mutate(data)}
/>
```

**New Component**: `ComposeMessageModal.tsx` (350 lines)
- Template selector
- Recipient selector (multi-select)
- Subject line (email only)
- Body with variable substitution
- Preview pane
- Send/Schedule options

#### Task 3: Wire History Page (2 hours)

**File**: `src/app/staff/communication/history/page.tsx`

```typescript
const [filters, setFilters] = useState({
  page: 1,
  limit: 20,
  type: undefined as 'email' | 'sms' | undefined,
  status: undefined as string | undefined,
  caseId: undefined as string | undefined,
});

const { data: history, isLoading } = trpc.communication.getCommunicationHistory.useQuery(filters);

// Display history
<div className="space-y-4">
  {history?.communications.map((comm) => (
    <CommunicationHistoryCard
      key={comm.id}
      communication={comm}
      onResend={() => {
        // Populate compose modal with same content
        setResendData(comm);
        setShowComposeModal(true);
      }}
    />
  ))}
</div>

// Pagination
<Pagination
  currentPage={filters.page}
  totalPages={history?.totalPages ?? 1}
  onPageChange={(page) => setFilters({ ...filters, page })}
/>
```

**New Component**: `CommunicationHistoryCard.tsx` (180 lines)
- Show type (email/SMS)
- Recipient info
- Status with icon
- Sent/delivered/opened timestamps
- Resend button
- View details

#### Task 4: Wire Analytics Page (2 hours)

**File**: `src/app/staff/communication/analytics/page.tsx`

```typescript
const [timeRange, setTimeRange] = useState(30); // days

const { data: stats } = trpc.communication.getCommunicationStats.useQuery({
  days: timeRange,
});

// Display KPIs
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatsCard
    label="Total Sent"
    value={stats?.totalSent ?? 0}
    icon={Send}
  />
  <StatsCard
    label="Delivery Rate"
    value={`${stats?.deliveryRate.toFixed(1) ?? 0}%`}
    icon={CheckCircle}
  />
  <StatsCard
    label="Open Rate"
    value={`${stats?.openRate.toFixed(1) ?? 0}%`}
    icon={Mail}
  />
  <StatsCard
    label="Click Rate"
    value={`${stats?.clickRate.toFixed(1) ?? 0}%`}
    icon={MousePointer}
  />
</div>

// Charts
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <ByTypeChart data={stats?.byType} />
  <ByStatusChart data={stats?.byStatus} />
</div>
```

**New Components**:
1. `ByTypeChart.tsx` (100 lines) - Pie chart
2. `ByStatusChart.tsx` (120 lines) - Bar chart

**Deliverables**:
- Template management (create, edit, delete, use)
- Campaign composition (email & SMS)
- Message history with filters and pagination
- Analytics dashboard with charts
- 11 endpoints fully wired
- 4 pages fully functional

---

## Summary: Phase 2 Complete Scope

### Scheduling Router (12 hours)
- 4 new components
- 1 new panel
- 6 endpoints wired
- Shift management workflow
- Swap request workflow
- On-call rotation view

### Payroll Router (8 hours)
- 2 new components/modals
- 8 endpoints wired
- Complete payroll workflow
- Direct deposit generation
- Journal entry creation
- W-2 generation

### Communication Router (10 hours)
- 8 new components
- 11 endpoints wired
- Template management
- Campaign composition
- Message history
- Analytics dashboard

### Total Deliverables
- **New Components**: 15
- **Endpoints Wired**: 25
- **Pages Enhanced**: 7
- **Workflows Complete**: 8

### Success Criteria
- [ ] All 3 routers 100% wired
- [ ] All buttons/forms functional
- [ ] End-to-end workflows tested
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Toast notifications for all actions
- [ ] Smoke tests updated

### Risk Mitigation
1. **Router endpoints may need debugging** - Test each endpoint with API client first
2. **UI may need design adjustments** - Keep designs simple and consistent
3. **Some endpoints may return mock data** - Add proper type checking and fallbacks
4. **Time may exceed estimates** - Prioritize core features first, polish later

### Implementation Order
1. **Payroll** (8h) - Compliance critical, simpler than others
2. **Scheduling** (12h) - Most complex, needs focus time
3. **Communication** (10h) - Multi-page, good for final push

**Total**: 30 hours for Phase 2
