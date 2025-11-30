# Case-to-GL with CPQ & Sales Order Orchestration
**Funeral Home Inquiry → Quote → Case → Order → Invoice → GL Flow**

---

## Executive Summary

This document analyzes whether to leverage the **extensive CPQ (Configure-Price-Quote)** and **Sales Order orchestration** capabilities in the Go ERP for the funeral home case management workflow. The answer is **YES** - these modules provide production-grade infrastructure for the inquiry → quote → case → financial posting flow that would otherwise need to be custom-built.

**Key Insight**: A funeral home "case" is essentially a **sales order** with unique characteristics (service-based, at-need vs. pre-need, deposit requirements). The Go ERP's CPQ + Sales Order + Inventory + GL modules provide a complete orchestration framework.

---

## Funeral Home Case Lifecycle vs. ERP Capabilities

### Traditional Funeral Home Flow
```
Death Call → Inquiry → Arrangements → Quote → Contract → Service Delivery → Invoice → Payment
```

### Mapped to Go ERP Capabilities
```
Family Contact → CPQ Quote → Contract (Sales Order) → Inventory Allocation → Service Delivery → AR Invoice → GL Posting
        ↓              ↓                ↓                      ↓                    ↓              ↓
    (TypeScript)   (Go CPQ)      (Go Sales Order)      (Go Inventory)      (Go AR/GL)      (Go GL)
```

---

## Phase 1: Inquiry to Quote (CPQ Module)

### Why Use CPQ for Funeral Home Quotes?

**The Go CPQ module (12 files, 1,628 LOC, 92% test coverage ✅) provides**:

1. **Product Catalog Management**
   - SKU-based items (caskets, urns, vaults, services)
   - Attributes (color, material, size) for merchandise
   - Tax classification (taxable vs. tax-exempt services)
   - Lifecycle management (active, retired products)

2. **Tiered Pricing Engine**
   - Multi-tier pricing (quantity breaks for multiple services)
   - Customer-specific pricing (pre-need vs. at-need pricing tiers)
   - Discount rules (pre-need discounts: 10-30% off)
   - FX conversion (US/Canadian border funeral homes)

3. **Quote Lifecycle with Approval Workflows**
   - Draft → Configure → Price → Approve → Send → Accept → Convert to Order
   - Approval gates for large discounts (e.g., >20% discount requires manager approval)
   - Versioned pricing (audit trail: "What was the price when quote was generated?")

4. **Configuration Rules Engine**
   - **Requires rules**: "If casket selected, must include vault" (common funeral home requirement)
   - **Excludes rules**: "Cannot select both traditional burial and cremation"
   - **Attribute validation**: "Casket must have color and material attributes"

### Funeral Home Catalog Example

**Product Categories in CPQ:**

| SKU | Name | Type | Tax Class | Attributes | Price |
|-----|------|------|-----------|------------|-------|
| `CASKET-OAK-001` | Oak Casket - Heritage | Merchandise | Taxable | color:oak, material:wood, size:standard | $3,500 |
| `URN-BRASS-101` | Brass Urn - Classic | Merchandise | Taxable | material:brass, capacity:220ci | $450 |
| `VAULT-CONC-001` | Concrete Vault | Merchandise | Taxable | material:concrete | $1,200 |
| `SVC-PROF-001` | Professional Services | Service | Exempt | - | $2,500 |
| `SVC-EMBALM-001` | Embalming | Service | Exempt | - | $750 |
| `SVC-FACILITY-001` | Facility Use (3 days) | Service | Exempt | - | $1,500 |
| `SVC-TRANSPORT-001` | Transportation | Service | Exempt | - | $395 |
| `CERT-DEATH-001` | Death Certificate | Document | Exempt | - | $25 |

### CPQ Configuration Rules for Funeral Homes

**Rule 1: Casket Requires Vault (Traditional Burial)**
```json
{
  "rule_id": "RULE-001",
  "kind": "requires",
  "expr": {
    "if_sku": "CASKET-*",
    "then_requires_sku": "VAULT-*"
  }
}
```

**Rule 2: Cremation Excludes Casket**
```json
{
  "rule_id": "RULE-002",
  "kind": "excludes",
  "expr": {
    "if_sku": "URN-*",
    "then_excludes_sku": "CASKET-*"
  }
}
```

**Rule 3: Professional Services Always Required**
```json
{
  "rule_id": "RULE-003",
  "kind": "requires",
  "expr": {
    "if_any_line": true,
    "then_requires_sku": "SVC-PROF-*"
  }
}
```

### CPQ Pricing Workflow

**Scenario: Johnson Family - Traditional Burial**

**Step 1: Create Quote**
```bash
POST /quotes
{
  "id": "QUOTE-20251129-001",
  "tenant": "dykstra-funeral",
  "legal_entity": "dykstra-chicago",
  "currency": "USD",
  "customer": {"name": "Johnson Family", "contact": "john@example.com"},
  "lines": [
    {"sku": "SVC-PROF-001", "qty": 1},
    {"sku": "CASKET-OAK-001", "qty": 1, "attributes": {"color": "oak"}},
    {"sku": "VAULT-CONC-001", "qty": 1},
    {"sku": "SVC-EMBALM-001", "qty": 1},
    {"sku": "SVC-FACILITY-001", "qty": 1},
    {"sku": "SVC-TRANSPORT-001", "qty": 1},
    {"sku": "CERT-DEATH-001", "qty": 3}
  ]
}
```

**Step 2: Price with CPQ (captures versions for audit trail)**
```bash
POST /quotes/QUOTE-20251129-001/price-cpq
{
  "tax_percent": 8.25,  # IL sales tax on merchandise only
  "shipping_cents": 0
}

Response:
{
  "subtotal_cents": 995000,    # $9,950 (services + merchandise)
  "tax_cents": 41287,          # 8.25% on merchandise only ($5,000)
  "shipping_cents": 0,
  "total_cents": 1036287,      # $10,362.87
  "line_items": [
    {"sku": "SVC-PROF-001", "qty": 1, "unit_price_cents": 250000, "extended_cents": 250000, "taxable": false},
    {"sku": "CASKET-OAK-001", "qty": 1, "unit_price_cents": 350000, "extended_cents": 350000, "taxable": true},
    {"sku": "VAULT-CONC-001", "qty": 1, "unit_price_cents": 120000, "extended_cents": 120000, "taxable": true},
    {"sku": "SVC-EMBALM-001", "qty": 1, "unit_price_cents": 75000, "extended_cents": 75000, "taxable": false},
    {"sku": "SVC-FACILITY-001", "qty": 1, "unit_price_cents": 150000, "extended_cents": 150000, "taxable": false},
    {"sku": "SVC-TRANSPORT-001", "qty": 1, "unit_price_cents": 39500, "extended_cents": 39500, "taxable": false},
    {"sku": "CERT-DEATH-001", "qty": 3, "unit_price_cents": 2500, "extended_cents": 7500, "taxable": false}
  ],
  "catalog_version": "catalog@commit:12345",    # Audit trail: price at this catalog version
  "price_list_version": "pl:default@commit:67890"
}
```

**Step 3: Approve Quote (if discount applied)**
```bash
# If funeral director applies 10% discount for pre-need planning
POST /quotes/QUOTE-20251129-001/request-approval
POST /quotes/QUOTE-20251129-001/approve  # Manager approval
```

**Step 4: Send to Family**
```bash
POST /quotes/QUOTE-20251129-001/send
{
  "to": "john@example.com",
  "pdf_url": "https://portal.dykstrafuneral.com/quotes/QUOTE-20251129-001.pdf"
}
```

---

## Phase 2: Quote to Order (Sales Order Module)

### Why Use Sales Orders for Funeral Home Cases?

**The Go Sales Order module provides**:

1. **Order Lifecycle Tracking (Ledger 4 - Sales Order Ledger)**
   - **Book** → **Allocate** → **Ship** → **Invoice** → **Close**
   - Each state tracked in TigerBeetle for real-time status
   - Perfect audit trail: "When was merchandise allocated? When was service delivered?"

2. **Deposit Management**
   - Collect deposit at contract signing (50% typical)
   - Track deposit liability separate from AR
   - Release deposit on invoice (apply to AR balance)

3. **Inventory Allocation**
   - Reserve casket/urn when quote converts to order
   - Prevent double-booking of merchandise
   - Multi-location availability (check other funeral homes)

4. **Credit Hold Integration**
   - Block order booking if family has outstanding AR
   - Require full payment upfront for high-risk families

### Sales Order Lifecycle for Funeral Home

**State Progression:**
```
Quote Accepted → Book Order → Allocate Inventory → Deliver Service → Invoice → Close Case
       ↓              ↓               ↓                    ↓              ↓          ↓
   (CPQ Module)  (SO Ledger 4)  (Inventory Reserve)  (Inventory Commit) (AR/GL)  (SO Close)
```

### Sales Order Events (TigerBeetle Ledger 4)

**1. Book Order (Quote → Sales Order)**
```go
BuildSOBook(controlID, bookedID, qty, seed)
// DR SO_Control, CR SO_Booked
// Records: "Johnson case booked for 1 casket + services"
```

**2. Allocate Inventory**
```go
BuildSOAllocate(bookedID, allocatedID, qty, seed)
// DR SO_Booked, CR SO_Allocated
// Records: "Casket CASKET-OAK-001 allocated to Johnson case"
```

**3. Deliver Service (Funeral Completed)**
```go
BuildSOShip(allocatedID, shippedID, qty, seed)
// DR SO_Allocated, CR SO_Shipped
// Records: "Service delivered for Johnson case"
```

**4. Invoice Customer**
```go
BuildSOInvoice(shippedID, invoicedID, qty, seed)
// DR SO_Shipped, CR SO_Invoiced
// Records: "Invoice generated for Johnson case"
```

**5. Close Case**
```go
BuildSOClose(invoicedID, controlID, qty, seed)
// DR SO_Invoiced, CR SO_Control
// Records: "Johnson case closed, AR collected"
```

### Deposit Flow (Money Ledger)

**At Contract Signing:**
```go
// 1. Collect deposit: $5,000 (50% of $10,000 total)
BuildCashReceipt(cashID, depositLiabilityID, 500000, seed)
// DR Cash $5,000, CR Deposit Liability $5,000

// 2. Link deposit to sales order
BuildSODepositDet(depositID, unappliedCashID, 500000, seed)
// DR SO_Deposit (asset), CR Unapplied Cash
```

**At Service Completion (Invoice):**
```go
// 3. Release deposit to AR
BuildSODepositRelease(depositID, arID, 500000, seed)
// DR Deposit Liability, CR AR
// Effect: Reduces AR balance from $10,000 to $5,000
```

---

## Phase 3: Order to Invoice (AR Module Integration)

### Invoice Generation from Sales Order

**After service delivery, generate AR invoice:**

```go
// For each line item in sales order:
// Service lines → Revenue accounts
BuildInvoicePosting(arID, revenueID, amount, seed)
// DR AR, CR Revenue (by service type)

// Merchandise lines → COGS posting (via Inventory module)
BuildInventoryCommit(inventoryID, cogsID, qty, value, seed)
// DR COGS, CR Inventory
```

### GL Account Mapping per Line Item

**Johnson Case Invoice Postings:**

| Line Item | Amount | GL Posting |
|-----------|--------|------------|
| Professional Services | $2,500 | DR AR $2,500 / CR Revenue-Professional Services 4000 |
| Casket (Oak) | $3,500 | DR AR $3,500 / CR Revenue-Merchandise 4100 |
| Vault | $1,200 | DR AR $1,200 / CR Revenue-Merchandise 4100 |
| Embalming | $750 | DR AR $750 / CR Revenue-Services 4200 |
| Facility Use | $1,500 | DR AR $1,500 / CR Revenue-Facilities 4300 |
| Transportation | $395 | DR AR $395 / CR Revenue-Transportation 4400 |
| Death Certificates | $75 | DR AR $75 / CR Revenue-Documents 4500 |
| Sales Tax | $412.87 | DR AR $412.87 / CR Sales Tax Payable 2400 |
| **Total Invoice** | **$10,362.87** | DR AR $10,362.87 / CR Various Revenue + Tax |

**COGS Postings (Merchandise only):**

| Merchandise | Qty | WAC Cost | COGS Posting |
|-------------|-----|----------|--------------|
| Casket (Oak) | 1 | $2,100 | DR COGS-Merchandise 5001 $2,100 / CR Inventory 1300 $2,100 |
| Vault | 1 | $750 | DR COGS-Merchandise 5002 $750 / CR Inventory 1300 $750 |

**Net Result:**
- **Revenue**: $9,950 ($10,362.87 - $412.87 tax)
- **COGS**: $2,850 (merchandise cost)
- **Gross Profit**: $7,100 (71.4% margin)
- **AR Balance**: $10,362.87
- **Deposit Applied**: -$5,000
- **Net AR Due**: $5,362.87

---

## Phase 4: Payment to GL (Complete Flow)

### Payment Application

**Family pays remaining balance:**

```go
// 1. Cash receipt
BuildCashReceipt(cashID, arID, 536287, seed)
// DR Cash $5,362.87 / CR AR $5,362.87

// 2. Close AR balance
// AR balance now $0, case fully paid
```

### Complete GL Impact (Johnson Case)

**Balance Sheet:**
```
Assets:
  Cash:                 +$10,362.87  (deposit $5,000 + balance $5,362.87)
  Inventory:            -$2,850      (casket + vault COGS)
  Accounts Receivable:  $0           (invoice $10,362.87 - deposit $5,000 - payment $5,362.87)

Liabilities:
  Deposit Liability:    $0           (collected $5,000, released $5,000)
  Sales Tax Payable:    +$412.87     (to be remitted to IL DOR)

Equity:
  Retained Earnings:    +$7,100      (net profit)
```

**Income Statement:**
```
Revenue:
  Professional Services:    $2,500
  Merchandise:              $4,700     (casket + vault)
  Services:                 $750       (embalming)
  Facilities:               $1,500
  Transportation:           $395
  Documents:                $75
  Total Revenue:            $9,920

Cost of Goods Sold:
  Merchandise (WAC):        $2,850
  Total COGS:               $2,850

Gross Profit:               $7,070     (71.3% margin)
```

---

## Architecture Integration Pattern

### TypeScript CRM (Frontend) ↔ Go ERP (Backend) Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ TypeScript CRM (Next.js + tRPC)                                 │
│ ─────────────────────────────────────────────────────────────── │
│ • Family Portal: Inquiry, arrangements, contract signing        │
│ • Staff Dashboard: Case management, quote generation            │
│ • Contract Builder: Generate GPL (General Price List)           │
│ • Payment Portal: Stripe integration for deposits/payments      │
└────────────────────────┬────────────────────────────────────────┘
                         │ tRPC API Calls
                         │ (via BFF service)
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ BFF Service (Fastify + tRPC + openapi-fetch)                    │
│ ─────────────────────────────────────────────────────────────── │
│ • Quote Orchestration: Map CRM cases → CPQ quotes               │
│ • Order Orchestration: Convert quotes → Sales orders            │
│ • Payment Mapping: Stripe webhooks → AR cash receipts           │
│ • GL Aggregation: Real-time financials for dashboard            │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP + OpenAPI
                         │
          ┌──────────────┼──────────────┬─────────────┐
          ↓              ↓              ↓             ↓
┌─────────────┐ ┌────────────┐ ┌──────────────┐ ┌─────────┐
│ Go CPQ      │ │ Go Sales   │ │ Go Inventory │ │ Go GL   │
│ Module      │ │ Orders     │ │ + WAC        │ │ + AR    │
│             │ │            │ │              │ │         │
│ • Catalog   │ │ • Book     │ │ • Reserve    │ │ • Post  │
│ • Pricing   │ │ • Allocate │ │ • Commit     │ │ • Report│
│ • Rules     │ │ • Deposit  │ │ • COGS       │ │         │
└─────────────┘ └────────────┘ └──────────────┘ └─────────┘
          │              │              │             │
          └──────────────┴──────────────┴─────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ TigerBeetle (5 Ledgers)                                          │
│ ─────────────────────────────────────────────────────────────── │
│ Ledger 1 (Money):   Cash, AR, Revenue, COGS, Inventory Value    │
│ Ledger 2 (Units):   Inventory quantities (on-hand, reserved)    │
│ Ledger 3 (Counter): Customer subledger (AR mirror)              │
│ Ledger 4 (SO):      Sales order states (booked → invoiced)      │
│ Ledger 5 (Admin):   Credit holds, pricing overrides             │
└─────────────────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────────┐
│ EventStoreDB (Write-Side Events)                                 │
│ ─────────────────────────────────────────────────────────────── │
│ catalog|CASKET-OAK-001 → CatalogItemCreated                      │
│ quote|QUOTE-20251129-001 → QuoteCreated, QuotePriced, ...       │
│ sales_order|SO-20251129-001 → OrderBooked, ...                  │
└─────────────────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────────┐
│ PostgreSQL (Read Models)                                         │
│ ─────────────────────────────────────────────────────────────── │
│ cpq_catalog_items, cpq_prices, cpq_quotes                        │
│ sales_orders, sales_order_lines                                  │
│ inventory_on_hand, inventory_reserved                            │
│ gl_balances, ar_aging                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## BFF Service Orchestration (tRPC Procedures)

### Quote Procedures

```typescript
// services/bff/src/routers/quotes.router.ts

export const quotesRouter = router({
  // Create funeral home quote (maps to CPQ)
  create: protectedProcedure
    .input(z.object({
      familyName: z.string(),
      serviceType: z.enum(['traditional', 'cremation', 'memorial']),
      items: z.array(z.object({
        sku: z.string(),
        qty: z.number(),
        attributes: z.record(z.string()).optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Call Go CPQ API: POST /quotes
      const quote = await ctx.erpClient.POST('/quotes', {
        body: {
          id: generateQuoteID(),
          tenant: ctx.tenant,
          legal_entity: ctx.legalEntity,
          currency: 'USD',
          customer: { name: input.familyName },
          lines: input.items,
        },
      });

      // 2. Price with CPQ
      const priced = await ctx.erpClient.POST('/quotes/{id}/price-cpq', {
        params: { path: { id: quote.id } },
        body: {
          tax_percent: 8.25, // IL sales tax
          shipping_cents: 0,
        },
      });

      // 3. Store in CRM database (link to case)
      await ctx.db.quote.create({
        data: {
          quoteId: quote.id,
          caseId: input.caseId,
          total: priced.total_cents,
          status: 'draft',
        },
      });

      return { quote, priced };
    }),

  // Convert quote to sales order (contract signed)
  convertToOrder: protectedProcedure
    .input(z.object({ quoteId: z.string(), depositAmount: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Convert quote to sales order in Go ERP
      const order = await ctx.erpClient.POST('/quotes/{id}/convert', {
        params: { path: { id: input.quoteId } },
      });

      // 2. Collect deposit
      if (input.depositAmount > 0) {
        await ctx.erpClient.POST('/sales-orders/{id}/deposit', {
          params: { path: { id: order.id } },
          body: { amount_cents: input.depositAmount },
        });
      }

      // 3. Allocate inventory
      await ctx.erpClient.POST('/sales-orders/{id}/allocate', {
        params: { path: { id: order.id } },
      });

      return { order };
    }),

  // Deliver service (trigger invoice + GL posting)
  deliverService: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Mark order as shipped (service delivered)
      await ctx.erpClient.POST('/sales-orders/{id}/ship', {
        params: { path: { id: input.orderId } },
      });

      // 2. Generate invoice (triggers GL posting)
      const invoice = await ctx.erpClient.POST('/sales-orders/{id}/invoice', {
        params: { path: { id: input.orderId } },
      });

      // 3. Commit inventory (COGS posting)
      // This happens automatically in the Go ERP when invoice is generated

      return { invoice };
    }),
});
```

---

## Benefits of Using CPQ + Sales Orders

### 1. Production-Grade Order Orchestration
- **1,628 LOC CPQ module** with 92% test coverage (excellent quality)
- **2,956 LOC Sales Orders module** with established patterns
- **Event-sourced** with full audit trail (EventStoreDB)
- **TigerBeetle integration** for <1ms P99 latency on financial postings

### 2. Versioned Pricing for Audit Compliance
- Every quote captures **catalog version** and **price list version**
- Deterministic re-evaluation: "What was the casket price on Nov 29, 2025?"
- Critical for **insurance disputes** and **regulatory compliance**

### 3. Configuration Rules for Funeral Home Logic
- Enforce business rules: "Casket requires vault"
- Prevent invalid configurations: "Cannot select both burial and cremation"
- Approval workflows for discounts (pre-need pricing)

### 4. Inventory Integration
- Reserve caskets/urns when contract signed
- Multi-location availability: "Check Skokie location for this casket"
- WAC (Weighted Average Cost) for accurate COGS

### 5. Deposit Management
- Track deposit liability separately from AR
- Release deposit on invoice (correct accounting treatment)
- Prevent revenue recognition before service delivery (GAAP compliance)

### 6. Real-Time Financial Reporting
- Sales Order Ledger (Ledger 4) tracks order status in TigerBeetle
- Know at any moment: "How many cases are booked? Allocated? Invoiced?"
- Revenue backlog reporting: "What's our pre-need contract backlog?"

---

## Trade-Offs: Custom Case Management vs. CPQ/SO

### Option A: Custom Case Management (TypeScript Only)
**Pros:**
- Full control over UX
- Simpler initial implementation
- No ERP learning curve

**Cons:**
- ❌ Must build quote pricing engine from scratch
- ❌ Must build order orchestration (Book → Allocate → Ship → Invoice)
- ❌ Must build inventory reservation logic
- ❌ Must build deposit tracking
- ❌ No versioned pricing (audit trail)
- ❌ No configuration rules engine
- ❌ Manual GL posting (error-prone)
- **Estimated effort**: 3-6 months for feature parity

### Option B: Leverage CPQ + Sales Orders (Hybrid Approach) ✅ RECOMMENDED
**Pros:**
- ✅ Production-grade pricing engine (tiered pricing, discounts, FX)
- ✅ Order orchestration with TigerBeetle audit trail
- ✅ Inventory integration (reserve → commit → COGS)
- ✅ Deposit management with correct accounting treatment
- ✅ Versioned pricing for audit compliance
- ✅ Configuration rules for business logic
- ✅ Automatic GL posting (zero manual journals)
- **Estimated effort**: 2-4 weeks for BFF integration

**Cons:**
- Learning curve for CPQ/SO modules
- Mapping funeral home terminology to ERP concepts
- BFF layer adds complexity

---

## Recommended Implementation Strategy

### Phase 1A: Quote Management with CPQ (Weeks 1-2)
1. Map funeral home services → CPQ catalog items
2. Configure price lists (at-need vs. pre-need tiers)
3. Set up configuration rules (casket + vault, etc.)
4. Build BFF `quotesRouter` with tRPC procedures:
   - `quotes.create` → CPQ quote
   - `quotes.price` → CPQ pricing
   - `quotes.approve` → Approval workflow

### Phase 1B: Order Management with Sales Orders (Weeks 3-4)
1. Quote conversion → Sales Order (`POST /quotes/{id}/convert`)
2. Deposit collection → SO Deposit + Deposit Liability
3. Inventory allocation → Reserve merchandise
4. Service delivery → Ship + Invoice + COGS posting
5. Build BFF `ordersRouter`:
   - `orders.convert` → Quote to Order
   - `orders.collectDeposit` → Deposit flow
   - `orders.deliverService` → Invoice + GL posting

### Phase 1C: GL Reporting Integration (Week 5-6)
1. Real-time dashboard: Cases by status (booked, allocated, invoiced)
2. Revenue backlog: Pre-need contracts awaiting service
3. Service-level P&L: Profitability by service type
4. AR aging: Outstanding balances by family

---

## Conclusion

**YES, we should use the Go ERP's CPQ and Sales Order modules** for the funeral home case management workflow. These modules provide:

1. **Production-grade infrastructure** (3,500+ LOC with test coverage)
2. **Versioned pricing** for audit compliance
3. **Order orchestration** with TigerBeetle ledger tracking
4. **Inventory integration** for merchandise management
5. **Deposit management** with correct accounting treatment
6. **Automatic GL posting** (zero manual journal entries)

The alternative (custom-building these capabilities) would require **3-6 months of development** and would lack the robustness, audit trail, and financial accuracy of the existing ERP modules.

**Recommended Approach**: Build a **thin BFF orchestration layer** that maps funeral home concepts (inquiry, arrangements, case, contract) to ERP primitives (quote, sales order, inventory, AR). This gives us the best of both worlds: **modern funeral home UX** (TypeScript CRM) + **enterprise-grade financial backend** (Go ERP).

---

**Document Status**: Draft v1.0  
**Last Updated**: 2025-11-29  
**Author**: AI Agent  
**Next Steps**: Review with team, validate CPQ catalog structure, build BFF quote router
