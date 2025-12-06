'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Edit2, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

type Period = 'Q1-2024' | 'Q2-2024' | 'Q3-2024' | 'Q4-2024';

export default function BudgetManagementPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Q4-2024');
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  // Map quarter label to a representative period-end Date for the budget API
  const periodDateMap: Record<Period, Date> = {
    'Q1-2024': new Date('2024-03-31'),
    'Q2-2024': new Date('2024-06-30'),
    'Q3-2024': new Date('2024-09-30'),
    'Q4-2024': new Date('2024-12-31'),
  };
  const selectedPeriodDate = periodDateMap[selectedPeriod];

  const { data: variance, isLoading } = trpc.financial.budget.getVariance.useQuery({
    period: selectedPeriodDate,
    funeralHomeId: 'fh-001',
  });

  const stats = variance ? {
    totalBudget: variance.accounts.reduce((sum, a) => sum + a.budgetAmount, 0),
    totalActual: variance.accounts.reduce((sum, a) => sum + a.actualAmount, 0),
    favorableVariances: variance.accounts.filter(a => a.variance > 0).length,
    unfavorableVariances: variance.accounts.filter(a => a.variance < 0).length,
  } : null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
        <p className="text-gray-600 mt-2">Monitor budget vs. actual performance and adjust budgets</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex items-center gap-3">
        <Calendar className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Period:</span>
        <div className="flex gap-2">
          {(['Q1-2024', 'Q2-2024', 'Q3-2024', 'Q4-2024'] as Period[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${stats.totalBudget.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Actual</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${stats.totalActual.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favorable</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.favorableVariances}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unfavorable</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.unfavorableVariances}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Variance Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Budget vs. Actual</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading variance data...</div>
        ) : variance?.accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No budget data for this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variance?.accounts.map((account) => (
                  <motion.tr
                    key={account.accountNumber}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.accountNumber}
                        </div>
                        <div className="text-sm text-gray-500">{account.accountName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ${account.budgetAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ${account.actualAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span
                        className={`font-medium ${
                          account.variance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {account.variance >= 0 ? '+' : ''}${account.variance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {account.variancePercent >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span
                          className={`font-medium ${
                            account.variancePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {account.variancePercent >= 0 ? '+' : ''}
                          {account.variancePercent.toFixed(1)}%
                        </span>
                        {Math.abs(account.variancePercent) > 20 && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setEditingAccount(account.accountNumber)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Budget Modal */}
      {editingAccount && (
        <EditBudgetModal
          accountNumber={editingAccount}
          period={selectedPeriod}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  );
}

function EditBudgetModal({
  accountNumber,
  period,
  onClose,
}: {
  accountNumber: string;
  period: Period;
  onClose: () => void;
}) {
  const [amounts, setAmounts] = useState({
    'Q1-2024': 50000,
    'Q2-2024': 55000,
    'Q3-2024': 52000,
    'Q4-2024': 60000,
  });

  const utils = trpc.useUtils();
  const updateBudget = trpc.financial.budget.updateAccount.useMutation({
    onSuccess: () => {
      utils.financial.budget.getVariance.invalidate();
      onClose();
    },
  });

  const handleSave = () => {
    updateBudget.mutate({
      budgetId: 'budget-2024',
      accountId: accountNumber,
      periods: Object.entries(amounts).map(([period, amount]) => ({
        period,
        amount,
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Budget - Account {accountNumber}
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(amounts).map(([period, amount]) => (
              <div key={period} className="flex items-center gap-4">
                <label className="w-24 text-sm font-medium text-gray-700">{period}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [period]: Number(e.target.value) }))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateBudget.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {updateBudget.isPending ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
