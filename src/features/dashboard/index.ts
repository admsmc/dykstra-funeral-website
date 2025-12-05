/**
 * Dashboard Feature Module
 * Public API exports
 */

// Components
export { DashboardStats } from './components/dashboard-stats';
export { RecentActivity } from './components/recent-activity';
export { KPICard } from './components/kpi-card';

// Hooks
export { useDashboardStats } from './hooks/use-dashboard-stats';

// ViewModels
export type { DashboardStatsViewModel } from './view-models/dashboard-stats-vm';

// Types
export type {
  DashboardStats as DashboardStatsType,
  DashboardKPIs,
  RecentCase,
  RecentPayment,
} from './types';
