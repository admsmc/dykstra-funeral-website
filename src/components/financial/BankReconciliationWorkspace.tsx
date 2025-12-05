'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Link2,
  Sparkles,
  X,
  Save,
  Download,
  Upload,
  ArrowRight,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc-client';

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

interface BankReconciliationWorkspaceProps {
  bankTransactions: BankTransaction[];
  glEntries: GLEntry[];
  suggestions: MatchSuggestion[];
  bankBalance: number;
  glBalance: number;
  isLoading?: boolean;
}

export function BankReconciliationWorkspace({
  bankTransactions: initialBankTxs,
  glEntries: initialGLEntries,
  suggestions,
  bankBalance: initialBankBalance,
  glBalance: initialGLBalance,
  isLoading,
}: BankReconciliationWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bankTransactions, setBankTransactions] = useState(initialBankTxs);
  const [glEntries, setGLEntries] = useState(initialGLEntries);
  const [matches, setMatches] = useState<Array<{ bankId: string; glId: string }>>([]);
  const [draggedItem, setDraggedItem] = useState<{ type: 'bank' | 'gl'; id: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  
  // Import bank statement mutation
  const importStatementMutation = trpc.financial.bankRec.importStatement.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully imported ${result.transactionsImported} transactions`);
      // Refresh data (would trigger parent refetch in real implementation)
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const unmatchedBankTxs = bankTransactions.filter(tx => tx.status === 'unmatched');
  const unmatchedGLEntries = glEntries.filter(entry => !entry.matched);
  const matchedCount = matches.length + bankTransactions.filter(tx => tx.status === 'matched').length;

  const handleDragStart = (type: 'bank' | 'gl', id: string) => {
    setDraggedItem({ type, id });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (targetType: 'bank' | 'gl', targetId: string) => {
    if (!draggedItem || draggedItem.type === targetType) {
      return;
    }

    const bankId = draggedItem.type === 'bank' ? draggedItem.id : targetId;
    const glId = draggedItem.type === 'gl' ? draggedItem.id : targetId;

    handleMatch(bankId, glId);
  };

  const handleMatch = (bankId: string, glId: string) => {
    // Check if amounts match
    const bankTx = bankTransactions.find(tx => tx.id === bankId);
    const glEntry = glEntries.find(entry => entry.id === glId);

    if (!bankTx || !glEntry) return;

    if (Math.abs(bankTx.amount) !== Math.abs(glEntry.amount)) {
      toast.error('Amounts do not match. Create an adjustment entry instead.');
      return;
    }

    // Create match
    setMatches([...matches, { bankId, glId }]);

    // Update statuses
    setBankTransactions(
      bankTransactions.map(tx =>
        tx.id === bankId ? { ...tx, status: 'matched' as const, glMatch: glId } : tx
      )
    );
    setGLEntries(
      glEntries.map(entry => (entry.id === glId ? { ...entry, matched: true } : entry))
    );

    toast.success('Transaction matched successfully');
  };

  const handleUnmatch = (bankId: string, glId: string) => {
    setMatches(matches.filter(m => !(m.bankId === bankId && m.glId === glId)));

    setBankTransactions(
      bankTransactions.map(tx =>
        tx.id === bankId ? { ...tx, status: 'unmatched' as const, glMatch: undefined } : tx
      )
    );
    setGLEntries(
      glEntries.map(entry => (entry.id === glId ? { ...entry, matched: false } : entry))
    );

    toast.info('Match removed');
  };

  const handleApplySuggestion = (suggestion: MatchSuggestion) => {
    handleMatch(suggestion.bankTxId, suggestion.glEntryId);
  };

  const handleBulkApplySuggestions = () => {
    suggestions.forEach(suggestion => {
      handleMatch(suggestion.bankTxId, suggestion.glEntryId);
    });
    toast.success(`Applied ${suggestions.length} suggested matches`);
  };
  
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      // Call import mutation
      importStatementMutation.mutate({
        accountId: 'primary-checking',
        fileContent: text,
        fileType: 'csv',
      });
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const variance = initialBankBalance - initialGLBalance;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="ml-3 text-gray-600">Loading reconciliation data...</p>
          </div>
        )}
        
        {!isLoading && (
          <>
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Bank Reconciliation Workspace</h2>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdjustmentModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                >
                  <FileText className="w-4 h-4" />
                  Create Adjustment
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importStatementMutation.isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {importStatementMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {importStatementMutation.isLoading ? 'Importing...' : 'Import Bank File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.ofx,.qfx"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </div>
            </div>

        {/* Reconciliation Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Bank Balance</p>
            <p className="text-2xl font-bold text-gray-900">${initialBankBalance.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">GL Balance</p>
            <p className="text-2xl font-bold text-gray-900">${initialGLBalance.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Variance</p>
            <p
              className={`text-2xl font-bold ${
                variance === 0 ? 'text-green-600' : 'text-amber-600'
              }`}
            >
              ${Math.abs(variance).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Matched</p>
            <p className="text-2xl font-bold text-green-600">
              {matchedCount} / {bankTransactions.length}
            </p>
          </div>
        </div>

        {/* AI Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {suggestions.length} Smart Match{suggestions.length > 1 ? 'es' : ''} Found
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    AI-powered matching has found {suggestions.length} potential match
                    {suggestions.length > 1 ? 'es' : ''} based on amount and description similarity.
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => {
                      const bankTx = bankTransactions.find(tx => tx.id === suggestion.bankTxId);
                      const glEntry = glEntries.find(entry => entry.id === suggestion.glEntryId);

                      if (!bankTx || !glEntry) return null;

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex-1 text-sm">
                            <div className="font-medium text-gray-900">{bankTx.description}</div>
                            <div className="text-gray-600">{glEntry.description}</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            ${Math.abs(bankTx.amount).toLocaleString()}
                          </div>
                          <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {Math.round(suggestion.confidence * 100)}% match
                          </div>
                          <button
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Apply
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkApplySuggestions}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 bg-white rounded-lg border border-indigo-200"
                >
                  Apply All
                </button>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Matching Workspace */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Bank Transactions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Bank Transactions ({unmatchedBankTxs.length} unmatched)
              </h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unmatchedBankTxs.map(tx => (
                <motion.div
                  key={tx.id}
                  draggable
                  onDragStart={() => handleDragStart('bank', tx.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop('bank', tx.id)}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 border rounded-lg cursor-move transition ${
                    draggedItem?.id === tx.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                      <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        tx.amount >= 0 ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      ${Math.abs(tx.amount).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))}
              {unmatchedBankTxs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">All bank transactions matched</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: GL Entries */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                GL Entries ({unmatchedGLEntries.length} unmatched)
              </h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unmatchedGLEntries.map(entry => (
                <motion.div
                  key={entry.id}
                  draggable
                  onDragStart={() => handleDragStart('gl', entry.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop('gl', entry.id)}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 border rounded-lg cursor-move transition ${
                    draggedItem?.id === entry.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{entry.description}</div>
                      <div className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        entry.amount >= 0 ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      ${Math.abs(entry.amount).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))}
              {unmatchedGLEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">All GL entries matched</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Matched Transactions */}
        {matches.length > 0 && (
          <div className="bg-white border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Matched Transactions ({matches.length})
            </h3>
            <div className="space-y-2">
              {matches.map((match, index) => {
                const bankTx = bankTransactions.find(tx => tx.id === match.bankId);
                const glEntry = glEntries.find(entry => entry.id === match.glId);

                if (!bankTx || !glEntry) return null;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bankTx.description}</div>
                        <div className="text-xs text-gray-500">Bank: {new Date(bankTx.date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{glEntry.description}</div>
                        <div className="text-xs text-gray-500">GL: {new Date(glEntry.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      ${Math.abs(bankTx.amount).toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleUnmatch(match.bankId, match.glId)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Unmatch
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">How to reconcile:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Drag and drop bank transactions to GL entries to match them</li>
                <li>Click "Apply" on AI suggestions to auto-match with high confidence</li>
                <li>Upload a CSV bank statement using "Import Bank File"</li>
                <li>Create adjustment entries for discrepancies that cannot be matched</li>
                <li>All transactions must be matched or explained before completing reconciliation</li>
              </ul>
            </div>
          </div>
        </div>
          </>
        )}
      </motion.div>

      {/* Adjustment Modal */}
      <AnimatePresence>
        {showAdjustmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAdjustmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create Adjustment Entry</h3>
                <button
                  onClick={() => setShowAdjustmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Type
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Bank Fee</option>
                    <option>Interest Income</option>
                    <option>NSF/Returned Check</option>
                    <option>Error Correction</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explain the adjustment..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdjustmentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Create Adjustment
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
