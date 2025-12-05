"use client";

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { TableSkeleton } from './TableSkeleton';
import { TableEmptyState } from './TableEmptyState';
import { TablePagination } from './TablePagination';
import { ColumnVisibilityToggle } from './ColumnVisibilityToggle';
import { ExportButton } from './ExportButton';
import { BulkActionBar, type BulkAction } from './BulkActionBar';

export interface DataTableProps<TData> {
  // Data
  data: TData[];
  columns: ColumnDef<TData>[];
  
  // Loading & Empty States
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  
  // Features
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  enableStickyHeader?: boolean;
  enableSorting?: boolean;
  
  // Pagination
  pageSize?: number;
  manualPagination?: boolean;
  
  // Bulk Actions
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string, selectedRows: TData[]) => void;
  
  // Row Click
  onRowClick?: (row: TData) => void;
  
  // Export
  exportFilename?: string;
  
  // Classes
  className?: string;
}

/**
 * Reusable DataTable Component
 * Built on TanStack Table v8 with all standard features
 * 
 * Features:
 * - Sorting (column headers)
 * - Pagination
 * - Row selection
 * - Column visibility toggle
 * - Export to CSV
 * - Loading skeleton
 * - Empty state
 * - Sticky header
 * - Bulk actions
 */
export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  emptyState,
  enableRowSelection = false,
  enableColumnVisibility = true,
  enableExport = true,
  enableStickyHeader = false,
  enableSorting = true,
  pageSize = 25,
  manualPagination = false,
  bulkActions,
  onBulkAction,
  onRowClick,
  exportFilename = 'export',
  className = '',
}: DataTableProps<TData>) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  
  // Initialize table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    enableRowSelection,
    enableSorting,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Loading state
  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={pageSize} />;
  }

  // Empty state
  if (data.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return <TableEmptyState />;
  }

  // Get selected rows for bulk actions
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      {(enableColumnVisibility || enableExport) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {data.length} {data.length === 1 ? 'result' : 'results'}
          </div>
          <div className="flex items-center gap-2">
            {enableColumnVisibility && <ColumnVisibilityToggle table={table} />}
            {enableExport && (
              <ExportButton
                data={data}
                columns={columns}
                filename={exportFilename}
              />
            )}
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {enableRowSelection && selectedRows.length > 0 && (
        <BulkActionBar
          selectedCount={selectedRows.length}
          actions={bulkActions}
          onClearSelection={() => table.resetRowSelection()}
        />
      )}

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className={`overflow-x-auto ${enableStickyHeader ? 'max-h-[600px] overflow-y-auto' : ''}`}>
          <table className="w-full" role="table" aria-label="Data table">
            {/* Header */}
            <thead className={`bg-gray-50 border-b border-gray-200 ${enableStickyHeader ? 'sticky top-0 z-10' : ''}`}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortDirection = header.column.getIsSorted();
                    return (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      scope="col"
                      aria-sort={
                        sortDirection === 'asc' ? 'ascending' :
                        sortDirection === 'desc' ? 'descending' :
                        header.column.getCanSort() ? 'none' : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'flex items-center gap-2 cursor-pointer select-none hover:text-gray-700'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                          role={header.column.getCanSort() ? 'button' : undefined}
                          aria-label={header.column.getCanSort() ? `Sort by ${header.column.id}` : undefined}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e as any);
                            }
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-gray-400">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ArrowUpDown className="w-4 h-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={
                    onRowClick
                      ? 'hover:bg-gray-50 cursor-pointer transition'
                      : 'hover:bg-gray-50 transition'
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!manualPagination && data.length > pageSize && (
          <TablePagination table={table} />
        )}
      </div>
    </div>
  );
}
