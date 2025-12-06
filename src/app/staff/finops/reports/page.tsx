'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Loader2,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/trpc/react';
import { toast } from 'sonner';

type ReportType =
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'ar_aging'
  | 'ap_aging'
  | 'budget_variance'
  | 'revenue_by_service'
  | 'expense_by_category';

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: any;
  color: string;
  requiresDateRange: boolean;
}

const REPORT_TYPES: ReportConfig[] = [
  {
    id: 'income_statement',
    title: 'Profit & Loss Statement',
    description: 'Revenue, expenses, and net income for a period',
    icon: TrendingUp,
    color: 'indigo',
    requiresDateRange: true,
  },
  {
    id: 'balance_sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity at a point in time',
    icon: Building2,
    color: 'blue',
    requiresDateRange: false,
  },
  {
    id: 'cash_flow',
    title: 'Cash Flow Statement',
    description: 'Operating, investing, and financing cash flows',
    icon: DollarSign,
    color: 'green',
    requiresDateRange: true,
  },
  {
    id: 'ar_aging',
    title: 'AR Aging Report',
    description: 'Accounts receivable by aging bucket (30/60/90+ days)',
    icon: Users,
    color: 'amber',
    requiresDateRange: false,
  },
  {
    id: 'ap_aging',
    title: 'AP Aging Report',
    description: 'Accounts payable by vendor and aging bucket',
    icon: Receipt,
    color: 'red',
    requiresDateRange: false,
  },
  {
    id: 'budget_variance',
    title: 'Budget vs Actual',
    description: 'Compare actual results to budgeted amounts',
    icon: BarChart3,
    color: 'purple',
    requiresDateRange: false,
  },
  {
    id: 'revenue_by_service',
    title: 'Revenue by Service Type',
    description: 'Revenue breakdown by service category',
    icon: CreditCard,
    color: 'teal',
    requiresDateRange: true,
  },
  {
    id: 'expense_by_category',
    title: 'Expense by Category',
    description: 'Operating expenses grouped by category',
    icon: FileText,
    color: 'orange',
    requiresDateRange: true,
  },
];

export default function FinancialReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('income_statement');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [format, setFormat] = useState<'summary' | 'detailed'>('summary');
  const [showFilters, setShowFilters] = useState(false);

  const currentReportConfig = REPORT_TYPES.find((r) => r.id === selectedReport)!;

  // Fetch appropriate data based on selected report
  const { data: incomeStatementData, isLoading: loadingIncome } =
    api.financial.gl.getFinancialStatement.useQuery(
      {
        type: 'income_statement',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        funeralHomeId: 'default',
      },
      { enabled: selectedReport === 'income_statement' }
    );

  const { data: balanceSheetData, isLoading: loadingBalanceSheet } =
    api.financial.gl.getFinancialStatement.useQuery(
      {
        type: 'balance_sheet',
        endDate: new Date(endDate),
        funeralHomeId: 'default',
      },
      { enabled: selectedReport === 'balance_sheet' }
    );

  const { data: cashFlowData, isLoading: loadingCashFlow } =
    api.financial.gl.getFinancialStatement.useQuery(
      {
        type: 'cash_flow',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        funeralHomeId: 'default',
      },
      { enabled: selectedReport === 'cash_flow' }
    );

  const { data: arAgingData, isLoading: loadingARAging } = api.financial.ar.getAgingReport.useQuery(
    {
      asOfDate: new Date(endDate),
      funeralHomeId: 'default',
    },
    { enabled: selectedReport === 'ar_aging' }
  );

  const { data: apPayablesData, isLoading: loadingAPAging } =
    api.financial.ap.getPayablesByVendor.useQuery(
      {
        asOfDate: new Date(endDate),
        funeralHomeId: 'default',
        status: 'all',
      },
      { enabled: selectedReport === 'ap_aging' }
    );

  const { data: budgetVarianceData, isLoading: loadingBudget } =
    api.financial.reports.budgetVariance.useQuery(
      {
        period: new Date(endDate),
        funeralHomeId: 'default',
      },
      { enabled: selectedReport === 'budget_variance' }
    );

  const { data: revenueByServiceData, isLoading: loadingRevenue } =
    api.financial.reports.revenueByServiceType.useQuery(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        funeralHomeId: 'default',
      },
      { enabled: selectedReport === 'revenue_by_service' }
    );

  const isLoading =
    loadingIncome ||
    loadingBalanceSheet ||
    loadingCashFlow ||
    loadingARAging ||
    loadingAPAging ||
    loadingBudget ||
    loadingRevenue;

  const handleExport = (exportFormat: 'pdf' | 'excel' | 'csv') => {
    toast.success(`Exporting ${currentReportConfig.title} as ${exportFormat.toUpperCase()}...`);
    // In production, trigger actual export
  };

  const handleQuickDateRange = (range: 'mtd' | 'qtd' | 'ytd' | 'last_month' | 'last_quarter') => {
    const today = new Date();
    let start = new Date();

    switch (range) {
      case 'mtd':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'qtd':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'ytd':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        setEndDate(
          new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
        );
        setStartDate(start.toISOString().split('T')[0]);
        return;
      case 'last_quarter':
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
        start = new Date(today.getFullYear(), lastQuarter * 3, 1);
        setEndDate(
          new Date(today.getFullYear(), lastQuarter * 3 + 3, 0).toISOString().split('T')[0]
        );
        setStartDate(start.toISOString().split('T')[0]);
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-lg text-gray-600 mt-2">
          Generate and export comprehensive financial reports
        </p>
      </motion.div>

      {/* Report Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {REPORT_TYPES.map((report, index) => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.id;
          const colorClasses = {
            indigo: 'bg-indigo-50 text-indigo-600',
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            amber: 'bg-amber-50 text-amber-600',
            red: 'bg-red-50 text-red-600',
            purple: 'bg-purple-50 text-purple-600',
            teal: 'bg-teal-50 text-teal-600',
            orange: 'bg-orange-50 text-orange-600',
          };

          return (
            <motion.button
              key={report.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colorClasses[report.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{report.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{report.description}</p>
                </div>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Selected
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Filters & Export Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{currentReportConfig.title}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-6 mb-6 border-b border-gray-200 space-y-4">
                {/* Date Range */}
                {currentReportConfig.requiresDateRange ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Ranges
                      </label>
                      <select
                        onChange={(e) => handleQuickDateRange(e.target.value as any)}
                        defaultValue=""
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="" disabled>
                          Select range...
                        </option>
                        <option value="mtd">Month to Date</option>
                        <option value="qtd">Quarter to Date</option>
                        <option value="ytd">Year to Date</option>
                        <option value="last_month">Last Month</option>
                        <option value="last_quarter">Last Quarter</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      As of Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Format Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Format
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormat('summary')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        format === 'summary'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setFormat('detailed')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        format === 'detailed'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-600">Generating {currentReportConfig.title.toLowerCase()}...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Report Preview */}
            <ReportPreview
              reportType={selectedReport}
              format={format}
              startDate={startDate}
              endDate={endDate}
              data={{
                incomeStatementData,
                balanceSheetData,
                cashFlowData,
                arAgingData,
                apPayablesData,
                budgetVarianceData,
                revenueByServiceData,
              }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ============================================
   REPORT PREVIEW COMPONENT
   ============================================ */
function ReportPreview({
  reportType,
  format,
  startDate,
  endDate,
  data,
}: {
  reportType: ReportType;
  format: 'summary' | 'detailed';
  startDate: string;
  endDate: string;
  data: any;
}) {
  // In production, render actual report data
  // For now, showing placeholder structure

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="text-center pb-6 border-b border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Dykstra Funeral Home
        </h3>
        <p className="text-lg font-semibold text-gray-700">
          {REPORT_TYPES.find((r) => r.id === reportType)?.title}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {reportType === 'balance_sheet' || reportType === 'ar_aging' || reportType === 'ap_aging'
            ? `As of ${new Date(endDate).toLocaleDateString()}`
            : `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
        </p>
      </div>

      {/* Report Body - Different for each type */}
      {reportType === 'income_statement' && data.incomeStatementData && (
        <IncomeStatementReport data={data.incomeStatementData} format={format} />
      )}

      {reportType === 'balance_sheet' && data.balanceSheetData && (
        <BalanceSheetReport data={data.balanceSheetData} format={format} />
      )}

      {reportType === 'cash_flow' && data.cashFlowData && (
        <CashFlowReport data={data.cashFlowData} format={format} />
      )}

      {reportType === 'ar_aging' && data.arAgingData && (
        <ARAgingReport data={data.arAgingData} format={format} />
      )}

      {reportType === 'ap_aging' && data.apPayablesData && (
        <APAgingReport data={data.apPayablesData} format={format} />
      )}

      {reportType === 'budget_variance' && data.budgetVarianceData && (
        <BudgetVarianceReport data={data.budgetVarianceData} format={format} />
      )}

      {reportType === 'revenue_by_service' && data.revenueByServiceData && (
        <RevenueByServiceReport data={data.revenueByServiceData} format={format} />
      )}

      {reportType === 'expense_by_category' && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Expense Report</p>
          <p className="text-sm mt-2">
            Detailed expense categorization will appear here
          </p>
        </div>
      )}

      {/* Empty State */}
      {!data.incomeStatementData && reportType === 'income_statement' && (
        <EmptyReportState reportType={reportType} />
      )}
      {!data.balanceSheetData && reportType === 'balance_sheet' && (
        <EmptyReportState reportType={reportType} />
      )}
      {!data.cashFlowData && reportType === 'cash_flow' && (
        <EmptyReportState reportType={reportType} />
      )}
      {!data.arAgingData && reportType === 'ar_aging' && (
        <EmptyReportState reportType={reportType} />
      )}
      {!data.apPayablesData && reportType === 'ap_aging' && (
        <EmptyReportState reportType={reportType} />
      )}
      {!data.budgetVarianceData && reportType === 'budget_variance' && (
        <EmptyReportState reportType={reportType} />
      )}
      {!data.revenueByServiceData && reportType === 'revenue_by_service' && (
        <EmptyReportState reportType={reportType} />
      )}
    </div>
  );
}

function ReportSection({
  title,
  children,
  highlight,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`${highlight ? 'bg-indigo-50 p-4 rounded-lg' : ''}`}>
      <h4 className="text-lg font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReportLine({
  label,
  amount,
  bold,
  large,
}: {
  label: string;
  amount: number;
  bold?: boolean;
  large?: boolean;
}) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className={`${bold ? 'font-semibold' : ''} ${large ? 'text-lg' : 'text-sm'} text-gray-700`}>
        {label}
      </span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${large ? 'text-xl' : 'text-sm'} ${amount >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

/* ============================================
   INDIVIDUAL REPORT IMPLEMENTATIONS
   ============================================ */
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function IncomeStatementReport({ data, format }: { data: any; format: string }) {
  if (!data || !data.sections) return <EmptyReportState reportType="income_statement" />;
  
  const revenueSection = data.sections.find((s: any) => s.name.toLowerCase().includes('revenue'));
  const expenseSection = data.sections.find((s: any) => s.name.toLowerCase().includes('expense'));
  const netIncome = data.netIncome || 0;
  
  return (
    <div className="space-y-4">
      {revenueSection && (
        <ReportSection title="Revenue">
          {revenueSection.accounts.map((acc: any, idx: number) => (
            <ReportLine key={idx} label={acc.accountName} amount={acc.amount} />
          ))}
          <ReportLine label="Total Revenue" amount={revenueSection.subtotal} bold />
        </ReportSection>
      )}
      
      {expenseSection && (
        <ReportSection title="Expenses">
          {expenseSection.accounts.map((acc: any, idx: number) => (
            <ReportLine key={idx} label={acc.accountName} amount={acc.amount} />
          ))}
          <ReportLine label="Total Expenses" amount={expenseSection.subtotal} bold />
        </ReportSection>
      )}
      
      <ReportSection title="Net Income" highlight>
        <ReportLine label="Net Income" amount={netIncome} bold large />
      </ReportSection>
    </div>
  );
}

function BalanceSheetReport({ data, format }: { data: any; format: string }) {
  if (!data || !data.sections) return <EmptyReportState reportType="balance_sheet" />;
  
  return (
    <div className="space-y-4">
      {data.sections.map((section: any, idx: number) => (
        <ReportSection key={idx} title={section.name}>
          {section.accounts.map((acc: any, accIdx: number) => (
            <ReportLine key={accIdx} label={acc.accountName} amount={acc.amount} />
          ))}
          <ReportLine label={`Total ${section.name}`} amount={section.subtotal} bold />
        </ReportSection>
      ))}
      
      {data.totalEquity && (
        <ReportSection title="Total Equity" highlight>
          <ReportLine label="Total Equity" amount={data.totalEquity} bold large />
        </ReportSection>
      )}
    </div>
  );
}

function CashFlowReport({ data, format }: { data: any; format: string }) {
  if (!data || !data.sections) return <EmptyReportState reportType="cash_flow" />;
  
  return (
    <div className="space-y-4">
      {data.sections.map((section: any, idx: number) => (
        <ReportSection key={idx} title={section.name}>
          {section.accounts.map((acc: any, accIdx: number) => (
            <ReportLine key={accIdx} label={acc.accountName} amount={acc.amount} />
          ))}
          <ReportLine label={`Net ${section.name}`} amount={section.subtotal} bold />
        </ReportSection>
      ))}
    </div>
  );
}

function ARAgingReport({ data, format }: { data: any; format: string }) {
  if (!data || !data.customers) return <EmptyReportState reportType="ar_aging" />;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4 font-semibold text-sm text-gray-700 border-b pb-2">
        <div>Customer</div>
        <div className="text-right">Current</div>
        <div className="text-right">1-30</div>
        <div className="text-right">31-60</div>
        <div className="text-right">61-90+</div>
      </div>
      
      {data.customers.map((customer: any, idx: number) => (
        <div key={idx} className="grid grid-cols-5 gap-4 text-sm py-2 border-b border-gray-100">
          <div className="font-medium text-gray-900">{customer.customerName}</div>
          <div className="text-right text-gray-700">{formatCurrency(customer.current)}</div>
          <div className="text-right text-gray-700">{formatCurrency(customer.days1to30)}</div>
          <div className="text-right text-amber-600">{formatCurrency(customer.days31to60)}</div>
          <div className="text-right text-red-600">{formatCurrency(customer.days61to90 + customer.days90Plus)}</div>
        </div>
      ))}
      
      <div className="grid grid-cols-5 gap-4 font-bold text-sm pt-4 border-t-2">
        <div>Total Outstanding</div>
        <div className="text-right">{formatCurrency(data.buckets?.find((b: any) => b.category === 'current')?.totalAmount || 0)}</div>
        <div className="text-right">{formatCurrency(data.buckets?.find((b: any) => b.category === '1-30')?.totalAmount || 0)}</div>
        <div className="text-right">{formatCurrency(data.buckets?.find((b: any) => b.category === '31-60')?.totalAmount || 0)}</div>
        <div className="text-right">{formatCurrency(data.buckets?.find((b: any) => b.category === '61-90' || b.category === '90+')?.totalAmount || 0)}</div>
      </div>
    </div>
  );
}

function APAgingReport({ data, format }: { data: any; format: string }) {
  if (!data || !data.vendors) return <EmptyReportState reportType="ap_aging" />;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 font-semibold text-sm text-gray-700 border-b pb-2">
        <div>Vendor</div>
        <div className="text-right">Bills</div>
        <div className="text-right">Amount Due</div>
        <div className="text-right">Total Amount</div>
      </div>
      
      {data.vendors.map((vendor: any, idx: number) => (
        <div key={idx} className="grid grid-cols-4 gap-4 text-sm py-2 border-b border-gray-100">
          <div className="font-medium text-gray-900">{vendor.vendorName}</div>
          <div className="text-right text-gray-700">{vendor.bills.length}</div>
          <div className="text-right text-red-600">{formatCurrency(vendor.totalDue)}</div>
          <div className="text-right text-gray-900">{formatCurrency(vendor.totalAmount)}</div>
        </div>
      ))}
      
      <div className="grid grid-cols-4 gap-4 font-bold text-sm pt-4 border-t-2">
        <div>Total Payable</div>
        <div className="text-right">{data.vendors.reduce((sum: number, v: any) => sum + v.bills.length, 0)}</div>
        <div className="text-right">{formatCurrency(data.totalPayables || data.vendors.reduce((sum: number, v: any) => sum + v.totalDue, 0))}</div>
        <div className="text-right">{formatCurrency(data.vendors.reduce((sum: number, v: any) => sum + v.totalAmount, 0))}</div>
      </div>
    </div>
  );
}

function BudgetVarianceReport({ data, format }: { data: any; format: string }) {
  if (!data || !data.variances) return <EmptyReportState reportType="budget_variance" />;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4 font-semibold text-sm text-gray-700 border-b pb-2">
        <div>Account</div>
        <div className="text-right">Budget</div>
        <div className="text-right">Actual</div>
        <div className="text-right">Variance</div>
        <div className="text-right">% Variance</div>
      </div>
      
      {data.variances.map((variance: any, idx: number) => {
        const varianceAmount = variance.actual - variance.budget;
        const variancePct = variance.budget !== 0 ? (varianceAmount / variance.budget) * 100 : 0;
        const isUnfavorable = varianceAmount < 0;
        
        return (
          <div key={idx} className="grid grid-cols-5 gap-4 text-sm py-2 border-b border-gray-100">
            <div className="font-medium text-gray-900">{variance.accountName}</div>
            <div className="text-right text-gray-700">{formatCurrency(variance.budget)}</div>
            <div className="text-right text-gray-900">{formatCurrency(variance.actual)}</div>
            <div className={`text-right font-medium ${isUnfavorable ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(varianceAmount))}
            </div>
            <div className={`text-right font-medium ${isUnfavorable ? 'text-red-600' : 'text-green-600'}`}>
              {variancePct.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RevenueByServiceReport({ data, format }: { data: any; format: string }) {
  if (!data || !data.breakdowns) return <EmptyReportState reportType="revenue_by_service" />;
  
  const totalRevenue = data.breakdowns.reduce((sum: number, b: any) => sum + b.revenue, 0);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 font-semibold text-sm text-gray-700 border-b pb-2">
        <div>Service Type</div>
        <div className="text-right">Cases</div>
        <div className="text-right">Revenue</div>
        <div className="text-right">% of Total</div>
      </div>
      
      {data.breakdowns.map((breakdown: any, idx: number) => {
        const percentage = totalRevenue > 0 ? (breakdown.revenue / totalRevenue) * 100 : 0;
        
        return (
          <div key={idx} className="grid grid-cols-4 gap-4 text-sm py-2 border-b border-gray-100">
            <div className="font-medium text-gray-900">{breakdown.serviceType}</div>
            <div className="text-right text-gray-700">{breakdown.caseCount}</div>
            <div className="text-right text-gray-900">{formatCurrency(breakdown.revenue)}</div>
            <div className="text-right text-indigo-600 font-medium">{percentage.toFixed(1)}%</div>
          </div>
        );
      })}
      
      <div className="grid grid-cols-4 gap-4 font-bold text-sm pt-4 border-t-2">
        <div>Total</div>
        <div className="text-right">{data.breakdowns.reduce((sum: number, b: any) => sum + b.caseCount, 0)}</div>
        <div className="text-right">{formatCurrency(totalRevenue)}</div>
        <div className="text-right">100.0%</div>
      </div>
    </div>
  );
}

function EmptyReportState({ reportType }: { reportType: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium">No Data Available</p>
      <p className="text-sm mt-2">
        No data found for {REPORT_TYPES.find((r) => r.id === reportType)?.title.toLowerCase()} in the selected period
      </p>
    </div>
  );
}
