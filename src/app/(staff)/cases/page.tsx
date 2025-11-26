"use client";

import { trpc } from "@/lib/trpc-client";
import Link from "next/link";
import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/**
 * Staff Cases List Page
 * Data grid with filtering and sorting
 */

interface CaseRow {
  id: string;
  businessKey: string;
  decedentName: string;
  type: string;
  status: string;
  serviceType: string | null;
  serviceDate: Date | null;
  createdAt: Date;
}

export default function StaffCasesPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [rowSelection, setRowSelection] = useState({});

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewCase: () => router.push("/staff/cases/new"),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onEscape: () => {
      searchInputRef.current?.blur();
      setGlobalFilter("");
    },
  });

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = 
    trpc.case.listAll.useInfiniteQuery(
      {
        limit: 50,
        status: statusFilter !== "all" ? statusFilter as any : undefined,
        type: typeFilter !== "all" ? typeFilter as any : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  // Flatten paginated data
  const allCases = data?.pages.flatMap((page) => page.items) ?? [];

  const columns = useMemo<ColumnDef<CaseRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300 text-[--navy] focus:ring-[--navy]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300 text-[--navy] focus:ring-[--navy]"
          />
        ),
      },
      {
        accessorKey: "decedentName",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Decedent Name
              <ArrowUpDown className="w-4 h-4" />
            </button>
          );
        },
        cell: ({ row }) => (
          <Link
            href={`/staff/cases/${row.original.businessKey}`}
            className="font-medium text-[--navy] hover:underline"
          >
            {row.original.decedentName}
          </Link>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {row.original.type.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const statusColors: Record<string, string> = {
            INQUIRY: "bg-yellow-100 text-yellow-800",
            ACTIVE: "bg-green-100 text-green-800",
            COMPLETED: "bg-gray-100 text-gray-800",
            ARCHIVED: "bg-gray-100 text-gray-600",
          };
          return (
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                statusColors[row.original.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {row.original.status}
            </span>
          );
        },
      },
      {
        accessorKey: "serviceType",
        header: "Service Type",
        cell: ({ row }) =>
          row.original.serviceType ? (
            <span className="text-sm text-gray-700">
              {row.original.serviceType.replace("_", " ")}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Not scheduled</span>
          ),
      },
      {
        accessorKey: "serviceDate",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Service Date
              <ArrowUpDown className="w-4 h-4" />
            </button>
          );
        },
        cell: ({ row }) =>
          row.original.serviceDate ? (
            <span className="text-sm text-gray-700">
              {new Date(row.original.serviceDate).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Not scheduled</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Created
              <ArrowUpDown className="w-4 h-4" />
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    // Filtering is now done server-side via query params
    return allCases;
  }, [allCases]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading cases</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600 mt-1">Manage all funeral cases</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">N</kbd> for new case</span>
          <Link
            href="/staff/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Case
          </Link>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {Object.keys(rowSelection).length} case(s) selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm(`Archive ${Object.keys(rowSelection).length} selected cases?`)) {
                    // TODO: Implement bulk archive mutation
                    console.log("Bulk archive:", Object.keys(rowSelection));
                    setRowSelection({});
                  }
                }}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
              >
                Archive Selected
              </button>
              <button
                onClick={() => setRowSelection({})}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search cases... (Press / to focus)"
              value={globalFilter ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="INQUIRY">Inquiry</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="AT_NEED">At-Need</option>
            <option value="PRE_NEED">Pre-Need</option>
            <option value="INQUIRY">Inquiry</option>
          </select>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading cases...</div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No cases found</p>
            <Link
              href="/staff/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition"
            >
              <Plus className="w-4 h-4" />
              Create First Case
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? "Loading..." : "Load More Cases"}
          </button>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && table.getRowModel().rows.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          Showing {table.getRowModel().rows.length} of {data?.pages[0]?.total ?? 0} cases
        </p>
      )}
    </div>
  );
}
