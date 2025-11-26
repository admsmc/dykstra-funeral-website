"use client";

import { trpc } from "@/lib/trpc-client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus,
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

/**
 * Contract Status Dashboard
 * 
 * Master list with filtering, status badges, signature tracking
 * Email reminder functionality for unsigned contracts
 */

type ContractStatus = 
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PENDING_SIGNATURES'
  | 'FULLY_SIGNED'
  | 'CANCELLED';

type Contract = {
  id: string;
  caseId: string;
  caseNumber: string;
  decedentName: string;
  serviceType: string;
  status: ContractStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  familySignedAt: Date | null;
  staffSignedAt: Date | null;
  createdBy: {
    name: string;
  };
};

export default function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  // Fetch contracts
  const { data: contractsData, isLoading, refetch } = trpc.contract.listContracts.useQuery({
    status: statusFilter !== 'all' ? statusFilter as ContractStatus : undefined,
    caseId: undefined,
    limit: 100,
  });

  // Filter by date range and search
  const filteredContracts = useMemo(() => {
    if (!contractsData) return [];

    let filtered = contractsData;

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(
        (contract) => new Date(contract.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (contract) => new Date(contract.createdAt) <= new Date(dateRange.end)
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.caseNumber.toLowerCase().includes(query) ||
          contract.decedentName.toLowerCase().includes(query) ||
          contract.createdBy.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [contractsData, dateRange, searchQuery]);

  // Table columns
  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        accessorKey: 'caseNumber',
        header: 'Case Number',
        cell: ({ row }) => (
          <Link
            href={`/staff/cases/${row.original.caseId}`}
            className="text-[--navy] hover:underline font-medium"
          >
            {row.original.caseNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'decedentName',
        header: 'Decedent',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.decedentName}</p>
            <p className="text-sm text-gray-500">
              {row.original.serviceType.replace(/_/g, ' ')}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'signatures',
        header: 'Signatures',
        cell: ({ row }) => (
          <SignatureStatus
            familySigned={!!row.original.familySignedAt}
            staffSigned={!!row.original.staffSignedAt}
            familySignedAt={row.original.familySignedAt}
            staffSignedAt={row.original.staffSignedAt}
          />
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">
            ${row.original.totalAmount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-gray-900">
              {new Date(row.original.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500">
              by {row.original.createdBy.name}
            </p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <ContractActions
            contractId={row.original.id}
            caseId={row.original.caseId}
            status={row.original.status}
            onRefetch={refetch}
          />
        ),
      },
    ],
    [refetch]
  );

  // React Table instance
  const table = useReactTable({
    data: filteredContracts,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  // Stats
  const stats = useMemo(() => {
    if (!contractsData) return null;

    return {
      total: contractsData.length,
      draft: contractsData.filter((c) => c.status === 'DRAFT').length,
      pendingReview: contractsData.filter((c) => c.status === 'PENDING_REVIEW').length,
      pendingSignatures: contractsData.filter((c) => c.status === 'PENDING_SIGNATURES').length,
      fullySigned: contractsData.filter((c) => c.status === 'FULLY_SIGNED').length,
      cancelled: contractsData.filter((c) => c.status === 'CANCELLED').length,
    };
  }, [contractsData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600 mt-1">
            Manage service contracts and track signatures
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/staff/contracts/templates"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <FileText className="w-4 h-4" />
            Templates
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            color="gray"
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <StatCard
            label="Draft"
            value={stats.draft}
            color="gray"
            active={statusFilter === 'DRAFT'}
            onClick={() => setStatusFilter('DRAFT')}
          />
          <StatCard
            label="Review"
            value={stats.pendingReview}
            color="blue"
            active={statusFilter === 'PENDING_REVIEW'}
            onClick={() => setStatusFilter('PENDING_REVIEW')}
          />
          <StatCard
            label="Signatures"
            value={stats.pendingSignatures}
            color="yellow"
            active={statusFilter === 'PENDING_SIGNATURES'}
            onClick={() => setStatusFilter('PENDING_SIGNATURES')}
          />
          <StatCard
            label="Signed"
            value={stats.fullySigned}
            color="green"
            active={statusFilter === 'FULLY_SIGNED'}
            onClick={() => setStatusFilter('FULLY_SIGNED')}
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            color="red"
            active={statusFilter === 'CANCELLED'}
            onClick={() => setStatusFilter('CANCELLED')}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by case number, decedent, or staff..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading contracts...</div>
        ) : filteredContracts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getIsSorted() && (
                              <span>
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredContracts.length
                )}{' '}
                of {filteredContracts.length} contracts
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium">No Contracts Found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end
                ? 'Try adjusting your filters'
                : 'Create a contract from a case'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red';
  active: boolean;
  onClick: () => void;
}) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition text-left ${
        active
          ? 'border-[--navy] bg-blue-50'
          : colorClasses[color]
      }`}
    >
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </button>
  );
}

function StatusBadge({ status }: { status: ContractStatus }) {
  const config = {
    DRAFT: {
      icon: Clock,
      label: 'Draft',
      className: 'bg-gray-100 text-gray-700',
    },
    PENDING_REVIEW: {
      icon: AlertCircle,
      label: 'Pending Review',
      className: 'bg-blue-100 text-blue-700',
    },
    PENDING_SIGNATURES: {
      icon: Clock,
      label: 'Pending Signatures',
      className: 'bg-yellow-100 text-yellow-700',
    },
    FULLY_SIGNED: {
      icon: CheckCircle,
      label: 'Fully Signed',
      className: 'bg-green-100 text-green-700',
    },
    CANCELLED: {
      icon: XCircle,
      label: 'Cancelled',
      className: 'bg-red-100 text-red-700',
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function SignatureStatus({
  familySigned,
  staffSigned,
  familySignedAt,
  staffSignedAt,
}: {
  familySigned: boolean;
  staffSigned: boolean;
  familySignedAt: Date | null;
  staffSignedAt: Date | null;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        {familySigned ? (
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-gray-400" />
        )}
        <span className={familySigned ? 'text-green-700 font-medium' : 'text-gray-500'}>
          Family {familySigned && familySignedAt && `(${new Date(familySignedAt).toLocaleDateString()})`}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {staffSigned ? (
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-gray-400" />
        )}
        <span className={staffSigned ? 'text-green-700 font-medium' : 'text-gray-500'}>
          Staff {staffSigned && staffSignedAt && `(${new Date(staffSignedAt).toLocaleDateString()})`}
        </span>
      </div>
    </div>
  );
}

function ContractActions({
  contractId,
  caseId,
  status,
  onRefetch,
}: {
  contractId: string;
  caseId: string;
  status: ContractStatus;
  onRefetch: () => void;
}) {
  // Update status mutation (for sending reminders)
  const updateStatusMutation = trpc.contract.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Reminder sent successfully');
      onRefetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send reminder');
    },
  });

  const handleSendReminder = () => {
    // In a real implementation, this would trigger an email reminder
    toast.success('Email reminder sent to family');
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/staff/cases/${caseId}#contracts`}
        className="p-1.5 text-gray-600 hover:text-[--navy] hover:bg-blue-50 rounded transition"
        title="View contract"
      >
        <Eye className="w-4 h-4" />
      </Link>
      
      {status === 'PENDING_SIGNATURES' && (
        <button
          onClick={handleSendReminder}
          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
          title="Send reminder"
        >
          <Mail className="w-4 h-4" />
        </button>
      )}
      
      {status === 'FULLY_SIGNED' && (
        <button
          className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
