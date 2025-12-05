// Components
export { AnalyticsDashboard } from './components/analytics-dashboard';
export { AnalyticsFilters } from './components/analytics-filters';
export { StatsGrid } from './components/stats-grid';
export { MostUsedTemplates } from './components/most-used-templates';
export { UsageByCategory } from './components/usage-by-category';
export { TrendChart } from './components/trend-chart';
export { PerformanceMetrics } from './components/performance-metrics';
export { RecentErrors } from './components/recent-errors';

// Hooks
export { useTemplateAnalytics, useDateFilter } from './hooks/use-template-analytics';

// Types
export type {
  DateRange,
  Category,
  DateFilter,
  OverallStats,
  TemplateUsage,
  CategoryUsage,
  TrendData,
  ErrorData,
  PerformanceMetrics as PerformanceMetricsType,
} from './types';

// ViewModels
export {
  OverallStatsViewModel,
  TemplateUsageViewModel,
  CategoryUsageViewModel,
  TrendDataViewModel,
  ErrorViewModel,
  PerformanceMetricsViewModel,
} from './view-models/template-analytics-view-model';
