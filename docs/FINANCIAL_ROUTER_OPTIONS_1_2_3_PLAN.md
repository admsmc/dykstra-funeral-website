# Financial Router - Options 1, 2, 3 Implementation Plan

**Date**: December 5, 2024  
**Total Estimated Time**: 11-15 hours  
**Status**: Option 1 in progress (1/2 pages complete)

---

## Option 1: Quick Wins ✅ IN PROGRESS (2-3 hours)

### Status: 50% Complete

#### ✅ Completed: AR Aging Page (60 minutes)
**File**: `src/app/staff/finops/ar-aging/page.tsx` (406 lines)

**Endpoints Wired** (3/3 - 100%):
1. ✅ `ar.getAgingReport` - Aging buckets (0-30, 31-60, 61-90, 90+)
2. ✅ `ar.getOverdueInvoices` - Overdue invoice tracking
3. ✅ `ar.applyBatchPayments` - Batch payment application

**Features**:
- 4 aging buckets with color coding (green → yellow → orange → red)
- Priority scoring system (1-10 scale)
- Batch payment workflow with selection checkboxes
- Per-invoice payment amount input
- Real-time total calculation
- Toast notifications for success/errors
- Loading states and empty states
- Mobile responsive grid layouts

**Components**:
- `ARAgingPage` (main component)
- `StatsCard` (KPI cards)
- `AgingBucketCard` (color-coded buckets)
- `InvoiceCard` (selectable invoice rows)

---

#### 🔜 Remaining: Supplier Management Page (60-90 minutes)
**File**: `src/app/staff/procurement/suppliers/page.tsx` (estimated 450 lines)

**Endpoints to Wire** (4/4):
1. ⏳ `suppliers.list` - List all suppliers with filtering
2. ⏳ `suppliers.getById` - Get supplier details
3. ⏳ `suppliers.create` - Create new supplier
4. ⏳ `suppliers.updateSupplier` - Update supplier info

**Planned Features**:
- Supplier directory with grid/list views
- Supplier rating system (1-5 stars)
- Total spend and order count tracking
- Category filtering (caskets, flowers, supplies, etc.)
- Status management (active/inactive)
- Contact information (email, phone, address)
- Create/Edit supplier modals
- Supplier performance metrics

**Navigation Updates Needed**:
- Add "AR Aging" link to Finance section (line ~170 in layout.tsx)
- Supplier Management already has nav link (exists)

---

## Option 2: Core Financial Pages (4-5 hours)

### Part A: GL Account Management (2-3 hours)

#### Phase 1: Wire Existing GL Endpoints (30 minutes)
**File**: `src/app/staff/finops/gl/page.tsx` (estimated 500 lines)

**Existing Endpoints to Wire** (4/4):
1. ⏳ `gl.getTrialBalance` - Trial balance for period
2. ⏳ `gl.getAccountHistory` - Transaction history per account
3. ⏳ `gl.getFinancialStatement` - Already wired in reports page
4. ⏳ `gl.postJournalEntry` - Manual JE posting

**Features**:
- Trial balance report with drill-down
- Account history viewer
- Manual journal entry form
- Debit/credit balance validation

#### Phase 2: Create Missing GL Endpoints (90 minutes)
**Backend Files**: `packages/application/src/use-cases/gl/`

**New Endpoints Needed** (6 endpoints):
1. ❌ `gl.getChartOfAccounts` - List all GL accounts
2. ❌ `gl.createAccount` - Create GL account
3. ❌ `gl.updateAccount` - Update GL account
4. ❌ `gl.deactivateAccount` - Deactivate GL account
5. ❌ `gl.getAccountBalances` - Current balances
6. ❌ `gl.reverseJournalEntry` - Reverse a JE

**Implementation Steps**:
```typescript
// Example: getChartOfAccounts use case
export const getChartOfAccounts = (input: { funeralHomeId: string }) =>
  Effect.gen(function* (_) {
    const goFinancialPort = yield* _(GoFinancialPort);
    const accounts = yield* _(goFinancialPort.getChartOfAccounts(input.funeralHomeId));
    return {
      accounts: accounts.map(account => ({
        id: account.id,
        accountNumber: account.accountNumber,
        name: account.name,
        type: account.accountType,
        balance: account.balance,
        isActive: account.isActive,
      })),
    };
  });
```

#### Phase 3: Complete GL Page (60 minutes)
**Features**:
- Chart of Accounts tree view with hierarchy
- Account creation modal with validation
- Account editing with number/name/type
- Deactivation with confirmation
- Journal entry reversal workflow
- Account balance real-time updates

---

### Part B: AP Payment Run Page (90 minutes)
**File**: `src/app/staff/finops/ap/payment-run/page.tsx` (estimated 550 lines)

**Existing Endpoints** (2/2):
1. ⏳ `ap.generatePaymentRun` - Payment run planning
2. ⏳ `ap.executePaymentRun` - Execute payment run

**Features**:
- Payment date selection
- Available cash input
- Due date cutoff filter
- Vendor exclusion list
- Bill selection with checkboxes
- Payment method selection (check/ACH/wire)
- Check number generation
- Payment run summary
- Execute with confirmation

**Workflow**:
1. Set payment date and available cash
2. System suggests bills due by cutoff date
3. User reviews and adjusts selections
4. User chooses payment method
5. Execute payment run
6. Generate check batch or ACH file

---

### Part C: Refunds Page (30 minutes)
**File**: `src/app/staff/finops/refunds/page.tsx` (estimated 350 lines)

**Existing Endpoint** (1/1):
1. ⏳ `refunds.process` - Process refund

**Features**:
- Refund request form
- Case/payment selection
- Refund amount input (partial/full)
- Refund reason dropdown (5 types)
- Notes field
- Multi-payment refund support
- Audit trail display
- Refund history

**Refund Reasons**:
- Overpayment
- Cancellation
- Error correction
- Service adjustment
- Other (with notes)

---

## Option 3: Fixed Assets Module (6-8 hours)

### Part A: Backend Implementation (4 hours)

#### Step 1: Create Domain Models (30 minutes)
**File**: `packages/domain/src/fixed-assets/fixed-asset.ts`

```typescript
export interface FixedAsset {
  id: string;
  assetNumber: string;
  description: string;
  category: AssetCategory;
  acquisitionDate: Date;
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: DepreciationMethod;
  currentBookValue: number;
  accumulatedDepreciation: number;
  location: string;
  status: AssetStatus;
  disposalDate?: Date;
  disposalAmount?: number;
}

export type AssetCategory = 
  | 'building' 
  | 'vehicle' 
  | 'equipment' 
  | 'furniture' 
  | 'technology';

export type DepreciationMethod = 
  | 'straight_line' 
  | 'declining_balance' 
  | 'sum_of_years_digits';

export type AssetStatus = 
  | 'active' 
  | 'disposed' 
  | 'fully_depreciated' 
  | 'under_maintenance';
```

#### Step 2: Create Use Cases (90 minutes)
**Files**: `packages/application/src/use-cases/fixed-assets/`

**8 Use Cases**:
1. `listFixedAssets.ts` - List with filtering
2. `createFixedAsset.ts` - Create new asset
3. `updateFixedAsset.ts` - Update asset details
4. `runDepreciation.ts` - Calculate depreciation
5. `disposeAsset.ts` - Record asset disposal
6. `getDepreciationSchedule.ts` - Future schedule
7. `transferAsset.ts` - Transfer between locations
8. `getAssetHistory.ts` - Audit trail

**Example**: `runDepreciation.ts`
```typescript
export const runDepreciation = (input: { 
  assetId: string; 
  periodEndDate: Date;
  funeralHomeId: string;
}) =>
  Effect.gen(function* (_) {
    const goFixedAssetsPort = yield* _(GoFixedAssetsPort);
    const asset = yield* _(goFixedAssetsPort.getAssetById(input.assetId));
    
    // Calculate depreciation based on method
    const monthsElapsed = calculateMonthsBetween(asset.lastDepreciationDate, input.periodEndDate);
    const depreciationAmount = calculateDepreciation(asset, monthsElapsed);
    
    // Post depreciation entry
    const entry = yield* _(goFixedAssetsPort.postDepreciationEntry({
      assetId: input.assetId,
      amount: depreciationAmount,
      periodEndDate: input.periodEndDate,
    }));
    
    return {
      assetId: input.assetId,
      depreciationAmount,
      newBookValue: asset.currentBookValue - depreciationAmount,
      journalEntryId: entry.id,
    };
  });
```

#### Step 3: Create Go Backend Port (60 minutes)
**File**: `packages/application/src/ports/go-fixed-assets-port.ts`

```typescript
export interface GoFixedAssetsPortService {
  listAssets: (funeralHomeId: string) => Effect.Effect<FixedAsset[], NetworkError, never>;
  getAssetById: (assetId: string) => Effect.Effect<FixedAsset, NetworkError | NotFoundError, never>;
  createAsset: (command: CreateAssetCommand) => Effect.Effect<FixedAsset, ValidationError | NetworkError, never>;
  updateAsset: (command: UpdateAssetCommand) => Effect.Effect<FixedAsset, ValidationError | NetworkError, never>;
  runDepreciation: (command: RunDepreciationCommand) => Effect.Effect<DepreciationResult, NetworkError, never>;
  disposeAsset: (command: DisposeAssetCommand) => Effect.Effect<void, NetworkError, never>;
  getDepreciationSchedule: (assetId: string, years: number) => Effect.Effect<DepreciationSchedule, NetworkError, never>;
  transferAsset: (command: TransferAssetCommand) => Effect.Effect<void, NetworkError, never>;
  getAssetHistory: (assetId: string) => Effect.Effect<AssetHistoryEvent[], NetworkError, never>;
}
```

#### Step 4: Create Go Backend Adapter (60 minutes)
**File**: `packages/infrastructure/src/adapters/go-backend/go-fixed-assets-adapter.ts`

```typescript
export const GoFixedAssetsAdapter: GoFixedAssetsPortService = {
  listAssets: (funeralHomeId) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/fixed-assets', {
          params: { query: { funeral_home_id: funeralHomeId } },
        });
        if (res.error) throw new Error(res.error.message);
        return res.data.map(mapToFixedAsset);
      },
      catch: (error) => new NetworkError('Failed to list fixed assets', error),
    }),
  
  // ... other 8 methods
};
```

#### Step 5: Wire to tRPC Router (30 minutes)
**File**: `packages/api/src/routers/financial.router.ts`

```typescript
fixedAssets: router({
  list: staffProcedure
    .input(z.object({ funeralHomeId: z.string() }))
    .query(async ({ input }) => {
      return await runEffect(listFixedAssets(input.funeralHomeId));
    }),
  
  create: staffProcedure
    .input(z.object({
      description: z.string(),
      category: z.enum(['building', 'vehicle', 'equipment', 'furniture', 'technology']),
      acquisitionDate: z.date(),
      acquisitionCost: z.number().positive(),
      salvageValue: z.number().nonnegative(),
      usefulLifeYears: z.number().int().positive(),
      depreciationMethod: z.enum(['straight_line', 'declining_balance', 'sum_of_years_digits']),
      location: z.string(),
      funeralHomeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await runEffect(createFixedAsset(input));
    }),
  
  // ... 6 more endpoints
}),
```

---

### Part B: Frontend Implementation (2-4 hours)

#### Fixed Assets Management Page (150 minutes)
**File**: `src/app/staff/finops/fixed-assets/page.tsx` (estimated 700 lines)

**All 8 Endpoints Wired**:
1. `fixedAssets.list` - Asset directory
2. `fixedAssets.create` - Create asset modal
3. `fixedAssets.update` - Edit asset modal
4. `fixedAssets.depreciate` - Run depreciation
5. `fixedAssets.dispose` - Disposal workflow
6. `fixedAssets.getSchedule` - Schedule viewer
7. `fixedAssets.transfer` - Transfer modal
8. `fixedAssets.getAssetHistory` - Audit trail

**Features**:
- Asset grid with filtering by category/status
- KPI cards (total assets, book value, monthly depreciation, fully depreciated)
- Create Asset modal with 3-step wizard:
  - Step 1: Basic info (description, category, location)
  - Step 2: Financial (acquisition cost, salvage value, useful life)
  - Step 3: Depreciation method selection
- Run Depreciation button with period selection
- Depreciation schedule chart (line graph showing book value over time)
- Asset detail view with:
  - Current book value
  - Accumulated depreciation
  - Remaining useful life
  - Monthly depreciation amount
- Transfer asset modal (location dropdown)
- Dispose asset workflow (disposal date, amount, reason)
- Asset history timeline

**Components**:
- `FixedAssetsPage` (main)
- `CreateAssetWizard` (3-step modal)
- `AssetCard` (grid item)
- `AssetDetailPanel` (side panel)
- `DepreciationScheduleChart` (Chart.js line chart)
- `TransferAssetModal`
- `DisposeAssetModal`
- `AssetHistoryTimeline`

---

## Combined Metrics

### Overall Financial Router Progress

| Phase | Endpoints | Status | Time |
|-------|-----------|--------|------|
| **Phase A: AR/AP Core** | 5 | ✅ Complete | - |
| **Phase B: Bank Rec** | 9 | ✅ Complete | 35 min |
| **Phase C: Reporting** | 3 | ✅ Complete | - |
| **Phase D: Period Close** | 3 | ✅ Complete | - |
| **Phase E: GL Mgmt** | 10 | 🔜 Option 2 | 2-3h |
| **Phase F: AR Aging** | 3 | ✅ Option 1 | 60 min |
| **Phase G: Suppliers** | 4 | 🔜 Option 1 | 60-90 min |
| **Phase H: AP Payment Run** | 2 | 🔜 Option 2 | 90 min |
| **Phase I: Refunds** | 1 | 🔜 Option 2 | 30 min |
| **Phase J: Fixed Assets** | 8 | 🔜 Option 3 | 6-8h |
| **Total** | 48 | 23 done (48%) | 11-15h |

### Files to Create/Modify

**Option 1** (2 files):
- ✅ `src/app/staff/finops/ar-aging/page.tsx` (406 lines)
- ⏳ `src/app/staff/procurement/suppliers/page.tsx` (450 lines)

**Option 2** (8 files):
- `src/app/staff/finops/gl/page.tsx` (500 lines)
- `packages/application/src/use-cases/gl/get-chart-of-accounts.ts` (50 lines)
- `packages/application/src/use-cases/gl/create-account.ts` (80 lines)
- `packages/application/src/use-cases/gl/update-account.ts` (70 lines)
- `packages/application/src/use-cases/gl/deactivate-account.ts` (60 lines)
- `packages/application/src/use-cases/gl/get-account-balances.ts` (50 lines)
- `packages/application/src/use-cases/gl/reverse-journal-entry.ts` (90 lines)
- `src/app/staff/finops/ap/payment-run/page.tsx` (550 lines)
- `src/app/staff/finops/refunds/page.tsx` (350 lines)

**Option 3** (14 files):
- Domain: `packages/domain/src/fixed-assets/fixed-asset.ts` (150 lines)
- Port: `packages/application/src/ports/go-fixed-assets-port.ts` (120 lines)
- Adapter: `packages/infrastructure/src/adapters/go-backend/go-fixed-assets-adapter.ts` (450 lines)
- Use Cases (8 files): ~80 lines each = 640 lines
- Frontend: `src/app/staff/finops/fixed-assets/page.tsx` (700 lines)

**Total Lines**: ~4,700 lines across 24 files

---

## Session Breakdown

### Session 1: Complete Option 1 (90 minutes remaining)
- ✅ AR Aging page (60 min) - DONE
- ⏳ Supplier Management page (60 min)
- ⏳ Add navigation links (10 min)
- ⏳ Test both pages (20 min)

### Session 2: GL Management (150 minutes)
- Create 6 missing GL use cases (90 min)
- Wire existing 4 endpoints (30 min)
- Create GL page (60 min)

### Session 3: Payment Run & Refunds (120 minutes)
- AP Payment Run page (90 min)
- Refunds page (30 min)

### Session 4: Fixed Assets Backend (240 minutes)
- Domain models (30 min)
- Use cases (90 min)
- Port definition (60 min)
- Adapter implementation (60 min)

### Session 5: Fixed Assets Frontend (180 minutes)
- Fixed Assets page (150 min)
- Navigation + testing (30 min)

---

## Next Immediate Steps

1. **Complete Supplier Management Page** (60-90 min)
   - Create `src/app/staff/procurement/suppliers/page.tsx`
   - Wire 4 supplier endpoints
   - Add to navigation
   
2. **Update Navigation Links** (10 min)
   - Add "AR Aging" to Finance section
   - Verify Supplier link exists

3. **Test Option 1 Pages** (20 min)
   - Verify AR Aging loads
   - Test batch payment workflow
   - Verify Supplier CRUD works

**Estimated Time to Complete All 3 Options**: 11-15 hours

Would you like me to continue with the Supplier Management page now, or would you prefer to pause and review the AR Aging page first?
