'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  Search,
  Paperclip,
  Upload,
  Star,
  DollarSign,
} from 'lucide-react';
import { trpc } from '@/lib/trpc-client';
import { toast } from 'sonner';

interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Mock GL accounts for picker (in production, fetch from API)
const MOCK_GL_ACCOUNTS = [
  { id: '1', code: '1000', name: 'Cash - Operating', type: 'Asset', favorite: true },
  { id: '2', code: '1200', name: 'Accounts Receivable', type: 'Asset', favorite: true },
  { id: '3', code: '1400', name: 'Inventory - Caskets', type: 'Asset', favorite: false },
  { id: '4', code: '2000', name: 'Accounts Payable', type: 'Liability', favorite: true },
  { id: '5', code: '3000', name: 'Owner Equity', type: 'Equity', favorite: false },
  { id: '6', code: '4000', name: 'Service Revenue', type: 'Revenue', favorite: true },
  { id: '7', code: '5000', name: 'Cost of Services', type: 'Expense', favorite: false },
  { id: '8', code: '6000', name: 'Operating Expenses', type: 'Expense', favorite: true },
  { id: '9', code: '6100', name: 'Utilities Expense', type: 'Expense', favorite: false },
  { id: '10', code: '6200', name: 'Marketing Expense', type: 'Expense', favorite: false },
];

export function JournalEntryModal({ isOpen, onClose, onSuccess }: JournalEntryModalProps) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<JournalEntryLine[]>([
    {
      id: '1',
      accountId: '',
      accountCode: '',
      accountName: '',
      debit: 0,
      credit: 0,
      description: '',
    },
    {
      id: '2',
      accountId: '',
      accountCode: '',
      accountName: '',
      debit: 0,
      credit: 0,
      description: '',
    },
  ]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  // Post journal entry mutation
  const postJournalEntry = trpc.financial.gl.postJournalEntry.useMutation({
    onSuccess: () => {
      toast.success(saveAsDraft ? 'Journal entry saved as draft' : 'Journal entry posted successfully');
      handleClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to post journal entry: ${error.message}`);
    },
  });

  // Calculate totals
  const totals = useMemo(() => {
    const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const balanced = Math.abs(totalDebits - totalCredits) < 0.01;
    const variance = totalDebits - totalCredits;

    return { totalDebits, totalCredits, balanced, variance };
  }, [lines]);

  // Filter accounts for picker
  const filteredAccounts = useMemo(() => {
    if (!searchQuery) {
      // Show favorites first when no search
      return MOCK_GL_ACCOUNTS.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    }

    return MOCK_GL_ACCOUNTS.filter(
      (account) =>
        account.code.includes(searchQuery) ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleAddLine = () => {
    const newLine: JournalEntryLine = {
      id: Date.now().toString(),
      accountId: '',
      accountCode: '',
      accountName: '',
      debit: 0,
      credit: 0,
      description: '',
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 2) {
      toast.error('Journal entry must have at least 2 lines');
      return;
    }
    setLines(lines.filter((line) => line.id !== id));
  };

  const handleLineChange = (id: string, field: keyof JournalEntryLine, value: any) => {
    setLines(
      lines.map((line) => {
        if (line.id === id) {
          // If debit is entered, clear credit and vice versa
          if (field === 'debit' && value > 0) {
            return { ...line, debit: value, credit: 0 };
          }
          if (field === 'credit' && value > 0) {
            return { ...line, credit: value, debit: 0 };
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  const handleSelectAccount = (lineId: string, account: typeof MOCK_GL_ACCOUNTS[0]) => {
    handleLineChange(lineId, 'accountId', account.id);
    handleLineChange(lineId, 'accountCode', account.code);
    handleLineChange(lineId, 'accountName', account.name);
    setShowAccountPicker(null);
    setSearchQuery('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
    toast.success(`${files.length} file(s) attached`);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!entryDate) {
      toast.error('Entry date is required');
      return;
    }

    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (lines.some((line) => !line.accountId)) {
      toast.error('All lines must have an account selected');
      return;
    }

    if (!totals.balanced) {
      toast.error('Journal entry must be balanced (debits must equal credits)');
      return;
    }

    if (lines.every((line) => line.debit === 0 && line.credit === 0)) {
      toast.error('Journal entry must have at least one non-zero amount');
      return;
    }

    // Submit to API
    postJournalEntry.mutate({
      entryDate: new Date(entryDate),
      description,
      funeralHomeId: 'default',
      lines: lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description || '',
      })),
    });
  };

  const handleClose = () => {
    setEntryDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setNotes('');
    setLines([
      {
        id: '1',
        accountId: '',
        accountCode: '',
        accountName: '',
        debit: 0,
        credit: 0,
        description: '',
      },
      {
        id: '2',
        accountId: '',
        accountCode: '',
        accountName: '',
        debit: 0,
        credit: 0,
        description: '',
      },
    ]);
    setAttachments([]);
    setShowAccountPicker(null);
    setSearchQuery('');
    setSaveAsDraft(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Create Journal Entry</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Post manual adjustments to the general ledger
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Entry Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Accrual for December utilities"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Journal Entry Lines */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Entry Lines</h3>
                  <button
                    onClick={handleAddLine}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </div>

                {/* Lines Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          Account
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          Description
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                          Debit
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                          Credit
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 w-20">
                          
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => (
                        <tr key={line.id} className="border-t border-gray-200">
                          <td className="py-3 px-4">
                            <div className="relative">
                              <button
                                onClick={() => setShowAccountPicker(line.id)}
                                className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              >
                                {line.accountName ? (
                                  <div>
                                    <span className="font-medium text-indigo-600">
                                      {line.accountCode}
                                    </span>{' '}
                                    - {line.accountName}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Select account...</span>
                                )}
                              </button>

                              {/* Account Picker Dropdown */}
                              {showAccountPicker === line.id && (
                                <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                                  <div className="p-3 border-b border-gray-200">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search accounts..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        autoFocus
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-64 overflow-y-auto">
                                    {filteredAccounts.map((account) => (
                                      <button
                                        key={account.id}
                                        onClick={() => handleSelectAccount(line.id, account)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition flex items-center justify-between group"
                                      >
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            <span className="text-indigo-600">{account.code}</span> -{' '}
                                            {account.name}
                                          </div>
                                          <div className="text-xs text-gray-500">{account.type}</div>
                                        </div>
                                        {account.favorite && (
                                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) =>
                                handleLineChange(line.id, 'description', e.target.value)
                              }
                              placeholder="Line description..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                step="0.01"
                                value={line.debit || ''}
                                onChange={(e) =>
                                  handleLineChange(line.id, 'debit', parseFloat(e.target.value) || 0)
                                }
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-right"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                step="0.01"
                                value={line.credit || ''}
                                onChange={(e) =>
                                  handleLineChange(line.id, 'credit', parseFloat(e.target.value) || 0)
                                }
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-right"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {lines.length > 2 && (
                              <button
                                onClick={() => handleRemoveLine(line.id)}
                                className="text-red-600 hover:text-red-800 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Totals Row */}
                      <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                        <td colSpan={2} className="py-3 px-4 text-right text-gray-900">
                          Totals:
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          ${totals.totalDebits.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          ${totals.totalCredits.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Balance Indicator */}
                <div className="mt-4 flex items-center justify-end gap-3">
                  {totals.balanced ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Entry is balanced</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">
                        Out of balance by ${Math.abs(totals.variance).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes or explanations..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload receipts or supporting documents
                    </span>
                    <span className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</span>
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsDraft}
                  onChange={(e) => setSaveAsDraft(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Save as draft (don't post yet)</span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!totals.balanced || postJournalEntry.isPending}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {postJournalEntry.isPending
                    ? 'Posting...'
                    : saveAsDraft
                    ? 'Save Draft'
                    : 'Post Entry'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
