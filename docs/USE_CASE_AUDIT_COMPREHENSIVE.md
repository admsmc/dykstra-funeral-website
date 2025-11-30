# Comprehensive Use Case Audit & Gap Analysis

**Date**: 2025-11-29  
**Status**: Requirements Document  
**Scope**: Identify all missing cross-domain use cases based on available TS + Go functionality

---

## Executive Summary

This audit identifies **35 missing use cases** across 8 categories that should be implemented to provide complete funeral home management functionality. These use cases leverage existing TypeScript CRM and Go ERP ports but lack the orchestration layer.

### Current State
- ✅ **Implemented**: 3 cross-domain use cases (Lead→Contract, Inventory→Case, Payment→AR)
- ❌ **Missing**: 35 use cases across financial, operational, reporting, and administrative workflows

---

## Audit Methodology

1. **Inventory Available Ports**: 
   - TypeScript: 15 repositories (Case, Lead, Contact, Payment, etc.)
   - Go: 20 ports with 142 methods (Contract, Financial, Inventory, Payroll, etc.)

2. **Identify Business Workflows**:
   - Extract from business requirement docs
   - Map to funeral home operations
   - Consider month-end/year-end processes

3. **Gap Analysis**:
   - Compare workflows to existing use cases
   - Identify missing orchestrations
   - Prioritize by business impact

---

## Category 1: Financial Operations (12 Use Cases)

### 1.1 Finalize Case with GL Posting ⭐ CRITICAL
**Priority**: HIGH  
**Business Impact**: Monthly close cannot complete without this

**Orchestration**:
1. TypeScript: Load case and validate all services delivered
2. TypeScript: Calculate final totals (services + products + adjustments)
3. Go Financial: Create journal entry with line items:
   - DR: AR (total amount)
   - CR: Revenue - Professional Services (by GL account)
   - CR: Revenue - Merchandise (by GL account)
   - CR: Revenue - Facilities (by GL account)
4. Go Financial: Post journal entry to GL
5. TypeScript: Mark case as finalized with GL journal ID
6. TypeScript: Update case status to "closed"

**Ports Used**:
- `CaseRepository` (TS)
- `GoContractPort` (to get contract details)
- `GoFinancialPort.createJournalEntry`
- `GoFinancialPort.postJournalEntry`

**Missing From**: Current implementation

---

### 1.2 Month-End Close Process ⭐ CRITICAL
**Priority**: HIGH  
**Business Impact**: Required monthly for accurate financials

**Orchestration**:
1. Go Financial: Get trial balance for the period
2. Go Financial: Generate P&L statement
3. Go Financial: Generate balance sheet
4. Go Financial: Run month-end depreciation (Fixed Assets)
5. Go Reconciliations: Verify all bank accounts reconciled
6. Go Financial: Create closing journal entries (accruals, deferrals)
7. Go Financial: Lock period (prevent backdated transactions)
8. TypeScript: Create audit log entry with close summary

**Ports Used**:
- `GoFinancialPort.getTrialBalance` ⚠️ (missing method)
- `GoFinancialPort.generateBalanceSheet` ⚠️ (missing method)
- `GoFinancialPort.generateFinancialStatement` (P&L)
- `GoFixedAssetsPort.runMonthlyDepreciation`
- `GoReconciliationsPort.listReconciliations`
- `GoFinancialPort.createJournalEntry`
- `AuditLogRepository` (TS)

**Missing From**: Current implementation + port methods

---

### 1.3 Create Invoice from Contract
**Priority**: HIGH  
**Business Impact**: AR cannot function without invoicing

**Orchestration**:
1. Go Contract: Get contract by ID
2. Validate contract is approved/signed
3. Go Financial: Create AR invoice from contract line items
4. TypeScript: Link invoice ID to case metadata
5. TypeScript: Update case balance

**Ports Used**:
- `GoContractPort.getContract`
- `GoFinancialPort.createInvoice`
- `CaseRepository` (TS)

**Missing From**: Current implementation

---

### 1.4 Batch Payment Application
**Priority**: MEDIUM  
**Business Impact**: Efficiency for processing multiple payments

**Orchestration**:
1. TypeScript: Load multiple cases with outstanding balances
2. For each payment in batch:
   - Go Financial: Record payment in AR
   - TypeScript: Update case balance
   - TypeScript: Create payment record
3. TypeScript: Generate batch receipt report

**Ports Used**:
- `CaseRepository` (TS)
- `PaymentRepository` (TS)
- `GoFinancialPort.recordPayment`

**Missing From**: Current implementation

---

### 1.5 Insurance Claim Processing
**Priority**: HIGH  
**Business Impact**: 30-40% of funeral payments via insurance

**Orchestration**:
1. TypeScript: Load case with insurance assignment
2. TypeScript: Create claim record with supporting documents
3. Go Financial: Create AR aging entry (insurance receivable)
4. TypeScript: Track claim status (submitted, approved, paid, denied)
5. On payment received:
   - Go Financial: Record payment from insurance
   - TypeScript: Update case balance
   - TypeScript: Mark claim as paid

**Ports Used**:
- `CaseRepository` (TS)
- `InsuranceRepository` ⚠️ (needs creation)
- `GoFinancialPort.createInvoice`
- `GoFinancialPort.recordPayment`
- `GoFinancialPort.getARAgingReport`

**Missing From**: Current implementation + insurance repository

---

### 1.6 Refund Processing
**Priority**: MEDIUM  
**Business Impact**: Handle cancellations and overpayments

**Orchestration**:
1. TypeScript: Load original payment record
2. Validate refund amount ≤ original payment
3. Go Financial: Create credit memo in AR
4. Go Financial: Record refund payment (negative)
5. TypeScript: Create refund payment record (linked to original)
6. TypeScript: Update case balance
7. TypeScript: Update original payment status to "refunded"

**Ports Used**:
- `PaymentRepository` (TS)
- `CaseRepository` (TS)
- `GoFinancialPort.recordPayment`

**Missing From**: Current implementation

---

### 1.7 AR Aging Report Generation
**Priority**: MEDIUM  
**Business Impact**: Collection management

**Orchestration**:
1. Go Financial: Get AR aging report (0-30, 31-60, 61-90, 90+)
2. TypeScript: Enrich with case details (family name, funeral director, notes)
3. TypeScript: Generate actionable report with follow-up tasks
4. TypeScript: Create tasks for overdue accounts

**Ports Used**:
- `GoFinancialPort.getARAgingReport`
- `CaseRepository` (TS)
- `TaskRepository` (TS)

**Missing From**: Current implementation

---

### 1.8 Vendor Bill Processing (AP)
**Priority**: MEDIUM  
**Business Impact**: Pay suppliers (flowers, transportation, etc.)

**Orchestration**:
1. TypeScript: Upload vendor invoice document
2. Go Financial: OCR scan bill (extract amount, vendor, date)
3. TypeScript: Link bill to case (if applicable)
4. Go Financial: Create AP bill entry
5. Go Financial: Trigger approval workflow
6. On approval: Go Financial: Schedule payment

**Ports Used**:
- `GoFinancialPort.uploadAndScanBill`
- `GoFinancialPort.createVendorBill`
- `GoFinancialPort.approveVendorBill`
- `GoApprovalWorkflowPort.createApprovalRequest`
- `CaseRepository` (TS)
- `StoragePort` (TS - for document upload)

**Missing From**: Current implementation

---

### 1.9 AP Payment Run
**Priority**: MEDIUM  
**Business Impact**: Batch vendor payments

**Orchestration**:
1. Go Financial: List approved vendor bills by due date
2. User selects bills to pay
3. Go Financial: Create payment run (batch)
4. Go Financial: Generate payment file (ACH, check print)
5. User confirms execution
6. Go Financial: Mark bills as paid
7. Go Financial: Create GL entries (DR: AP, CR: Cash)

**Ports Used**:
- `GoFinancialPort.listVendorBills`
- `GoFinancialPort.createAPPaymentRun` ⚠️ (missing method)
- `GoFinancialPort.getAPPaymentRun` ⚠️ (missing method)
- `GoFinancialPort.payVendorBills`

**Missing From**: Current implementation + port methods

---

### 1.10 Bank Reconciliation
**Priority**: HIGH  
**Business Impact**: Monthly close requirement

**Orchestration**:
1. TypeScript: Upload bank statement CSV
2. Go Reconciliations: Create reconciliation record
3. Go Financial: Get unreconciled GL transactions (cash account)
4. Go Reconciliations: Auto-match by amount/date
5. User manually matches remaining items
6. Go Reconciliations: Mark items as cleared
7. Go Reconciliations: Complete reconciliation
8. Go Financial: Post reconciliation adjustment entry (if needed)

**Ports Used**:
- `GoReconciliationsPort.createReconciliation`
- `GoReconciliationsPort.markItemCleared`
- `GoReconciliationsPort.completeReconciliation`
- `GoFinancialPort.listJournalEntries`
- `StoragePort` (TS)

**Missing From**: Current implementation

---

### 1.11 Budget vs. Actual Variance Report
**Priority**: LOW  
**Business Impact**: Management reporting

**Orchestration**:
1. Go Budget: Get approved budget for period
2. Go Financial: Get actual GL transactions for period
3. Go Budget: Generate variance report by account
4. TypeScript: Enrich with commentary and KPIs
5. TypeScript: Generate management report

**Ports Used**:
- `GoBudgetPort.getBudget`
- `GoBudgetPort.getBudgetVarianceReport`
- `GoFinancialPort.listJournalEntries`

**Missing From**: Current implementation

---

### 1.12 Sales Tax Reporting
**Priority**: MEDIUM  
**Business Impact**: Compliance (if applicable by state)

**Orchestration**:
1. Go Financial: Query taxable sales for period
2. Calculate sales tax collected by jurisdiction
3. Generate sales tax return report
4. Create remittance journal entry
5. Generate payment voucher

**Ports Used**:
- `GoFinancialPort.listInvoices`
- `GoFinancialPort.createJournalEntry`

**Missing From**: Current implementation

---

## Category 2: Inventory & Procurement (6 Use Cases)

### 2.1 Purchase Requisition to PO
**Priority**: HIGH  
**Business Impact**: Replenish inventory (caskets, urns, supplies)

**Orchestration**:
1. Go Inventory: Get items below reorder point
2. TypeScript: Create purchase requisition with suggested quantities
3. Go Procurement: Create requisition record
4. Go Approval: Submit for approval
5. On approval: Go Procurement: Convert to purchase order
6. Go Procurement: Send PO to vendor (email)

**Ports Used**:
- `GoInventoryPort.getItemsBelowReorderPoint`
- `GoProcurementPort.createRequisition` ⚠️ (missing port)
- `GoProcurementPort.createPurchaseOrder` ⚠️ (missing port)
- `GoApprovalWorkflowPort.createApprovalRequest`

**Missing From**: Current implementation + Procurement port

---

### 2.2 Receive Inventory from PO
**Priority**: HIGH  
**Business Impact**: Update inventory quantities

**Orchestration**:
1. Go Procurement: Get open purchase order
2. User records receipt (quantity received, receipt date)
3. Go Inventory: Receive inventory (increase quantity)
4. Go Procurement: Update PO status (fully/partially received)
5. If fully received: Go Financial: Create AP bill (3-way match)

**Ports Used**:
- `GoProcurementPort.getPurchaseOrder` ⚠️ (missing port)
- `GoInventoryPort.receiveInventory`
- `GoProcurementPort.recordReceipt` ⚠️ (missing port)
- `GoFinancialPort.createVendorBill`
- `GoFinancialPort.getThreeWayMatchStatus`

**Missing From**: Current implementation + Procurement port

---

### 2.3 Inventory Transfer Between Locations
**Priority**: MEDIUM  
**Business Impact**: Multi-location funeral homes

**Orchestration**:
1. TypeScript: Select items to transfer with quantities
2. Go Inventory: Check availability at source location
3. Go Inventory: Create transfer order
4. Go Inventory: Execute transfer (decrease source, increase destination)
5. TypeScript: Generate transfer receipt

**Ports Used**:
- `GoInventoryPort.getBalance`
- `GoInventoryPort.transferInventory`

**Missing From**: Current implementation

---

### 2.4 Inventory Cycle Count
**Priority**: MEDIUM  
**Business Impact**: Maintain accurate inventory

**Orchestration**:
1. TypeScript: Generate cycle count assignment (items to count)
2. User performs physical count
3. TypeScript: Record count results
4. Go Inventory: Calculate variances (system vs. physical)
5. Go Inventory: Create adjustment transactions for variances
6. Go Financial: Post inventory adjustment GL entries (DR/CR Inventory)

**Ports Used**:
- `GoInventoryPort.listItems`
- `GoInventoryPort.getBalance`
- `GoInventoryPort.adjustInventory`
- `GoFinancialPort.createJournalEntry`

**Missing From**: Current implementation

---

### 2.5 Inventory Valuation Report (WAC)
**Priority**: MEDIUM  
**Business Impact**: Balance sheet accuracy

**Orchestration**:
1. Go Inventory: Get all inventory items with quantities
2. Go Inventory: Get WAC (weighted average cost) per item
3. Calculate total inventory value
4. Generate inventory valuation report
5. Compare to GL inventory account balance

**Ports Used**:
- `GoInventoryPort.listItems`
- `GoInventoryPort.getBalance`
- `GoFinancialPort.getGLAccountByNumber`

**Missing From**: Current implementation

---

### 2.6 Commit Inventory Reservation (After Service Delivered)
**Priority**: HIGH  
**Business Impact**: Move from reserved to COGS

**Orchestration**:
1. TypeScript: Load case with inventory reservations
2. Go Inventory: Commit reservations (convert to sold)
3. Go Financial: Create COGS journal entry:
   - DR: COGS - Merchandise
   - CR: Inventory (at WAC cost)
4. TypeScript: Mark case inventory as delivered
5. TypeScript: Update case P&L with COGS

**Ports Used**:
- `CaseRepository` (TS)
- `GoInventoryPort.commitReservation`
- `GoFinancialPort.createJournalEntry`

**Missing From**: Current implementation

---

## Category 3: Payroll & Time Tracking (5 Use Cases)

### 3.1 Create Payroll Run from Timesheets ⭐ CRITICAL
**Priority**: HIGH  
**Business Impact**: Biweekly payroll processing

**Orchestration**:
1. TypeScript: Get all approved timesheets for pay period
2. Aggregate hours by employee
3. Go Payroll: Import time entries
4. Go Payroll: Create payroll run
5. Go Payroll: Calculate payroll (gross, taxes, net)
6. Go Payroll: Get payroll line items (review)
7. User approves
8. Go Payroll: Approve payroll run
9. Go Payroll: Mark as paid (after ACH execution)
10. Go Financial: Create payroll GL entries

**Ports Used**:
- `GoTimesheetPort.listTimesheets` ⚠️ (missing port)
- `GoPayrollPort.importTimeEntries` ⚠️ (missing method)
- `GoPayrollPort.createPayrollRun`
- `GoPayrollPort.calculatePayroll`
- `GoPayrollPort.getPayrollLineItems`
- `GoPayrollPort.approvePayrollRun`
- `GoPayrollPort.markPayrollPaid`
- `GoFinancialPort.createJournalEntry`

**Missing From**: Current implementation + port/methods

---

### 3.2 Submit Timesheet for Approval
**Priority**: HIGH  
**Business Impact**: Weekly time tracking

**Orchestration**:
1. TypeScript: Employee selects pay period
2. TypeScript: Employee enters hours per day/case
3. Go Timesheet: Create timesheet with entries
4. Go Timesheet: Submit for approval
5. Go Approval: Create approval request
6. Manager notification
7. Manager reviews and approves
8. Go Timesheet: Mark as approved

**Ports Used**:
- `GoTimesheetPort.createTimesheet` ⚠️ (missing port)
- `GoTimesheetPort.addTimesheetEntry` ⚠️ (missing port)
- `GoTimesheetPort.submitTimesheet` ⚠️ (missing port)
- `GoApprovalWorkflowPort.createApprovalRequest`
- `GoTimesheetPort.approveTimesheet` ⚠️ (missing port)

**Missing From**: Current implementation + Timesheet port

---

### 3.3 Case-Based Labor Costing
**Priority**: MEDIUM  
**Business Impact**: Case profitability analysis

**Orchestration**:
1. Go Timesheet: Get timesheets by case
2. Go Payroll: Get employee hourly rates
3. Calculate total labor cost per case
4. TypeScript: Update case metadata with labor cost
5. TypeScript: Calculate case P&L (revenue - COGS - labor)

**Ports Used**:
- `GoTimesheetPort.getTimesheetsByCase` ⚠️ (missing port)
- `GoPayrollPort.getEmployee`
- `CaseRepository` (TS)

**Missing From**: Current implementation + Timesheet port

---

### 3.4 Generate Year-End Tax Forms (W-2, 1099)
**Priority**: HIGH  
**Business Impact**: Annual compliance

**Orchestration**:
1. Go Payroll: List all employees
2. For each employee:
   - Go Payroll: Generate W-2 form
   - Store PDF in storage
3. Go Payroll: List all contractors
4. For each contractor:
   - Go Payroll: Generate 1099 form
   - Store PDF in storage
5. TypeScript: Generate summary report
6. TypeScript: Create distribution tasks

**Ports Used**:
- `GoPayrollPort.listEmployees`
- `GoPayrollPort.generateW2`
- `GoPayrollPort.generate1099`
- `StoragePort` (TS)
- `TaskRepository` (TS)

**Missing From**: Current implementation

---

### 3.5 Payroll Expense Summary Report
**Priority**: MEDIUM  
**Business Impact**: Monthly financial reporting

**Orchestration**:
1. Go Payroll: Get expense summary for period
2. Breakdown by: department, case, employee type
3. Compare to budget
4. Generate management report

**Ports Used**:
- `GoPayrollPort.getExpenseSummary` ⚠️ (missing method)
- `GoBudgetPort.getBudget`

**Missing From**: Current implementation + port method

---

## Category 4: Contract & Case Lifecycle (4 Use Cases)

### 4.1 Approve Contract with Provisioning
**Priority**: HIGH  
**Business Impact**: Triggers all downstream operations

**Orchestration**:
1. Go Contract: Approve contract
2. **Trigger Provisioning Orchestrator**:
   - For each contract item by service_type:
     - Physical products → Go Inventory: Reserve inventory
     - Professional services → Go PS: Create engagement
     - Facilities → (Future: Capacity planning)
     - Third-party services → Go Procurement: Create requisition
3. TypeScript: Update case status to "active"
4. TypeScript: Create tasks for funeral director

**Ports Used**:
- `GoContractPort.approveContract`
- `GoInventoryPort.reserveInventory`
- `GoProfessionalServicesPort.createEngagement`
- `GoProcurementPort.createRequisition` ⚠️ (missing port)
- `CaseRepository` (TS)
- `TaskRepository` (TS)

**Missing From**: Current implementation (partially implemented in reserve-inventory)

---

### 4.2 Amend Contract (Mid-Service Changes)
**Priority**: HIGH  
**Business Impact**: 15% of cases require changes

**Orchestration**:
1. Go Contract: Get current contract
2. TypeScript: Calculate changes (items added/removed/modified)
3. For removed items:
   - Go Inventory: Release reservations
   - Go PS: Cancel engagements
4. For added items:
   - Go Inventory: Create new reservations
   - Go PS: Create new engagements
5. Go Contract: Update contract
6. Go Financial: Update invoice (if already created)
7. TypeScript: Update case balance

**Ports Used**:
- `GoContractPort.getContract`
- `GoContractPort.updateContract`
- `GoInventoryPort.releaseReservation`
- `GoInventoryPort.reserveInventory`
- `GoProfessionalServicesPort.createEngagement`
- `GoFinancialPort.getInvoice`
- `CaseRepository` (TS)

**Missing From**: Current implementation

---

### 4.3 Cancel Contract with Reversals
**Priority**: MEDIUM  
**Business Impact**: Handle cancellations cleanly

**Orchestration**:
1. Go Contract: Cancel contract with reason
2. **Trigger Reversal Orchestrator**:
   - Go Inventory: Release all reservations
   - Go PS: Cancel all engagements
   - Go Financial: Void/credit invoice (if created)
   - Go Financial: Process refund (if deposit paid)
3. TypeScript: Update case status to "cancelled"
4. TypeScript: Create audit log entry

**Ports Used**:
- `GoContractPort.cancelContract`
- `GoInventoryPort.releaseReservation`
- `GoProfessionalServicesPort` (need cancel method)
- `GoFinancialPort.recordPayment` (refund)
- `CaseRepository` (TS)
- `AuditLogRepository` (TS)

**Missing From**: Current implementation

---

### 4.4 Convert Pre-Need to At-Need Contract
**Priority**: HIGH  
**Business Impact**: 30% of cases start as pre-need

**Orchestration**:
1. Go Contract: Get pre-need contract
2. Validate all payments received or trust funded
3. Go Contract: Create at-need contract (copy items, apply guaranteed pricing)
4. Go Financial: Release trust funds (if applicable)
5. TypeScript: Create new case linked to at-need contract
6. TypeScript: Link pre-need and at-need contracts (parent-child)
7. Go Contract: Mark pre-need as "converted"

**Ports Used**:
- `GoContractPort.getContract`
- `GoContractPort.createContract`
- `GoFinancialPort.recordPayment` (trust release)
- `CaseRepository` (TS)

**Missing From**: Current implementation + Go backend (see BACKEND_GAPS_CONTRACT_MANAGEMENT.md)

---

## Category 5: Reporting & Analytics (5 Use Cases)

### 5.1 Daily Cash Receipts Report
**Priority**: MEDIUM  
**Business Impact**: Daily financial reconciliation

**Orchestration**:
1. TypeScript: Get all payments for today
2. Group by payment method (cash, check, credit card, insurance)
3. Go Financial: Get bank deposits for today
4. Reconcile receipts to deposits
5. Generate cash receipts report

**Ports Used**:
- `PaymentRepository` (TS)
- `GoFinancialPort.listJournalEntries`

**Missing From**: Current implementation

---

### 5.2 Case Profitability Dashboard
**Priority**: HIGH  
**Business Impact**: Understand which cases are profitable

**Orchestration**:
1. TypeScript: List all closed cases for period
2. For each case:
   - Go Contract: Get contract total (revenue)
   - Go Inventory: Get committed items (COGS)
   - Go Timesheet: Get labor hours (labor cost)
   - Go Financial: Get vendor bills (third-party costs)
   - Calculate: Gross profit = Revenue - COGS - Labor - Third-party
3. Aggregate by: service type, funeral director, month
4. Generate profitability dashboard with charts

**Ports Used**:
- `CaseRepository` (TS)
- `GoContractPort.getContract`
- `GoInventoryPort.getReservationsByCase`
- `GoTimesheetPort.getTimesheetsByCase` ⚠️ (missing port)
- `GoFinancialPort.listVendorBills`

**Missing From**: Current implementation + port

---

### 5.3 Revenue Recognition Report
**Priority**: MEDIUM  
**Business Impact**: GAAP compliance

**Orchestration**:
1. Go Financial: List all invoices by period
2. Filter by service delivery status
3. Calculate recognized vs. deferred revenue
4. Generate revenue recognition schedule
5. Create deferral/accrual journal entries if needed

**Ports Used**:
- `GoFinancialPort.listInvoices`
- `GoContractPort.listContractsByCase`
- `GoFinancialPort.createJournalEntry`

**Missing From**: Current implementation

---

### 5.4 KPI Dashboard (Management Reporting)
**Priority**: MEDIUM  
**Business Impact**: Executive visibility

**Orchestration**:
1. **Revenue Metrics**:
   - Go Financial: Total revenue MTD, YTD
   - TypeScript: Average revenue per case
   - TypeScript: Revenue by service type
2. **Operational Metrics**:
   - TypeScript: Cases in pipeline by stage
   - TypeScript: Average days to close case
   - Go Inventory: Inventory turnover ratio
3. **Financial Health**:
   - Go Financial: AR aging (DSO)
   - Go Financial: AP aging (DPO)
   - Go Financial: Cash balance
4. Generate executive dashboard

**Ports Used**:
- `GoFinancialPort.generateFinancialStatement`
- `GoFinancialPort.getARAgingReport`
- `CaseRepository` (TS)
- `GoInventoryPort.listItems`

**Missing From**: Current implementation

---

### 5.5 Segment/Location P&L Report
**Priority**: LOW  
**Business Impact**: Multi-location profitability

**Orchestration**:
1. Go Segment Reporting: Get segments (locations/departments)
2. Go Segment Reporting: Generate segment P&L report
3. Calculate segment margins
4. Compare to consolidated results

**Ports Used**:
- `GoSegmentReportingPort.listSegments`
- `GoSegmentReportingPort.generateSegmentReport`

**Missing From**: Current implementation

---

## Category 6: HCM & Employee Lifecycle (4 Use Cases)

### 6.1 Onboard New Employee
**Priority**: MEDIUM  
**Business Impact**: HR process automation

**Orchestration**:
1. TypeScript: Collect employee information
2. Go HCM Onboarding: Hire employee (create dual-ledger: HCM + Payroll)
3. Go HCM Onboarding: Get onboarding checklist
4. TypeScript: Create tasks for HR (I-9, W-4, direct deposit setup)
5. Go Position Management: Assign to position
6. TypeScript: Send welcome email

**Ports Used**:
- `GoEmployeeOnboardingPort.hireEmployee`
- `GoEmployeeOnboardingPort.getOnboardingTasks`
- `GoPositionManagementPort.assignPosition` ⚠️ (may need method)
- `TaskRepository` (TS)
- `EmailPort` (TS)

**Missing From**: Current implementation

---

### 6.2 Terminate Employee with Cleanup
**Priority**: MEDIUM  
**Business Impact**: Clean termination process

**Orchestration**:
1. Go HCM Termination: Terminate employee with reason
2. Go HCM Termination: Get exit checklist
3. TypeScript: Create tasks (return keys, deactivate accounts, etc.)
4. Go Payroll: Process final paycheck with PTO payout
5. Go HCM: Update status to "terminated"
6. TypeScript: Archive employee records

**Ports Used**:
- `GoEmployeeTerminationPort.terminateEmployee`
- `GoEmployeeTerminationPort.getExitChecklist`
- `GoEmployeeTerminationPort.processFinalPaycheck`
- `TaskRepository` (TS)

**Missing From**: Current implementation

---

### 6.3 PTO Request and Approval
**Priority**: LOW  
**Business Impact**: Employee self-service

**Orchestration**:
1. Go PTO: Get employee PTO balance
2. TypeScript: Employee submits PTO request
3. Go PTO: Create PTO request
4. Go Approval: Create approval request
5. Manager notification
6. Go PTO: Approve/reject request
7. If approved: Go PTO: Deduct from balance
8. TypeScript: Update calendar with time off

**Ports Used**:
- `GoPTOPort.getPTOBalance`
- `GoPTOPort.createPTORequest`
- `GoPTOPort.approvePTORequest`
- `GoApprovalWorkflowPort.createApprovalRequest`

**Missing From**: Current implementation

---

### 6.4 Performance Review Workflow
**Priority**: LOW  
**Business Impact**: Annual reviews

**Orchestration**:
1. TypeScript: Schedule review for employee
2. Go HCM Common: Create performance review record
3. Manager enters review scores/comments
4. Go HCM Common: Submit review
5. Employee acknowledgement
6. Go HCM Common: Store in employee history
7. TypeScript: Link to compensation changes (if applicable)

**Ports Used**:
- `GoHCMCommonPort` (need review methods)
- `TaskRepository` (TS)

**Missing From**: Current implementation + port methods

---

## Category 7: Pre-Need Contracts (3 Use Cases)

### 7.1 Create Pre-Need Contract with Payment Plan
**Priority**: HIGH  
**Business Impact**: Pre-need sales represent 30% of revenue

**Orchestration**:
1. TypeScript: Collect customer information and service selections
2. Go Contract: Create pre-need contract (guaranteed pricing)
3. TypeScript: Create payment plan schedule
4. Go Financial: Create subscription for installment payments
5. TypeScript: Link subscription to contract
6. TypeScript: Create tasks for sales follow-up

**Ports Used**:
- `GoContractPort.createContract`
- `GoFinancialPort` (need subscription integration)
- `PaymentPlanRepository` ⚠️ (may need creation)
- `CaseRepository` (TS)
- `TaskRepository` (TS)

**Missing From**: Current implementation + Go backend (see BACKEND_GAPS_CONTRACT_MANAGEMENT.md)

---

### 7.2 Process Pre-Need Payment
**Priority**: HIGH  
**Business Impact**: Track pre-need payment progress

**Orchestration**:
1. TypeScript: Record pre-need payment
2. Go Financial: Apply payment to subscription
3. Go Financial: Deposit to trust account (if required by state)
4. TypeScript: Update payment plan progress
5. TypeScript: Update contract funding status
6. If fully paid: TypeScript: Mark contract as "paid in full"

**Ports Used**:
- `PaymentRepository` (TS)
- `GoFinancialPort.recordPayment`
- `CaseRepository` (TS)

**Missing From**: Current implementation

---

### 7.3 Pre-Need Contract Insurance Assignment
**Priority**: MEDIUM  
**Business Impact**: Insurance-funded pre-need contracts

**Orchestration**:
1. TypeScript: Collect insurance policy information
2. TypeScript: Create insurance assignment record
3. Go Contract: Update contract with insurance details
4. TypeScript: Track policy cash value
5. On death: Claim insurance proceeds, apply to at-need contract

**Ports Used**:
- `InsuranceRepository` ⚠️ (needs creation)
- `GoContractPort.updateContract`
- `CaseRepository` (TS)

**Missing From**: Current implementation + insurance repository

---

## Category 8: Administrative & Compliance (2 Use Cases)

### 8.1 Audit Trail Query
**Priority**: MEDIUM  
**Business Impact**: Compliance and troubleshooting

**Orchestration**:
1. TypeScript: Specify entity type and ID
2. TypeScript: Get audit log entries from CRM
3. Go Contract: Get contract event history (if applicable)
4. Go Financial: Get journal entry history (if applicable)
5. Combine and sort chronologically
6. Generate comprehensive audit trail report

**Ports Used**:
- `AuditLogRepository` (TS)
- `GoContractPort` (need event history method - see BACKEND_GAPS)
- `GoFinancialPort.listJournalEntries`

**Missing From**: Current implementation + Go backend methods

---

### 8.2 Backup and Archive Old Cases
**Priority**: LOW  
**Business Impact**: Data management and performance

**Orchestration**:
1. TypeScript: Identify cases older than retention period (e.g., 7 years)
2. For each case:
   - Export case data
   - Export contract data (from Go)
   - Export payment history
   - Export documents
3. Create archive package (ZIP)
4. Upload to long-term storage (S3 Glacier)
5. Mark case as "archived" in CRM
6. Optionally: Remove from active database

**Ports Used**:
- `CaseRepository` (TS)
- `GoContractPort.getContract`
- `PaymentRepository` (TS)
- `StoragePort` (TS)

**Missing From**: Current implementation

---

## Summary by Priority

### ⭐ CRITICAL (Must Have)
1. **Finalize Case with GL Posting** - Month-end close blocker
2. **Month-End Close Process** - Financial compliance
3. **Create Payroll Run from Timesheets** - Biweekly requirement

### HIGH (Should Have - Phase 5)
1. Create Invoice from Contract
2. Insurance Claim Processing
3. Purchase Requisition to PO
4. Receive Inventory from PO
5. Commit Inventory Reservation
6. Submit Timesheet for Approval
7. Approve Contract with Provisioning
8. Amend Contract
9. Convert Pre-Need to At-Need
10. Case Profitability Dashboard
11. Create Pre-Need Contract with Payment Plan
12. Process Pre-Need Payment

### MEDIUM (Could Have - Phase 6)
1. Batch Payment Application
2. Refund Processing
3. AR Aging Report Generation
4. Vendor Bill Processing
5. AP Payment Run
6. Bank Reconciliation
7. Inventory Transfer
8. Inventory Cycle Count
9. Inventory Valuation Report
10. Case-Based Labor Costing
11. Generate Year-End Tax Forms
12. Payroll Expense Summary
13. Daily Cash Receipts Report
14. Revenue Recognition Report
15. KPI Dashboard
16. Onboard New Employee
17. Terminate Employee
18. Pre-Need Insurance Assignment
19. Audit Trail Query

### LOW (Won't Have Initially)
1. Budget vs. Actual Variance Report
2. Sales Tax Reporting
3. Segment/Location P&L
4. PTO Request and Approval
5. Performance Review Workflow
6. Backup and Archive Old Cases

---

## Missing Port Methods Summary

### Critical Missing Ports
1. **GoTimesheetPort** - Entire port missing (8-10 methods)
2. **GoProcurementPort** - Entire port missing (10-12 methods)

### Critical Missing Methods
1. `GoFinancialPort.getTrialBalance`
2. `GoFinancialPort.generateBalanceSheet`
3. `GoFinancialPort.generateCashFlowStatement`
4. `GoFinancialPort.getAccountBalances`
5. `GoFinancialPort.createAPPaymentRun`
6. `GoFinancialPort.getAPPaymentRun`
7. `GoPayrollPort.importTimeEntries`
8. `GoPayrollPort.getExpenseSummary`
9. `GoReconciliationsPort.getReconciliationItems`
10. `GoReconciliationsPort.undoReconciliation`

**Reference**: See [BACKEND_GAPS_CONTRACT_MANAGEMENT.md](./BACKEND_GAPS_CONTRACT_MANAGEMENT.md) for additional contract-specific gaps.

---

## Implementation Roadmap

### Phase 5A: Financial Use Cases (Weeks 1-2)
- Finalize Case with GL Posting ⭐
- Create Invoice from Contract
- Refund Processing
- Vendor Bill Processing

### Phase 5B: Month-End Close (Week 3)
- Month-End Close Process ⭐
- Bank Reconciliation
- Financial Reporting

### Phase 5C: Payroll Integration (Week 4)
- Create Timesheet Port
- Submit Timesheet for Approval
- Create Payroll Run from Timesheets ⭐
- Generate Year-End Tax Forms

### Phase 5D: Procurement & Inventory (Week 5-6)
- Create Procurement Port
- Purchase Requisition to PO
- Receive Inventory from PO
- Commit Inventory Reservation
- Inventory Cycle Count

### Phase 5E: Contract Lifecycle (Week 7)
- Approve Contract with Provisioning
- Amend Contract
- Cancel Contract with Reversals
- Convert Pre-Need to At-Need

### Phase 5F: Reporting & Analytics (Week 8)
- Case Profitability Dashboard
- AR Aging Report
- Daily Cash Receipts Report
- KPI Dashboard

---

## Success Criteria

- ✅ All CRITICAL use cases implemented
- ✅ All HIGH priority use cases implemented
- ✅ Month-end close can be completed end-to-end
- ✅ Payroll can be run from CRM timesheets
- ✅ Inventory properly integrated with cases
- ✅ Financial reporting complete and accurate
- ✅ Zero compilation errors
- ✅ All use cases follow Effect-TS patterns
- ✅ Complete documentation in use-cases README

---

**Total Missing Use Cases**: 35  
**Estimated Implementation Time**: 8-10 weeks  
**Business Value**: Complete funeral home ERP functionality
