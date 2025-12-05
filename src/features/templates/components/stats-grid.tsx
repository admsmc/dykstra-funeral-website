import type { OverallStatsViewModel } from '../view-models/template-analytics-view-model';

interface StatCardProps {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>
        {value}
      </p>
    </div>
  );
}

interface StatsGridProps {
  stats: OverallStatsViewModel;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <StatCard
        title="Total Generations"
        value={stats.totalGenerations}
        color="blue"
      />
      <StatCard
        title="Success Rate"
        value={stats.successRate}
        color="green"
      />
      <StatCard
        title="Avg Duration"
        value={stats.avgDuration}
        color="yellow"
      />
      <StatCard
        title="Avg PDF Size"
        value={stats.avgPdfSize}
        color="purple"
      />
    </div>
  );
}
