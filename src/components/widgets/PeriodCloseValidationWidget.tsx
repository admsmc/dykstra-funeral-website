'use client';

import Link from 'next/link';
import { Calendar, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';

/**
 * Period Close Validation Widget
 * 
 * Dashboard widget showing month-end close readiness:
 * - Traffic light status (ready/warning/blocked)
 * - Top validation checks
 * - Quick link to period close page
 * - Auto-refreshes every 30 seconds
 */

export function PeriodCloseValidationWidget() {
  // Get current period (last day of current month)
  const getCurrentPeriod = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // Last day of current month
    return date;
  };

  // Query validation status
  const { data: validation, isLoading, error } = api.financial.periodClose.validate.useQuery(
    { periodEnd: getCurrentPeriod() },
    { 
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      retry: 1,
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Period Close Status</h3>
              <p className="text-sm text-gray-500">Checking readiness...</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !validation) {
    return (
      <div className="bg-white border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Period Close Status</h3>
            <p className="text-sm text-red-600">Unable to load validation status</p>
          </div>
        </div>
        <Link
          href="/staff/finops/period-close"
          className="text-sm text-[--navy] hover:underline flex items-center gap-1"
        >
          View details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // Determine overall status based on validateMonthEndClose result shape
  const { ready, issues = [], warnings = [] } = validation;
  const errors = issues;
  const passed: string[] = ready && issues.length === 0 && warnings.length === 0
    ? ['All validation checks passed']
    : [];
  const status = ready ? 'ready' : errors.length > 0 ? 'blocked' : 'warning';

  // Status configuration
  const statusConfig = {
    ready: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
      icon: CheckCircle2,
      label: 'Ready to Close',
      description: 'All validation checks passed',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-700',
      icon: AlertTriangle,
      label: 'Review Warnings',
      description: `${warnings.length} warning(s) detected`,
    },
    blocked: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
      icon: XCircle,
      label: 'Close Blocked',
      description: `${errors.length} error(s) must be resolved`,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Get top 3 items to display (errors first, then warnings, then passed)
  const topItems = [
    ...errors.slice(0, 3),
    ...warnings.slice(0, Math.max(0, 3 - errors.length)),
    ...passed.slice(0, Math.max(0, 3 - errors.length - warnings.length)),
  ];

  return (
    <div className={`border-2 ${config.border} ${config.bg} rounded-lg p-6 hover:shadow-lg transition-shadow`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${config.iconBg} rounded-lg`}>
            <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Period Close Status</h3>
            <p className={`text-sm font-medium ${config.textColor}`}>
              {config.label}
            </p>
          </div>
        </div>
      </div>

      {/* Status Description */}
      <p className={`text-sm mb-4 ${config.textColor}`}>
        {config.description}
      </p>

      {/* Validation Checklist (Top 3) */}
      <div className="space-y-2 mb-4">
        {topItems.map((item, idx) => {
          const isError = errors.includes(item);
          const isWarning = warnings.includes(item);
          const isPassed = !isError && !isWarning;

          return (
            <div key={idx} className="flex items-start gap-2 text-sm">
              {isError && <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />}
              {isPassed && <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />}
              <span className={`${
                isError ? 'text-red-700' : 
                isWarning ? 'text-yellow-700' : 
                'text-gray-600'
              }`}>
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="flex items-center gap-4 mb-4 text-xs">
          {errors.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-red-700 font-medium">{errors.length} Error{errors.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-yellow-700 font-medium">{warnings.length} Warning{warnings.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {passed.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-green-700 font-medium">{passed.length} Passed</span>
            </div>
          )}
        </div>
      )}

      {/* Action Link */}
      <Link
        href="/staff/finops/period-close"
        className={`flex items-center justify-center gap-2 w-full px-4 py-2 ${
          status === 'ready' ? 'bg-green-600 hover:bg-green-700' :
          status === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
          'bg-red-600 hover:bg-red-700'
        } text-white rounded-lg transition-colors font-medium`}
      >
        <span>{status === 'ready' ? 'Start Period Close' : 'View Full Report'}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>

      {/* Auto-refresh indicator */}
      <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Auto-refreshing every 30s</span>
      </div>
    </div>
  );
}
