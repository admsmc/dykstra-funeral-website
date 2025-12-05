'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

/**
 * GL Account Selector Component
 * 
 * Reusable autocomplete component for GL account selection.
 * Features:
 * - Fuzzy search by account number or name
 * - Displays account balance
 * - Keyboard navigation
 * - Accessible
 */

export interface GLAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  isActive: boolean;
}

interface GLAccountSelectorProps {
  value: string;
  onChange: (accountId: string, account: GLAccount | null) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

// Mock GL accounts - in production, these would come from an API
const MOCK_GL_ACCOUNTS: GLAccount[] = [
  { id: '1', accountNumber: '1000', accountName: 'Cash - Operating', accountType: 'asset', balance: 53730, isActive: true },
  { id: '2', accountNumber: '1100', accountName: 'Cash - Payroll', accountType: 'asset', balance: 12400, isActive: true },
  { id: '3', accountNumber: '1200', accountName: 'Accounts Receivable', accountType: 'asset', balance: 24500, isActive: true },
  { id: '4', accountNumber: '1300', accountName: 'Inventory - Caskets', accountType: 'asset', balance: 45000, isActive: true },
  { id: '5', accountNumber: '1310', accountName: 'Inventory - Urns', accountType: 'asset', balance: 8900, isActive: true },
  { id: '6', accountNumber: '1400', accountName: 'Prepaid Expenses', accountType: 'asset', balance: 3200, isActive: true },
  { id: '7', accountNumber: '1500', accountName: 'Equipment', accountType: 'asset', balance: 125000, isActive: true },
  { id: '8', accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'liability', balance: -8200, isActive: true },
  { id: '9', accountNumber: '2100', accountName: 'Accrued Expenses', accountType: 'liability', balance: -3400, isActive: true },
  { id: '10', accountNumber: '3000', accountName: 'Owner Equity', accountType: 'equity', balance: -250000, isActive: true },
  { id: '11', accountNumber: '4000', accountName: 'Service Revenue - Traditional', accountType: 'revenue', balance: -320000, isActive: true },
  { id: '12', accountNumber: '4100', accountName: 'Service Revenue - Cremation', accountType: 'revenue', balance: -180000, isActive: true },
  { id: '13', accountNumber: '4200', accountName: 'Merchandise Revenue', accountType: 'revenue', balance: -95000, isActive: true },
  { id: '14', accountNumber: '5000', accountName: 'Cost of Goods Sold', accountType: 'expense', balance: 42000, isActive: true },
  { id: '15', accountNumber: '6000', accountName: 'Salaries & Wages', accountType: 'expense', balance: 125000, isActive: true },
  { id: '16', accountNumber: '6100', accountName: 'Payroll Taxes', accountType: 'expense', balance: 18000, isActive: true },
  { id: '17', accountNumber: '6200', accountName: 'Supplies Expense', accountType: 'expense', balance: 8500, isActive: true },
  { id: '18', accountNumber: '6300', accountName: 'Utilities', accountType: 'expense', balance: 6200, isActive: true },
  { id: '19', accountNumber: '6400', accountName: 'Rent Expense', accountType: 'expense', balance: 24000, isActive: true },
  { id: '20', accountNumber: '6500', accountName: 'Marketing & Advertising', accountType: 'expense', balance: 12000, isActive: true },
];

export function GLAccountSelector({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'Search by account number or name...',
  label,
  required = false,
}: GLAccountSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Get selected account
  const selectedAccount = MOCK_GL_ACCOUNTS.find(acc => acc.id === value);

  // Filter accounts based on search term
  const filteredAccounts = searchTerm
    ? MOCK_GL_ACCOUNTS.filter(acc => {
        const search = searchTerm.toLowerCase();
        return (
          acc.accountNumber.includes(search) ||
          acc.accountName.toLowerCase().includes(search) ||
          acc.accountType.toLowerCase().includes(search)
        );
      })
    : MOCK_GL_ACCOUNTS;

  // Reset highlighted index when filtered accounts change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Handle account selection
  const handleSelect = (account: GLAccount) => {
    onChange(account.id, account);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredAccounts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredAccounts[highlightedIndex]) {
          handleSelect(filteredAccounts[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    const abs = Math.abs(amount);
    return `$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get account type color
  const getAccountTypeColor = (type: GLAccount['accountType']) => {
    switch (type) {
      case 'asset': return 'text-blue-600';
      case 'liability': return 'text-red-600';
      case 'equity': return 'text-purple-600';
      case 'revenue': return 'text-green-600';
      case 'expense': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected Account Display or Search Input */}
      <div className="relative">
        {selectedAccount && !isOpen ? (
          <div
            onClick={() => !disabled && setIsOpen(true)}
            className={`
              w-full px-4 py-2 border rounded-lg flex items-center justify-between
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[--navy]'}
              ${error ? 'border-red-500' : 'border-gray-300'}
              transition-colors
            `}
          >
            <div className="flex-1">
              <span className="font-mono font-semibold text-[--navy]">
                {selectedAccount.accountNumber}
              </span>
              <span className="mx-2 text-gray-400">-</span>
              <span className="text-gray-700">{selectedAccount.accountName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${getAccountTypeColor(selectedAccount.accountType)} capitalize`}>
                {selectedAccount.accountType}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {formatCurrency(selectedAccount.balance)}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              className={`
                w-full pl-10 pr-4 py-2 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                ${error ? 'border-red-500' : 'border-gray-300'}
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              `}
            />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
            }}
          />

          {/* Account List */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No accounts found matching &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredAccounts.map((account, index) => (
                <div
                  key={account.id}
                  onClick={() => handleSelect(account)}
                  className={`
                    px-4 py-3 cursor-pointer flex items-center justify-between
                    ${index === highlightedIndex ? 'bg-[--cream]' : 'hover:bg-gray-50'}
                    ${index === 0 ? 'rounded-t-lg' : ''}
                    ${index === filteredAccounts.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'}
                    transition-colors
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[--navy]">
                        {account.accountNumber}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className="text-gray-700">{account.accountName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`text-xs px-2 py-1 rounded capitalize ${getAccountTypeColor(account.accountType)}`}>
                      {account.accountType}
                    </span>
                    <span className="text-sm font-medium text-gray-600 min-w-[100px] text-right">
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Helper Text */}
      {!error && (
        <p className="mt-1 text-xs text-gray-500">
          Type to search by account number, name, or type
        </p>
      )}
    </div>
  );
}
