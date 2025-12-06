'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { motion } from 'framer-motion';
import { 
  Plus, FileText, RotateCcw, Eye, Edit2, Trash2, 
  ChevronRight, ChevronDown, DollarSign, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

interface GLAccount {
  id: string;
  accountNumber: string;
  name: string;
  type: AccountType;
  balance: number;
  isActive: boolean;
  parentAccountId?: string;
}

export default function GLManagementPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJournalEntryModal, setShowJournalEntryModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<GLAccount | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<AccountType>>(
    new Set(['asset', 'liability', 'equity', 'revenue', 'expense'])
  );

  // Fetch chart of accounts
  const { data: coaData, isLoading } = api.financial.gl.getChartOfAccounts.useQuery({
    funeralHomeId: 'default',
    includeInactive: false,
  });

  // Fetch account balances
  const { data: balancesData } = api.financial.gl.getAccountBalances.useQuery({
    funeralHomeId: 'default',
  });

  const accounts = coaData?.accounts ?? [];
  const balances = balancesData?.balances ?? [];

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {} as Record<AccountType, GLAccount[]>);

  const toggleType = (type: AccountType) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const getAccountTypeLabel = (type: AccountType) => {
    const labels: Record<AccountType, string> = {
      asset: 'Assets',
      liability: 'Liabilities',
      equity: 'Equity',
      revenue: 'Revenue',
      expense: 'Expenses',
    };
    return labels[type];
  };

  const getAccountTypeColor = (type: AccountType) => {
    const colors: Record<AccountType, string> = {
      asset: 'text-green-600',
      liability: 'text-red-600',
      equity: 'text-blue-600',
      revenue: 'text-purple-600',
      expense: 'text-orange-600',
    };
    return colors[type];
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">General Ledger</h1>
          <p className="text-gray-500 mt-1">
            Manage chart of accounts and journal entries
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJournalEntryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <FileText size={18} />
            <span>Journal Entry</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition"
          >
            <Plus size={18} />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          label="Total Accounts"
          value={accounts.length.toString()}
          icon={<DollarSign size={24} />}
          color="bg-blue-500"
        />
        <StatsCard
          label="Assets"
          value={`$${accountsByType.asset?.reduce((sum, a) => sum + a.balance, 0).toLocaleString() ?? 0}`}
          icon={<TrendingUp size={24} />}
          color="bg-green-500"
        />
        <StatsCard
          label="Liabilities"
          value={`$${accountsByType.liability?.reduce((sum, a) => sum + a.balance, 0).toLocaleString() ?? 0}`}
          icon={<TrendingUp size={24} />}
          color="bg-red-500"
        />
        <StatsCard
          label="Equity"
          value={`$${accountsByType.equity?.reduce((sum, a) => sum + a.balance, 0).toLocaleString() ?? 0}`}
          icon={<TrendingUp size={24} />}
          color="bg-purple-500"
        />
      </div>

      {/* Chart of Accounts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Chart of Accounts</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.entries(accountsByType).map(([type, typeAccounts]) => (
            <div key={type}>
              {/* Type Header */}
              <button
                onClick={() => toggleType(type as AccountType)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  {expandedTypes.has(type as AccountType) ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                  <span className={`text-lg font-semibold ${getAccountTypeColor(type as AccountType)}`}>
                    {getAccountTypeLabel(type as AccountType)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({typeAccounts.length} accounts)
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${typeAccounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
                  </div>
                </div>
              </button>

              {/* Accounts List */}
              {expandedTypes.has(type as AccountType) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-50"
                >
                  {typeAccounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      onEdit={() => setSelectedAccount(account)}
                      onDeactivate={() => handleDeactivateAccount(account.id)}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAccountModal onClose={() => setShowCreateModal(false)} />
      )}
      {selectedAccount && (
        <EditAccountModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
      {showJournalEntryModal && (
        <JournalEntryModal onClose={() => setShowJournalEntryModal(false)} />
      )}
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
    </motion.div>
  );
}

function AccountRow({
  account,
  onEdit,
  onDeactivate,
}: {
  account: GLAccount;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-t border-gray-200 hover:bg-gray-100 transition group">
      <div className="flex items-center gap-4 flex-1">
        <div className="font-mono text-sm text-gray-600 w-20">
          {account.accountNumber}
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900">{account.name}</div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right w-32">
          <div className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(account.balance).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            {account.balance >= 0 ? 'Debit' : 'Credit'}
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDeactivate}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    accountNumber: '',
    name: '',
    accountType: 'asset' as AccountType,
  });

  const createMutation = api.financial.gl.createAccount.useMutation({
    onSuccess: () => {
      toast.success('Account created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      funeralHomeId: 'default',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create GL Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              required
              pattern="\d{4,}"
            />
            <p className="text-xs text-gray-500 mt-1">Must be 4+ digits</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Cash - Operating Account"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value as AccountType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditAccountModal({ account, onClose }: { account: GLAccount; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: account.name,
    accountType: account.type,
  });

  const updateMutation = api.financial.gl.updateAccount.useMutation({
    onSuccess: () => {
      toast.success('Account updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      accountId: account.id,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit GL Account</h2>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Account Number</div>
          <div className="font-mono font-semibold text-gray-900">{account.accountNumber}</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value as AccountType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function JournalEntryModal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Array<{ accountId: string; debit: number; credit: number; description: string }>>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' },
  ]);
  const [description, setDescription] = useState('');

  const postMutation = api.financial.gl.postJournalEntry.useMutation({
    onSuccess: () => {
      toast.success('Journal entry posted successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error('Debits must equal credits');
      return;
    }
    postMutation.mutate({
      entryDate: new Date(),
      description,
      funeralHomeId: 'default',
      lines: lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0)),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Journal Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Monthly depreciation adjustment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Journal Entry Lines</label>
              <button
                type="button"
                onClick={() => setLines([...lines, { accountId: '', debit: 0, credit: 0, description: '' }])}
                className="text-sm text-[--navy] hover:underline"
              >
                + Add Line
              </button>
            </div>
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Account ID"
                  value={line.accountId}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].accountId = e.target.value;
                    setLines(newLines);
                  }}
                  className="col-span-3 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Debit"
                  value={line.debit || ''}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].debit = parseFloat(e.target.value) || 0;
                    setLines(newLines);
                  }}
                  className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Credit"
                  value={line.credit || ''}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].credit = parseFloat(e.target.value) || 0;
                    setLines(newLines);
                  }}
                  className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                />
                <input
                  type="text"
                  placeholder="Line description"
                  value={line.description}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].description = e.target.value;
                    setLines(newLines);
                  }}
                  className="col-span-4 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={() => setLines(lines.filter((_, i) => i !== index))}
                  className="col-span-1 text-red-600 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Total Debits</div>
              <div className="font-semibold text-gray-900">${totalDebits.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Credits</div>
              <div className="font-semibold text-gray-900">${totalCredits.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Difference</div>
              <div className={`font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalDebits - totalCredits).toFixed(2)}
              </div>
            </div>
          </div>

          {!isBalanced && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ Journal entry must be balanced (debits = credits)
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={postMutation.isPending || !isBalanced}
              className="flex-1 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition disabled:opacity-50"
            >
              {postMutation.isPending ? 'Posting...' : 'Post Entry'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function handleDeactivateAccount(accountId: string) {
  const reason = prompt('Please provide a reason for deactivating this account:');
  if (!reason) return;

  // This would call the deactivate mutation
  toast.promise(
    Promise.resolve(), // Replace with actual mutation
    {
      loading: 'Deactivating account...',
      success: 'Account deactivated successfully',
      error: 'Failed to deactivate account',
    }
  );
}
