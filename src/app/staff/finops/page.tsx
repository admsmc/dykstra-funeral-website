'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, TrendingUp, DollarSign, FileText, Calendar, Download, Plus, Search, CheckCircle2, XCircle, AlertCircle, Building2, Link2, Sparkles, X, Save, Upload, Loader2 } from 'lucide-react';
import { BankReconciliationWorkspace } from '@/components/financial/BankReconciliationWorkspace';
import { JournalEntryModal } from '@/components/financial/JournalEntryModal';
import { trpc } from '@/lib/trpc-client';
import { toast } from 'sonner';

/**
 * General Ledger & Financial Operations Page - Linear/Notion Style
 * Financial operations powered by Go ERP backend
 * 
 * Features:
 * - Trial balance view
 * - Journal entries
 * - Account management
 * - Period close tracking
 * - Financial reports
 */

interface GLAccount {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  status: 'matched' | 'unmatched' | 'pending';
  glMatch?: string;
}

interface GLEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  matched: boolean;
}

interface MatchSuggestion {
  bankTxId: string;
  glEntryId: string;
  confidence: number;
  reason: string;
}

// Mock data removed - now using real API calls

export default function FinOpsPage() {
  const [activeTab, setActiveTab] = useState<'general-ledger' | 'bank-reconciliation'>('general-ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('all');
  const [bankFilter, setBankFilter] = useState<'all' | 'matched' | 'unmatched' | 'pending'>('all');
  const [showJournalEntryModal, setShowJournalEntryModal] = useState(false);
  
  // Bank reconciliation date range
  const bankRecStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    return date;
  }, []);
  const bankRecEndDate = useMemo(() => new Date(), []);
  
  // Current period (for trial balance)
  const currentPeriod = useMemo(() => new Date(), []);
  
  // Fetch trial balance from API
  const { data: trialBalanceData, isLoading: loadingTrialBalance, error: trialBalanceError } = trpc.financial.gl.getTrialBalance.useQuery(
    {
      period: currentPeriod,
      funeralHomeId: 'default',
    },
    {
      enabled: activeTab === 'general-ledger',
    }
  );
  
  // Fetch bank reconciliation data
  const { data: bankTransactionsData, isLoading: loadingBankTxs } = trpc.financial.bankRec.getBankTransactions.useQuery(
    {
      accountId: 'primary-checking', // Default account
      startDate: bankRecStartDate,
      endDate: bankRecEndDate,
      includeCleared: true,
    },
    {
      enabled: activeTab === 'bank-reconciliation',
    }
  );
  
  const { data: glEntriesData, isLoading: loadingGLEntries } = trpc.financial.bankRec.getGLEntries.useQuery(
    {
      accountId: 'primary-checking',
      startDate: bankRecStartDate,
      endDate: bankRecEndDate,
      includeMatched: false,
    },
    {
      enabled: activeTab === 'bank-reconciliation',
    }
  );
  
  const { data: matchSuggestionsData } = trpc.financial.bankRec.getMatchSuggestions.useQuery(
    {
      accountId: 'primary-checking',
      threshold: 0.8,
    },
    {
      enabled: activeTab === 'bank-reconciliation',
    }
  );

  // Map trial balance data to GLAccount format
  const accounts: GLAccount[] = useMemo(() => {
    if (!trialBalanceData?.accounts) {
      return [];
    }
    // Map API response (GoTrialBalanceAccount) to GLAccount format
    return trialBalanceData.accounts.map((acc: any) => ({
      code: acc.accountNumber,
      name: acc.accountName,
      type: inferAccountType(acc.accountNumber), // Infer from account number
      debit: acc.debitBalance,
      credit: acc.creditBalance,
      balance: acc.debitBalance - acc.creditBalance,
    }));
  }, [trialBalanceData]);
  
  // Helper function to infer account type from account number
  function inferAccountType(accountNumber: string): string {
    const firstDigit = accountNumber.charAt(0);
    if (firstDigit === '1') return 'Asset';
    if (firstDigit === '2') return 'Liability';
    if (firstDigit === '3') return 'Equity';
    if (firstDigit === '4') return 'Revenue';
    if (firstDigit === '5' || firstDigit === '6') return 'Expense';
    return 'Other';
  }

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           account.code.includes(searchQuery);
      const matchesFilter = accountFilter === 'all' || account.type.toLowerCase() === accountFilter;
      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchQuery, accountFilter]);

  // Use fetched bank transactions (default to empty array if loading)
  const bankTransactions: BankTransaction[] = useMemo(() => {
    if (!bankTransactionsData) return [];
    return bankTransactionsData.map((tx: any) => ({
      ...tx,
      status: tx.status || 'unmatched',
    }));
  }, [bankTransactionsData]);
  
  const glEntries: GLEntry[] = useMemo(() => {
    if (!glEntriesData) return [];
    return glEntriesData.map((entry: any) => ({
      ...entry,
      matched: entry.matched || false,
    }));
  }, [glEntriesData]);
  
  const matchSuggestions: MatchSuggestion[] = matchSuggestionsData || [];

  const filteredBankTransactions = bankTransactions.filter(tx => {
    const matchesFilter = bankFilter === 'all' || tx.status === bankFilter;
    return matchesFilter;
  });

  // Calculate totals from accounts
  const totalAssets = useMemo(() => 
    accounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );
  const totalLiabilities = useMemo(() => 
    Math.abs(accounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + a.balance, 0)),
    [accounts]
  );
  const totalRevenue = useMemo(() => 
    Math.abs(accounts.filter(a => a.type === 'Revenue').reduce((sum, a) => sum + a.balance, 0)),
    [accounts]
  );
  const totalExpenses = useMemo(() => 
    accounts.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  const bankBalance = useMemo(() => {
    return bankTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [bankTransactions]);
  
  const glBalance = useMemo(() => {
    return glEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [glEntries]);
  
  const matchedTransactions = bankTransactions.filter(tx => tx.status === 'matched').length;
  const unmatchedTransactions = bankTransactions.filter(tx => tx.status === 'unmatched').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">General Ledger</h1>
        <p className="text-lg text-gray-600">Financial operations and account management</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general-ledger')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'general-ledger'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          General Ledger
        </button>
        <button
          onClick={() => setActiveTab('bank-reconciliation')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'bank-reconciliation'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Bank Reconciliation
        </button>
      </div>

      {/* Stats Cards - Conditional based on tab */}
      {activeTab === 'general-ledger' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard icon={Book} label="Total Assets" value={`$${(totalAssets / 1000).toFixed(0)}K`} color="indigo" delay={0} />
          <StatsCard icon={FileText} label="Liabilities" value={`$${(totalLiabilities / 1000).toFixed(0)}K`} color="red" delay={0.1} />
          <StatsCard icon={TrendingUp} label="Revenue YTD" value={`$${(totalRevenue / 1000).toFixed(0)}K`} color="green" delay={0.2} />
          <StatsCard icon={DollarSign} label="Expenses YTD" value={`$${(totalExpenses / 1000).toFixed(0)}K`} color="amber" delay={0.3} />
        </div>
      )}

      {activeTab === 'bank-reconciliation' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard icon={Building2} label="Bank Balance" value={`$${(bankBalance / 1000).toFixed(1)}K`} color="indigo" delay={0} />
          <StatsCard icon={Book} label="GL Balance" value={`$${(glBalance / 1000).toFixed(0)}K`} color="blue" delay={0.1} />
          <StatsCard icon={CheckCircle2} label="Matched" value={matchedTransactions.toString()} color="green" delay={0.2} />
          <StatsCard icon={AlertCircle} label="Unmatched" value={unmatchedTransactions.toString()} color="amber" delay={0.3} />
        </div>
      )}

      {/* General Ledger Content */}
      {activeTab === 'general-ledger' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Trial Balance - December 2024</h2>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="asset">Assets</option>
              <option value="liability">Liabilities</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expenses</option>
            </select>

            <button 
              onClick={() => setShowJournalEntryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Journal Entry
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loadingTrialBalance && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading trial balance...</p>
          </div>
        )}

        {/* Error State */}
        {trialBalanceError && (
          <div className="flex flex-col items-center justify-center py-12 text-red-600">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="font-medium mb-2">Failed to load trial balance</p>
            <p className="text-sm text-gray-600">Using cached data. Please try again later.</p>
          </div>
        )}

        {/* Empty State */}
        {!loadingTrialBalance && !trialBalanceError && filteredAccounts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Book className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium mb-2">No accounts found</p>
            <p className="text-sm text-gray-500">{searchQuery || accountFilter !== 'all' ? 'Try adjusting your filters' : 'Trial balance is empty'}</p>
          </div>
        )}

        {/* Account List */}
        {!loadingTrialBalance && filteredAccounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Account Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Account Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Debit</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Credit</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account, index) => (
                <motion.tr
                  key={account.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="py-3 px-4 text-sm font-medium text-indigo-600">{account.code}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{account.name}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      account.type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                      account.type === 'Liability' ? 'bg-red-100 text-red-800' :
                      account.type === 'Equity' ? 'bg-purple-100 text-purple-800' :
                      account.type === 'Revenue' ? 'bg-green-100 text-green-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {account.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">${account.debit.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">${account.credit.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${
                    account.balance >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    ${Math.abs(account.balance).toLocaleString()}
                  </td>
                </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </motion.div>
      )}

      {/* Bank Reconciliation Content */}
      {activeTab === 'bank-reconciliation' && (
        <BankReconciliationWorkspace
          bankTransactions={bankTransactions}
          glEntries={glEntries}
          suggestions={matchSuggestions}
          bankBalance={bankBalance}
          glBalance={glBalance}
          isLoading={loadingBankTxs || loadingGLEntries}
        />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          icon={Book}
          title="Financial Statements"
          description="P&L, balance sheet, cash flow"
          delay={0.6}
          href="/staff/finops/reports"
        />
        <ActionCard
          icon={Calendar}
          title="Period Close"
          description="Month-end and year-end close"
          delay={0.65}
          href="/staff/finops/period-close"
        />
        <ActionCard
          icon={Download}
          title="Export Reports"
          description="Download GL reports and exports"
          delay={0.7}
          href="/staff/finops/reports"
        />
      </div>

      {/* Journal Entry Modal */}
      <JournalEntryModal
        isOpen={showJournalEntryModal}
        onClose={() => setShowJournalEntryModal(false)}
        onSuccess={() => {
          // Refetch trial balance after successful posting
          toast.success('Trial balance will be updated');
        }}
      />
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, delay }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

function ActionCard({ icon: Icon, title, description, delay, href }: any) {
  const content = (
    <>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </>
  );

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition"
    >
      {content}
    </motion.div>
  );

  if (href) {
    return <a href={href}>{card}</a>;
  }

  return card;
}
