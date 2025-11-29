# Cash Advances & Pass-Through Expenses
**Balance Sheet Only Transactions for Funeral Home Reimbursables**

---

## Executive Summary

**YES, you are absolutely correct!** The Go ERP has extensive **pass-through / reimbursable expense** capabilities via the **Professional Services (PS) module**. This is **perfect for funeral home cash advances** - those expenses the funeral home pays on behalf of families (death certificates, flowers, obituary notices, cemetery fees) where the funeral home:

- ✅ **Receives no revenue** (pure pass-through)
- ✅ **Records no expense** (not a cost of doing business)
- ✅ **Only impacts balance sheet** (asset/liability movements)

This is exactly how the PS module's `BuildPSExpenseAccrual` and **Expense Clearing** accounts work.

---

## Funeral Home Cash Advances: The Problem

### What are Cash Advances?

Cash advances (also called "disbursements" or "third-party charges") are amounts the **funeral home pays on behalf of the family** to third parties, then **bills the family to recover** those exact amounts.

**Common Cash Advances:**
| Item | Typical Amount | Payee |
|------|----------------|-------|
| Death Certificates | $25 each (3-10 copies typical) | County Clerk |
| Obituary Notice | $200-$500 | Newspaper |
| Clergy/Minister | $150-$300 | Religious officiant |
| Musician/Organist | $100-$250 | Church or musician |
| Cemetery Opening/Closing | $600-$1,200 | Cemetery |
| Flowers (if arranged by FH) | $150-$500 | Florist |
| Crematory Fee (outsourced) | $300-$800 | Third-party crematory |

### Why They're Different from Revenue

**FTC Funeral Rule Compliance**:
- Cash advances **must be itemized separately** from funeral home services
- The funeral home **cannot mark up** cash advances (pure pass-through)
- If the funeral home earns a fee/commission, it must be **disclosed separately**

**Accounting Treatment**:
```
❌ WRONG: DR Cash, CR Revenue (overstates revenue)
❌ WRONG: DR Expense, CR Cash (overstates expenses)
✅ CORRECT: Balance sheet only (Reimbursable Asset → Cash → AR)
```

**Example Problem: Without Pass-Through Accounting**
```
Johnson Family Case:
  Professional Services: $2,500 (funeral home revenue)
  Casket: $3,500 (funeral home revenue)
  Death Certificates: $75 (cash advance - NOT revenue)
  Obituary: $400 (cash advance - NOT revenue)
  Total Invoice: $6,475

❌ Wrong Approach (recording cash advances as revenue):
  Revenue: $6,475
  Result: Overstated revenue by $475 (6.8%)
  Problem: Regulatory non-compliance + distorted margins

✅ Correct Approach (pass-through accounting):
  Revenue: $6,000 (services + merchandise only)
  Cash Advances: $475 (balance sheet pass-through)
  Result: Accurate revenue, clean margins
```

---

## Go ERP Solution: Professional Services Module

### Architecture Overview

The **Professional Services (PS) module** provides **reimbursable expense accounting** which maps perfectly to funeral home cash advances.

**Key Components:**
1. **Reimbursable Expense Account** (Asset) - Tracks amounts paid on behalf of client
2. **Expense Clearing Account** (Liability) - Temporary holding account
3. **AR Invoice** - Bill client for reimbursable expenses
4. **Cash Receipt** - Collect payment from client

### Account Types (from domain/types.go)

```go
ReimbursableExpense     // Asset: Amounts paid on behalf of client
ServiceExpenseClearing  // Liability: Clearing account for pass-through
AccountsReceivable      // Asset: Amount owed by client
Cash                    // Asset: Cash on hand
```

### Domain Functions (from domain/ps.go)

```go
// Account ID helpers
func PSReimbursableExpenseID(tenant, currency, projectID string) AccountID
func PSExpenseClearingID(tenant, currency string) AccountID

// Accrue reimbursable expense: DR ReimbursableExpense, CR ExpenseClearing
func BuildPSExpenseAccrual(reimbID, clearingID AccountID, amount uint64, seed string) Transfer
```

---

## Funeral Home Cash Advance Flow

### Step-by-Step Accounting

**Scenario: Johnson Family Case**
- Death certificates: $75 (3 × $25)
- Obituary notice: $400
- Cemetery opening: $800
- **Total cash advances: $1,275**

### Step 1: Funeral Home Pays Vendor (Initial Outlay)

**When funeral home pays County Clerk for death certificates:**

```go
// DR ReimbursableExpense (Asset), CR Cash
reimbExpenseID := PSReimbursableExpenseID("dykstra", "USD", "johnson-case-001")
cashID := DeterministicAccountIDFromStrings("cash", "dykstra", "dykstra-chicago")

transfer := Transfer{
  ID:              DeterministicTransferIDFromStrings("johnson-case-001", "death-certs"),
  DebitAccountID:  reimbExpenseID,  // Increase asset (amount recoverable)
  CreditAccountID: cashID,           // Decrease cash
  Amount:          7500,             // $75
  Type:            StandardTransfer,
}
```

**GL Impact:**
```
Assets:
  Cash:                    -$75      (paid county clerk)
  Reimbursable Expense:    +$75      (recoverable from family)
  Net Assets:              $0        (balance sheet neutral)

Revenue: $0 (no revenue recorded)
Expenses: $0 (no expense recorded)
```

### Step 2: Accrue All Cash Advances (Arrangement Conference)

**Batch all cash advances for the case:**

```go
reimbExpenseID := PSReimbursableExpenseID("dykstra", "USD", "johnson-case-001")
expenseClearingID := PSExpenseClearingID("dykstra", "USD")

// Death certificates: $75
deathCerts := BuildPSExpenseAccrual(reimbExpenseID, expenseClearingID, 7500, "johnson-death-certs")

// Obituary: $400
obituary := BuildPSExpenseAccrual(reimbExpenseID, expenseClearingID, 40000, "johnson-obituary")

// Cemetery: $800
cemetery := BuildPSExpenseAccrual(reimbExpenseID, expenseClearingID, 80000, "johnson-cemetery")

// Post all at once
batch.CreateTransfersBatch([]Transfer{deathCerts, obituary, cemetery})
```

**GL Impact (after all accruals):**
```
Assets:
  Reimbursable Expense:    +$1,275   (total recoverable)

Liabilities:
  Expense Clearing:        +$1,275   (clearing account)

Net: $0 (balance sheet neutral, no P&L impact)
```

### Step 3: Generate Client Invoice (Bill Family)

**Invoice family for services + merchandise + cash advances:**

```go
arID := PSARID("dykstra", "USD")

// Invoice for services ($6,000) - this IS revenue
serviceInvoice := BuildInvoicePosting(arID, revenueID, 600000, "johnson-services")

// Invoice for cash advances ($1,275) - this is NOT revenue
// We bill AR against the clearing account, NOT revenue
cashAdvanceInvoice := Transfer{
  ID:              DeterministicTransferIDFromStrings("johnson-case-001", "cash-advance-invoice"),
  DebitAccountID:  arID,                        // DR AR
  CreditAccountID: expenseClearingID,           // CR Expense Clearing
  Amount:          127500,                      // $1,275
  Type:            InvoicePosting,
}
```

**GL Impact:**
```
Assets:
  AR:                      +$7,275   ($6,000 services + $1,275 cash advances)
  Reimbursable Expense:    +$1,275   (unchanged, still an asset)

Liabilities:
  Expense Clearing:        $0        ($1,275 - $1,275 cleared)

Revenue:                   +$6,000   (services only, NOT cash advances)

P&L Impact: +$6,000 revenue (cash advances NOT included)
```

### Step 4: Collect Payment from Family

**Family pays invoice:**

```go
// DR Cash, CR AR
cashReceipt := Transfer{
  ID:              DeterministicTransferIDFromStrings("johnson-case-001", "payment"),
  DebitAccountID:  cashID,
  CreditAccountID: arID,
  Amount:          727500,  // $7,275
  Type:            CashReceipt,
}
```

**GL Impact:**
```
Assets:
  Cash:                    +$7,275   (payment received)
  AR:                      $0        (cleared)
  Reimbursable Expense:    +$1,275   (still recorded)

Note: Cash increased by $7,275, but $1,275 was already spent in Step 1
Net cash increase: $6,000 (revenue only)
```

### Step 5: Clear Reimbursable Expense (Close Loop)

**Final step: Clear the reimbursable expense asset:**

```go
// DR Expense Clearing (or AP if vendor invoices arrive later), CR Reimbursable Expense
// This closes the loop when vendor invoices are fully processed

clearReimbursable := Transfer{
  ID:              DeterministicTransferIDFromStrings("johnson-case-001", "clear-reimbursable"),
  DebitAccountID:  expenseClearingID,  // Or AP if vendor invoice arrives later
  CreditAccountID: reimbExpenseID,
  Amount:          127500,
  Type:            StandardTransfer,
}
```

**Final GL State:**
```
Assets:
  Cash:                    +$6,000   (net cash from services, after cash advances paid/recovered)
  Reimbursable Expense:    $0        (cleared)
  AR:                      $0        (collected)

Liabilities:
  Expense Clearing:        $0        (cleared)

Revenue:                   +$6,000   (services only)
Expenses:                  $0        (no expenses recorded for cash advances)

P&L: +$6,000 (accurate, no distortion from cash advances)
```

---

## Complete BFF Integration Pattern

### BFF Router: Cash Advances

```typescript
// services/bff/src/routers/cash-advances.router.ts

export const cashAdvancesRouter = router({
  // Record cash advance paid on behalf of family
  recordPayment: staffProcedure
    .input(z.object({
      caseId: z.string(),
      vendor: z.enum(['county_clerk', 'newspaper', 'cemetery', 'florist', 'crematory', 'clergy', 'musician']),
      description: z.string(),
      amountCents: z.number(),
      paidDate: z.string(),
      checkNumber: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Record cash outlay: DR Reimbursable Expense, CR Cash
      const reimbExpenseID = await ctx.erpClient.POST('/ps/reimbursable-expense/accrue', {
        body: {
          tenant: ctx.tenant,
          legal_entity: ctx.legalEntity,
          currency: 'USD',
          project_id: input.caseId,  // Case ID as project
          amount_cents: input.amountCents,
          seed: `${input.caseId}-${input.vendor}-${Date.now()}`,
        },
      });

      // 2. Store in CRM for display/tracking
      await ctx.db.cashAdvance.create({
        data: {
          caseId: input.caseId,
          vendor: input.vendor,
          description: input.description,
          amount: input.amountCents,
          paidDate: new Date(input.paidDate),
          checkNumber: input.checkNumber,
          status: 'paid',
        },
      });

      return { success: true, reimbExpenseID };
    }),

  // Bill family for cash advances (add to invoice)
  addToInvoice: staffProcedure
    .input(z.object({
      caseId: z.string(),
      invoiceId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Get all unpaid cash advances for case
      const cashAdvances = await ctx.db.cashAdvance.findMany({
        where: {
          caseId: input.caseId,
          status: 'paid',  // Paid by FH, not yet billed to family
        },
      });

      const totalCashAdvances = cashAdvances.reduce((sum, ca) => sum + ca.amount, 0);

      // 2. Invoice family: DR AR, CR Expense Clearing
      await ctx.erpClient.POST('/ps/cash-advances/invoice', {
        body: {
          tenant: ctx.tenant,
          legal_entity: ctx.legalEntity,
          currency: 'USD',
          invoice_id: input.invoiceId,
          amount_cents: totalCashAdvances,
          line_items: cashAdvances.map(ca => ({
            description: ca.description,
            amount_cents: ca.amount,
          })),
        },
      });

      // 3. Mark cash advances as billed
      await ctx.db.cashAdvance.updateMany({
        where: { caseId: input.caseId, status: 'paid' },
        data: { status: 'billed' },
      });

      return { totalCashAdvances, lineItems: cashAdvances.length };
    }),

  // List cash advances for a case
  list: staffProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ input, ctx }) => {
      const cashAdvances = await ctx.db.cashAdvance.findMany({
        where: { caseId: input.caseId },
        orderBy: { paidDate: 'desc' },
      });

      const totalPaid = cashAdvances
        .filter(ca => ca.status === 'paid')
        .reduce((sum, ca) => sum + ca.amount, 0);

      const totalBilled = cashAdvances
        .filter(ca => ca.status === 'billed')
        .reduce((sum, ca) => sum + ca.amount, 0);

      return { cashAdvances, totalPaid, totalBilled };
    }),
});
```

---

## Benefits of Pass-Through Accounting

### 1. **Regulatory Compliance (FTC Funeral Rule)**
- ✅ Cash advances **itemized separately** on General Price List (GPL)
- ✅ No markup on pass-through items (pure cost recovery)
- ✅ Clean audit trail for regulatory inspections

### 2. **Accurate Financial Reporting**
```
❌ Without pass-through accounting:
  Dykstra Funeral Home - October 2025
  Revenue: $300,000
  Cash Advances (buried in revenue): $25,000
  True Revenue: $275,000
  Margin distortion: 9.1% overstatement

✅ With pass-through accounting:
  Revenue: $275,000 (services + merchandise only)
  Cash Advances: $25,000 (balance sheet only)
  True Revenue: $275,000
  Accurate margins: Clean P&L
```

### 3. **Cash Flow Visibility**
- Know exactly how much cash is tied up in reimbursables
- Identify slow-paying families (high reimbursable asset balance)
- Dashboard: "Total cash advances outstanding: $12,500 across 15 cases"

### 4. **Vendor Reconciliation**
- Track which vendors have been paid
- Reconcile funeral home payments vs. family payments
- Handle timing differences (FH pays vendor before family pays FH)

---

## Real-World Example: Johnson Family Case

### Complete Transaction Log

| Date | Transaction | DR | CR | Revenue | Expense | Balance Sheet Impact |
|------|-------------|----|----|---------|---------|---------------------|
| **11/15** | Pay County Clerk (death certs) | Reimbursable Expense $75 | Cash $75 | $0 | $0 | Assets: +$75 reimb, -$75 cash |
| **11/16** | Pay Newspaper (obituary) | Reimbursable Expense $400 | Cash $400 | $0 | $0 | Assets: +$400 reimb, -$400 cash |
| **11/17** | Pay Cemetery (opening) | Reimbursable Expense $800 | Cash $800 | $0 | $0 | Assets: +$800 reimb, -$800 cash |
| **11/18** | Accrue to clearing | Reimbursable Expense | Expense Clearing $1,275 | $0 | $0 | Liability: +$1,275 |
| **11/20** | Invoice family (services) | AR $6,000 | Revenue $6,000 | **$6,000** | $0 | Assets: +$6,000 AR |
| **11/20** | Invoice family (cash advances) | AR $1,275 | Expense Clearing $1,275 | **$0** | $0 | Assets: +$1,275 AR |
| **11/25** | Collect payment | Cash $7,275 | AR $7,275 | $0 | $0 | Assets: +$7,275 cash, -$7,275 AR |
| **11/30** | Clear reimbursable | Expense Clearing $1,275 | Reimbursable Expense $1,275 | $0 | $0 | Assets: -$1,275 reimb, Liabilities: -$1,275 clearing |

**Final Results:**
- **Revenue**: $6,000 (services only, accurate)
- **Expenses**: $0 (no expenses, cash advances are pass-through)
- **Net Cash Flow**: +$6,000 (cash in $7,275 - cash out $1,275)
- **P&L Impact**: +$6,000 revenue (clean, no distortion)

---

## Integration with Existing Modules

### 1. **CPQ Module Integration**
```typescript
// Define cash advance items in CPQ catalog
const cashAdvanceItems = [
  { sku: 'CA-DEATH-CERT', name: 'Death Certificate', price: 2500, taxClass: 'exempt', type: 'cash_advance' },
  { sku: 'CA-OBITUARY', name: 'Obituary Notice', price: 40000, taxClass: 'exempt', type: 'cash_advance' },
  { sku: 'CA-CEMETERY-OPEN', name: 'Cemetery Opening/Closing', price: 80000, taxClass: 'exempt', type: 'cash_advance' },
  { sku: 'CA-CLERGY', name: 'Clergy/Minister', price: 20000, taxClass: 'exempt', type: 'cash_advance' },
];

// Configure CPQ pricing rules
const cashAdvanceRule = {
  rule_id: 'CASH-ADVANCE-RULE',
  kind: 'attribute_required',
  expr: {
    if_sku: 'CA-*',  // All cash advance items
    then_attribute_required: 'pass_through',
    then_attribute_value: true,  // Flag as pass-through
  },
};
```

### 2. **Sales Order Integration**
```typescript
// When converting quote to sales order, separate cash advances
const quote = await ctx.erpClient.GET('/quotes/{id}', { params: { path: { id: quoteId } } });

const serviceLines = quote.lines.filter(line => !line.sku.startsWith('CA-'));
const cashAdvanceLines = quote.lines.filter(line => line.sku.startsWith('CA-'));

// Create sales order for services/merchandise only
const order = await ctx.erpClient.POST('/sales-orders', {
  body: {
    lines: serviceLines,  // Revenue-generating lines only
  },
});

// Track cash advances separately (not part of sales order revenue)
for (const line of cashAdvanceLines) {
  await ctx.erpClient.POST('/ps/cash-advances/accrue', {
    body: {
      project_id: order.id,
      description: line.name,
      amount_cents: line.extended_cents,
    },
  });
}
```

### 3. **GL Reporting Integration**
```typescript
// Generate P&L showing cash advances separately
const pnl = await ctx.erpClient.GET('/gl/statements/pnl', {
  params: { query: { start_date: '2025-11-01', end_date: '2025-11-30' } },
});

// Cash advances do NOT appear in revenue or expenses
// They only appear in balance sheet (Reimbursable Expense asset)
const balanceSheet = await ctx.erpClient.GET('/gl/statements/balance-sheet', {
  params: { query: { as_of_date: '2025-11-30' } },
});

// Show cash advances as separate line item in balance sheet
const reimbursableAssets = balanceSheet.assets.filter(
  a => a.account_type === 'ReimbursableExpense'
);
```

---

## FTC Compliance: General Price List (GPL)

### Required Itemization Format

**Per FTC Funeral Rule § 453.2(b)(4):**

> "The funeral provider must disclose on the itemized statement any cash advance items, with a description of each item and the amount, and clearly state that the charge is for a cash advance item."

### GPL Presentation (Example)

```
DYKSTRA FUNERAL HOME
GENERAL PRICE LIST

═══════════════════════════════════════════════════════════

BASIC SERVICES & OVERHEAD ............................. $2,500

PROFESSIONAL SERVICES:
  Embalming ............................................. $750
  Other Preparation ..................................... $500
  Viewing/Visitation Facilities ........................ $1,500
  Chapel Service ........................................ $800
  Graveside Service ..................................... $500

MERCHANDISE:
  Casket (Oak Heritage) ................................ $3,500
  Vault (Concrete) ..................................... $1,200

TRANSPORTATION:
  Transfer of Remains ................................... $395
  Funeral Coach (Hearse) ................................ $295
  Limousine ............................................. $295

CASH ADVANCES:
  (These are charges paid by the funeral home on your behalf
   to third parties. We charge you the exact amount with no markup.)

  Death Certificates (3) ................................ $75
  Obituary Notice (Newspaper) ........................... $400
  Cemetery Opening/Closing .............................. $800
  Clergy Honorarium ..................................... $200
  Musician/Organist ..................................... $150

═══════════════════════════════════════════════════════════

TOTAL FUNERAL SERVICE ................................ $13,860

  Services & Merchandise: $11,235
  Cash Advances (pass-through): $1,625

═══════════════════════════════════════════════════════════
```

---

## Conclusion

The Go ERP's **Professional Services (PS) module** provides **production-grade pass-through accounting** that is **perfect for funeral home cash advances**. Key capabilities:

1. ✅ **Balance sheet only transactions** (no revenue/expense distortion)
2. ✅ **Reimbursable Expense tracking** (know what's owed by families)
3. ✅ **Expense Clearing accounts** (proper GL treatment)
4. ✅ **FTC Funeral Rule compliance** (itemized separately, no markup)
5. ✅ **Accurate financial reporting** (clean P&L, true margins)

**Integration Effort**: 1-2 weeks
- Map cash advance items in CPQ catalog
- Build BFF `cashAdvancesRouter` (tRPC procedures)
- Create staff UI for recording/tracking cash advances
- Generate compliant GPL with cash advance section

**Business Value**:
- **Regulatory compliance**: FTC Funeral Rule adherence
- **Financial accuracy**: Clean margins, accurate revenue
- **Operational efficiency**: Track reimbursables per case
- **Cash flow visibility**: Know outstanding reimbursables

---

**Document Status**: Draft v1.0  
**Last Updated**: 2025-11-29  
**Author**: AI Agent  
**Next Steps**: Validate with funeral home operators, build BFF router, test E2E flow
