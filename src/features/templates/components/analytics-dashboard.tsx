import { StatsGrid } from './stats-grid';
import { MostUsedTemplates } from './most-used-templates';
import { UsageByCategory } from './usage-by-category';
import { TrendChart } from './trend-chart';
import { PerformanceMetrics } from './performance-metrics';
import { RecentErrors } from './recent-errors';
import type {
  OverallStatsViewModel,
  TemplateUsageViewModel,
  CategoryUsageViewModel,
  TrendDataViewModel,
  ErrorViewModel,
  PerformanceMetricsViewModel,
} from '../view-models/template-analytics-view-model';

interface AnalyticsDashboardProps {
  overallStats: OverallStatsViewModel;
  mostUsedTemplates: TemplateUsageViewModel[];
  usageByCategory: CategoryUsageViewModel[];
  generationTrend: TrendDataViewModel[];
  recentErrors: ErrorViewModel[];
  performanceMetrics: PerformanceMetricsViewModel;
}

export function AnalyticsDashboard({
  overallStats,
  mostUsedTemplates,
  usageByCategory,
  generationTrend,
  recentErrors,
  performanceMetrics,
}: AnalyticsDashboardProps) {
  return (
    <>
      <StatsGrid stats={overallStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MostUsedTemplates templates={mostUsedTemplates} />
        <UsageByCategory categories={usageByCategory} />
      </div>

      <TrendChart data={generationTrend} />
      <PerformanceMetrics metrics={performanceMetrics} />
      <RecentErrors errors={recentErrors} />
    </>
  );
}
