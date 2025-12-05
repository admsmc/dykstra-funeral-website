/**
 * Case Table Component
 * Refactored to use DataTable component with pagination, export, and column visibility
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, MoreVertical, Calendar, Users, FileText, DollarSign, Clock } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table";
import { ErrorBoundary, TableErrorFallback } from "@/components/error";
import type { CaseViewModel } from "../view-models/CaseViewModel";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";

/**
 * Workflow state machine - defines valid status transitions
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  inquiry: ['active', 'archived'],
  active: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

/**
 * Quick Actions Menu Component
 */
function CaseQuickActions({ caseId, currentStatus }: { caseId: string; currentStatus: string }) {
  const [showMenu, setShowMenu] = useState(false);
  const utils = trpc.useUtils();
  
  const updateStatusMutation = trpc.case.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Case status updated');
      utils.case.listAll.invalidate();
      setShowMenu(false);
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const scheduleServiceMutation = trpc.case.scheduleService.useMutation({
    onSuccess: () => {
      toast.success('Service scheduled');
      utils.case.listAll.invalidate();
    },
  });

  const assignStaffMutation = trpc.case.assignStaff.useMutation({
    onSuccess: () => {
      toast.success('Staff assigned');
      utils.case.listAll.invalidate();
    },
  });

  const generateDocsMutation = trpc.case.generateDocuments.useMutation({
    onSuccess: () => {
      toast.success('Documents generated');
    },
  });

  const validNextStatuses = VALID_TRANSITIONS[currentStatus.toLowerCase()] || [];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 hover:bg-gray-100 rounded transition"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {/* Status transitions */}
            {validNextStatuses.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Change Status</div>
                {validNextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatusMutation.mutate({ caseId, status: status.toUpperCase() as any, reason: 'Manual status change' })}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick actions */}
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Quick Actions</div>
              <button
                onClick={() => {
                  // Mock schedule - would open modal in production
                  scheduleServiceMutation.mutate({
                    caseId,
                    serviceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    serviceType: 'traditional_burial',
                  });
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Schedule Service</span>
              </button>
              <button
                onClick={() => {
                  // Mock assign - would open modal in production
                  assignStaffMutation.mutate({
                    caseId,
                    assignments: [{ staffId: 'staff_001', role: 'DIRECTOR', isPrimary: true }],
                  });
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Assign Staff</span>
              </button>
              <button
                onClick={() => {
                  generateDocsMutation.mutate({
                    caseId,
                    templateIds: ['tpl_service_program', 'tpl_prayer_card'],
                    format: 'PDF',
                  });
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Generate Documents</span>
              </button>
            </div>

            {/* View details */}
            <Link
              href={`/staff/cases/${caseId}`}
              className="block px-3 py-2 hover:bg-gray-50 transition text-sm text-[--navy] font-medium"
              onClick={() => setShowMenu(false)}
            >
              View Full Details →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Financial Summary Cell Component
 */
function FinancialSummaryCell({ caseId }: { caseId: string }) {
  const { data: summary } = trpc.case.getFinancialSummary.useQuery({ caseId });

  if (!summary) {
    return <span className="text-sm text-gray-400">Loading...</span>;
  }

  const balanceDue = summary.balanceDue;
  const isOverdue = summary.nextPaymentDue && new Date(summary.nextPaymentDue) < new Date();

  return (
    <div className="flex items-center gap-1">
      <DollarSign className="w-3 h-3 text-gray-400" />
      <span className={`text-sm font-medium ${
        balanceDue === 0 ? 'text-green-600' : 
        isOverdue ? 'text-red-600' : 
        'text-gray-700'
      }`}>
        ${balanceDue.toLocaleString()}
      </span>
    </div>
  );
}

interface CaseTableProps {
  cases: CaseViewModel[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function CaseTable({ cases, onSelectionChange }: CaseTableProps) {
  // Memoize column definitions to prevent recreation on every render
  const columns = useMemo<ColumnDef<CaseViewModel>[]>(() => [
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
    header: "Decedent Name",
    cell: ({ row }) => (
      <Link
        href={row.original.detailUrl}
        className="font-medium text-[--navy] hover:underline"
      >
        {row.original.decedentName}
      </Link>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const config = row.original.typeBadgeConfig;
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}
        >
          {row.original.formattedType}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const config = row.original.statusBadgeConfig;
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}
        >
          {row.original.formattedStatus}
        </span>
      );
    },
  },
  {
    accessorKey: "serviceType",
    header: "Service Type",
    cell: ({ row }) => (
      <span
        className={`text-sm ${
          row.original.hasServiceType ? "text-gray-700" : "text-gray-400"
        }`}
      >
        {row.original.formattedServiceType}
      </span>
    ),
  },
  {
    accessorKey: "serviceDate",
    header: "Service Date",
    cell: ({ row }) => (
      <span
        className={`text-sm ${
          row.original.hasServiceDate ? "text-gray-700" : "text-gray-400"
        }`}
      >
        {row.original.formattedServiceDate}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.formattedCreatedAt}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "balance",
    header: "Balance Due",
    cell: ({ row }) => <FinancialSummaryCell caseId={row.original.id} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <CaseQuickActions
        caseId={row.original.id}
        currentStatus={row.original.status}
      />
    ),
  },
], []);
  // Custom empty state with "Create First Case" button
  const emptyState = (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
    </div>
  );

  return (
    <ErrorBoundary fallback={(error, reset) => <TableErrorFallback error={error} reset={reset} />}>
      <DataTable
        data={cases}
        columns={columns}
        enableRowSelection={true}
        enableColumnVisibility={true}
        enableExport={true}
        enableStickyHeader={true}
        pageSize={25}
        exportFilename="cases"
        emptyState={emptyState}
      />
    </ErrorBoundary>
  );
}
