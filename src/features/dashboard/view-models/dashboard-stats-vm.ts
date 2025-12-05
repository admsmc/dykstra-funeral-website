/**
 * Dashboard Stats ViewModel
 * Transforms raw dashboard data into display-ready format
 */

import type { DashboardStats, RecentCase, RecentPayment } from '../types';

export class DashboardStatsViewModel {
  constructor(private data: DashboardStats) {}

  // KPIs
  get activeCases() {
    return this.data.kpis.activeCases;
  }

  get inquiries() {
    return this.data.kpis.inquiries;
  }

  get upcomingServices() {
    return this.data.kpis.upcomingServices;
  }

  get pendingTasks() {
    return this.data.kpis.pendingTasks;
  }

  // Recent Cases
  get recentCases() {
    return this.data.recentActivity.cases.map((c) => ({
      ...c,
      displayDate: new Date(c.createdAt).toLocaleDateString(),
      displayType: c.type.replace(/_/g, ' '),
    }));
  }

  get hasRecentCases() {
    return this.data.recentActivity.cases.length > 0;
  }

  // Recent Payments
  get recentPayments() {
    return this.data.recentActivity.payments.map((p) => ({
      ...p,
      displayAmount: `$${Number(p.amount).toFixed(2)}`,
      displayMethod: p.method.replace(/_/g, ' '),
      statusBadgeClass: this.getPaymentStatusClass(p.status),
    }));
  }

  get hasRecentPayments() {
    return this.data.recentActivity.payments.length > 0;
  }

  // Helper methods
  private getPaymentStatusClass(status: 'SUCCEEDED' | 'PENDING' | 'FAILED'): string {
    const classes = {
      SUCCEEDED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return classes[status];
  }
}
