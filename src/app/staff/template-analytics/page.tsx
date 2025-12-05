'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { DashboardSkeleton } from '@/components/skeletons';
import {
  AnalyticsDashboard,
  AnalyticsFilters,
  useTemplateAnalytics,
  type DateRange,
  type Category,
} from '@/features/templates';

export default function TemplateAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [category, setCategory] = useState<Category>('all');

  const {
    overallStats,
    mostUsedTemplates,
    usageByCategory,
    generationTrend,
    recentErrors,
    performanceMetrics,
    isLoading,
  } = useTemplateAnalytics(dateRange, category);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardLayout
      title="Template Analytics Dashboard"
      subtitle="Monitor template usage, performance, and errors"
    >
      <AnalyticsFilters
        dateRange={dateRange}
        category={category}
        onDateRangeChange={setDateRange}
        onCategoryChange={setCategory}
      />

      <AnalyticsDashboard
        overallStats={overallStats}
        mostUsedTemplates={mostUsedTemplates}
        usageByCategory={usageByCategory}
        generationTrend={generationTrend}
        recentErrors={recentErrors}
        performanceMetrics={performanceMetrics}
      />
    </DashboardLayout>
  );
}
