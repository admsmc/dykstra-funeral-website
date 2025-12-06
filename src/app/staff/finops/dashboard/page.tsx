'use client';

import { DollarSign, TrendingUp, TrendingDown, Wallet, FileText, Calculator, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { FinancialTrendChart } from '@/components/charts/FinancialTrendChart';
import { ExpenseBreakdownChart } from '@/components/charts/ExpenseBreakdownChart';
import { PeriodCloseValidationWidget } from '@/components/widgets/PeriodCloseValidationWidget';
import { OverdueInvoicesWidget } from '@/components/widgets/OverdueInvoicesWidget';
import { BatchPaymentStatusWidget } from '@/components/widgets/BatchPaymentStatusWidget';

/**
 * Financial Dashboard Page
 * 
 * Single pane of glass for financial health:
 * - 4 KPI cards: Revenue, Expenses, Profit, AR Balance
 * - 2 charts: Revenue trend (6 months), Expense breakdown (pie)
 * - 3 widgets: Period close status, Overdue invoices, Recent payment runs
 * - Quick actions: Record payment, Create invoice, Create journal entry
 */

export default function FinancialDashboardPage() {
  const currentPeriod = new Date().toISOString().substring(0, 7); // '2024-12'
  const funeralHomeId = 'fh-001';

  // Fetch real KPIs from backend
  const { data: kpisData, isLoading: kpisLoading } = trpc.financial.dashboards.getKPIs.useQuery({
    funeralHomeId,
    period: currentPeriod,
  });

  // Mock previous month data for comparison (in production, fetch from backend)
  const mockPrevious = {
    revenue: 142000,
    expenses: 125000,
    profit: 17000,
    arBalance: 268000,
  };

  const kpis = kpisData ? {
    revenue: {
      current: kpisData.revenue,
      previous: mockPrevious.revenue,
      label: 'Revenue',
      description: 'Current month',
    },
    expenses: {
      current: kpisData.expenses,
      previous: mockPrevious.expenses,
      label: 'Expenses',
      description: 'Current month',
    },
    profit: {
      current: kpisData.netIncome,
      previous: mockPrevious.profit,
      label: 'Net Profit',
      description: 'Current month',
    },
    arBalance: {
      current: kpisData.accountsReceivable,
      previous: mockPrevious.arBalance,
      label: 'AR Balance',
      description: 'Outstanding receivables',
    },
  } : {
    revenue: { current: 178000, previous: 142000, label: 'Revenue', description: 'Current month' },
    expenses: { current: 140000, previous: 125000, label: 'Expenses', description: 'Current month' },
    profit: { current: 38000, previous: 17000, label: 'Net Profit', description: 'Current month' },
    arBalance: { current: 245000, previous: 268000, label: 'AR Balance', description: 'Outstanding receivables' },
  };

  // Calculate change percentages
  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const revenueChange = calculateChange(kpis.revenue.current, kpis.revenue.previous);
  const expensesChange = calculateChange(kpis.expenses.current, kpis.expenses.previous);
  const profitChange = calculateChange(kpis.profit.current, kpis.profit.previous);
  const arChange = calculateChange(kpis.arBalance.current, kpis.arBalance.previous);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[--navy] mb-2">
            Financial Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive view of your funeral home's financial health
          </p>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Revenue */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${revenueChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {revenueChange.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {revenueChange.percentage}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {kpis.revenue.label}
            </h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(kpis.revenue.current)}
            </div>
            <p className="text-xs text-gray-500">
              {kpis.revenue.description}
            </p>
          </div>

          {/* Expenses */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${!expensesChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {expensesChange.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {expensesChange.percentage}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {kpis.expenses.label}
            </h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(kpis.expenses.current)}
            </div>
            <p className="text-xs text-gray-500">
              {kpis.expenses.description}
            </p>
          </div>

          {/* Profit */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${profitChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {profitChange.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {profitChange.percentage}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {kpis.profit.label}
            </h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(kpis.profit.current)}
            </div>
            <p className="text-xs text-gray-500">
              {kpis.profit.description}
            </p>
          </div>

          {/* AR Balance */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Wallet className="w-6 h-6 text-yellow-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${!arChange.isPositive ? 'text-green-600' : 'text-yellow-600'}`}>
                {arChange.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {arChange.percentage}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {kpis.arBalance.label}
            </h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(kpis.arBalance.current)}
            </div>
            <p className="text-xs text-gray-500">
              {kpis.arBalance.description}
            </p>
          </div>
        </div>

        {/* Secondary KPI Grid (Margins & Balances) */}
        {kpisData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Gross Margin */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Gross Margin
              </h3>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {(kpisData.grossMargin * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">
                Profitability ratio
              </p>
            </div>

            {/* Operating Margin */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Operating Margin
              </h3>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {(kpisData.operatingMargin * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">
                Operating efficiency
              </p>
            </div>

            {/* AP Balance */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Wallet className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                AP Balance
              </h3>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(kpisData.accountsPayable)}
              </div>
              <p className="text-xs text-gray-500">
                Outstanding payables
              </p>
            </div>

            {/* Cash on Hand */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Cash on Hand
              </h3>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(kpisData.cashOnHand)}
              </div>
              <p className="text-xs text-gray-500">
                Available liquidity
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {kpisLoading && (
          <div className="text-center py-8 text-gray-500">Loading financial data...</div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FinancialTrendChart funeralHomeId={funeralHomeId} />
          <ExpenseBreakdownChart />
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/staff/payments"
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[--navy] hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-[--navy] transition-colors">
                <DollarSign className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-[--navy]">
                  Record Payment
                </div>
                <div className="text-sm text-gray-600">
                  Process customer payment
                </div>
              </div>
            </Link>

            <Link
              href="/staff/finops/invoices/new"
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[--navy] hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-[--navy] transition-colors">
                <FileText className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-[--navy]">
                  Create Invoice
                </div>
                <div className="text-sm text-gray-600">
                  Generate AR invoice
                </div>
              </div>
            </Link>

            <Link
              href="/staff/finops/journal-entry"
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[--navy] hover:shadow-md transition-all group"
            >
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-[--navy] transition-colors">
                <Calculator className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-[--navy]">
                  Journal Entry
                </div>
                <div className="text-sm text-gray-600">
                  Create manual entry
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PeriodCloseValidationWidget />
          <OverdueInvoicesWidget />
          <BatchPaymentStatusWidget />
        </div>
      </div>
    </div>
  );
}
