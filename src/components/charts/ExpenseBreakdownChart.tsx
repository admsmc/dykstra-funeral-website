'use client';

import { useState } from 'react';

/**
 * Expense Breakdown Chart
 * 
 * Pie chart showing expense categories
 * 
 * Features:
 * - Canvas-based pie chart (no external dependencies)
 * - Interactive legend with toggle to show/hide categories
 * - Percentage labels on each slice
 * - Total expenses displayed in center
 * - Responsive design
 */

interface ExpenseCategory {
  category: string;
  amount: number;
  color: string;
}

interface ExpenseBreakdownChartProps {
  data?: ExpenseCategory[];
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  // Mock data for expense categories
  const defaultData: ExpenseCategory[] = [
    { category: 'Caskets & Urns', amount: 45000, color: '#1e3a5f' }, // Navy
    { category: 'Staff Salaries', amount: 38000, color: '#8b9d83' }, // Sage
    { category: 'Facilities', amount: 22000, color: '#b8956a' }, // Gold
    { category: 'Supplies', amount: 15000, color: '#2c3539' }, // Charcoal
    { category: 'Vehicles', amount: 12000, color: '#6b7280' }, // Gray
    { category: 'Other', amount: 8000, color: '#9ca3af' }, // Light gray
  ];

  const expenseData = data || defaultData;
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  // Filter out hidden categories
  const visibleData = expenseData.filter(item => !hiddenCategories.has(item.category));
  const totalExpenses = visibleData.reduce((sum, item) => sum + item.amount, 0);

  // Toggle category visibility
  const toggleCategory = (category: string) => {
    setHiddenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate pie slices
  const calculateSlices = () => {
    const slices: Array<{
      category: string;
      amount: number;
      color: string;
      percentage: number;
      startAngle: number;
      endAngle: number;
    }> = [];

    let currentAngle = -90; // Start at top

    visibleData.forEach(item => {
      const percentage = (item.amount / totalExpenses) * 100;
      const sliceAngle = (percentage / 100) * 360;
      
      slices.push({
        category: item.category,
        amount: item.amount,
        color: item.color,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + sliceAngle,
      });

      currentAngle += sliceAngle;
    });

    return slices;
  };

  const slices = calculateSlices();

  // Convert polar to cartesian coordinates
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Create SVG arc path
  const createArc = (slice: typeof slices[0], centerX: number, centerY: number, radius: number) => {
    const start = polarToCartesian(centerX, centerY, radius, slice.endAngle);
    const end = polarToCartesian(centerX, centerY, radius, slice.startAngle);
    const largeArcFlag = slice.endAngle - slice.startAngle <= 180 ? 0 : 1;

    return [
      `M ${centerX} ${centerY}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  };

  // Calculate label position (midpoint of arc)
  const getLabelPosition = (slice: typeof slices[0], centerX: number, centerY: number, radius: number) => {
    const midAngle = (slice.startAngle + slice.endAngle) / 2;
    return polarToCartesian(centerX, centerY, radius * 0.7, midAngle);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Expense Breakdown
        </h3>
        <p className="text-sm text-gray-600">
          Current month distribution
        </p>
      </div>

      {/* Chart */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {slices.map((slice, i) => (
              <g key={i}>
                {/* Pie slice */}
                <path
                  d={createArc(slice, 100, 100, 90)}
                  fill={slice.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => toggleCategory(slice.category)}
                >
                  <title>{slice.category}: {formatCurrency(slice.amount)} ({slice.percentage.toFixed(1)}%)</title>
                </path>

                {/* Percentage label (only show if >5%) */}
                {slice.percentage > 5 && (
                  <text
                    x={getLabelPosition(slice, 100, 100, 90).x}
                    y={getLabelPosition(slice, 100, 100, 90).y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="system-ui"
                    className="pointer-events-none"
                  >
                    {slice.percentage.toFixed(0)}%
                  </text>
                )}
              </g>
            ))}

            {/* Center circle with total */}
            <circle cx="100" cy="100" r="45" fill="white" />
            <text
              x="100"
              y="95"
              textAnchor="middle"
              fill="#6b7280"
              fontSize="11"
              fontFamily="system-ui"
            >
              Total Expenses
            </text>
            <text
              x="100"
              y="110"
              textAnchor="middle"
              fill="#1e3a5f"
              fontSize="16"
              fontWeight="bold"
              fontFamily="system-ui"
            >
              {formatCurrency(totalExpenses)}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {expenseData.map((item, i) => {
            const isHidden = hiddenCategories.has(item.category);
            const percentage = ((item.amount / expenseData.reduce((sum, d) => sum + d.amount, 0)) * 100).toFixed(1);

            return (
              <button
                key={i}
                onClick={() => toggleCategory(item.category)}
                className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                  isHidden ? 'opacity-40' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className={`text-sm font-medium ${isHidden ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>
                    {formatCurrency(item.amount)}
                  </div>
                  <div className={`text-xs ${isHidden ? 'text-gray-400' : 'text-gray-600'}`}>
                    {percentage}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Click legend items to show/hide categories
      </div>
    </div>
  );
}
