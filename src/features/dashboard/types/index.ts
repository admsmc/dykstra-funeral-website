/**
 * Dashboard Feature Types
 * Type definitions for dashboard data structures
 */

export type DashboardKPIs = {
  activeCases: number;
  inquiries: number;
  upcomingServices: number;
  pendingTasks: number;
};

export type RecentCase = {
  id: string;
  businessKey: string;
  decedentName: string;
  type: string;
  status: string;
  createdAt: Date;
};

export type RecentPayment = {
  id: string;
  case: {
    decedentName: string;
  };
  method: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  amount: number;
  createdAt: Date;
};

export type DashboardStats = {
  kpis: DashboardKPIs;
  recentActivity: {
    cases: RecentCase[];
    payments: RecentPayment[];
  };
};
