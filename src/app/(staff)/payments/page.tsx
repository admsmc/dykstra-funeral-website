"use client";

import { trpc } from "@/lib/trpc-client";
import Link from "next/link";
import { useState, useMemo } from "react";
import ManualPaymentModal from "./_components/ManualPaymentModal";
import RefundModal from "./_components/RefundModal";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, DollarSign, TrendingUp, AlertCircle, RefreshCw, Plus } from "lucide-react";

/**
 * Staff Payments Dashboard
 * Payment management with KPIs, filtering, and reconciliation tools
 */

interface PaymentRow {
  id: string;
  businessKey: string;
  caseId: string;
  amount: {
    amount: number;
    currency: string;
  };
  method: string;
  status: string;
  createdAt: Date;
  createdBy: string;
}

export default function StaffPaymentsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState<PaymentRow | null>(null);

  // Fetch payment statistics
  const { data: stats, isLoading: statsLoading } = trpc.payment.getStats.useQuery({
    funeralHomeId: undefined,
  });

  // Fetch payment list
  const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = trpc.payment.list.useQuery({
    funeralHomeId: undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    method: methodFilter !== "all" ? (methodFilter as any) : undefined,
    limit: 50,
    offset: 0,
  });

  const payments = paymentsData?.payments ?? [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // KPI Cards
  const kpiCards = [
    {
      title: "Total Collected",
      value: formatCurrency(stats?.totalCollected ?? 0),
      icon: DollarSign,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      textColor: "text-green-900",
    },
    {
      title: "Pending",
      value: formatCurrency(stats?.totalPending ?? 0),
      icon: TrendingUp,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-900",
    },
    {
      title: "Failed",
      value: formatCurrency(stats?.totalFailed ?? 0),
      icon: AlertCircle,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      textColor: "text-red-900",
    },
    {
      title: "Refunded",
      value: formatCurrency(stats?.totalRefunded ?? 0),
      icon: RefreshCw,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      textColor: "text-blue-900",
    },
  ];

  // Table columns
  const columns = useMemo<ColumnDef<PaymentRow>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date
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
      {
        accessorKey: "caseId",
        header: "Case",
        cell: ({ row }) => (
          <Link
            href={`/staff/cases/${row.original.caseId}`}
            className="text-sm font-medium text-[--navy] hover:underline"
          >
            View Case
          </Link>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 font-semibold text-gray-900"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Amount
              <ArrowUpDown className="w-4 h-4" />
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(row.original.amount.amount)}
          </span>
        ),
        sortingFn: (rowA, rowB) => {
          return rowA.original.amount.amount - rowB.original.amount.amount;
        },
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => {
          const methodLabels: Record<string, string> = {
            credit_card: "Credit Card",
            debit_card: "Debit Card",
            ach: "ACH",
            check: "Check",
            cash: "Cash",
            insurance_assignment: "Insurance",
            payment_plan: "Payment Plan",
          };
          return (
            <span className="text-sm text-gray-700">
              {methodLabels[row.original.method] || row.original.method}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const statusColors: Record<string, string> = {
            succeeded: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            failed: "bg-red-100 text-red-800",
            cancelled: "bg-gray-100 text-gray-800",
            refunded: "bg-purple-100 text-purple-800",
          };
          return (
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                statusColors[row.original.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {row.original.status.toUpperCase()}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              href={`/staff/payments/${row.original.businessKey}`}
              className="text-sm text-[--navy] hover:underline"
            >
              View
            </Link>
            {row.original.status === "succeeded" && (
              <button
                className="text-sm text-red-600 hover:underline"
                onClick={() => setRefundPayment(row.original)}
              >
                Refund
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: payments,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Payment processing and reconciliation</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
          onClick={() => setIsManualPaymentModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-lg p-6 border border-gray-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor} mt-2`}>
                  {statsLoading ? "..." : card.value}
                </p>
              </div>
              <div className={`${card.iconColor}`}>
                <card.icon className="w-8 h-8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="ach">ACH</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="insurance_assignment">Insurance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Actions
            </label>
            <button
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              onClick={() => alert("Export to CSV")}
            >
              Export to CSV
            </button>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {paymentsLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payments found. Try adjusting your filters.
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!paymentsLoading && payments.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {payments.length} of {paymentsData?.total ?? 0} payments
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                disabled={true}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                disabled={!paymentsData?.hasMore}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Payment Modal */}
      <ManualPaymentModal
        isOpen={isManualPaymentModalOpen}
        onClose={() => setIsManualPaymentModalOpen(false)}
        onSuccess={() => {
          refetchPayments();
          // Could also show success toast here
        }}
      />

      {/* Refund Modal */}
      {refundPayment && (
        <RefundModal
          isOpen={!!refundPayment}
          onClose={() => setRefundPayment(null)}
          onSuccess={() => {
            refetchPayments();
            setRefundPayment(null);
          }}
          payment={{
            businessKey: refundPayment.businessKey,
            amount: refundPayment.amount.amount,
            method: refundPayment.method,
            status: refundPayment.status,
          }}
        />
      )}
    </div>
  );
}
