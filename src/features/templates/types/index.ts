export type DateRange = 'day' | 'week' | 'month' | 'all';
export type Category = 'service_program' | 'prayer_card' | 'thank_you_card' | 'memorial_bookmark' | 'all';

export interface DateFilter {
  startDate: Date;
  endDate: Date;
}

export interface OverallStats {
  totalGenerations: number;
  successRate: number;
  avgDurationMs: number;
  avgPdfSizeBytes: number;
}

export interface TemplateUsage {
  businessKey: string;
  name: string;
  category: string;
  count: number;
}

export interface CategoryUsage {
  category: string;
  count: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface ErrorData {
  name: string;
  category: string;
  createdAt: Date | string;
  errorMessage: string;
}

export interface PerformanceMetrics {
  p50: number;
  p95: number;
  p99: number;
}
