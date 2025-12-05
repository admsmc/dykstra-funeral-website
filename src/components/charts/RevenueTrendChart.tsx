'use client';

import { TrendingUp } from 'lucide-react';

/**
 * Revenue Trend Chart
 * 
 * Line chart showing monthly revenue for last 6 months
 * 
 * Features:
 * - Simple canvas-based line chart (no external dependencies)
 * - Hover tooltips with exact amounts
 * - Responsive design with mobile-optimized view
 * - Gradient fill under line
 * - Grid lines for readability
 */

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface RevenueTrendChartProps {
  data?: RevenueDataPoint[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  // Mock data for last 6 months
  const defaultData: RevenueDataPoint[] = [
    { month: 'Jun', revenue: 125000 },
    { month: 'Jul', revenue: 148000 },
    { month: 'Aug', revenue: 132000 },
    { month: 'Sep', revenue: 165000 },
    { month: 'Oct', revenue: 142000 },
    { month: 'Nov', revenue: 178000 },
  ];

  const revenueData = data || defaultData;

  // Calculate chart dimensions and scales
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const minRevenue = Math.min(...revenueData.map(d => d.revenue));
  const revenueRange = maxRevenue - minRevenue;
  const padding = revenueRange * 0.2; // 20% padding
  const chartMax = maxRevenue + padding;
  const chartMin = Math.max(0, minRevenue - padding);
  const chartRange = chartMax - chartMin;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${(amount / 1000).toFixed(0)}k`;
  };

  const formatFullCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate percentage change
  const firstRevenue = revenueData[0].revenue;
  const lastRevenue = revenueData[revenueData.length - 1].revenue;
  const percentChange = ((lastRevenue - firstRevenue) / firstRevenue) * 100;
  const isPositive = percentChange >= 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Revenue Trend
          </h3>
          <p className="text-sm text-gray-600">
            Last 6 months
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[--navy]">
            {formatFullCurrency(lastRevenue)}
          </div>
          <div className={`flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} />
            {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <svg
          viewBox="0 0 600 240"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = (i / 4) * 200 + 20;
            const value = chartMax - (i / 4) * chartRange;
            return (
              <g key={i}>
                <line
                  x1="40"
                  y1={y}
                  x2="590"
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x="35"
                  y={y + 4}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize="12"
                  fontFamily="system-ui"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          {/* Line path with gradient fill */}
          <defs>
            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area under line */}
          <path
            d={revenueData.map((point, i) => {
              const x = 40 + (i / (revenueData.length - 1)) * 550;
              const y = 220 - ((point.revenue - chartMin) / chartRange) * 200;
              return i === 0 ? `M${x},${y}` : `L${x},${y}`;
            }).join(' ') + ` L590,220 L40,220 Z`}
            fill="url(#revenueGradient)"
          />

          {/* Line */}
          <path
            d={revenueData.map((point, i) => {
              const x = 40 + (i / (revenueData.length - 1)) * 550;
              const y = 220 - ((point.revenue - chartMin) / chartRange) * 200;
              return i === 0 ? `M${x},${y}` : `L${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {revenueData.map((point, i) => {
            const x = 40 + (i / (revenueData.length - 1)) * 550;
            const y = 220 - ((point.revenue - chartMin) / chartRange) * 200;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke="#1e3a5f"
                  strokeWidth="2"
                  className="hover:r-7 transition-all cursor-pointer"
                >
                  <title>{point.month}: {formatFullCurrency(point.revenue)}</title>
                </circle>
              </g>
            );
          })}

          {/* X-axis labels */}
          {revenueData.map((point, i) => {
            const x = 40 + (i / (revenueData.length - 1)) * 550;
            return (
              <text
                key={i}
                x={x}
                y="235"
                textAnchor="middle"
                fill="#6b7280"
                fontSize="12"
                fontFamily="system-ui"
              >
                {point.month}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[--navy]"></div>
          <span>Monthly Revenue</span>
        </div>
      </div>
    </div>
  );
}
