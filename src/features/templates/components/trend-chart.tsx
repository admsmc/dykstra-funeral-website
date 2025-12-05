import type { TrendDataViewModel } from '../view-models/template-analytics-view-model';

interface TrendChartProps {
  data: TrendDataViewModel[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generation Trend</h2>
        <p className="text-gray-500 text-center py-8">No data available for this time range</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));
  const chartHeight = 200;

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Generation Trend</h2>
      <div className="h-64">
        <div className="relative h-full flex items-end justify-between gap-1 px-2">
          {data.map((point, idx) => {
            const barHeight = maxCount > 0 ? (point.count / maxCount) * chartHeight : 0;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center" style={{ height: chartHeight }}>
                  <div
                    className="w-full bg-blue-600 rounded-t hover:bg-blue-700 transition-colors cursor-pointer"
                    style={{ height: barHeight }}
                    title={`${point.date}: ${point.count} generations`}
                  />
                </div>
                <span className="text-xs text-gray-600 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {point.formattedDate}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
