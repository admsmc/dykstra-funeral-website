# Implementation Plan: 35 Critical Use Cases
## Context
All required Go backend methods have been verified to exist (100% coverage). We now need to implement TypeScript use cases that orchestrate these operations for funeral home management workflows.
## Current State
* ✅ 3 cross-domain use cases implemented (Lead→Contract, Inventory→Case, Payment→AR)
* ✅ All 21 Go ports exist with required methods
* ✅ Financial port methods verified (trial balance, balance sheet, cash flow, payment runs)
* ✅ Payroll/timesheet methods verified (workflow-based approval system)
* ✅ Procurement port has 80+ endpoints
* ❌ 35 use cases missing orchestration layer
## Priority Grouping
### Critical (Month-End Close Blockers) - 7 Use Cases
1. Finalize Case with GL Posting
2. Month-End Close Process
3. Create Invoice from Contract
4. Create Payroll Run from Timesheets
5. Bank Reconciliation
6. Purchase Requisition to PO
7. Receive Inventory from PO
### High Priority (Core Operations) - 15 Use Cases
8. Insurance Claim Processing
9. Batch Payment Application
10. Refund Processing
11. AR Aging Report Generation
12. Vendor Bill Processing (AP)
13. AP Payment Run
14. Inventory Transfer Between Locations
15. Commit Inventory Reservation
16. Submit Timesheet for Approval
17. Case-Based Labor Costing
18. Employee Onboarding Workflow
19. Employee Offboarding Workflow
20. Contract Renewal Management
21. Service Package Recommendations
22. Pre-Need Contract Processing
### Medium Priority (Reporting & Compliance) - 9 Use Cases
23. Budget vs. Actual Variance Report
24. Sales Tax Reporting
25. Inventory Cycle Count
26. Inventory Valuation Report
27. Fixed Asset Depreciation Run
28. Expense Report Approval
29. Cash Flow Forecasting
30. Customer Retention Analysis
31. Revenue by Service Type Report
### Low Priority (Advanced Features) - 4 Use Cases
32. Multi-Language Document Generation
33. Automated Email Campaigns
34. Social Media Integration
35. Advanced Analytics Dashboard
## Implementation Phases
### Phase 1: Financial Operations (Week 1-2)
**Goal**: Enable month-end close and core AR/AP workflows
#### Use Case 1.1: Finalize Case with GL Posting
**File**: `packages/application/src/use-cases/case-management/finalize-case-with-gl-posting.ts`
**Dependencies**:
* CaseRepository (exists)
* GoContractPort.getContract (exists)
* GoFinancialPort.createJournalEntry (exists)
* GoFinancialPort.postJournalEntry (exists)
**Steps**:
1. Load case and validate all services delivered
2. Get contract details for revenue breakdown
3. Calculate totals by category (services, merchandise, facilities)
4. Create journal entry with line items (DR: AR, CR: Revenue by category)
5. Post journal entry to GL
6. Update case status to "finalized" with GL journal reference
**Return**: `{ caseId, journalEntryId, totalAmount, glAccountsPosted }`
#### Use Case 1.2: Month-End Close Process
**File**: `packages/application/src/use-cases/financial/month-end-close.ts`
**Dependencies**:
* GoFinancialPort.getTrialBalance (verified exists: `ComputeEntity/ComputeGroup`)
* GoFinancialPort.generateBalanceSheet (verified exists: `BalanceSheetEntity/Group`)
* GoFinancialPort.generateCashFlowStatement (verified exists)
* GoFixedAssetsPort.runMonthlyDepreciation (exists)
* GoReconciliationsPort.listReconciliations (exists)
* AuditLogRepository (exists)
**Steps**:
1. Get trial balance for entity and currency
2. Generate P&L statement
3. Generate balance sheet
4. Generate cash flow statement
5. Run depreciation on all active fixed assets
6. Verify all bank accounts reconciled (fail if not)
7. Create audit log entry with close summary and document links
8. Lock period (call GoFinancialPort.lockPeriod if exists)
**Return**: `{ periodClosed, trialBalanceId, plStatementId, balanceSheetId, cashFlowId, depreciationRunId, auditLogId }`
#### Use Case 1.3: Create Invoice from Contract
**File**: `packages/application/src/use-cases/financial/create-invoice-from-contract.ts`
**Dependencies**:
* GoContractPort.getContract (exists)
* GoFinancialPort.createInvoice (exists)
* CaseRepository (exists)
**Steps**:
1. Get contract by ID and validate approved/signed status
2. Extract line items with GL accounts and amounts
3. Create AR invoice with line items
4. Link invoice ID to case metadata
5. Update case outstanding balance
**Return**: `{ invoiceId, caseId, totalAmount, dueDate }`
#### Use Case 1.9: AP Payment Run
**File**: `packages/application/src/use-cases/financial/ap-payment-run.ts`
**Dependencies**:
* GoFinancialPort.createAPPaymentRun (verified exists)
* GoFinancialPort.getAPPaymentRun (verified exists)
* GoFinancialPort.approveAPPaymentRun (verified exists)
* GoFinancialPort.executeAPPaymentRun (verified exists)
**Steps**:
1. List approved vendor bills by due date (filter by date range)
2. User selects bills to include in payment run
3. Create payment run with selected bills
4. Generate payment preview (total amount, vendor count)
5. User confirms execution
6. Approve payment run
7. Execute payment run (mark bills paid, create GL entries)
**Return**: `{ paymentRunId, billCount, totalAmount, paymentDate, glJournalId }`
#### Use Case 1.10: Bank Reconciliation
**File**: `packages/application/src/use-cases/financial/bank-reconciliation.ts`
**Dependencies**:
* GoReconciliationsPort (all methods exist)
* StoragePort (for bank statement upload)
**Steps**:
1. Upload bank statement CSV to storage
2. Create reconciliation workspace (customer kind for bank account)
3. Get unreconciled GL transactions (cash account)
4. Auto-match by amount and date
5. User manually matches remaining items via UI
6. Mark items as cleared
7. Complete reconciliation
8. Post reconciliation adjustment entry if needed
**Return**: `{ reconciliationId, matchedCount, adjustmentAmount, status }`
### Phase 2: Inventory & Procurement (Week 2-3)
**Goal**: Enable purchase-to-pay and inventory management workflows
#### Use Case 2.1: Purchase Requisition to PO
**File**: `packages/application/src/use-cases/procurement/purchase-requisition-to-po.ts`
**Dependencies**:
* GoInventoryPort.getItemsBelowReorderPoint (exists)
* GoProcurementPort (verified exists with 24 methods)
* GoApprovalWorkflowPort (exists)
**Steps**:
1. Get items below reorder point
2. Calculate suggested order quantities (reorder point + safety stock)
3. Create purchase requisition with line items
4. Submit for approval workflow
5. On approval: convert requisition to purchase order
6. Send PO to vendor via email
**Return**: `{ requisitionId, poId, vendorId, totalAmount, approvalStatus }`
#### Use Case 2.2: Receive Inventory from PO
**File**: `packages/application/src/use-cases/procurement/receive-inventory-from-po.ts`
**Dependencies**:
* GoProcurementPort.getPurchaseOrder (exists)
* GoProcurementPort.recordReceipt (exists)
* GoInventoryPort.receiveInventory (exists)
* GoFinancialPort.createVendorBill (exists)
**Steps**:
1. Get open purchase order
2. User records receipt (quantity received, receipt date)
3. Update inventory quantities (call receiveInventory for each line)
4. Update PO status (fully/partially received)
5. If fully received: create AP bill (3-way match: PO, receipt, invoice)
**Return**: `{ receiptId, poId, itemsReceived, apBillId, matchStatus }`
#### Use Case 2.6: Commit Inventory Reservation
**File**: `packages/application/src/use-cases/inventory/commit-inventory-reservation.ts`
**Dependencies**:
* CaseRepository (exists)
* GoInventoryPort.commitReservation (exists)
* GoFinancialPort.createJournalEntry (exists)
**Steps**:
1. Load case with inventory reservations
2. Commit each reservation (convert from reserved to sold)
3. Get WAC cost for each item
4. Create COGS journal entry (DR: COGS, CR: Inventory at cost)
5. Update case metadata with COGS amount
6. Mark case inventory as delivered
**Return**: `{ caseId, itemsCommitted, cogsAmount, journalEntryId }`
### Phase 3: Payroll & Time Tracking (Week 3-4)
**Goal**: Enable biweekly payroll and time tracking workflows
#### Use Case 3.1: Create Payroll Run from Timesheets
**File**: `packages/application/src/use-cases/payroll/create-payroll-run-from-timesheets.ts`
**Dependencies**:
* GoPayrollPort (verified exists with submitTimesheet, approveTimesheet, listTimesheets)
* GoPayrollPort.createPayrollRun (exists)
* GoPayrollPort.calculatePayroll (exists)
* GoFinancialPort.createJournalEntry (exists)
**Important Note**: Go backend uses workflow-based timesheet submission (NOT bulk import). Timesheets must be submitted individually via `POST /ps/timesheets/submit` before payroll processing.
**Steps**:
1. List all approved timesheets for pay period (status=approved)
2. Validate all timesheets have been approved (fail if any pending)
3. Create payroll run referencing approved timesheet IDs
4. Calculate payroll (gross, taxes, deductions, net)
5. Get payroll line items for review
6. User approves payroll run
7. Mark payroll run as approved
8. After ACH execution: mark as paid
9. Create payroll GL entries (DR: Payroll Expense + Taxes, CR: Cash + Payroll Liabilities)
**Return**: `{ payrollRunId, employeeCount, grossPay, netPay, taxesWithheld, journalEntryId }`
#### Use Case 3.2: Submit Timesheet for Approval
**File**: `packages/application/src/use-cases/payroll/submit-timesheet-for-approval.ts`
**Dependencies**:
* GoPayrollPort.submitTimesheet (verified exists: `POST /ps/timesheets/submit`)
* GoPayrollPort.approveTimesheet (verified exists: `POST /ps/timesheets/{id}/approve`)
* GoApprovalWorkflowPort (exists)
**Steps**:
1. Worker selects pay period (start date, end date)
2. Worker enters time entries (pre-created separately, not shown here)
3. Submit timesheet with entry references
4. Create approval request workflow
5. Notify manager
6. Manager reviews and approves via separate endpoint
**Return**: `{ timesheetId, workerId, periodStart, periodEnd, totalHours, approvalStatus }`
#### Use Case 3.3: Case-Based Labor Costing
**File**: `packages/application/src/use-cases/payroll/case-based-labor-costing.ts`
**Dependencies**:
* GoPayrollPort.listTimesheets (exists)
* CaseRepository (exists)
**Steps**:
1. Get all timesheet entries for case
2. Calculate total hours by employee
3. Get employee hourly rates
4. Calculate labor cost per case
5. Update case P&L with labor costs
6. Generate case profitability report (revenue - COGS - labor)
**Return**: `{ caseId, totalLaborHours, totalLaborCost, revenue, cogs, grossProfit, grossMargin }`
### Phase 4: Reporting & Compliance (Week 4-5)
**Goal**: Enable management reporting and compliance workflows
#### Use Case 1.7: AR Aging Report Generation
**File**: `packages/application/src/use-cases/financial/ar-aging-report.ts`
**Dependencies**:
* GoFinancialPort.getARAgingReport (exists)
* CaseRepository (exists)
* TaskRepository (exists)
**Steps**:
1. Get AR aging report (0-30, 31-60, 61-90, 90+ buckets)
2. Enrich with case details (family name, funeral director, notes)
3. Calculate collection priority scores
4. Generate actionable report with follow-up tasks
5. Auto-create tasks for overdue accounts >90 days
**Return**: `{ agingBuckets, totalOutstanding, overdueCount, tasksCreated }`
#### Use Case 1.11: Budget vs. Actual Variance Report
**File**: `packages/application/src/use-cases/financial/budget-variance-report.ts`
**Dependencies**:
* GoBudgetPort.getBudget (exists)
* GoBudgetPort.getBudgetVarianceReport (exists)
* GoFinancialPort.listJournalEntries (exists)
**Steps**:
1. Get approved budget for period
2. Get actual GL transactions for period
3. Generate variance report by account (budget, actual, variance, %)
4. Enrich with commentary and KPIs
5. Generate management report with charts
**Return**: `{ period, totalBudget, totalActual, variance, variancePercent, accountVariances }`
### Phase 5: HR & Employee Management (Week 5)
**Goal**: Enable employee lifecycle management
#### Use Case 4.1: Employee Onboarding Workflow
**File**: `packages/application/src/use-cases/hr/employee-onboarding.ts`
**Dependencies**:
* GoEmployeeOnboardingPort (exists)
* GoApprovalWorkflowPort (exists)
* TaskRepository (exists)
**Steps**:
1. Create onboarding record with employee details
2. Generate onboarding checklist (I-9, W-4, benefits enrollment, etc.)
3. Assign tasks to HR and manager
4. Track completion status
5. On all tasks complete: activate employee in payroll
6. Generate completion report
**Return**: `{ onboardingId, employeeId, tasksCompleted, tasksRemaining, status }`
#### Use Case 4.2: Employee Offboarding Workflow
**File**: `packages/application/src/use-cases/hr/employee-offboarding.ts`
**Dependencies**:
* GoEmployeeTerminationPort (exists)
* TaskRepository (exists)
**Steps**:
1. Create termination record with effective date and reason
2. Generate offboarding checklist (equipment return, exit interview, final paycheck, COBRA notice)
3. Assign tasks to HR and manager
4. Track completion status
5. On all tasks complete: deactivate employee in payroll and revoke system access
6. Generate final pay calculation (accrued PTO payout)
7. Generate completion report
**Return**: `{ terminationId, employeeId, terminationDate, finalPayAmount, tasksCompleted, status }`
## Testing Strategy
### Unit Tests
* Each use case gets a test file in `packages/application/src/use-cases/__tests__/`
* Mock all port dependencies using Vitest
* Test happy path and error conditions
* Target: 80%+ coverage
### Integration Tests
* Test use case orchestration with real adapters
* Use test database with fixtures
* Verify Effect error handling
* Test SCD2 temporal patterns
### E2E Tests
* Test complete workflows in browser (Playwright)
* Example: Create case → Finalize → Generate invoice → Record payment → Month-end close
* Verify UI state updates correctly
## Success Criteria
* ✅ All 35 use cases implemented with proper Effect error handling
* ✅ All use cases have unit tests (80%+ coverage)
* ✅ Integration tests pass for critical workflows
* ✅ E2E tests cover month-end close flow
* ✅ Zero TypeScript compilation errors
* ✅ All validation checks pass (circular deps, Effect layers)
* ✅ Documentation complete with usage examples
## Implementation Notes
### Architectural Patterns
1. All use cases return `Effect<Result, Error, Dependencies>`
2. Use `Effect.gen` for sequential operations
3. Use `Effect.all` for parallel operations (where safe)
4. Use proper error types from domain layer
5. Use object-based ports (NOT classes)
6. Follow SCD2 pattern for temporal data
### Error Handling
* Use domain-specific error types (ValidationError, PersistenceError, NetworkError)
* Provide meaningful error messages
* Include context (entity IDs, amounts, timestamps)
* Use Effect.tryPromise for async operations
### Go Backend Naming Differences
* TypeScript `getTrialBalance` → Go `ComputeEntity` or `ComputeGroup`
* TypeScript `generateBalanceSheet` → Go `BalanceSheetEntity` or `BalanceSheetGroup`
* TypeScript `importTimeEntries` → Go workflow-based `submitTimesheet` (NOT bulk import)
* Always check `docs/BACKEND_REALITY_CHECK.md` for actual Go endpoint names
### Timesheet Workflow Important Note
The Go backend uses an **event-sourced workflow system** for timesheets, NOT bulk import:
1. Time entries created separately (not shown in these endpoints)
2. Worker submits timesheet referencing entries: `POST /ps/timesheets/submit`
3. Manager approves: `POST /ps/timesheets/{id}/approve`
4. Approved timesheets flow to payroll
Do NOT attempt to create a bulk import endpoint - it doesn't exist and would violate the backend's architectural pattern.
## Risk Mitigation
### Risk 1: Go Endpoint Naming Mismatches
* **Mitigation**: Always verify actual Go endpoint names in `docs/BACKEND_REALITY_CHECK.md` before implementing
* **Mitigation**: Create mapping document (TypeScript method → Go endpoint)
### Risk 2: Workflow vs Bulk Import Pattern Conflicts
* **Mitigation**: Document Go backend patterns (event-sourced workflows vs batch operations)
* **Mitigation**: Adapt TypeScript use cases to match Go patterns, not vice versa
### Risk 3: Effect Error Type Proliferation
* **Mitigation**: Reuse existing error types from domain layer
* **Mitigation**: Only create new error types when domain-specific context is needed
### Risk 4: Test Data Setup Complexity
* **Mitigation**: Create test data factories for common entities
* **Mitigation**: Use database seeds for integration tests
* **Mitigation**: Document test data requirements per use case
## Timeline Summary
* **Week 1**: Financial Operations (Use Cases 1.1-1.3, 1.9-1.10) - 5 use cases
* **Week 2**: Procurement & Inventory (Use Cases 2.1-2.2, 2.6) - 3 use cases
* **Week 3**: Payroll & Time Tracking (Use Cases 3.1-3.3) - 3 use cases
* **Week 4**: Reporting & Compliance (Use Cases 1.7, 1.11, 2.4-2.5) - 4 use cases
* **Week 5**: HR & Advanced Features (Use Cases 4.1-4.2, remaining 18 use cases) - 20 use cases
**Total**: 5 weeks to implement all 35 use cases (vs original 9-12 week estimate)