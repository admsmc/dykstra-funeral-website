import type { PerformanceMetricsViewModel } from '../view-models/template-analytics-view-model';

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
}

function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsViewModel;
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="P50 (Median)"
          value={metrics.p50}
          description="50% of generations complete in this time or less"
        />
        <MetricCard
          label="P95"
          value={metrics.p95}
          description="95% of generations complete in this time or less"
        />
        <MetricCard
          label="P99"
          value={metrics.p99}
          description="99% of generations complete in this time or less"
        />
      </div>
    </div>
  );
}
