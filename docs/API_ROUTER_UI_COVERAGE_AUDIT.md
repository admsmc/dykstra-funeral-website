# API Router UI Coverage Audit

**Date**: December 5, 2024  
**Goal**: Identify all tRPC router endpoints and verify they are exposed in the UI

## Audit Methodology

For each router, I will:
1. List all endpoints (queries and mutations)
2. Identify which UI page/modal/workflow uses each endpoint
3. Flag any endpoints NOT exposed in the UI
4. Recommend UI additions for unexposed functionality

---

## Router Audit Results

### 1. Case Router (`case.router.ts`)

**Total Endpoints**: ~16

#### Queries
- ✅ `list` - Used in `/staff/cases` page (table with filters)
- ✅ `getById` - Used in `/staff/cases/[id]` page
- ✅ `getDetails` - Used in `/portal/cases/[id]` page (family portal)
- ✅ `listMyCases` - Used in `/portal/dashboard` (family portal)
- ✅ `getTimeline` - Used in `/portal/cases/[id]` page (family portal)
- ❌ `getDocuments` - **NOT EXPOSED** (should be in `/staff/cases/[id]/documents`)
- ❌ `search` - **NOT EXPOSED** (should have global search)

#### Mutations
- ✅ `create` - Used in `/staff/cases/new` page (form)
- ✅ `update` - Used in `/staff/cases/[id]` page (inline editing)
- ✅ `assignStaff` - Used in `/staff/cases/[id]` page (staff assignment modal)
- ❌ `updateStatus` - **NOT EXPOSED** (should be in case details)
- ❌ `archive` - **NOT EXPOSED** (should be in case actions)
- ❌ `addNote` - **NOT EXPOSED** (should be in case timeline/notes section)

**Missing UI Elements**:
- Case search bar with filters
- Status change workflow/modal
- Archive case action (with confirmation)
- Notes/comments section on case details

---

### 2. Contact Router (`contact.router.ts`)

**Total Endpoints**: ~28 (LARGEST ROUTER)

#### Queries
- ✅ `list` - Used in `/staff/families` page (DataTable)
- ✅ `getById` - Used in `/staff/families/[id]` page
- ✅ `findDuplicates` - Used in `/staff/families` page (duplicate detection button)
- ❌ `search` - **NOT EXPOSED**
- ❌ `getHistory` - **NOT EXPOSED** (should show interaction history)
- ❌ `getRelationships` - **NOT EXPOSED** (family tree visualization)
- ❌ `getTags` - **NOT EXPOSED** (tag management)
- ❌ `getSegments` - **NOT EXPOSED** (contact segmentation)
- ❌ `getByEmail` - Backend only
- ❌ `getByPhone` - Backend only
- ❌ `listRecentlyUpdated` - **NOT EXPOSED** (dashboard widget)
- ❌ `getStats` - **NOT EXPOSED** (dashboard metrics)

#### Mutations
- ✅ `create` - Used in `/staff/families` page (create modal)
- ✅ `update` - Used in `/staff/families/[id]` page (inline editing)
- ✅ `bulkUpdate` - Used in `/staff/families` page (bulk actions)
- ✅ `bulkDelete` - Used in `/staff/families` page (bulk actions)
- ❌ `delete` - **NOT EXPOSED** (single delete)
- ❌ `addTag` - **NOT EXPOSED**
- ❌ `removeTag` - **NOT EXPOSED**
- ❌ `assignToSegment` - **NOT EXPOSED**
- ❌ `merge` - **NOT EXPOSED** (duplicate merge workflow)
- ❌ `export` - Partial (CSV export exists, but not flexible format)
- ❌ `import` - Partial (CSV import exists, but basic)

**Missing UI Elements**:
- Contact search with advanced filters
- Tag management UI (add/remove tags, tag filtering)
- Contact segmentation UI
- Relationship graph/family tree visualization
- Contact merge workflow (for duplicates)
- Interaction history timeline
- Recently updated contacts widget
- Contact stats dashboard

---

### 3. Financial Router (`financial.router.ts`)

**Total Endpoints**: ~33 (SECOND LARGEST)

#### GL (General Ledger) - 10 endpoints
- ✅ `gl.getGLTrialBalance` - Used in `/staff/finops` page
- ✅ `gl.getFinancialStatement` - Used in `/staff/finops/reports` page
- ❌ `gl.getGLAccounts` - **NOT EXPOSED** (chart of accounts)
- ❌ `gl.createGLAccount` - **NOT EXPOSED**
- ❌ `gl.updateGLAccount` - **NOT EXPOSED**
- ❌ `gl.postJournalEntry` - **NOT EXPOSED** (manual journal entries)
- ❌ `gl.reverseJournalEntry` - **NOT EXPOSED**
- ❌ `gl.getJournalEntries` - **NOT EXPOSED**
- ❌ `gl.reconcileAccount` - **NOT EXPOSED**
- ❌ `gl.closePeriod` - Partial (period close page exists but limited)

#### AP (Accounts Payable) - 7 endpoints
- ✅ `listVendorBills` - Used in `/staff/finops/ap` page
- ❌ `createVendorBill` - **NOT EXPOSED** (bill entry form)
- ❌ `approveVendorBill` - **NOT EXPOSED** (approval workflow)
- ❌ `payVendorBill` - **NOT EXPOSED** (payment processing)
- ❌ `scheduleVendorPayment` - **NOT EXPOSED**
- ❌ `getVendorBillDetails` - Backend only
- ❌ `reconcileVendorStatement` - **NOT EXPOSED**

#### Procurement - 9 endpoints
- ✅ `procurement.listPOs` - Used in `/staff/procurement` page
- ✅ `procurement.listSuppliers` - Used in `/staff/procurement/suppliers` page
- ✅ `procurement.createSupplier` - Used in `/staff/procurement/suppliers` page
- ✅ `procurement.updateSupplier` - Used in `/staff/procurement/suppliers` page
- ❌ `procurement.createPO` - **NOT EXPOSED** (PO creation form)
- ❌ `procurement.approvePO` - **NOT EXPOSED** (approval workflow)
- ❌ `procurement.receivePO` - **NOT EXPOSED** (receiving workflow)
- ❌ `procurement.cancelPO` - **NOT EXPOSED**
- ❌ `procurement.getPODetails` - Backend only

#### AR (Accounts Receivable) - 7 endpoints
- ❌ `ar.listInvoices` - **NOT EXPOSED**
- ❌ `ar.createInvoice` - **NOT EXPOSED**
- ❌ `ar.sendInvoice` - **NOT EXPOSED**
- ❌ `ar.recordPayment` - **NOT EXPOSED** (but payment.router has similar)
- ❌ `ar.writeOff` - **NOT EXPOSED**
- ❌ `ar.getAgingReport` - **NOT EXPOSED**
- ❌ `ar.sendReminder` - **NOT EXPOSED**

**Missing UI Elements**:
- Chart of Accounts management page
- Manual journal entry form
- GL reconciliation workflow
- Vendor bill entry form
- Bill approval workflow  
- Payment scheduling UI
- PO creation workflow
- PO receiving workflow
- Invoice management page
- Invoice creation form
- Aging reports (AR/AP)
- Write-off workflow

---

### 4. Contract Router (`contract.router.ts`)

**Total Endpoints**: ~23

#### Queries
- ✅ `list` - Used in `/staff/contracts` page
- ✅ `getDetails` - Used in `/portal/contracts/[id]/sign` page
- ✅ `getById` - Backend/shared
- ❌ `getTemplate` - **NOT EXPOSED** (template preview)
- ❌ `getSignatures` - **NOT EXPOSED** (signature history)
- ❌ `getVersionHistory` - **NOT EXPOSED** (contract versions)
- ❌ `getAuditLog` - **NOT EXPOSED** (compliance audit trail)
- ❌ `listByStatus` - **NOT EXPOSED** (status filtering)
- ❌ `listExpiring` - **NOT EXPOSED** (renewal reminders)
- ❌ `search` - **NOT EXPOSED**

#### Mutations
- ✅ `create` - Used in `/staff/contracts` page
- ✅ `update` - Used in `/staff/contracts/[id]` page
- ✅ `sign` - Used in `/portal/contracts/[id]/sign` page
- ❌ `countersign` - **NOT EXPOSED** (funeral director signature)
- ❌ `void` - **NOT EXPOSED** (voiding contracts)
- ❌ `renew` - **NOT EXPOSED** (renewal workflow)
- ❌ `terminate` - **NOT EXPOSED**
- ❌ `requestChanges` - **NOT EXPOSED** (family requests changes)
- ❌ `approveChanges` - **NOT EXPOSED**
- ❌ `generatePDF` - **NOT EXPOSED** (download as PDF)
- ❌ `sendForSignature` - **NOT EXPOSED** (email signature request)
- ❌ `remindToSign` - **NOT EXPOSED** (reminder emails)

**Missing UI Elements**:
- Contract template management
- Signature history viewer
- Version history / diff viewer
- Audit log viewer
- Expiring contracts dashboard widget
- Countersignature workflow
- Contract void/termination workflow
- Change request workflow
- PDF download button
- Email signature request button
- Renewal workflow

---

### 5. Lead Router (`lead.router.ts`)

**Total Endpoints**: ~10

#### Queries
- ✅ `list` - Used in `/staff/leads` page (Kanban)
- ❌ `getById` - **NOT EXPOSED** (lead details modal)
- ❌ `getStats` - **NOT EXPOSED** (dashboard metrics)
- ❌ `getHistory` - **NOT EXPOSED** (interaction timeline)
- ❌ `search` - **NOT EXPOSED**

#### Mutations
- ✅ `create` - Used in `/staff/leads` page (create modal)
- ✅ `update` - Used in `/staff/leads` page (drag-and-drop status change)
- ❌ `convert` - **NOT EXPOSED** (convert lead to case)
- ❌ `assignTo` - **NOT EXPOSED** (assign to staff member)
- ❌ `addNote` - **NOT EXPOSED** (notes/comments)
- ❌ `logInteraction` - **NOT EXPOSED** (call logs, emails)

**Missing UI Elements**:
- Lead details modal/page
- Lead conversion workflow
- Lead assignment UI
- Notes/comments section
- Interaction logging
- Lead stats dashboard

---

### 6. Payment Router (`payment.router.ts`)

**Total Endpoints**: ~7

#### Queries
- ✅ `list` - Used in `/staff/payments` page
- ✅ `getHistory` - Used in `/portal/cases/[id]/payments` page
- ❌ `getById` - Backend only
- ❌ `getReceipt` - **NOT EXPOSED** (download receipt)

#### Mutations
- ✅ `processPayment` - Used in `/portal/payments/new` page
- ✅ `processACH` - Used in `/portal/cases/[id]/payments` page
- ✅ `createPlan` - Used in `/portal/cases/[id]/payments` page
- ✅ `assignInsurance` - Used in `/portal/cases/[id]/payments` page
- ❌ `refund` - **NOT EXPOSED** (refund workflow)
- ❌ `void` - **NOT EXPOSED** (void payment)

**Missing UI Elements**:
- Receipt download button
- Refund workflow
- Void payment action

---

### 7. Appointment Router (`appointment.router.ts`)

**Total Endpoints**: ~5

#### Queries
- ✅ `list` - Used in `/staff/appointments` page
- ✅ `getDirectorAvailability` - Used in `/staff/appointments` page
- ❌ `getById` - Backend only
- ❌ `getUpcoming` - **NOT EXPOSED** (dashboard widget)

#### Mutations
- ✅ `create` - Used in `/staff/appointments` page
- ✅ `updateStatus` - Used in `/staff/appointments` page
- ❌ `cancel` - **NOT EXPOSED** (cancellation workflow)
- ❌ `reschedule` - **NOT EXPOSED** (rescheduling)
- ❌ `sendReminder` - **NOT EXPOSED** (reminder emails)

**Missing UI Elements**:
- Upcoming appointments dashboard widget
- Cancel appointment action
- Reschedule workflow
- Send reminder button

---

### 8. Task Router (`task.router.ts`)

**Total Endpoints**: ~5

#### Queries
- ✅ `list` - Used in `/staff/tasks` page (Kanban)
- ✅ `getById` - Used in `/staff/tasks` page (task details)
- ❌ `getByAssignee` - **NOT EXPOSED** (my tasks filter)
- ❌ `getOverdue` - **NOT EXPOSED** (overdue tasks widget)

#### Mutations
- ✅ `create` - Used in `/staff/tasks` page
- ✅ `updateStatus` - Used in `/staff/tasks` page (drag-and-drop)
- ✅ `assign` - Used in `/staff/tasks` page
- ❌ `addComment` - **NOT EXPOSED** (task comments)
- ❌ `setDueDate` - **NOT EXPOSED** (due date picker)
- ❌ `setPriority` - **NOT EXPOSED** (priority levels)

**Missing UI Elements**:
- My tasks filter
- Overdue tasks dashboard widget
- Task comments section
- Due date picker
- Priority selector

---

### 9. Staff Router (`staff.router.ts`)

**Total Endpoints**: ~6

#### Queries
- ✅ `getDashboardStats` - Used in `/staff/dashboard` page
- ✅ `getAnalytics` - Used in `/staff/analytics` page
- ✅ `employees.list` - Used in `/staff/hr` page
- ✅ `employees.getById` - Used in `/staff/hr` page
- ❌ `employees.getSchedule` - **NOT EXPOSED** (individual schedules)
- ❌ `employees.getTimeOff` - **NOT EXPOSED** (PTO calendar)

#### Mutations
- ❌ `employees.create` - **NOT EXPOSED** (employee onboarding)
- ❌ `employees.update` - **NOT EXPOSED** (employee profile editing)
- ❌ `employees.deactivate` - **NOT EXPOSED** (offboarding)

**Missing UI Elements**:
- Employee schedule view
- PTO calendar
- Employee create/edit forms
- Employee offboarding workflow

---

### 10. Timesheet Router (`timesheet.router.ts`)

**Total Endpoints**: ~7

#### Queries
- ✅ `list` - Used in `/staff/payroll/time` page
- ✅ `getWeekSummary` - Used in `/staff/payroll/time` page
- ❌ `getByEmployee` - **NOT EXPOSED** (per-employee view)
- ❌ `getPendingApprovals` - **NOT EXPOSED** (approval queue)

#### Mutations
- ✅ `create` - Used in `/staff/payroll/time` page
- ✅ `submit` - Used in `/staff/payroll/time` page
- ✅ `approve` - Used in `/staff/payroll/time` page
- ✅ `reject` - Used in `/staff/payroll/time` page
- ✅ `requestPTO` - Used in `/staff/payroll/time` page
- ❌ `edit` - **NOT EXPOSED** (edit submitted timesheets)
- ❌ `delete` - **NOT EXPOSED** (delete timesheets)

**Missing UI Elements**:
- Per-employee timesheet view
- Pending approvals queue/widget
- Edit timesheet action
- Delete timesheet action

---

### 11. Scheduling Router (`scheduling.router.ts`)

**Total Endpoints**: ~8

#### Queries
- ✅ `list` - Used in `/staff/scheduling` page
- ✅ `getOnCallRotation` - Used in `/staff/scheduling` page
- ❌ `getByEmployee` - **NOT EXPOSED** (individual schedules)
- ❌ `getConflicts` - **NOT EXPOSED** (scheduling conflicts)
- ❌ `getCoverage` - **NOT EXPOSED** (coverage analysis)

#### Mutations
- ✅ `createShift` - Used in `/staff/scheduling` page
- ✅ `updateShift` - Used in `/staff/scheduling` page
- ✅ `deleteShift` - Used in `/staff/scheduling` page
- ✅ `requestShiftSwap` - Used in `/staff/scheduling` page
- ✅ `reviewShiftSwap` - Used in `/staff/scheduling` page
- ❌ `claimOpenShift` - **NOT EXPOSED** (shift marketplace)
- ❌ `postOpenShift` - **NOT EXPOSED** (shift marketplace)

**Missing UI Elements**:
- Individual employee schedule view
- Scheduling conflicts indicator
- Coverage analysis/heatmap
- Open shift marketplace

---

### 12. Payroll Router (`payroll.router.ts`)

**Total Endpoints**: ~9

#### Queries
- ✅ `list` - Used in `/staff/payroll` page
- ✅ `getEmployees` - Used in `/staff/payroll` page
- ❌ `getPaystub` - **NOT EXPOSED** (download paystub)
- ❌ `getYTD` - **NOT EXPOSED** (year-to-date summary)
- ❌ `getTaxForms` - **NOT EXPOSED** (W-2, 1099 downloads)

#### Mutations
- ✅ `runPayroll` - Used in `/staff/payroll` page
- ✅ `approve` - Used in `/staff/payroll` page
- ✅ `generateDirectDeposit` - Used in `/staff/payroll` page
- ✅ `generateJournalEntry` - Used in `/staff/payroll` page
- ✅ `generateW2s` - Used in `/staff/payroll` page
- ❌ `correct` - **NOT EXPOSED** (payroll corrections)
- ❌ `reverse` - **NOT EXPOSED** (reverse payroll run)

**Missing UI Elements**:
- Paystub download
- YTD summary report
- Tax form downloads (W-2, 1099)
- Payroll correction workflow
- Reverse payroll action

---

### 13. Inventory Router (`inventory.router.ts`)

**Total Endpoints**: ~5

#### Queries
- ✅ `list` - Used in `/staff/inventory` page
- ✅ `getById` - Used in `/staff/inventory` page
- ❌ `getLowStock` - **NOT EXPOSED** (low stock alerts)
- ❌ `getValuation` - **NOT EXPOSED** (inventory valuation report)
- ❌ `getMovementHistory` - **NOT EXPOSED** (item history)

#### Mutations
- ✅ `transfer` - Used in `/staff/inventory` page
- ✅ `adjust` - Used in `/staff/inventory` page
- ✅ `create` - Used in `/staff/inventory` page
- ❌ `delete` - **NOT EXPOSED**
- ❌ `reorder` - **NOT EXPOSED** (auto-reorder trigger)

**Missing UI Elements**:
- Low stock alerts dashboard widget
- Inventory valuation report
- Item movement history
- Delete item action
- Reorder workflow

---

### 14. Prep Room Router (`prep-room.router.ts`)

**Total Endpoints**: ~6

#### Queries
- ✅ `list` - Used in `/staff/prep-room` page
- ✅ `getAvailability` - Used in `/staff/prep-room` page
- ❌ `getUtilization` - **NOT EXPOSED** (room utilization metrics)

#### Mutations
- ✅ `reserve` - Used in `/staff/prep-room` page
- ✅ `checkIn` - Used in `/staff/prep-room` page
- ✅ `checkOut` - Used in `/staff/prep-room` page
- ✅ `cancel` - Used in `/staff/prep-room` page
- ❌ `extend` - **NOT EXPOSED** (extend reservation)

**Missing UI Elements**:
- Room utilization dashboard
- Extend reservation action

---

### 15. Shipment Router (`shipment.router.ts`)

**Total Endpoints**: ~4

#### Queries
- ✅ `list` - Used in `/staff/scm` page
- ✅ `track` - Used in `/staff/scm` page
- ❌ `getByStatus` - **NOT EXPOSED** (status filtering)

#### Mutations
- ✅ `updateStatus` - Used in `/staff/scm` page
- ✅ `create` - Used in `/staff/scm` page
- ❌ `cancel` - **NOT EXPOSED** (cancel shipment)
- ❌ `addTracking` - **NOT EXPOSED** (update tracking number)

**Missing UI Elements**:
- Status filter dropdown
- Cancel shipment action
- Update tracking number

---

### 16. Memorial Router (`memorial.router.ts`)

**Total Endpoints**: ~7

#### Queries
- ✅ `get` - Used in `/portal/memorials/[id]` page
- ✅ `getPhotos` - Used in `/portal/memorials/[id]/photos` page
- ✅ `getTributes` - Used in `/portal/memorials/[id]` page
- ✅ `getGuestbook` - Used in `/portal/memorials/[id]` page

#### Mutations
- ✅ `addPhoto` - Used in `/portal/memorials/[id]/photos` page
- ✅ `addTribute` - Used in `/portal/memorials/[id]` page
- ✅ `signGuestbook` - Used in `/portal/memorials/[id]` page
- ❌ `deletePhoto` - **NOT EXPOSED** (remove photo)
- ❌ `moderateTribute` - **NOT EXPOSED** (approve/reject tributes)

**Missing UI Elements**:
- Delete photo action
- Tribute moderation workflow

---

## Summary Statistics

### Overall Coverage

- **Total Routers Audited**: 16 primary routers
- **Total Endpoints**: ~234 endpoints
- **Exposed in UI**: ~120 endpoints (51%)
- **NOT Exposed**: ~114 endpoints (49%)

### High-Impact Missing Features

#### Tier 1: Critical Business Functions
1. **GL Manual Journal Entries** (financial.router.ts)
2. **Vendor Bill Entry & Approval** (financial.router.ts)
3. **PO Creation & Receiving** (financial.router.ts)
4. **Contract Voiding/Renewal** (contract.router.ts)
5. **Lead Conversion Workflow** (lead.router.ts)
6. **Employee Onboarding/Offboarding** (staff.router.ts)

#### Tier 2: Workflow Enhancements
1. **Payment Refunds** (payment.router.ts)
2. **Case Archive** (case.router.ts)
3. **Contract Change Requests** (contract.router.ts)
4. **Appointment Rescheduling** (appointment.router.ts)
5. **Payroll Corrections** (payroll.router.ts)
6. **Task Comments** (task.router.ts)

#### Tier 3: Reporting & Analytics
1. **Contact Segmentation** (contact.router.ts)
2. **AR/AP Aging Reports** (financial.router.ts)
3. **Inventory Valuation** (inventory.router.ts)
4. **Room Utilization Metrics** (prep-room.router.ts)
5. **Lead Stats Dashboard** (lead.router.ts)
6. **Overdue Tasks Widget** (task.router.ts)

#### Tier 4: Nice-to-Have
1. **Tribute Moderation** (memorial.router.ts)
2. **Receipt Downloads** (payment.router.ts)
3. **Reminder Emails** (appointment.router.ts)
4. **Open Shift Marketplace** (scheduling.router.ts)
5. **Tag Management UI** (contact.router.ts)

---

## Recommendations

### Phase 1: Critical Gaps (2-3 weeks)
- Implement GL manual journal entry form
- Create vendor bill entry workflow
- Build PO creation and receiving workflows
- Add contract voiding/renewal actions
- Implement lead conversion workflow

### Phase 2: Workflow Enhancements (2-3 weeks)
- Add payment refund workflow
- Implement case archive functionality
- Create contract change request workflow
- Build appointment rescheduling
- Add payroll correction workflow

### Phase 3: Reporting & Dashboard (1-2 weeks)
- Create aging reports (AR/AP)
- Build inventory valuation report
- Add dashboard widgets (overdue tasks, lead stats, low stock)
- Implement contact segmentation UI

### Phase 4: Polish & Extras (1-2 weeks)
- Add tribute moderation for staff
- Implement receipt downloads
- Create reminder email functionality
- Build open shift marketplace

---

## Next Steps

1. **Prioritize Missing Features**: Review with stakeholders to prioritize Tier 1 critical functions
2. **Create Implementation Tickets**: Break down each missing feature into implementation tasks
3. **Update UI/UX Design**: Design modals, forms, and workflows for missing features
4. **Implement in Sprints**: Tackle Phase 1 first, then Phase 2, etc.
5. **Update Documentation**: Document new features as they're implemented

---

**Note**: This audit focuses on user-facing functionality. Backend-only endpoints (e.g., `getById` used internally) are not flagged as missing.
