"use client";

import { trpc } from "@/lib/trpc-client";
import { Download, TrendingUp, DollarSign, Calendar } from "lucide-react";

/**
 * Financial Reports Tab
 * Displays AR aging report and provides CSV export functionality
 * 
 * Features:
 * - AR aging report with buckets (0-30, 31-60, 61-90, 90+ days)
 * - Total outstanding and account count
 * - CSV export for payment list
 * - Date range selection
 */

export default function FinancialReportsTab() {
  // Fetch AR aging report
  const { data: arReport, isLoading: arLoading } = trpc.payment.getArAgingReport.useQuery({
    funeralHomeId: undefined,
    asOfDate: new Date(),
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      // In a real implementation, this would call a dedicated export endpoint
      // For now, we'll use the list endpoint and format client-side
      
      // Fetch all payments (would need pagination in production)
      const response = await fetch("/api/trpc/payment.list?input=" + encodeURIComponent(JSON.stringify({
        funeralHomeId: undefined,
        limit: 1000,
        offset: 0,
      })));
      
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      
      const data = await response.json();
      const payments = data.result?.data?.payments || [];
      
      // Convert to CSV
      const headers = ["Date", "Case ID", "Amount", "Method", "Status", "Created By"];
      const rows = payments.map((p: any) => [
        new Date(p.createdAt).toLocaleDateString(),
        p.caseId,
        p.amount.amount,
        p.method,
        p.status,
        p.createdBy,
      ]);
      
      const csv = [
        headers.join(","),
        ...rows.map((row: any[]) => row.join(",")),
      ].join("\n");
      
      // Download CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export CSV. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Payments</h2>
            <p className="text-sm text-gray-600 mt-1">
              Download payment data as CSV for external analysis
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* AR Aging Report */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Accounts Receivable Aging Report
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {arReport?.asOfDate
                ? `As of ${formatDate(arReport.asOfDate)}`
                : "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Updated daily</span>
          </div>
        </div>

        {arLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[--navy]" />
            <p className="text-gray-600 mt-4">Loading AR aging report...</p>
          </div>
        ) : arReport ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">
                    Total Outstanding
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(arReport.totalOutstanding)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-medium text-purple-900">
                    Outstanding Accounts
                  </p>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {arReport.totalAccounts}
                </p>
              </div>
            </div>

            {/* Aging Buckets */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Aging Breakdown
              </h3>
              {arReport.buckets.map((bucket, index) => {
                const percentage =
                  arReport.totalOutstanding > 0
                    ? (bucket.totalAmount / arReport.totalOutstanding) * 100
                    : 0;

                // Color based on age
                const colorClasses = [
                  "bg-green-500", // 0-30 days
                  "bg-yellow-500", // 31-60 days
                  "bg-orange-500", // 61-90 days
                  "bg-red-500", // 90+ days
                ];

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {bucket.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {bucket.accountCount}{" "}
                          {bucket.accountCount === 1 ? "account" : "accounts"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(bucket.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colorClasses[index]} rounded-full h-2 transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* No AR Message */}
            {arReport.totalOutstanding === 0 && (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">No Outstanding AR</p>
                <p className="text-xs mt-1">All payments are current</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Failed to load AR aging report</p>
          </div>
        )}
      </div>

      {/* Additional Reports Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Additional Reports
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            • <strong>Payment Method Breakdown:</strong> Available in dashboard
            KPIs
          </p>
          <p>
            • <strong>Daily Collections:</strong> Track via payment history and
            date filters
          </p>
          <p>
            • <strong>Revenue Reports:</strong> Coming soon in analytics section
          </p>
        </div>
      </div>
    </div>
  );
}
