'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialTrendChartProps {
  funeralHomeId: string;
}

export function FinancialTrendChart({ funeralHomeId }: FinancialTrendChartProps) {
  // Calculate period range (last 12 months)
  const now = new Date();
  const toPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fromDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const fromPeriod = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}`;

  // Fetch trend data from backend
  const { data: trendsData, isLoading } = trpc.financial.dashboards.getTrends.useQuery({
    funeralHomeId,
    fromPeriod,
    toPeriod,
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Loading trend data...</div>
      </div>
    );
  }

  if (!trendsData?.series || trendsData.series.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 h-[400px] flex items-center justify-center">
        <div className="text-gray-500">No trend data available</div>
      </div>
    );
  }

  const series = trendsData.series;

  // Calculate percentage change
  const firstRevenue = series[0].revenue;
  const lastRevenue = series[series.length - 1].revenue;
  const percentChange = ((lastRevenue - firstRevenue) / firstRevenue) * 100;
  const isPositive = percentChange >= 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Format period labels (e.g., "2024-01" -> "Jan '24")
  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} '${year.substring(2)}`;
  };

  const chartData = {
    labels: series.map(point => formatPeriodLabel(point.period)),
    datasets: [
      {
        label: 'Revenue',
        data: series.map(point => point.revenue),
        borderColor: '#1e3a5f',
        backgroundColor: 'rgba(30, 58, 95, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1e3a5f',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Expenses',
        data: series.map(point => point.expenses),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Net Income',
        data: series.map(point => point.netIncome),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: 'system-ui',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += formatCurrency(context.parsed.y);
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Financial Trends
          </h3>
          <p className="text-sm text-gray-600">
            Last 12 months
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[--navy]">
            {formatCurrency(lastRevenue)}
          </div>
          <div className={`flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} />
            {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
