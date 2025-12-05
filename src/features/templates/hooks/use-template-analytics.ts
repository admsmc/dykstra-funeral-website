import { useMemo } from 'react';
import { trpc } from '@/lib/trpc-client';
import type { DateRange, Category } from '../types';
import {
  OverallStatsViewModel,
  TemplateUsageViewModel,
  CategoryUsageViewModel,
  TrendDataViewModel,
  ErrorViewModel,
  PerformanceMetricsViewModel,
} from '../view-models/template-analytics-view-model';

export function useDateFilter(dateRange: DateRange) {
  return useMemo(() => {
    if (dateRange === 'all') return undefined;
    
    const now = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
    }
    
    return { startDate: start, endDate: now };
  }, [dateRange]);
}

export function useTemplateAnalytics(dateRange: DateRange, category: Category) {
  const dateFilter = useDateFilter(dateRange);
  const categoryFilter = category === 'all' ? undefined : category;

  const queryOptions = {
    ...dateFilter,
    category: categoryFilter,
  };

  // Fetch all analytics data
  const overallStatsQuery = trpc.templateAnalytics.getOverallStats.useQuery(queryOptions);
  const mostUsedQuery = trpc.templateAnalytics.getMostUsedTemplates.useQuery(queryOptions);
  const usageByCategoryQuery = trpc.templateAnalytics.getUsageByCategory.useQuery({
    ...dateFilter,
  });
  const trendQuery = trpc.templateAnalytics.getGenerationTrend.useQuery(queryOptions);
  const errorsQuery = trpc.templateAnalytics.getRecentErrors.useQuery({
    limit: 10,
    category: categoryFilter,
  });
  const performanceQuery = trpc.templateAnalytics.getPerformanceMetrics.useQuery(queryOptions);

  // Transform data into ViewModels
  const overallStats = useMemo(
    () => new OverallStatsViewModel(overallStatsQuery.data),
    [overallStatsQuery.data]
  );

  const mostUsedTemplates = useMemo(
    () => mostUsedQuery.data?.map((t, idx) => new TemplateUsageViewModel(idx + 1, t)) ?? [],
    [mostUsedQuery.data]
  );

  const usageByCategory = useMemo(() => {
    if (!usageByCategoryQuery.data) return [];
    const totalCount = usageByCategoryQuery.data.reduce((sum, c) => sum + c.count, 0);
    return usageByCategoryQuery.data.map((c) => new CategoryUsageViewModel(c, totalCount));
  }, [usageByCategoryQuery.data]);

  const generationTrend = useMemo(
    () => trendQuery.data?.map((d) => new TrendDataViewModel(d)) ?? [],
    [trendQuery.data]
  );

  const recentErrors = useMemo(
    () => errorsQuery.data?.map((e) => new ErrorViewModel(e)) ?? [],
    [errorsQuery.data]
  );

  const performanceMetrics = useMemo(
    () => new PerformanceMetricsViewModel(performanceQuery.data),
    [performanceQuery.data]
  );

  // Aggregate loading states
  const isLoading =
    overallStatsQuery.isLoading ||
    mostUsedQuery.isLoading ||
    usageByCategoryQuery.isLoading ||
    trendQuery.isLoading ||
    errorsQuery.isLoading ||
    performanceQuery.isLoading;

  return {
    overallStats,
    mostUsedTemplates,
    usageByCategory,
    generationTrend,
    recentErrors,
    performanceMetrics,
    isLoading,
  };
}
