'use client';

import { useState } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GLAccountSelector, type GLAccount } from './GLAccountSelector';

/**
 * Journal Entry Lines Component
 * 
 * Multi-line grid for journal entry details with:
 * - Dynamic add/remove lines
 * - Debit/Credit columns
 * - Real-time balance validation
 * - Account selection per line
 * - Optional line descriptions
 */

export interface JournalEntryLine {
  id: string;
  accountId: string;
  account: GLAccount | null;
  debit: number;
  credit: number;
  description: string;
}

interface JournalEntryLinesProps {
  lines: JournalEntryLine[];
  onChange: (lines: JournalEntryLine[]) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function JournalEntryLines({
  lines,
  onChange,
  errors = {},
  disabled = false,
}: JournalEntryLinesProps) {
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01; // Within $0.01 tolerance

  // Add new line
  const handleAddLine = () => {
    const newLine: JournalEntryLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      accountId: '',
      account: null,
      debit: 0,
      credit: 0,
      description: '',
    };
    onChange([...lines, newLine]);
  };

  // Remove line
  const handleRemoveLine = (lineId: string) => {
    if (lines.length <= 2) return; // Minimum 2 lines required
    onChange(lines.filter(line => line.id !== lineId));
  };

  // Update line
  const handleUpdateLine = (lineId: string, updates: Partial<JournalEntryLine>) => {
    onChange(
      lines.map(line =>
        line.id === lineId ? { ...line, ...updates } : line
      )
    );
  };

  // Format currency input
  const formatCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  };

  return (
    <div className="space-y-4">
      {/* Lines Grid */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-300 px-4 py-3">
          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
            <div className="col-span-5">Account</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
            <div className="col-span-2">Description</div>
            <div className="col-span-1"></div>
          </div>
        </div>

        {/* Lines */}
        <div className="divide-y divide-gray-200">
          {lines.map((line, index) => (
            <div
              key={line.id}
              className={`
                px-4 py-3
                ${focusedLineId === line.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
                transition-colors
              `}
              onFocus={() => setFocusedLineId(line.id)}
              onBlur={() => setFocusedLineId(null)}
            >
              <div className="grid grid-cols-12 gap-4 items-start">
                {/* Account Selector */}
                <div className="col-span-5">
                  <GLAccountSelector
                    value={line.accountId}
                    onChange={(accountId, account) =>
                      handleUpdateLine(line.id, { accountId, account })
                    }
                    error={errors[`lines.${index}.accountId`]}
                    disabled={disabled}
                    placeholder="Select account..."
                  />
                </div>

                {/* Debit */}
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="text"
                      value={line.debit > 0 ? line.debit.toFixed(2) : ''}
                      onChange={(e) => {
                        const debit = formatCurrencyInput(e.target.value);
                        handleUpdateLine(line.id, { 
                          debit, 
                          credit: debit > 0 ? 0 : line.credit // Clear credit if debit is entered
                        });
                      }}
                      disabled={disabled || line.credit > 0}
                      placeholder="0.00"
                      className={`
                        w-full pl-6 pr-3 py-2 border rounded-lg text-right
                        focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                        ${errors[`lines.${index}.debit`] ? 'border-red-500' : 'border-gray-300'}
                        ${disabled || line.credit > 0 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                      `}
                    />
                  </div>
                  {errors[`lines.${index}.debit`] && (
                    <p className="mt-1 text-xs text-red-500">{errors[`lines.${index}.debit`]}</p>
                  )}
                </div>

                {/* Credit */}
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="text"
                      value={line.credit > 0 ? line.credit.toFixed(2) : ''}
                      onChange={(e) => {
                        const credit = formatCurrencyInput(e.target.value);
                        handleUpdateLine(line.id, { 
                          credit,
                          debit: credit > 0 ? 0 : line.debit // Clear debit if credit is entered
                        });
                      }}
                      disabled={disabled || line.debit > 0}
                      placeholder="0.00"
                      className={`
                        w-full pl-6 pr-3 py-2 border rounded-lg text-right
                        focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                        ${errors[`lines.${index}.credit`] ? 'border-red-500' : 'border-gray-300'}
                        ${disabled || line.debit > 0 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                      `}
                    />
                  </div>
                  {errors[`lines.${index}.credit`] && (
                    <p className="mt-1 text-xs text-red-500">{errors[`lines.${index}.credit`]}</p>
                  )}
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) =>
                      handleUpdateLine(line.id, { description: e.target.value })
                    }
                    disabled={disabled}
                    placeholder="Optional"
                    className={`
                      w-full px-3 py-2 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                      ${errors[`lines.${index}.description`] ? 'border-red-500' : 'border-gray-300'}
                      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                    `}
                  />
                </div>

                {/* Remove Button */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.id)}
                    disabled={disabled || lines.length <= 2}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${
                        lines.length <= 2 || disabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }
                    `}
                    title={lines.length <= 2 ? 'Minimum 2 lines required' : 'Remove line'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Row */}
        <div className="bg-[--cream] border-t-2 border-[--navy] px-4 py-3">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 flex items-center">
              <span className="font-semibold text-[--navy]">Totals</span>
              {isBalanced ? (
                <div className="ml-3 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Balanced</span>
                </div>
              ) : (
                <div className="ml-3 flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Out of balance by ${difference.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="col-span-2 text-right">
              <span className="font-mono font-bold text-[--navy] text-lg">
                ${totalDebits.toFixed(2)}
              </span>
            </div>
            <div className="col-span-2 text-right">
              <span className="font-mono font-bold text-[--navy] text-lg">
                ${totalCredits.toFixed(2)}
              </span>
            </div>
            <div className="col-span-3"></div>
          </div>
        </div>
      </div>

      {/* Add Line Button */}
      <button
        type="button"
        onClick={handleAddLine}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border-2 border-dashed rounded-lg
          flex items-center justify-center gap-2
          transition-all
          ${
            disabled
              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
              : 'border-[--sage] text-[--sage] hover:border-[--navy] hover:text-[--navy] hover:bg-[--cream]'
          }
        `}
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add Line</span>
      </button>

      {/* Validation Summary */}
      {!isBalanced && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Entry is out of balance</p>
            <p className="text-sm text-red-700 mt-1">
              Debits and credits must be equal to post this journal entry. Current difference: $
              {difference.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>• Minimum 2 lines required</p>
        <p>• Enter amount in either Debit OR Credit column (not both)</p>
        <p>• Total debits must equal total credits to post</p>
        <p>• Use Tab key to move between fields</p>
      </div>
    </div>
  );
}
