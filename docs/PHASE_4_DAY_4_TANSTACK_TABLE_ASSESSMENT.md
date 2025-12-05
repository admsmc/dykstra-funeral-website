# Phase 4 Day 4 - TanStack Table Assessment & Refactoring Plan

**Status**: Assessment Complete
**Tables Found**: 4 tables using TanStack Table v8.20.5
**Current State**: Good foundation, needs standardization and enhancement

---

## Current Table Inventory

### 1. ✅ **CaseTable** - `src/features/case-list/components/CaseTable.tsx`
**Status**: Well-implemented, good baseline
**Features**:
- ✅ TanStack Table v8 with full typing
- ✅ Sorting (column-level, 3 sortable columns)
- ✅ Global filtering/search
- ✅ Row selection (checkboxes)
- ✅ Responsive design
- ✅ Empty state handling
- ✅ Link to detail pages
- ✅ Badge components for status/type
**Improvements Needed**:
- Column visibility toggle
- Pagination (currently shows all rows)
- Export to CSV
- Sticky header (for long lists)
- Loading skeleton
- Column resizing

### 2. ⚠️ **Portal Payments Table** - `src/app/portal/cases/[id]/payments/page.tsx`
**Status**: Inline implementation, no TanStack Table
**Features**:
- ❌ Manual `<table>` HTML (not using TanStack Table)
- ✅ Empty state
- ✅ Loading state
- ✅ Badge for status
- ✅ Action buttons (download receipt)
**Improvements Needed**:
- **Convert to TanStack Table** (HIGH PRIORITY)
- Add sorting
- Add filtering
- Add pagination
- Standardize with other tables

### 3. ✅ **Contracts Table** - `src/app/staff/contracts/page.tsx`
**Status**: Well-implemented with TanStack Table
**Features**:
- ✅ TanStack Table v8
- ✅ Sorting (with ChevronUp/Down icons)
- ✅ Pagination
- ✅ Global search
- ✅ Status filtering (custom stat cards)
- ✅ Date range filtering
- ✅ Empty state
- ✅ Loading state
**Improvements Needed**:
- Column visibility toggle
- Export to CSV
- Sticky header
- Loading skeleton (instead of text)
- Bulk actions

### 4. ✅ **Payments Table** - `src/app/staff/payments/page.tsx`
**Status**: Using TanStack Table, good foundation
**Features**:
- ✅ TanStack Table v8
- ✅ Status filter dropdown
- ✅ Payment method filter dropdown
- ✅ KPI cards
- ✅ Pagination (basic UI, disabled)
- ✅ Empty state
- ✅ Loading state
**Improvements Needed**:
- Enable pagination (currently disabled)
- Add sorting
- Export to CSV
- Column visibility toggle
- Bulk actions (bulk refunds, etc.)
- Loading skeleton

---

## Day 4 Refactoring Goals

### Primary Goals
1. **Standardize Table Component** - Create reusable `<DataTable>` component
2. **Portal Payments Conversion** - Convert inline table to TanStack Table
3. **Add Missing Features** - Column visibility, export, sticky headers
4. **Loading Skeletons** - Replace text with proper skeletons
5. **Bulk Actions** - Add bulk action support to tables with row selection

### Secondary Goals
6. **Pagination Enhancement** - Enable pagination where disabled
7. **Column Resizing** - Add column resize capability
8. **Keyboard Navigation** - Add arrow key navigation
9. **Mobile Responsiveness** - Better mobile table experience

---

## Implementation Plan

### Step 1: Create Reusable `<DataTable>` Component (2 hours)

**File**: `src/components/table/DataTable.tsx`

**Features**:
- Generic TanStack Table wrapper
- Built-in sorting, filtering, pagination
- Column visibility toggle
- Export to CSV
- Loading skeleton
- Empty state
- Sticky header option
- Bulk actions support
- Full TypeScript typing

**Props**:
```typescript
interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  enableStickyHeader?: boolean;
  emptyState?: React.ReactNode;
  bulkActions?: BulkAction[];
  onRowClick?: (row: TData) => void;
  // Pagination
  pageSize?: number;
  pageIndex?: number;
  pageCount?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
  // Sorting
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  // Filtering
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
}
```

### Step 2: Create Table Components Library (1 hour)

**Files**:
- `src/components/table/DataTable.tsx` - Main table component
- `src/components/table/TableSkeleton.tsx` - Loading skeleton
- `src/components/table/TableEmptyState.tsx` - Empty state component
- `src/components/table/TablePagination.tsx` - Pagination controls
- `src/components/table/ColumnVisibilityToggle.tsx` - Column visibility dropdown
- `src/components/table/ExportButton.tsx` - CSV export button
- `src/components/table/BulkActionBar.tsx` - Bulk action toolbar
- `src/components/table/index.ts` - Exports

### Step 3: Refactor CaseTable to Use DataTable (1 hour)

**File**: `src/features/case-list/components/CaseTable.tsx`

**Changes**:
- Import `<DataTable>` component
- Remove manual table rendering
- Add column visibility toggle
- Add pagination (pageSize: 25)
- Add export to CSV
- Add sticky header
- Add loading skeleton
- Keep existing sorting, filtering, row selection

**Estimated reduction**: 220 → 120 lines (45% reduction)

### Step 4: Convert Portal Payments Table (1.5 hours)

**File**: `src/app/portal/cases/[id]/payments/page.tsx`

**Changes**:
- Define column definitions for TanStack Table
- Replace inline `<table>` with `<DataTable>`
- Add sorting (date, amount, status)
- Add filtering (status filter)
- Add pagination
- Keep existing empty/loading states
- Keep download receipt action

**Estimated reduction**: Manual table → 60 lines for column defs

### Step 5: Refactor Contracts Table (1 hour)

**File**: `src/app/staff/contracts/page.tsx`

**Changes**:
- Convert to `<DataTable>` component
- Add column visibility toggle
- Add export to CSV
- Add sticky header
- Add loading skeleton
- Keep existing filters (status, date range)
- Keep existing pagination

**Estimated reduction**: 170 → 90 lines (47% reduction)

### Step 6: Refactor Payments Table (1 hour)

**File**: `src/app/staff/payments/page.tsx`

**Changes**:
- Convert to `<DataTable>` component
- Enable pagination (currently disabled)
- Add column visibility toggle
- Add export to CSV
- Add bulk actions (bulk refund)
- Add loading skeleton
- Keep existing filters

**Estimated reduction**: 120 → 70 lines (42% reduction)

---

## Technical Implementation Details

### DataTable Component Architecture

```typescript
// src/components/table/DataTable.tsx
export function DataTable<TData>({
  data,
  columns,
  isLoading,
  enableRowSelection = false,
  enableColumnVisibility = true,
  enableExport = true,
  enableStickyHeader = false,
  emptyState,
  bulkActions,
  onRowClick,
  // Pagination
  pageSize = 25,
  pageIndex = 0,
  pageCount,
  onPaginationChange,
  // Sorting
  sorting = [],
  onSortingChange,
  // Filtering
  globalFilter = '',
  onGlobalFilterChange,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: { pageSize, pageIndex },
      rowSelection,
      columnVisibility,
    },
    // ... all hooks
  });

  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={pageSize} />;
  }

  return (
    <div className="data-table-container">
      {/* Toolbar */}
      <div className="data-table-toolbar">
        {enableColumnVisibility && <ColumnVisibilityToggle table={table} />}
        {enableExport && <ExportButton data={data} columns={columns} />}
      </div>

      {/* Bulk Actions Bar */}
      {enableRowSelection && table.getSelectedRowModel().rows.length > 0 && (
        <BulkActionBar
          selectedCount={table.getSelectedRowModel().rows.length}
          actions={bulkActions}
          onClearSelection={() => table.resetRowSelection()}
        />
      )}

      {/* Table */}
      <div className={enableStickyHeader ? 'sticky-header' : ''}>
        <table>...</table>
      </div>

      {/* Pagination */}
      <TablePagination table={table} onPaginationChange={onPaginationChange} />
    </div>
  );
}
```

### Loading Skeleton Component

```typescript
// src/components/table/TableSkeleton.tsx
export function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Export to CSV Function

```typescript
// src/components/table/export-utils.ts
export function exportToCSV<TData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  filename: string
) {
  // Extract headers
  const headers = columns
    .filter((col) => col.header && typeof col.header === 'string')
    .map((col) => col.header as string);

  // Extract rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const accessor = col.accessorKey as string;
      return row[accessor] || '';
    })
  );

  // Generate CSV
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\\n');

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Expected Outcomes

### Code Metrics
- **New components**: 8 reusable table components
- **Lines added**: ~600 lines (reusable components)
- **Lines reduced**: ~300 lines (across 4 table implementations)
- **Net change**: +300 lines, but with 4x code reuse

### Feature Additions
- ✅ Column visibility toggle (4 tables)
- ✅ Export to CSV (4 tables)
- ✅ Loading skeletons (4 tables)
- ✅ Sticky headers (4 tables)
- ✅ Bulk actions (2 tables: cases, payments)
- ✅ Proper pagination (payments table)
- ✅ TanStack Table conversion (portal payments table)

### Quality Improvements
- ✅ Standardized table patterns across codebase
- ✅ Reusable components (DRY principle)
- ✅ Better UX (skeletons, sticky headers, export)
- ✅ Consistent styling and behavior
- ✅ Full TypeScript type safety

---

## Timeline

**Total Estimated Time**: 7.5 hours

- Step 1: Create DataTable component (2 hours)
- Step 2: Create table components library (1 hour)
- Step 3: Refactor CaseTable (1 hour)
- Step 4: Convert Portal Payments Table (1.5 hours)
- Step 5: Refactor Contracts Table (1 hour)
- Step 6: Refactor Payments Table (1 hour)

---

## Next Session Checklist

When starting Day 4 implementation:

1. **Create table components**:
   ```bash
   mkdir -p src/components/table
   # Create 8 component files
   ```

2. **Run tests after each refactoring**:
   ```bash
   pnpm --filter @dykstra/application test
   pnpm type-check
   ```

3. **Verify table features**:
   - [ ] Sorting works in all tables
   - [ ] Filtering works in all tables
   - [ ] Pagination works (not disabled)
   - [ ] Column visibility toggle works
   - [ ] Export to CSV generates valid CSV
   - [ ] Loading skeletons display correctly
   - [ ] Empty states display correctly
   - [ ] Bulk actions work (where applicable)

4. **Test responsive design**:
   - [ ] Tables scroll horizontally on mobile
   - [ ] Sticky headers work on scroll
   - [ ] Touch interactions work on mobile

---

## Dependencies

- ✅ `@tanstack/react-table` v8.20.5 already installed
- ✅ No new dependencies required

---

**Phase 4 Day 4: Ready to implement**
