# Financial Router Deep Dive & Implementation Plan

**Date**: December 5, 2024  
**Router File**: `packages/api/src/routers/financial.router.ts`  
**Current Coverage**: 36% (12/33 endpoints exposed)  
**Total Lines**: 969 lines of code

---

## Executive Summary

The Financial Router is the **second-largest router** in the application with 33 endpoints across 7 major modules. It has **significant functionality gaps** - only 36% of endpoints are exposed in the UI, leaving critical business processes like manual journal entries, vendor bill processing, and AR invoicing completely unavailable to users.

### Key Findings

- **✅ Well-Covered**: Bank Reconciliation (90%), Procurement Suppliers (100%)
- **⚠️ Partially Covered**: General Ledger (40%), Financial Reports (50%)
- **❌ Critically Missing**: Accounts Payable (29%), Accounts Receivable (0%), Period Close (33%)

---

## Module-by-Module Analysis

### 1. Period Close Operations (3/3 endpoints - 100% in API, 33% in UI)

#### Available Endpoints
1. ✅ `periodClose.execute` - Execute month-end close
2. ✅ `periodClose.validate` - Validate close readiness
3. ✅ `periodClose.getHistory` - Get close audit log

#### Current UI State
- ✅ `/staff/finops/period-close` page EXISTS but LIMITED
- ❌ No validation check UI before running close
- ❌ No history viewer
- ❌ No status indicators during close process
- ❌ No pre-close checklist UI

#### Missing UI Components

**A. Pre-Close Checklist Widget**
```
┌─────────────────────────────────────────┐
│ Month-End Close Checklist              │
├─────────────────────────────────────────┤
│ ✅ Trial balance balanced               │
│ ✅ All bank accounts reconciled         │
│ ⚠️  3 draft journal entries remain      │
│ ❌ Depreciation not run                 │
│                                         │
│ [ Run Validation Check ]                │
└─────────────────────────────────────────┘
```

**B. Close Execution Modal**
```
┌─────────────────────────────────────────┐
│ Execute Month-End Close                │
├─────────────────────────────────────────┤
│ Period End: December 31, 2024          │
│                                         │
│ Steps to be performed:                  │
│ 1. Lock previous period                │
│ 2. Generate depreciation entries        │
│ 3. Create financial statements          │
│ 4. Create audit snapshot                │
│ 5. Post closing entries                 │
│                                         │
│ ⚠️  This action cannot be easily       │
│    undone. Are you sure?                │
│                                         │
│ Notes (optional):                       │
│ [________________________]              │
│                                         │
│ [ ] Skip reconciliation check           │
│                                         │
│ [ Cancel ]  [ Execute Close ]           │
└─────────────────────────────────────────┘
```

**C. Close History Timeline**
```
┌─────────────────────────────────────────┐
│ Close History - Last 12 Months         │
├─────────────────────────────────────────┤
│ 2024-12-31  ✅ Closed  John Smith      │
│ 2024-11-30  ✅ Closed  Jane Doe        │
│ 2024-10-31  ✅ Closed  John Smith      │
│ 2024-09-30  ⚠️  Reopened (adjustment)   │
│ 2024-08-31  ✅ Closed  Jane Doe        │
│                                         │
│ [ View All History ]                    │
└─────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] Add pre-close validation widget to dashboard
- [ ] Create close execution modal with progress indicator
- [ ] Build close history timeline component
- [ ] Add status badges (Closed, In Progress, Failed)
- [ ] Implement close confirmation workflow

**Estimated Effort**: 1 week

---

### 2. Bank Reconciliation (6/6 endpoints - 100% in API, 90% in UI)

#### Available Endpoints
1. ✅ `bankRec.start` - Start reconciliation
2. ✅ `bankRec.clearItems` - Mark items as cleared
3. ✅ `bankRec.complete` - Complete reconciliation
4. ✅ `bankRec.undo` - Undo reconciliation
5. ✅ `bankRec.getBankTransactions` - Get bank transactions
6. ✅ `bankRec.getGLEntries` - Get GL entries
7. ✅ `bankRec.getMatchSuggestions` - AI matching suggestions
8. ✅ `bankRec.importStatement` - Import CSV/OFX

#### Current UI State
- ✅ `/staff/finops` page has bank reconciliation section with CSV import
- ✅ Smart matching UI implemented
- ❌ No undo reconciliation button
- ❌ No adjustment entry form (when out of balance)

#### Missing UI Components

**A. Reconciliation Adjustment Form**
```
┌─────────────────────────────────────────┐
│ Reconciliation Adjustment Entry         │
├─────────────────────────────────────────┤
│ Difference: $125.50                     │
│                                         │
│ Reason:                                 │
│ ( ) Bank fees                           │
│ ( ) Interest income                     │
│ ( ) NSF check                           │
│ (•) Other: [______________________]     │
│                                         │
│ GL Account:                             │
│ [▼ 5400 - Bank Charges        ]         │
│                                         │
│ [ Cancel ]  [ Post Adjustment ]         │
└─────────────────────────────────────────┘
```

**B. Undo Reconciliation Modal**
```
┌─────────────────────────────────────────┐
│ Undo Bank Reconciliation                │
├─────────────────────────────────────────┤
│ ⚠️  Warning: This will:                │
│ • Unmark all cleared items              │
│ • Allow re-matching of transactions     │
│ • NOT reverse adjustment entries        │
│                                         │
│ Reason for undo (required):             │
│ [____________________________________]  │
│                                         │
│ [ Cancel ]  [ Undo Reconciliation ]     │
└─────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] Add adjustment entry form when difference exists
- [ ] Create undo reconciliation action (with confirmation)
- [ ] Add reconciliation status indicator

**Estimated Effort**: 3 days

---

### 3. General Ledger Operations (4/4 endpoints - 100% in API, 40% in UI)

#### Available Endpoints
1. ✅ `gl.getTrialBalance` - Get trial balance (USED in `/staff/finops`)
2. ✅ `gl.getAccountHistory` - Get account transactions (NOT EXPOSED)
3. ✅ `gl.getFinancialStatement` - Generate P&L/BS/CF (USED in `/staff/finops/reports`)
4. ✅ `gl.postJournalEntry` - Post manual journal entry (NOT EXPOSED) **CRITICAL**

#### Current UI State
- ✅ Trial balance shown on `/staff/finops` page
- ✅ Financial statements on `/staff/finops/reports` page
- ❌ No manual journal entry form **CRITICAL BUSINESS NEED**
- ❌ No account history/drill-down
- ❌ No chart of accounts management

#### Missing UI Components - **HIGHEST PRIORITY**

**A. Manual Journal Entry Form** ⭐ CRITICAL
```
┌──────────────────────────────────────────────────────┐
│ Manual Journal Entry                                 │
├──────────────────────────────────────────────────────┤
│ Entry Date: [2024-12-05]       JE #: [Auto]         │
│                                                      │
│ Description:                                         │
│ [______________________________________________]     │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Account            Description  Debit   Credit │ │
│ ├────────────────────────────────────────────────┤ │
│ │ 1100 - Cash        Correction   $500            │ │
│ │ 6200 - Supplies    Supplies             $500   │ │
│ │                                                │ │
│ │ [+ Add Line]                                   │ │
│ │                                                │ │
│ │ Totals:                        $500    $500    │ │
│ │ ✅ In Balance                                   │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ [ ] Post immediately                                 │
│ [ Cancel ]  [ Save Draft ]  [ Post Entry ]          │
└──────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Real-time debit/credit balance validation
- ✅ Account search/autocomplete
- ✅ Multi-line entry support (minimum 2 lines)
- ✅ Draft save capability
- ✅ Template/recurring entry option
- ✅ Attachment support (receipts, invoices)

**B. Account History Drill-Down**
```
┌─────────────────────────────────────────┐
│ Account History: 1100 - Cash           │
├─────────────────────────────────────────┤
│ Period: Jan 1 - Dec 31, 2024          │
│ Opening Balance: $45,230.00             │
│                                         │
│ Date     JE#    Description    Debit  Cr│
│ ────────────────────────────────────────│
│ 12/05   2451  Payment-Smith    $8,500  │
│ 12/04   2450  Vendor-ABC              $2│
│ 12/03   2449  Deposit         $12,400  │
│ ...                                     │
│                                         │
│ Ending Balance: $53,730.00              │
│                                         │
│ [ Export to CSV ]  [ Print ]           │
└─────────────────────────────────────────┘
```

**C. Chart of Accounts Management**
```
┌─────────────────────────────────────────┐
│ Chart of Accounts                       │
├─────────────────────────────────────────┤
│ [Search accounts...]         [+ Add]    │
│                                         │
│ Assets                                  │
│   1000-1999                             │
│   ├─ 1100 Cash            $53,730      │
│   ├─ 1200 AR              $24,500      │
│   └─ 1300 Inventory       $12,400      │
│                                         │
│ Liabilities                             │
│   2000-2999                             │
│   ├─ 2100 AP              $8,200       │
│   └─ 2200 Accrued         $3,400       │
│                                         │
│ [ View Inactive ]  [ Export ]          │
└─────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] **CRITICAL**: Build manual journal entry form (lines 445-490)
- [ ] Create account history drill-down modal
- [ ] Build chart of accounts management page
- [ ] Add GL account search/autocomplete component
- [ ] Implement balance validation logic
- [ ] Add journal entry templates/recurring entries

**Estimated Effort**: 2 weeks (1.5 weeks for manual JE form alone)

---

### 4. Accounts Receivable (3/3 endpoints - 100% in API, 0% in UI) ⚠️

#### Available Endpoints
1. ❌ `ar.getAgingReport` - AR aging report (lines 504-517) **CRITICAL**
2. ❌ `ar.getOverdueInvoices` - Overdue invoices (lines 524-539)
3. ❌ `ar.applyBatchPayments` - Batch payment application (lines 546-569)

#### Current UI State
- ❌ **NO UI EXISTS FOR ANY AR FUNCTIONALITY** ⚠️
- ❌ No AR aging report
- ❌ No overdue invoice list
- ❌ No invoice management
- ❌ No payment application workflow

#### Missing UI Components - **CRITICAL BUSINESS NEED**

**A. AR Aging Report** ⭐ CRITICAL
```
┌──────────────────────────────────────────────────────┐
│ Accounts Receivable Aging Report                    │
├──────────────────────────────────────────────────────┤
│ As of: December 5, 2024                             │
│                                                      │
│ Customer       Current  1-30  31-60  61-90   90+    │
│ ─────────────────────────────────────────────────── │
│ Smith Family   $2,500   $500   $0     $0     $0    │
│ Jones Estate   $0      $1,200  $800   $0     $0    │
│ Williams Inc   $0      $0     $0    $3,500  $2,000 │
│ Brown Family   $4,200   $0     $0     $0     $0    │
│ ─────────────────────────────────────────────────── │
│ Total         $6,700  $1,700  $800  $3,500  $2,000 │
│                                                      │
│ Total AR: $14,700    Overdue: $6,300 (43%)         │
│                                                      │
│ [ Export PDF ]  [ Export Excel ]  [ Print ]         │
└──────────────────────────────────────────────────────┘
```

**B. Overdue Invoices Dashboard Widget**
```
┌─────────────────────────────────────────┐
│ ⚠️  Overdue Invoices (12)              │
├─────────────────────────────────────────┤
│ 🔴 Williams Estate - $5,500 (120 days) │
│    Priority: HIGH                       │
│    [ Send Reminder ]  [ Call ]          │
│                                         │
│ 🟡 Jones Family - $2,000 (45 days)     │
│    Priority: MEDIUM                     │
│    [ Send Reminder ]                    │
│                                         │
│ 🟡 Brown Inc - $800 (35 days)          │
│    Priority: MEDIUM                     │
│                                         │
│ [ View All Overdue ]                    │
└─────────────────────────────────────────┘
```

**C. Invoice Management Page** (NEW PAGE NEEDED)
```
┌──────────────────────────────────────────────────────┐
│ Invoice Management                                   │
├──────────────────────────────────────────────────────┤
│ [Search...] [▼ Status: All] [▼ Date Range]  [+ New] │
│                                                      │
│ Invoice #  Customer     Amount   Due Date   Status   │
│ ────────────────────────────────────────────────────│
│ INV-2024-001  Smith    $12,500  12/15/24  Paid     │
│ INV-2024-002  Jones    $8,200   12/20/24  Sent     │
│ INV-2024-003  Williams $5,500   11/15/24  Overdue  │
│ ...                                                  │
│                                                      │
│ [ Export ]  [ Bulk Send ]  [ Bulk Write-Off ]       │
└──────────────────────────────────────────────────────┘
```

**D. Invoice Creation Form**
```
┌──────────────────────────────────────────────────────┐
│ Create Invoice                                       │
├──────────────────────────────────────────────────────┤
│ Customer: [▼ Select or create customer]             │
│ Invoice Date: [2024-12-05]   Due Date: [2025-01-04]│
│                                                      │
│ Line Items:                                          │
│ ┌──────────────────────────────────────────────┐   │
│ │ Description        Qty  Price    Amount      │   │
│ ├──────────────────────────────────────────────┤   │
│ │ Service Fee         1   $5,000   $5,000      │   │
│ │ Casket Premium      1   $3,500   $3,500      │   │
│ │ Transportation      1   $500     $500        │   │
│ │                                              │   │
│ │ [+ Add Line]                                 │   │
│ │                                              │   │
│ │ Subtotal:                       $9,000       │   │
│ │ Tax (6.0%):                     $540         │   │
│ │ Total:                          $9,540       │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Notes:                                               │
│ [______________________________________________]     │
│                                                      │
│ [ Cancel ]  [ Save Draft ]  [ Save & Send ]         │
└──────────────────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] **CRITICAL**: Create `/staff/finops/invoices` page
- [ ] Build AR aging report component
- [ ] Create overdue invoices dashboard widget
- [ ] Implement invoice creation form
- [ ] Add invoice send/email functionality
- [ ] Build payment application workflow
- [ ] Add write-off functionality
- [ ] Implement reminder email system

**Estimated Effort**: 3 weeks

---

### 5. Procurement & Purchase Orders (3/9 endpoints - 33% in API, 44% in UI)

#### Available Endpoints
1. ✅ `procurement.listPOs` - List POs (USED in `/staff/procurement`)
2. ✅ `procurement.listSuppliers` - List suppliers (USED in `/staff/procurement/suppliers`)
3. ✅ `procurement.createSupplier` - Create supplier (USED)
4. ✅ `procurement.updateSupplier` - Update supplier (USED)
5. ❌ `procurement.createPO` - Create PO (NOT EXPOSED)
6. ❌ `procurement.approvePO` - Approve PO (NOT EXPOSED)
7. ❌ `procurement.receivePO` - Receive PO (NOT EXPOSED)
8. ❌ `procurement.cancelPO` - Cancel PO (NOT EXPOSED)
9. ❌ `procurement.getPODetails` - Get PO details (Backend only)

#### Current UI State
- ✅ `/staff/procurement` page shows PO list (Kanban view)
- ✅ `/staff/procurement/suppliers` page manages suppliers
- ❌ Can view POs but **cannot create** them ⚠️
- ❌ No PO approval workflow
- ❌ No receiving workflow (critical for AP 3-way match)

#### Missing UI Components - **CRITICAL**

**A. Create Purchase Order Form** ⭐ CRITICAL
```
┌──────────────────────────────────────────────────────┐
│ Create Purchase Order                                │
├──────────────────────────────────────────────────────┤
│ Vendor: [▼ Select vendor            ]  [+ New]      │
│ PO Date: [2024-12-05]   Delivery: [2024-12-12]     │
│ Ship To: [▼ Main Location           ]               │
│                                                      │
│ Line Items:                                          │
│ ┌──────────────────────────────────────────────┐   │
│ │ Item              Qty  Unit Price  Total     │   │
│ ├──────────────────────────────────────────────┤   │
│ │ Oak Casket         2   $3,500     $7,000     │   │
│ │ [▼ Select item]    1   $0         $0         │   │
│ │                                              │   │
│ │ [+ Add Line]                                 │   │
│ │                                              │   │
│ │ Subtotal:                         $7,000     │   │
│ │ Tax (if applicable):              $0         │   │
│ │ Shipping:                         $250       │   │
│ │ Total:                            $7,250     │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Notes/Terms:                                         │
│ [______________________________________________]     │
│                                                      │
│ [ Cancel ]  [ Save Draft ]  [ Submit for Approval ] │
└──────────────────────────────────────────────────────┘
```

**B. PO Approval Workflow**
```
┌─────────────────────────────────────────┐
│ Approve Purchase Order                  │
├─────────────────────────────────────────┤
│ PO #: PO-2024-005                      │
│ Vendor: Casket Supplier Inc             │
│ Amount: $7,250                          │
│                                         │
│ Items:                                  │
│ • Oak Casket (2) - $7,000              │
│ • Shipping - $250                       │
│                                         │
│ Requested by: Jane Smith                │
│ Date: December 5, 2024                  │
│                                         │
│ Your approval notes:                    │
│ [____________________________________]  │
│                                         │
│ [ Reject ]  [ Request Changes ]  [ Approve ]│
└─────────────────────────────────────────┘
```

**C. PO Receiving Workflow** ⭐ CRITICAL (needed for AP 3-way match)
```
┌──────────────────────────────────────────────────────┐
│ Receive Purchase Order: PO-2024-004                 │
├──────────────────────────────────────────────────────┤
│ Vendor: Casket Supplier Inc                          │
│ PO Date: 2024-12-01   Expected: 2024-12-08          │
│                                                      │
│ Receiving Date: [2024-12-05]                        │
│ Packing Slip #: [_________________]                  │
│                                                      │
│ Items to Receive:                                    │
│ ┌──────────────────────────────────────────────┐   │
│ │ Item         Ordered  Received  Qty Now      │   │
│ ├──────────────────────────────────────────────┤   │
│ │ Oak Casket      2        0      [2]          │   │
│ │ Bronze Urn      1        0      [1]          │   │
│ │                                              │   │
│ │ [ ] Partial Receipt                          │   │
│ │ [ ] Complete order                           │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Notes:                                               │
│ [______________________________________________]     │
│                                                      │
│ [ Cancel ]  [ Save Receipt ]                        │
└──────────────────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] **CRITICAL**: Build PO creation form
- [ ] Implement PO approval workflow (modal)
- [ ] **CRITICAL**: Build PO receiving workflow (needed for AP)
- [ ] Add PO cancellation action
- [ ] Create PO details modal/page
- [ ] Add PO status tracking

**Estimated Effort**: 2 weeks

---

### 6. Accounts Payable (6/9 endpoints - 67% in API, 29% in UI) ⚠️

#### Available Endpoints
1. ✅ `ap.processBill` - 3-way matching (lines 689-726) (NOT EXPOSED)
2. ✅ `ap.approveBill` - Approve bill (lines 733-749) (NOT EXPOSED)
3. ✅ `ap.payBill` - Pay bill (lines 756-782) (NOT EXPOSED)
4. ✅ `ap.getPayablesByVendor` - Vendor payables (USED in `/staff/finops/ap`)
5. ❌ `ap.generatePaymentRun` - Payment run (lines 831-849) (NOT EXPOSED)
6. ❌ `ap.executePaymentRun` - Execute payment run (lines 856-876) (NOT EXPOSED)

#### Current UI State
- ✅ `/staff/finops/ap` page shows vendor bills
- ❌ Can view bills but **cannot create/enter** them ⚠️
- ❌ No bill approval workflow
- ❌ No payment processing workflow
- ❌ No payment run functionality

#### Missing UI Components - **CRITICAL**

**A. Vendor Bill Entry Form** ⭐ CRITICAL (3-Way Matching)
```
┌──────────────────────────────────────────────────────┐
│ Enter Vendor Bill (3-Way Match)                     │
├──────────────────────────────────────────────────────┤
│ Step 1: Link to PO                                   │
│ Purchase Order: [▼ PO-2024-004 - Casket Supplier]  │
│                                                      │
│ Step 2: Receipt                                      │
│ Receipt: [▼ REC-2024-012 (12/05/24)    ]           │
│                                                      │
│ Step 3: Bill Details                                 │
│ Vendor: Casket Supplier Inc (auto-filled)           │
│ Invoice #: [_________________]                       │
│ Invoice Date: [2024-12-05]   Due: [2025-01-04]     │
│                                                      │
│ 3-Way Match Verification:                            │
│ ┌──────────────────────────────────────────────┐   │
│ │ Item      PO Amt  Received  Bill Amt  Status │   │
│ ├──────────────────────────────────────────────┤   │
│ │ Oak Casket $7,000   $7,000   $7,000   ✅     │   │
│ │ Shipping   $250     $250     $250     ✅     │   │
│ │                                              │   │
│ │ Total:    $7,250   $7,250   $7,250   ✅     │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ✅ 3-way match successful                           │
│                                                      │
│ [ Cancel ]  [ Save for Approval ]                   │
└──────────────────────────────────────────────────────┘
```

**B. Bill Approval Workflow**
```
┌─────────────────────────────────────────┐
│ Approve Vendor Bill                     │
├─────────────────────────────────────────┤
│ Bill #: BILL-2024-089                   │
│ Vendor: Casket Supplier Inc             │
│ Amount: $7,250    Due: 01/04/2025      │
│                                         │
│ 3-Way Match Status:                     │
│ ✅ Matched to PO-2024-004               │
│ ✅ Matched to REC-2024-012              │
│ ✅ Amounts match                        │
│                                         │
│ Approval Notes:                         │
│ [____________________________________]  │
│                                         │
│ [ Reject ]  [ Request Info ]  [ Approve ]│
└─────────────────────────────────────────┘
```

**C. Bill Payment Processing**
```
┌──────────────────────────────────────────────────────┐
│ Pay Vendor Bill                                      │
├──────────────────────────────────────────────────────┤
│ Bill: BILL-2024-089                                  │
│ Vendor: Casket Supplier Inc                          │
│ Amount Due: $7,250                                   │
│ Due Date: 01/04/2025 (30 days)                      │
│                                                      │
│ Payment Details:                                     │
│ Payment Date: [2024-12-05]                          │
│ Payment Method: (•) Check ( ) ACH ( ) Wire          │
│ Check Number: [_____]                                │
│ Amount: [$7,250]                                     │
│                                                      │
│ [ ] Apply early payment discount (2%)                │
│     Discount amount: $145                            │
│     Net payment: $7,105                              │
│                                                      │
│ Reference/Notes:                                     │
│ [______________________________________________]     │
│                                                      │
│ [ Cancel ]  [ Process Payment ]                     │
└──────────────────────────────────────────────────────┘
```

**D. Payment Run Generation**
```
┌──────────────────────────────────────────────────────┐
│ Generate Payment Run                                 │
├──────────────────────────────────────────────────────┤
│ Payment Date: [2024-12-05]                          │
│ Available Cash: [$50,000]                           │
│ Include bills due before: [2024-12-12]              │
│                                                      │
│ Recommended Bills to Pay (12):                       │
│ ┌──────────────────────────────────────────────┐   │
│ │ ☑ Vendor A - $3,200  Due: 12/08  Priority: 1│   │
│ │ ☑ Vendor B - $1,500  Due: 12/10  Priority: 2│   │
│ │ ☑ Vendor C - $8,900  Due: 12/12  Priority: 3│   │
│ │ ☐ Vendor D - $5,600  Due: 12/15  Priority: 4│   │
│ │ ... (8 more)                                 │   │
│ │                                              │   │
│ │ Selected: 3 bills    Total: $13,600         │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [ Select All ]  [ Generate Run ]                    │
└──────────────────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] **CRITICAL**: Build vendor bill entry form (3-way matching)
- [ ] Implement bill approval workflow
- [ ] Create bill payment processing form
- [ ] Build payment run generation UI
- [ ] Add batch payment execution
- [ ] Implement early payment discount calculator

**Estimated Effort**: 3 weeks

---

### 7. Financial Reports (2/2 endpoints - 100% in API, 50% in UI)

#### Available Endpoints
1. ✅ `reports.revenueByServiceType` - Revenue analysis (USED in `/staff/finops/reports`)
2. ✅ `reports.budgetVariance` - Budget vs actual (PARTIAL in `/staff/finops/reports`)

#### Current UI State
- ✅ `/staff/finops/reports` page exists with 7 report types
- ⚠️ Budget variance report exists but UI is basic
- ❌ No interactive charting
- ❌ No drill-down capabilities

#### Missing UI Enhancements

**A. Enhanced Budget Variance Report**
```
┌──────────────────────────────────────────────────────┐
│ Budget Variance Report - December 2024              │
├──────────────────────────────────────────────────────┤
│ Department  Budget   Actual   Variance   %  Status  │
│ ────────────────────────────────────────────────────│
│ Revenue     $125K    $132K    +$7K      +5.6%  ✅   │
│ COGS        $45K     $42K     -$3K      -6.7%  ✅   │
│ Salaries    $35K     $37K     +$2K      +5.7%  ⚠️   │
│ Marketing   $8K      $12K     +$4K      +50%   🔴   │
│                                                      │
│ [View Detailed Breakdown] [Export]                   │
└──────────────────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] Add interactive charts (Chart.js/Recharts)
- [ ] Implement drill-down modals
- [ ] Add variance threshold indicators (red/yellow/green)
- [ ] Create report export functionality (PDF/Excel)

**Estimated Effort**: 1 week

---

### 8. Refund Processing (1/1 endpoint - 100% in API, 0% in UI)

#### Available Endpoints
1. ❌ `refunds.process` - Process refund (lines 940-966) (NOT EXPOSED)

#### Current UI State
- ❌ **NO REFUND UI EXISTS** ⚠️
- Users must manually reverse payments or use workarounds

#### Missing UI Components

**A. Refund Processing Form**
```
┌──────────────────────────────────────────────────────┐
│ Process Refund                                       │
├──────────────────────────────────────────────────────┤
│ Case: Smith Family (CASE-2024-123)                  │
│                                                      │
│ Original Payments:                                   │
│ ☑ Payment #1 - $5,000  (12/01/24) Credit Card      │
│ ☑ Payment #2 - $3,000  (12/05/24) Check             │
│ ☐ Payment #3 - $2,000  (12/10/24) ACH               │
│                                                      │
│ Refund Amount: [$8,000]   (Max: $10,000)            │
│                                                      │
│ Reason:                                              │
│ (•) Service Adjustment                               │
│ ( ) Cancellation                                     │
│ ( ) Overpayment                                      │
│ ( ) Error Correction                                 │
│ ( ) Other                                            │
│                                                      │
│ Notes:                                               │
│ [______________________________________________]     │
│                                                      │
│ Refund Method: (•) Original payment method          │
│                ( ) Check                             │
│                                                      │
│ [ Cancel ]  [ Process Refund ]                      │
└──────────────────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] Create refund form (modal or page)
- [ ] Add to case details page (action button)
- [ ] Add to payments page
- [ ] Implement multi-payment selection
- [ ] Add refund reason dropdown
- [ ] Create refund confirmation workflow

**Estimated Effort**: 1 week

---

## Implementation Roadmap

### Phase 1: Critical Business Functions (4-5 weeks)

**Week 1: Manual Journal Entries** ⭐ HIGHEST PRIORITY
- [ ] Manual journal entry form component
- [ ] Real-time debit/credit balance validation
- [ ] Account search/autocomplete
- [ ] Draft save capability
- [ ] Integration with GL router endpoint

**Week 2: AR Management**
- [ ] AR aging report page
- [ ] Invoice management page
- [ ] Invoice creation form
- [ ] Overdue invoices dashboard widget

**Week 3: Vendor Bill Processing (AP)**
- [ ] Vendor bill entry form (3-way matching)
- [ ] Bill approval workflow
- [ ] Bill payment processing

**Week 4: Purchase Order Workflow**
- [ ] PO creation form
- [ ] PO approval workflow
- [ ] PO receiving workflow (critical for AP 3-way match)

**Week 5: Refunds & Polish**
- [ ] Refund processing form
- [ ] Integration testing
- [ ] Bug fixes

### Phase 2: Workflow Enhancements (2-3 weeks)

**Week 6: Period Close**
- [ ] Pre-close validation widget
- [ ] Close execution modal with progress
- [ ] Close history timeline

**Week 7: Payment Run & Batch Operations**
- [ ] Payment run generation UI
- [ ] Batch payment execution
- [ ] Early payment discount calculator

**Week 8: Reporting Enhancements**
- [ ] Interactive charts
- [ ] Drill-down modals
- [ ] Export functionality

### Phase 3: Advanced Features (2 weeks)

**Week 9: Analytics & Dashboards**
- [ ] Chart of accounts management
- [ ] Account history drill-down
- [ ] Budget variance enhancements

**Week 10: Polish & Documentation**
- [ ] User training materials
- [ ] Help documentation
- [ ] Video tutorials

---

## UI Framework Recommendations

### Component Library
- **DataTable**: TanStack Table (already in use)
- **Forms**: React Hook Form + Zod (already in use)
- **Modals**: Radix UI Dialog (already in use)
- **Charts**: Recharts or Chart.js
- **Date Pickers**: react-day-picker
- **Currency Input**: Custom component with formatting

### Reusable Components to Build

1. **AccountSelector** - Autocomplete GL account picker
2. **JournalEntryLines** - Multi-line entry grid with balance validation
3. **ThreeWayMatchVerification** - PO/Receipt/Invoice comparison
4. **AgingReportTable** - Reusable aging bucket table
5. **PaymentMethodSelector** - Check/ACH/Wire selector with conditional fields

---

## Success Metrics

### Business Impact
- **Time Savings**: 2-3 hours/day for accounting staff (manual JE alone)
- **Error Reduction**: 90% fewer manual entry errors with 3-way matching
- **Cash Flow**: 30% faster invoice processing improves collections
- **Compliance**: Complete audit trail for all financial transactions

### Technical Metrics
- **UI Coverage**: 36% → 95% (27 endpoints exposed)
- **User Satisfaction**: Target NPS > 8/10
- **Page Load**: < 2 seconds for all financial pages
- **Error Rate**: < 1% for all financial transactions

---

## Next Steps

1. **Stakeholder Review**: Present this plan to accounting/finance team
2. **Prioritization**: Confirm priority order with business owners
3. **Design Phase**: Create detailed mockups for Phase 1 features
4. **Sprint Planning**: Break down into 2-week sprints
5. **Development**: Start with manual journal entry form (highest impact)

---

**Document Owner**: Engineering Team  
**Last Updated**: December 5, 2024  
**Next Review**: Weekly during implementation
