"use client";

import { trpc } from "@/lib/trpc-client";
import { FolderOpen, MessageSquare, Calendar, CheckSquare, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

/**
 * Staff Dashboard Page
 * Shows KPIs, recent activity, and quick actions
 */

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function KPICard({ title, value, icon, href, trend }: KPICardProps) {
  const content = (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              {trend.isPositive ? "+" : ""}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className="p-3 bg-[--navy] rounded-lg text-white">
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function StaffDashboardPage() {
  const { data, isLoading, error } = trpc.staff.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-4">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of funeral home operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Cases"
          value={data?.kpis.activeCases ?? 0}
          icon={<FolderOpen className="w-6 h-6" />}
          href="/staff/cases?status=ACTIVE"
        />
        <KPICard
          title="New Inquiries"
          value={data?.kpis.inquiries ?? 0}
          icon={<MessageSquare className="w-6 h-6" />}
          href="/staff/cases?status=INQUIRY"
        />
        <KPICard
          title="Upcoming Services"
          value={data?.kpis.upcomingServices ?? 0}
          icon={<Calendar className="w-6 h-6" />}
          href="/staff/cases?upcoming=true"
        />
        <KPICard
          title="Pending Tasks"
          value={data?.kpis.pendingTasks ?? 0}
          icon={<CheckSquare className="w-6 h-6" />}
          href="/staff/tasks"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Cases</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {data?.recentActivity.cases && data.recentActivity.cases.length > 0 ? (
              data.recentActivity.cases.map((case_) => (
                <Link
                  key={case_.id}
                  href={`/staff/cases/${case_.businessKey}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {case_.decedentName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {case_.type.replace("_", " ")}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {case_.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-4">
                      {new Date(case_.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent cases
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <Link
              href="/staff/cases"
              className="text-sm font-medium text-[--navy] hover:text-[--sage] transition"
            >
              View all cases →
            </Link>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {data?.recentActivity.payments && data.recentActivity.payments.length > 0 ? (
              data.recentActivity.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="px-6 py-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {payment.case.decedentName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {payment.method.replace("_", " ")}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          payment.status === "SUCCEEDED"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">
                        ${Number(payment.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent payments
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <Link
              href="/staff/payments"
              className="text-sm font-medium text-[--navy] hover:text-[--sage] transition"
            >
              View all payments →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/staff/cases/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[--navy] hover:bg-gray-50 transition"
          >
            <FolderOpen className="w-5 h-5 text-[--navy]" />
            <div>
              <p className="font-medium text-gray-900">Create New Case</p>
              <p className="text-sm text-gray-600">Start a new arrangement</p>
            </div>
          </Link>
          <Link
            href="/staff/payments"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[--navy] hover:bg-gray-50 transition"
          >
            <DollarSign className="w-5 h-5 text-[--navy]" />
            <div>
              <p className="font-medium text-gray-900">Record Payment</p>
              <p className="text-sm text-gray-600">Process a payment</p>
            </div>
          </Link>
          <Link
            href="/staff/families"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[--navy] hover:bg-gray-50 transition"
          >
            <MessageSquare className="w-5 h-5 text-[--navy]" />
            <div>
              <p className="font-medium text-gray-900">Invite Family</p>
              <p className="text-sm text-gray-600">Send portal invite</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
