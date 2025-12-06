"use client";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { ErrorDisplay, PredictiveSearch } from "@dykstra/ui";
import { useState } from "react";
import {
  DashboardStats,
  RecentActivity,
  useDashboardStats,
} from "@/features/dashboard";
import { useRouter } from "next/navigation";
import { OverdueInvoicesWidget } from "@/components/widgets/OverdueInvoicesWidget";

/**
 * Staff Dashboard Page
 * Refactored with ViewModel pattern - 86% reduction (216 → 30 lines)
 */

export default function StaffDashboardPage() {
  const { stats, isLoading, error } = useDashboardStats();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  // Normalize tRPC errors (or other error shapes) to a standard Error instance for ErrorDisplay
  const normalizedError = error
    ? error instanceof Error
      ? error
      : new Error((error as any).message ?? 'Unknown error')
    : null;

  const handleSearch = (query: string) => {
    // Route to appropriate page based on query
    if (query.toLowerCase().includes('case')) {
      router.push('/staff/cases');
    } else if (query.toLowerCase().includes('payment')) {
      router.push('/staff/payments');
    } else if (query.toLowerCase().includes('contract')) {
      router.push('/staff/contracts');
    } else {
      // Default to cases page with search query
      router.push(`/staff/cases?q=${encodeURIComponent(query)}`);
    }
  };

  if (isLoading) return <DashboardSkeleton statsCount={4} showChart={false} />;
  if (normalizedError) return <ErrorDisplay error={normalizedError} title="Error loading dashboard" />;
  if (!stats) return <div className="p-8 text-center text-gray-500">No data available</div>;

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Overview of funeral home operations"
    >
      {/* AI-Powered Search */}
      <div className="mb-6">
        <PredictiveSearch
          placeholder="Search cases, contracts, families, payments..."
          value={searchValue}
          onChange={setSearchValue}
          results={[
            { id: 'recent-cases', title: 'Recent cases', type: 'trending' },
            { id: 'pending-payments', title: 'Pending payments', type: 'trending' },
            { id: 'active-contracts', title: 'Active contracts', type: 'trending' },
          ]}
          onSelectResult={(result) => handleSearch(result.title)}
        />
      </div>
      
      <DashboardStats stats={stats} />
      
      {/* Financial Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <OverdueInvoicesWidget />
      </div>
      
      <RecentActivity stats={stats} />
    </DashboardLayout>
  );
}
