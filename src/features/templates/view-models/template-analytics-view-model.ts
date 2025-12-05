import { BaseViewModel } from '@/lib/view-models/base-view-model';
import type {
  OverallStats,
  TemplateUsage,
  CategoryUsage,
  TrendData,
  ErrorData,
  PerformanceMetrics,
} from '../types';

export class OverallStatsViewModel extends BaseViewModel {
  constructor(private stats: OverallStats | undefined) {
    super();
  }

  get totalGenerations(): string {
    return this.formatCount(this.stats?.totalGenerations);
  }

  get successRate(): string {
    const rate = this.stats?.successRate;
    return rate !== undefined ? `${rate.toFixed(1)}%` : '0%';
  }

  get avgDuration(): string {
    return this.formatDuration(this.stats?.avgDurationMs);
  }

  get avgPdfSize(): string {
    return this.formatBytes(this.stats?.avgPdfSizeBytes);
  }

  get hasData(): boolean {
    return this.stats !== undefined;
  }
}

export class TemplateUsageViewModel extends BaseViewModel {
  constructor(
    public readonly rank: number,
    private template: TemplateUsage
  ) {
    super();
  }

  get name(): string {
    return this.template.name;
  }

  get category(): string {
    return this.toTitleCase(this.template.category);
  }

  get count(): string {
    return this.formatCount(this.template.count);
  }

  get businessKey(): string {
    return this.template.businessKey;
  }
}

export class CategoryUsageViewModel extends BaseViewModel {
  constructor(
    private usage: CategoryUsage,
    private totalCount: number
  ) {
    super();
  }

  get category(): string {
    return this.toTitleCase(this.usage.category);
  }

  get count(): string {
    return this.formatCount(this.usage.count);
  }

  get percentage(): number {
    return this.totalCount > 0 ? (this.usage.count / this.totalCount) * 100 : 0;
  }
}

export class TrendDataViewModel extends BaseViewModel {
  constructor(private data: TrendData) {
    super();
  }

  get date(): string {
    return this.data.date;
  }

  get formattedDate(): string {
    const d = new Date(this.data.date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  get count(): number {
    return this.data.count;
  }
}

export class ErrorViewModel extends BaseViewModel {
  constructor(private error: ErrorData) {
    super();
  }

  get name(): string {
    return this.error.name;
  }

  get category(): string {
    return this.toTitleCase(this.error.category);
  }

  get formattedDate(): string {
    return this.formatDateTime(this.error.createdAt);
  }

  get errorMessage(): string {
    return this.error.errorMessage;
  }
}

export class PerformanceMetricsViewModel extends BaseViewModel {
  constructor(private metrics: PerformanceMetrics | undefined) {
    super();
  }

  get p50(): string {
    return this.formatDuration(this.metrics?.p50);
  }

  get p95(): string {
    return this.formatDuration(this.metrics?.p95);
  }

  get p99(): string {
    return this.formatDuration(this.metrics?.p99);
  }
}
