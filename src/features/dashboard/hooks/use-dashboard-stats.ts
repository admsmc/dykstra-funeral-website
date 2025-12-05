/**
 * Dashboard Stats Hook
 * Fetches dashboard data and returns ViewModel
 */

import { trpc } from '@/lib/trpc-client';
import { useMemo } from 'react';
import { DashboardStatsViewModel } from '../view-models/dashboard-stats-vm';

export function useDashboardStats() {
  const query = trpc.staff.getDashboardStats.useQuery();

  const viewModel = useMemo(
    () => (query.data ? new DashboardStatsViewModel(query.data) : null),
    [query.data]
  );

  return {
    stats: viewModel,
    isLoading: query.isLoading,
    error: query.error,
  };
}
