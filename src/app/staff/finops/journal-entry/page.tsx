'use client';

import { useState } from 'react';
import { Calendar, Save, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { JournalEntryLines, type JournalEntryLine } from '@/components/JournalEntryLines';
import { api } from '@/trpc/react';

/**
 * Manual Journal Entry Page
 * 
 * Allows staff to create manual journal entries with:
 * - Entry date selection
 * - Multi-line debit/credit entry
 * - Real-time balance validation
 * - Draft save capability
 * - Integration with financial.router.ts
 */

export default function ManualJournalEntryPage() {
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalEntryLine[]>([
    {
      id: `line-1-${Date.now()}`,
      accountId: '',
      account: null,
      debit: 0,
      credit: 0,
      description: '',
    },
    {
      id: `line-2-${Date.now()}`,
      accountId: '',
      account: null,
      debit: 0,
      credit: 0,
      description: '',
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // tRPC mutation
  const postJournalEntry = api.financial.gl.postJournalEntry.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(
        `Journal entry #${data.journalEntryId} posted successfully! Debits: $${data.totalDebits.toFixed(2)}, Credits: $${data.totalCredits.toFixed(2)}`
      );
      // Reset form
      setDescription('');
      setLines([
        {
          id: `line-1-${Date.now()}`,
          accountId: '',
          account: null,
          debit: 0,
          credit: 0,
          description: '',
        },
        {
          id: `line-2-${Date.now()}`,
          accountId: '',
          account: null,
          debit: 0,
          credit: 0,
          description: '',
        },
      ]);
      setErrors({});
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01; // Within $0.01 tolerance

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate entry date
    if (!entryDate) {
      newErrors.entryDate = 'Entry date is required';
    }

    // Validate description
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate lines
    if (lines.length < 2) {
      newErrors.general = 'Minimum 2 lines required';
    }

    lines.forEach((line, index) => {
      if (!line.accountId) {
        newErrors[`lines.${index}.accountId`] = 'Account is required';
      }
      if (line.debit === 0 && line.credit === 0) {
        newErrors[`lines.${index}.debit`] = 'Enter an amount in debit or credit';
      }
    });

    // Validate balance
    if (!isBalanced) {
      newErrors.general = `Entry is out of balance by $${difference.toFixed(2)}. Debits must equal credits.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Transform lines to API format
    const apiLines = lines.map((line) => ({
      accountId: line.accountId,
      debit: line.debit,
      credit: line.credit,
      description: line.description || undefined,
    }));

    // Call API
    postJournalEntry.mutate({
      entryDate: new Date(entryDate),
      description,
      funeralHomeId: 'fh-001', // TODO: Get from auth context
      lines: apiLines,
    });
  };

  // Handle save draft (future feature)
  const handleSaveDraft = () => {
    // TODO: Implement draft save functionality
    alert('Draft save feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[--navy]" />
            <h1 className="text-3xl font-serif font-bold text-[--navy]">
              Manual Journal Entry
            </h1>
          </div>
          <p className="text-gray-600">
            Create manual journal entries for adjustments, accruals, and corrections
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Success!</p>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Entry Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-serif font-semibold text-[--navy] flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Entry Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entry Date */}
              <div>
                <label
                  htmlFor="entryDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Entry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="entryDate"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  disabled={postJournalEntry.isPending}
                  className={`
                    w-full px-4 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                    ${errors.entryDate ? 'border-red-500' : 'border-gray-300'}
                    ${postJournalEntry.isPending ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                  `}
                />
                {errors.entryDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.entryDate}</p>
                )}
              </div>

              {/* Reference Number (future feature) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  disabled
                  placeholder="Auto-generated on save"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={postJournalEntry.isPending}
                rows={3}
                placeholder="Describe the purpose of this journal entry..."
                className={`
                  w-full px-4 py-2 border rounded-lg resize-none
                  focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                  ${errors.description ? 'border-red-500' : 'border-gray-300'}
                  ${postJournalEntry.isPending ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                `}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Journal Entry Lines */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-serif font-semibold text-[--navy]">
              Journal Entry Lines
            </h2>

            <JournalEntryLines
              lines={lines}
              onChange={setLines}
              errors={errors}
              disabled={postJournalEntry.isPending}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={postJournalEntry.isPending}
              className={`
                px-6 py-3 border-2 border-[--sage] rounded-lg
                flex items-center gap-2
                transition-all
                ${
                  postJournalEntry.isPending
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[--sage] hover:text-white text-[--sage]'
                }
              `}
            >
              <Save className="w-5 h-5" />
              <span className="font-medium">Save Draft</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Debits / Credits</div>
                <div className="font-mono font-bold text-lg text-[--navy]">
                  ${totalDebits.toFixed(2)} / ${totalCredits.toFixed(2)}
                </div>
                {isBalanced ? (
                  <div className="text-sm text-green-600 flex items-center justify-end gap-1 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Balanced
                  </div>
                ) : (
                  <div className="text-sm text-red-600 flex items-center justify-end gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    Out of balance by ${difference.toFixed(2)}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={postJournalEntry.isPending || !isBalanced}
                className={`
                  px-8 py-3 rounded-lg font-medium
                  flex items-center gap-2
                  transition-all
                  ${
                    postJournalEntry.isPending || !isBalanced
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[--navy] text-white hover:bg-opacity-90'
                  }
                `}
              >
                {postJournalEntry.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Post Journal Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
