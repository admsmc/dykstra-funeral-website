# Production Integration Plan: Backend\-to\-Frontend Bridge
**Timeline**: 6\-8 weeks to production\-ready
**Approach**: Systematic completion, one domain at a time
**Status**: Ready for execution
## Executive Summary
This plan bridges the gap between excellent backend \(119 use cases, 22 Go modules\) and excellent frontend \(38 pages, Linear/Notion UI\) by systematically creating integration layers, workflow UIs, and API wiring\. Each week delivers production\-ready features in a specific domain\.

***
## Week 1\-2: Financial Operations Domain
**Goal**: Enable complete financial close process, bank reconciliation, and GL operations
**Deliverables**: 4 routers, 6 UI wizards, 8 pages wired to real APIs
### Phase 1\.1: Create Financial Router \(Day 1\-2\)
**File**: `packages/api/src/routers/financial.router.ts`
**Lines**: ~800 lines
**Dependencies**: Existing use cases in `packages/application/src/use-cases/financial/`
**Endpoints to Implement**:
```typescript
financialRouter.periodClose.start         // Month-end close initiation
financialRouter.periodClose.validate      // Trial balance validation
financialRouter.periodClose.adjustments   // Post adjusting entries
financialRouter.periodClose.finalize      // Lock period
financialRouter.periodClose.getStatus     // Check close status
financialRouter.bankRec.import            // Import bank statement
financialRouter.bankRec.match             // Match transactions
financialRouter.bankRec.createAdjustment  // Create GL adjustment
financialRouter.bankRec.finalize          // Complete reconciliation
financialRouter.gl.postJournalEntry       // Manual journal entries
financialRouter.gl.getTrialBalance        // Get trial balance
financialRouter.gl.getAccountHistory      // Account detail report
financialRouter.gl.getFinancialStatement  // P&L, Balance Sheet
financialRouter.ar.getAgingReport         // AR aging by customer
financialRouter.ar.getOverdueInvoices     // Overdue invoice list
financialRouter.ap.runPaymentBatch        // Batch AP payments
financialRouter.ap.getPayablesByVendor    // AP by vendor report
```
**Implementation Pattern**:
```typescript
import { router, staffProcedure } from '../trpc';
import { 
  executeMonthEndClose,
  bankReconciliation,
  postJournalEntry,
  getTrialBalance 
} from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';
export const financialRouter = router({
  periodClose: router({
    start: staffProcedure
      .input(z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/),
        funeralHomeId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await runEffect(
          executeMonthEndClose({
            period: input.period,
            funeralHomeId: input.funeralHomeId,
            userId: ctx.user.id,
          })
        );
      }),
    // ... more endpoints
  }),
  bankRec: router({ /* ... */ }),
  gl: router({ /* ... */ }),
  ar: router({ /* ... */ }),
  ap: router({ /* ... */ }),
});
```
**Validation Steps**:
1. All use cases from `packages/application/src/use-cases/financial/` are exposed
2. Input validation with Zod schemas
3. Proper error handling with Effect\-TS
4. Staff\-only access via `staffProcedure`
5. Unit tests for each endpoint
### Phase 1\.2: Build Period Close Wizard \(Day 3\-4\)
**File**: `src/app/staff/finops/period-close/page.tsx`
**Lines**: ~600 lines
**Components**: Multi\-step wizard with 5 steps
**Wizard Steps**:
1. **Select Period** \- Choose month/year to close
2. **Review Trial Balance** \- Display all accounts, validate balance
3. **Post Adjustments** \- Manual journal entries, accruals, deferrals
4. **Review Close Report** \- Summary of changes, preview locked period
5. **Finalize & Lock** \- Confirm close, lock period from edits
**UI Structure**:
```typescript
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
export default function PeriodClosePage() {
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState('');
  const [closeId, setCloseId] = useState('');
  
  const startCloseMutation = trpc.financial.periodClose.start.useMutation();
  const validateMutation = trpc.financial.periodClose.validate.useMutation();
  const finalizeMutation = trpc.financial.periodClose.finalize.useMutation();
  
  return (
    <div className="space-y-8">
      <WizardHeader currentStep={step} totalSteps={5} />
      
      <AnimatePresence mode="wait">
        {step === 1 && <SelectPeriodStep onNext={handleStartClose} />}
        {step === 2 && <ReviewTrialBalanceStep onNext={() => setStep(3)} />}
        {step === 3 && <PostAdjustmentsStep onNext={() => setStep(4)} />}
        {step === 4 && <ReviewReportStep onNext={() => setStep(5)} />}
        {step === 5 && <FinalizeStep onComplete={handleComplete} />}
      </AnimatePresence>
      
      <WizardNavigation 
        step={step} 
        onBack={() => setStep(s => s - 1)}
        onNext={() => setStep(s => s + 1)}
      />
    </div>
  );
}
```
**Features**:
* Progress indicator \(5\-step timeline\)
* Back/Next navigation with validation
* Real\-time balance calculations
* Error handling with toast notifications
* Confirmation dialogs for destructive actions
* Audit trail logging
### Phase 1\.3: Build Bank Reconciliation UI \(Day 5\-6\)
**File**: Enhancement to existing `src/app/staff/finops/page.tsx`
**Lines**: \+400 lines to existing page
**Components**: Transaction matching interface
**Enhancements to Bank Rec Tab**:
1. **Import Bank Statement** \- Upload CSV/OFX/QBO files
2. **Auto\-Matching Engine** \- ML\-based transaction matching
3. **Manual Matching UI** \- Drag\-and\-drop bank tx to GL entries
4. **Create Adjustments** \- Modal for adjustment journal entries
5. **Finalize Reconciliation** \- Lock matched transactions
**UI Components**:
```typescript
// Left panel: Bank transactions (unmatched)
<BankTransactionList
  transactions={unmatchedBankTx}
  onDragStart={handleDragStart}
  onCreateAdjustment={openAdjustmentModal}
/>
// Right panel: GL entries (unmatched)
<GLEntryList
  entries={unmatchedGLEntries}
  onDrop={handleMatch}
  onCreateEntry={openJournalEntryModal}
/>
// Center: Matched pairs
<MatchedTransactionsList
  matches={matchedPairs}
  onUnmatch={handleUnmatch}
/>
// Summary
<ReconciliationSummary
  bankBalance={bankBalance}
  glBalance={glBalance}
  variance={variance}
  matchedCount={matchedCount}
  unmatchedCount={unmatchedCount}
/>
```
**Key Features**:
* Drag\-and\-drop transaction matching
* Fuzzy matching suggestions \(show likely matches\)
* Bulk matching for recurring transactions
* Create GL adjustment entries inline
* Real\-time variance calculation
* Export reconciliation report
### Phase 1\.4: Wire Existing FinOps Pages \(Day 7\-8\)
**Pages to Update**:
1. `/staff/finops` \(General Ledger\)
2. `/staff/finops/ap` \(Accounts Payable\)
3. `/staff/analytics` \(Financial Analytics\)
4. `/staff/payments` \(Payment Processing\)
**Pattern for Each Page**:
```typescript
// BEFORE: Mock data
const MOCK_ACCOUNTS = [...];
const accounts = useMemo(() => MOCK_ACCOUNTS, []);
// AFTER: Real API call
const { data: accounts, isLoading } = trpc.financial.gl.getTrialBalance.useQuery({
  period: selectedPeriod,
  funeralHomeId: user.funeralHomeId,
});
if (isLoading) return <LoadingSkeleton />;
if (!accounts) return <ErrorState />;
```
**Files to Modify**:
* `src/app/staff/finops/page.tsx` \(~50 line changes\)
* `src/app/staff/finops/ap/page.tsx` \(~80 line changes\)
* `src/app/staff/analytics/page.tsx` \(~120 line changes\)
* `src/app/staff/payments/page.tsx` \(~40 line changes\)
**Required Changes**:
1. Replace all `MOCK_*` constants with tRPC queries
2. Add loading states with skeleton loaders
3. Add error states with retry buttons
4. Add refetch on user actions \(refresh, filter change\)
5. Add optimistic updates for mutations
6. Add success/error toast notifications
### Phase 1\.5: Create GL Journal Entry Modal \(Day 9\)
**File**: `src/components/financial/JournalEntryModal.tsx`
**Lines**: ~350 lines
**Purpose**: Create manual journal entries from any page
**Features**:
* Debit/Credit entry rows \(dynamic add/remove\)
* Account picker with search and favorites
* Auto\-balancing validation \(debits must equal credits\)
* Memo/notes field
* Attachment support \(receipts, invoices\)
* Save as draft or post immediately
* Template support \(recurring entries\)
### Phase 1\.6: Create Financial Reports Page \(Day 10\)
**File**: `src/app/staff/finops/reports/page.tsx`
**Lines**: ~450 lines
**Reports Available**:
1. Profit & Loss Statement \(monthly, quarterly, annual\)
2. Balance Sheet \(point\-in\-time\)
3. Cash Flow Statement \(direct/indirect method\)
4. AR Aging Report \(30/60/90/120\+ days\)
5. AP Aging Report \(by vendor\)
6. Budget vs Actual Variance Report
7. Revenue by Service Type
8. Expense by Category
**UI Components**:
```typescript
<ReportsPage>
  <ReportSelector onSelect={setSelectedReport} />
  <DateRangePicker onChange={setDateRange} />
  <FilterPanel filters={reportFilters} />
  <ReportViewer 
    report={reportData}
    format={selectedFormat} // table, chart, summary
  />
  <ExportButtons 
    onExportPDF={handleExportPDF}
    onExportExcel={handleExportExcel}
    onExportCSV={handleExportCSV}
  />
</ReportsPage>
```
### Week 1\-2 Validation Checklist
- [ ] Financial router created with all 20\+ endpoints
- [ ] **ARCHITECTURE CHECK**: No business logic in router \(only delegation\)
- [ ] **ARCHITECTURE CHECK**: All use cases called via `runEffect()`
- [ ] **ARCHITECTURE CHECK**: No Prisma imports in API layer
- [ ] **ARCHITECTURE CHECK**: All inputs validated with Zod schemas
- [ ] Period close wizard functional \(5 steps\)
- [ ] **STATE MANAGEMENT CHECK**: No Zustand for backend data
- [ ] **STATE MANAGEMENT CHECK**: All backend data via tRPC queries
- [ ] Bank reconciliation UI functional \(import, match, adjust\)
- [ ] GL journal entry modal functional
- [ ] 4 FinOps pages wired to real APIs
- [ ] Financial reports page created
- [ ] All mutations have loading/error states
- [ ] All queries have skeleton loaders
- [ ] Toast notifications on success/error
- [ ] Navigation updated with new routes
- [ ] **LAYER BOUNDARY CHECK**: `pnpm check:layers` passing
- [ ] **CIRCULAR DEPS CHECK**: `pnpm check:circular` passing
- [ ] Integration tests passing
- [ ] Manual smoke test completed
- [ ] Manual smoke test completed
### Architecture Compliance Enforcement \(All Weeks\)
**Critical Rules** \(Run before committing each feature\):
1. **Layer Boundaries**
```warp-runnable-command
pnpm check:layers       # No Prisma in application/domain
pnpm check:circular     # No circular dependencies
pnpm type-check         # TypeScript strict mode
```
2. **tRPC Router Pattern**
    * ✅ Routers delegate to use cases \(NO business logic\)
    * ✅ All inputs validated with Zod
    * ✅ Use `runEffect()` for Effect execution
    * ✅ Use `staffProcedure` for auth
3. **State Management**
    * ✅ Backend data via tRPC \(NOT Zustand\)
    * ✅ Zustand ONLY for UI state \(theme, sidebar, modals\)
    * ✅ No `MOCK_*` constants in production pages
4. **Error Handling**
    * ✅ Proper Effect error types \(NotFoundError, ValidationError, PersistenceError\)
    * ✅ Toast notifications for user\-facing errors
    * ✅ Structured error logging
5. **Go Backend Integration**
    * ✅ NO new Go adapters \(out of scope\)
    * ✅ Existing Go adapters remain unchanged
    * ✅ No direct TigerBeetle/EventStoreDB imports
**Validation Command** \(run daily\):
```warp-runnable-command
pnpm validate   # Runs all checks: type-check, lint, layers, circular, contracts
```
**Code Review Checklist** \(per ARCHITECTURE\.md\):
- [ ] No Prisma in application or domain layers
- [ ] All repositories are object\-based \(not classes\) \- N/A for API/UI work
- [ ] Domain entities contain business rules \- N/A for API/UI work
- [ ] Use cases are thin orchestrators \- ✅ Verified by router delegation
- [ ] API routers delegate to use cases \- ✅ Core focus of this plan
- [ ] Errors use object format \- ✅ Effect\-TS patterns
- [ ] All ports exported from application/src/ports/ \- N/A for API/UI work
***
## Week 3\-4: Family CRM Domain
**Goal**: Enable complete family hierarchy management and contact relationship tracking
**Deliverables**: 2 routers, 4 UI components, 3 pages wired to real APIs
### Phase 2\.1: Create Family Hierarchy Router \(Day 11\-12\)
**File**: `packages/api/src/routers/family-hierarchy.router.ts`
**Lines**: ~500 lines
**Endpoints to Implement**:
```typescript
familyHierarchyRouter.createFamily         // Create new family unit
familyHierarchyRouter.addMember           // Add member to family
familyHierarchyRouter.updateMember        // Update member details
familyHierarchyRouter.removeMember        // Remove member (soft delete)
familyHierarchyRouter.linkRelationship    // Define relationship (spouse, child, etc.)
familyHierarchyRouter.unlinkRelationship  // Remove relationship
familyHierarchyRouter.getFamilyTree       // Get full family hierarchy
familyHierarchyRouter.searchFamilies      // Search across families
familyHierarchyRouter.mergeFamilies       // Merge duplicate families
familyHierarchyRouter.getFamilyHistory    // Get family case history
```
**Data Structures**:
```typescript
interface FamilyMember {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  email?: string;
  phone?: string;
  address?: Address;
  relationships: Relationship[];
  primaryContact: boolean;
  decedent: boolean;
  tags: string[];
}
interface Relationship {
  fromMemberId: string;
  toMemberId: string;
  type: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  notes?: string;
}
interface FamilyTree {
  familyId: string;
  familyName: string;
  members: FamilyMember[];
  relationships: Relationship[];
  cases: Case[];
}
```
### Phase 2\.2: Create Contact Management Router \(Day 13\)
**File**: `packages/api/src/routers/contact-management.router.ts`
**Lines**: ~400 lines
**Endpoints**:
```typescript
contactRouter.create                      // Create individual contact
contactRouter.update                      // Update contact details
contactRouter.delete                      // Soft delete contact
contactRouter.search                      // Search contacts
contactRouter.findDuplicates              // Find potential duplicates
contactRouter.merge                       // Merge duplicate contacts
contactRouter.getHistory                  // Get contact interaction history
contactRouter.addNote                     // Add note to contact
contactRouter.addTag                      // Tag contact
contactRouter.linkToCase                  // Associate contact with case
```
### Phase 2\.3: Build Family Tree Visualization \(Day 14\-15\)
**File**: `src/components/family/FamilyTreeVisualization.tsx`
**Lines**: ~600 lines
**Library**: React Flow or D3\.js for graph visualization
**Features**:
* Interactive family tree graph
* Zoom/pan controls
* Click member to see details
* Add member inline
* Add relationship with drag\-and\-drop
* Highlight decedent
* Show multiple generations
* Export as PDF/image
**UI Structure**:
```typescript
import ReactFlow, { Node, Edge } from 'reactflow';
export function FamilyTreeVisualization({ familyId }: Props) {
  const { data: familyTree } = trpc.familyHierarchy.getFamilyTree.useQuery({ familyId });
  
  // Convert family data to graph nodes/edges
  const nodes = familyTree.members.map(member => ({
    id: member.id,
    data: { 
      label: `${member.firstName} ${member.lastName}`,
      decedent: member.decedent,
      primaryContact: member.primaryContact,
    },
    position: calculatePosition(member),
  }));
  
  const edges = familyTree.relationships.map(rel => ({
    id: `${rel.fromMemberId}-${rel.toMemberId}`,
    source: rel.fromMemberId,
    target: rel.toMemberId,
    label: rel.type,
  }));
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
    >
      <Controls />
      <MiniMap />
      <Background />
    </ReactFlow>
  );
}
```
### Phase 2\.4: Build Family Manager Page \(Day 16\-17\)
**File**: `src/app/staff/families/[id]/page.tsx`
**Lines**: ~700 lines
**Layout**:
```warp-runnable-command
┌─────────────────────────────────────────────────┐
│ Family Header: Smith Family                     │
│ Primary Contact: John Smith (555) 123-4567      │
├──────────────────┬──────────────────────────────┤
│ Family Tree      │ Member Details               │
│ Visualization    │ ┌──────────────────────────┐ │
│                  │ │ John Smith               │ │
│                  │ │ DOB: 1/1/1950            │ │
│                  │ │ Email: john@example.com  │ │
│                  │ │ Phone: (555) 123-4567    │ │
│                  │ │ Tags: Primary, Spouse    │ │
│                  │ └──────────────────────────┘ │
│                  │                              │
│                  │ Relationships:               │
│                  │ • Spouse of Jane Smith       │
│                  │ • Parent of Mary Smith       │
│                  │                              │
│                  │ [Edit] [Add Note] [Add Tag]  │
├──────────────────┴──────────────────────────────┤
│ Case History                                    │
│ • Case #2024-001: John Smith (Deceased)         │
│ • Case #2019-012: Robert Smith (Grandfather)    │
└─────────────────────────────────────────────────┘
```
**Components**:
* `FamilyHeader` \- Family name, primary contact, action buttons
* `FamilyTreePanel` \- Interactive visualization
* `MemberDetailsPanel` \- Selected member details, editable form
* `RelationshipsList` \- List of relationships with add/edit/delete
* `CaseHistoryList` \- All cases associated with this family
* `NotesTimeline` \- Chronological notes and interactions
* `AddMemberModal` \- Form to add new family member
* `AddRelationshipModal` \- Form to link two members
### Phase 2\.5: Build Contact Search & Management \(Day 18\-19\)
**File**: Enhancement to `src/app/staff/families/page.tsx`
**Lines**: \+300 lines
**Features**:
* Advanced search \(name, email, phone, tags\)
* Filter by primary contact, decedent, tags
* Bulk actions \(tag, delete, export\)
* Duplicate detection and merging
* Quick create contact
* Import contacts from CSV
**UI Enhancements**:
```typescript
<ContactManagementPage>
  <SearchBar 
    onSearch={handleSearch}
    filters={filters}
    onFilterChange={setFilters}
  />
  
  <ContactListView>
    <ContactCard 
      contact={contact}
      onSelect={handleSelect}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  </ContactListView>
  
  <BulkActionBar
    selectedContacts={selectedContacts}
    actions={['tag', 'delete', 'export', 'merge']}
  />
  
  <DuplicateDetectionPanel
    duplicates={detectedDuplicates}
    onMerge={handleMerge}
  />
</ContactManagementPage>
```
### Phase 2\.6: Wire Families Page to Real API \(Day 20\)
**File**: `src/app/staff/families/page.tsx`
**Changes**: Replace all mock data with tRPC queries
**API Calls to Add**:
```typescript
// Replace MOCK_FAMILIES
const { data: families } = trpc.familyHierarchy.searchFamilies.useQuery({
  searchQuery,
  filters,
  limit: 50,
});
// Add mutations
const createFamilyMutation = trpc.familyHierarchy.createFamily.useMutation();
const addMemberMutation = trpc.familyHierarchy.addMember.useMutation();
const linkRelationshipMutation = trpc.familyHierarchy.linkRelationship.useMutation();
```
### Week 3\-4 Validation Checklist
- [ ] Family hierarchy router created with 10\+ endpoints
- [ ] **ARCHITECTURE CHECK**: Router delegation pattern followed
- [ ] **ARCHITECTURE CHECK**: `pnpm validate` passing
- [ ] Contact management router created with 10\+ endpoints
- [ ] Family tree visualization component functional
- [ ] Family manager page functional \(tree \+ details \+ cases\)
- [ ] Contact search and management functional
- [ ] Duplicate detection working
- [ ] Family merge functionality working
- [ ] Families page wired to real APIs
- [ ] **STATE MANAGEMENT CHECK**: All backend data via tRPC
- [ ] All CRUD operations working \(create, read, update, delete\)
- [ ] Relationship linking/unlinking working
- [ ] Case history integration working
- [ ] Navigation updated
- [ ] Integration tests passing
- [ ] Manual smoke test completed
***
## Week 5\-6: Core Operations Domain
**Goal**: Wire cases, contracts, and documents to production\-ready state
**Deliverables**: 3 routers enhanced, 5 pages wired, document generation working
### Phase 3\.1: Enhance Case Router \(Day 21\-22\)
**File**: `packages/api/src/routers/case.router.ts` \(already exists, needs enhancement\)
**Lines**: \+400 lines
**New Endpoints to Add**:
```typescript
caseRouter.createFromLead                 // Convert lead to case with contract
caseRouter.updateStatus                   // Update case status with workflow
caseRouter.getFinancialSummary            // Get case financials
caseRouter.finalizeCase                   // Finalize case with GL posting
caseRouter.getAuditLog                    // Get case audit trail
caseRouter.attachDocument                 // Attach document to case
caseRouter.generateDocuments              // Generate service program, prayer card
caseRouter.reserveInventory               // Reserve casket, vault, etc.
caseRouter.assignStaff                    // Assign director, embalmer
caseRouter.scheduleService                // Schedule service date/time
```
**Workflow State Machine**:
```typescript
const CASE_WORKFLOW = {
  'lead': ['inquiry', 'preplanning'],
  'inquiry': ['arrangement', 'lost'],
  'preplanning': ['arrangement', 'on_hold'],
  'arrangement': ['service_scheduled', 'cancelled'],
  'service_scheduled': ['in_progress', 'rescheduled'],
  'in_progress': ['completed'],
  'completed': ['finalized'],
  'finalized': ['closed'],
};
```
### Phase 3\.2: Enhance Contract Router \(Day 23\)
**File**: `packages/api/src/routers/contract.router.ts` \(already exists, needs enhancement\)
**Lines**: \+300 lines
**New Endpoints to Add**:
```typescript
contractRouter.createFromTemplate        // Create contract from template
contractRouter.addLineItem               // Add service/merchandise
contractRouter.removeLineItem            // Remove line item
contractRouter.updatePricing             // Update pricing with discounts
contractRouter.sendForSignature          // Send to DocuSign/HelloSign
contractRouter.recordSignature           // Record signature event
contractRouter.generatePDF               // Generate contract PDF
contractRouter.renew                     // Renew pre-need contract
contractRouter.cancel                    // Cancel contract with refund
```
### Phase 3\.3: Wire Cases Page \(Day 24\-25\)
**File**: `src/app/staff/cases/page.tsx`
**Changes**: Replace mock data, add real workflow
**Key Changes**:
```typescript
// Replace MOCK_CASES
const { data: cases } = trpc.case.list.useQuery({
  funeralHomeId: user.funeralHomeId,
  status: statusFilter,
  dateRange,
});
// Add mutations
const createCaseMutation = trpc.case.create.useMutation();
const updateStatusMutation = trpc.case.updateStatus.useMutation();
const finalizeMutation = trpc.case.finalizeCase.useMutation();
// Add workflow actions
const handleStatusChange = async (caseId, newStatus) => {
  await updateStatusMutation.mutateAsync({ caseId, newStatus });
  toast.success(`Case status updated to ${newStatus}`);
};
```
**New Features to Add**:
* Status workflow dropdown \(only show valid next statuses\)
* Quick actions menu \(schedule, assign staff, generate docs\)
* Financial summary widget per case
* Recent activity timeline
* Bulk status updates
### Phase 3\.4: Wire Contracts Page \(Day 26\)
**File**: `src/app/staff/contracts/page.tsx`
**Changes**: Wire to contract router, add signature tracking
**API Integration**:
```typescript
const { data: contracts } = trpc.contract.list.useQuery({
  funeralHomeId: user.funeralHomeId,
  status: statusFilter,
});
const renewMutation = trpc.contract.renew.useMutation();
const sendForSignatureMutation = trpc.contract.sendForSignature.useMutation();
```
**Add Contract Renewal Modal** \(integrate component created in Week 1\):
* Wire modal to real `renewMutation`
* Add success handling with refetch
* Add error handling with retry
### Phase 3\.5: Enable Document Generation \(Day 27\-28\)
**Files**:
* `src/app/staff/cases/[id]/documents/page.tsx` \(new page\)
* `src/components/documents/DocumentGenerator.tsx` \(new component\)
**Features**:
* List available templates \(service program, prayer card, obituary\)
* Preview template with case data
* Generate PDF with one click
* Download or email to family
* Track document generation history
* Bulk generate \(e\.g\., all service programs for a case\)
**UI Flow**:
```typescript
<DocumentGenerationPage caseId={caseId}>
  <TemplateSelector 
    templates={availableTemplates}
    onSelect={setSelectedTemplate}
  />
  
  <DataMappingPreview
    template={selectedTemplate}
    caseData={caseData}
    onDataChange={setCaseData}
  />
  
  <GenerateButton
    onClick={handleGenerate}
    isLoading={isGenerating}
  />
  
  <GeneratedDocumentsList
    documents={generatedDocuments}
    onDownload={handleDownload}
    onEmail={handleEmail}
  />
</DocumentGenerationPage>
```
### Phase 3\.6: Add Workflow Tracking \(Day 29\-30\)
**File**: `src/components/workflow/WorkflowTracker.tsx`
**Purpose**: Visual workflow progress for cases
**Component**:
```typescript
export function WorkflowTracker({ caseId }: Props) {
  const { data: auditLog } = trpc.case.getAuditLog.useQuery({ caseId });
  
  const steps = [
    { status: 'inquiry', label: 'Initial Inquiry', date: auditLog.inquiry },
    { status: 'arrangement', label: 'Arrangement', date: auditLog.arrangement },
    { status: 'service_scheduled', label: 'Service Scheduled', date: auditLog.service },
    { status: 'completed', label: 'Service Completed', date: auditLog.completed },
    { status: 'finalized', label: 'Case Finalized', date: auditLog.finalized },
  ];
  
  return (
    <div className="flex justify-between">
      {steps.map((step, index) => (
        <WorkflowStep
          key={step.status}
          label={step.label}
          date={step.date}
          active={step.date !== null}
          completed={step.date !== null}
          isLast={index === steps.length - 1}
        />
      ))}
    </div>
  );
}
```
**Integration**:
* Add to case detail page header
* Add to case list as hover tooltip
* Add to dashboard for active cases
### Week 5\-6 Validation Checklist
- [ ] Case router enhanced with 10\+ new endpoints
- [ ] **ARCHITECTURE CHECK**: Router delegation pattern followed
- [ ] **ARCHITECTURE CHECK**: `pnpm validate` passing
- [ ] Contract router enhanced with 9\+ new endpoints
- [ ] Cases page wired to real API
- [ ] Contracts page wired to real API
- [ ] **STATE MANAGEMENT CHECK**: All backend data via tRPC
- [ ] Case workflow state machine implemented
- [ ] Document generation functional
- [ ] Workflow tracking component created
- [ ] All case CRUD operations working
- [ ] All contract CRUD operations working
- [ ] Signature tracking working
- [ ] PDF generation working
- [ ] Email delivery working
- [ ] Audit logging working
- [ ] Navigation updated
- [ ] Integration tests passing
- [ ] Manual smoke test completed
***
## Week 7\-8: Polish & Production Readiness
**Goal**: End\-to\-end testing, performance optimization, production deployment
**Deliverables**: Production\-ready system with monitoring and documentation
### Phase 4\.1: Integration Testing \(Day 31\-33\)
**Approach**: Test complete user workflows end\-to\-end
**Test Scenarios**:
1. **Complete Case Workflow**
    * Create case from lead
    * Build contract with line items
    * Send contract for signature
    * Record payment
    * Generate service documents
    * Complete service
    * Finalize case with GL posting
    * Run financial close
2. **Family CRM Workflow**
    * Create family with 3 members
    * Link relationships \(spouse, children\)
    * Create case for deceased family member
    * Verify family appears on case
    * Add notes and interactions
    * Export family tree
3. **Financial Close Workflow**
    * Record multiple payments
    * Post manual journal entries
    * Import bank statement
    * Match transactions
    * Create adjustments
    * Run trial balance
    * Execute period close
    * Generate financial statements
**Testing Tools**:
* Playwright for E2E tests
* Manual test checklist
* User acceptance testing \(UAT\) with stakeholders
**Files to Create**:
* `tests/e2e/case-workflow.spec.ts`
* `tests/e2e/family-crm-workflow.spec.ts`
* `tests/e2e/financial-close-workflow.spec.ts`
* `docs/TESTING_CHECKLIST.md`
### Phase 4\.2: Performance Optimization \(Day 34\-35\)
**Focus Areas**:
1. **Query Optimization**
    * Add database indexes for common queries
    * Implement pagination for large lists
    * Add caching for frequently accessed data
    * Optimize N\+1 queries
2. **Frontend Performance**
    * Code splitting for large pages
    * Lazy loading for modals and wizards
    * Virtualization for long lists \(react\-window\)
    * Image optimization
    * Bundle size analysis
3. **API Performance**
    * Add response caching
    * Implement rate limiting
    * Add request batching
    * Monitor slow queries
**Files to Create/Modify**:
* `packages/infrastructure/prisma/schema.prisma` \(add indexes\)
* `src/lib/trpc-client.ts` \(add query caching\)
* `src/components/virtual-list.tsx` \(virtualization\)
### Phase 4\.3: Error Handling & Monitoring \(Day 36\)
**Setup**:
1. **Error Tracking**
    * Integrate Sentry for error tracking
    * Add breadcrumbs for debugging
    * Custom error boundaries for each domain
    * Error reporting to Slack/email
2. **Performance Monitoring**
    * Add Datadog/New Relic APM
    * Track slow API endpoints
    * Monitor database query performance
    * Track frontend metrics \(Core Web Vitals\)
3. **Logging**
    * Structured logging with Winston
    * Log important business events
    * Request/response logging
    * Audit trail for all mutations
**Files to Create**:
* `packages/infrastructure/src/monitoring/sentry.ts`
* `packages/infrastructure/src/monitoring/datadog.ts`
* `packages/infrastructure/src/logging/logger.ts`
### Phase 4\.4: User Acceptance Testing \(Day 37\-38\)
**Process**:
1. Deploy to staging environment
2. Create test accounts for stakeholders
3. Provide UAT test scripts
4. Collect feedback in structured format
5. Prioritize and fix critical issues
6. Re\-test fixed issues
7. Get sign\-off from stakeholders
**UAT Test Scripts**:
* Create 20 realistic test scenarios
* Provide step\-by\-step instructions
* Include expected outcomes
* Provide feedback form
**File to Create**:
* `docs/UAT_TEST_SCRIPTS.md`
* `docs/UAT_FEEDBACK_FORM.md`
### Phase 4\.5: Documentation \(Day 39\-40\)
**Documents to Create**:
1. **User Documentation**
    * User guide for each major feature
    * Video tutorials for complex workflows
    * FAQ document
    * Troubleshooting guide
2. **Admin Documentation**
    * Deployment guide
    * Configuration guide
    * Backup and recovery procedures
    * Monitoring and alerting setup
3. **Developer Documentation**
    * Architecture overview
    * API documentation \(auto\-generated from tRPC\)
    * Database schema documentation
    * Contributing guide
    * Local development setup
**Files to Create**:
* `docs/user-guide/FINANCIAL_OPERATIONS.md`
* `docs/user-guide/FAMILY_CRM.md`
* `docs/user-guide/CASE_MANAGEMENT.md`
* `docs/admin-guide/DEPLOYMENT.md`
* `docs/admin-guide/MONITORING.md`
* `docs/developer-guide/ARCHITECTURE.md`
* `docs/developer-guide/API_REFERENCE.md`
### Phase 4\.6: Production Deployment \(Day 41\-42\)
**Checklist**:
1. **Pre\-Deployment**
    - [ ] All tests passing \(unit, integration, E2E\)
    - [ ] UAT sign\-off received
    - [ ] Performance benchmarks met
    - [ ] Security audit completed
    - [ ] Database migration scripts tested
    - [ ] Backup procedures verified
    - [ ] Rollback plan documented
    - [ ] Monitoring dashboards configured
    - [ ] Alert thresholds set
    - [ ] Documentation completed
2. **Deployment Steps**
    - [ ] Create production database backup
    - [ ] Run database migrations
    - [ ] Deploy backend services
    - [ ] Deploy frontend application
    - [ ] Verify health checks
    - [ ] Smoke test critical paths
    - [ ] Monitor error rates
    - [ ] Monitor performance metrics
3. **Post\-Deployment**
    - [ ] Monitor for 24 hours
    - [ ] Verify all integrations working
    - [ ] Check error tracking dashboards
    - [ ] Review performance metrics
    - [ ] Collect user feedback
    - [ ] Document any issues
    - [ ] Plan iteration 2 improvements
**Files to Create**:
* `docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
* `docs/deployment/ROLLBACK_PROCEDURE.md`
* `docs/deployment/POST_DEPLOYMENT_MONITORING.md`
### Week 7\-8 Validation Checklist
- [ ] All integration tests passing
- [ ] **FINAL ARCHITECTURE AUDIT**: All layers compliant with ARCHITECTURE\.md
- [ ] **FINAL VALIDATION**: `pnpm validate` passing across all packages
- [ ] E2E test suite completed
- [ ] Performance benchmarks met
- [ ] Error tracking configured
- [ ] Monitoring dashboards live
- [ ] UAT completed with sign\-off
- [ ] All documentation completed
- [ ] **ARCHITECTURE DOCUMENTATION**: Updated with production patterns
- [ ] Production deployment successful
- [ ] Post\-deployment monitoring active
- [ ] Rollback plan tested
- [ ] User training completed
- [ ] System in production use
***
## Success Metrics
**Week 2**: Financial operations fully functional
**Week 4**: Family CRM fully functional
**Week 6**: Core operations fully functional
**Week 8**: Production\-ready system deployed
**Key Performance Indicators**:
* API response time < 200ms \(p95\)
* Page load time < 2 seconds
* Error rate < 0\.1%
* Test coverage > 80%
* User satisfaction > 4\.5/5
* Zero critical bugs in production
***
## Risk Mitigation
**Risk**: Complex workflows take longer than estimated
**Mitigation**: Break into smaller increments, deploy iteratively
**Risk**: Data migration issues
**Mitigation**: Test migrations on staging, maintain rollback scripts
**Risk**: Performance issues under load
**Mitigation**: Load testing before production, horizontal scaling ready
**Risk**: User adoption challenges
**Mitigation**: Comprehensive training, gradual rollout, feedback loops
***
## Next Steps After Week 8
1. **Iteration 2 Planning** \- Based on user feedback
2. **Advanced Features** \- AI\-powered recommendations, predictive analytics
3. **Mobile App** \- React Native app for field staff
4. **Public API** \- REST API for third\-party integrations
5. **Marketplace** \- Template marketplace for documents
***
## Daily Standup Format
For each day of development:
1. What was completed yesterday?
2. What will be completed today?
3. Any blockers or dependencies?
4. Current sprint progress \(%\)
***
## Definition of Done
A feature is "done" when:
- [ ] Code implemented and committed
- [ ] **ARCHITECTURE**: Follows Clean Architecture patterns \(see ARCHITECTURE\.md\)
- [ ] **ARCHITECTURE**: Layer boundaries respected \(no Prisma in application/domain\)
- [ ] **ARCHITECTURE**: Router delegates to use cases \(no business logic\)
- [ ] **STATE MANAGEMENT**: Backend data via tRPC \(not Zustand\)
- [ ] **VALIDATION**: `pnpm validate` passing \(includes layers, circular, type\-check\)
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by peer
- [ ] Documentation updated
- [ ] UI matches design specs
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Toast notifications added
- [ ] Manual smoke test passed
- [ ] Deployed to staging
- [ ] UAT approved \(if applicable\)
***
This plan is **AI\-executable** and provides detailed, step\-by\-step instructions for bridging the backend\-frontend gap systematically over 6\-8 weeks\.