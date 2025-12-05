'use client';

import { useState } from 'react';
import { FileText, Plus, Trash2, Save, Send, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Invoice Creation Page
 * 
 * Create new AR invoices with:
 * - Case selection
 * - Multi-line items (services/merchandise)
 * - Automatic tax calculation
 * - Payment terms (due date)
 * - Save as draft or send immediately
 */

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
}

export default function NewInvoicePage() {
  const router = useRouter();
  
  // Form state
  const [caseId, setCaseId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default 30 days
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<InvoiceLineItem[]>([
    {
      id: `line-1-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxable: false,
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mock cases for selection
  const mockCases = [
    { id: 'CASE-001', caseNumber: 'CASE-001', customerName: 'Smith Family', status: 'active' },
    { id: 'CASE-002', caseNumber: 'CASE-002', customerName: 'Johnson Family', status: 'active' },
    { id: 'CASE-003', caseNumber: 'CASE-003', customerName: 'Williams Estate', status: 'active' },
    { id: 'CASE-004', caseNumber: 'CASE-004', customerName: 'Brown Family', status: 'active' },
    { id: 'CASE-005', caseNumber: 'CASE-005', customerName: 'Davis Family', status: 'active' },
  ];

  // tRPC mutation
  const createInvoice = api.financial.ar.createInvoice.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(`Invoice ${data.invoiceNumber} created successfully!`);
      setTimeout(() => {
        router.push('/staff/finops/invoices');
      }, 2000);
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  // Calculate line amount
  const calculateLineAmount = (quantity: number, unitPrice: number): number => {
    return Math.round(quantity * unitPrice * 100) / 100;
  };

  // Calculate totals
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const taxableAmount = lines.filter(line => line.taxable).reduce((sum, line) => sum + line.amount, 0);
  const taxRate = 0.06; // 6% tax rate
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
  const total = subtotal + taxAmount;

  // Add line
  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: `line-${Date.now()}-${Math.random()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        taxable: false,
      },
    ]);
  };

  // Remove line
  const handleRemoveLine = (lineId: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter(line => line.id !== lineId));
  };

  // Update line
  const handleUpdateLine = (lineId: string, updates: Partial<InvoiceLineItem>) => {
    setLines(
      lines.map(line => {
        if (line.id !== lineId) return line;
        
        const updated = { ...line, ...updates };
        
        // Recalculate amount if quantity or unitPrice changed
        if ('quantity' in updates || 'unitPrice' in updates) {
          updated.amount = calculateLineAmount(updated.quantity, updated.unitPrice);
        }
        
        return updated;
      })
    );
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!caseId) {
      newErrors.caseId = 'Case selection is required';
    }

    if (!invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    }

    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (new Date(dueDate) < new Date(invoiceDate)) {
      newErrors.dueDate = 'Due date must be after invoice date';
    }

    if (lines.length === 0) {
      newErrors.general = 'At least one line item is required';
    }

    lines.forEach((line, index) => {
      if (!line.description.trim()) {
        newErrors[`lines.${index}.description`] = 'Description is required';
      }
      if (line.quantity <= 0) {
        newErrors[`lines.${index}.quantity`] = 'Quantity must be positive';
      }
      if (line.unitPrice < 0) {
        newErrors[`lines.${index}.unitPrice`] = 'Price cannot be negative';
      }
    });

    if (total <= 0) {
      newErrors.general = 'Invoice total must be greater than $0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    createInvoice.mutate({
      caseId,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      notes: notes || undefined,
      lineItems: lines.map(line => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount: line.amount,
        taxable: line.taxable,
      })),
      funeralHomeId: 'fh-001', // TODO: Get from auth context
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/staff/finops/invoices"
            className="inline-flex items-center gap-2 text-sm text-[--navy] hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>

          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[--navy]" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-[--navy]">
                New Invoice
              </h1>
              <p className="text-gray-600 mt-1">
                Create a new accounts receivable invoice
              </p>
            </div>
          </div>
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
          {/* Invoice Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-serif font-semibold text-[--navy]">
              Invoice Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Case Selection */}
              <div>
                <label htmlFor="caseId" className="block text-sm font-medium text-gray-700 mb-2">
                  Case <span className="text-red-500">*</span>
                </label>
                <select
                  id="caseId"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  disabled={createInvoice.isPending}
                  className={`
                    w-full px-4 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                    ${errors.caseId ? 'border-red-500' : 'border-gray-300'}
                    ${createInvoice.isPending ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                  `}
                >
                  <option value="">Select a case...</option>
                  {mockCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} - {c.customerName}
                    </option>
                  ))}
                </select>
                {errors.caseId && (
                  <p className="mt-1 text-sm text-red-500">{errors.caseId}</p>
                )}
              </div>

              {/* Invoice Number (Auto) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  disabled
                  placeholder="Auto-generated"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="invoiceDate"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  disabled={createInvoice.isPending}
                  className={`
                    w-full px-4 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                    ${errors.invoiceDate ? 'border-red-500' : 'border-gray-300'}
                    ${createInvoice.isPending ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                  `}
                />
                {errors.invoiceDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.invoiceDate}</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={createInvoice.isPending}
                  className={`
                    w-full px-4 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                    ${errors.dueDate ? 'border-red-500' : 'border-gray-300'}
                    ${createInvoice.isPending ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                  `}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={createInvoice.isPending}
                rows={3}
                placeholder="Add any notes or special instructions..."
                className={`
                  w-full px-4 py-2 border rounded-lg resize-none
                  focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
                  ${createInvoice.isPending ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                `}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-serif font-semibold text-[--navy]">
              Line Items
            </h2>

            <div className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={line.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Description */}
                    <div className="col-span-5">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => handleUpdateLine(line.id, { description: e.target.value })}
                        disabled={createInvoice.isPending}
                        placeholder="Service or item description"
                        className={`
                          w-full px-3 py-2 text-sm border rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-[--navy]
                          ${errors[`lines.${index}.description`] ? 'border-red-500' : 'border-gray-300'}
                          ${createInvoice.isPending ? 'bg-gray-100' : 'bg-white'}
                        `}
                      />
                      {errors[`lines.${index}.description`] && (
                        <p className="mt-1 text-xs text-red-500">{errors[`lines.${index}.description`]}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Qty *
                      </label>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => handleUpdateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                        disabled={createInvoice.isPending}
                        min="0"
                        step="0.01"
                        className={`
                          w-full px-3 py-2 text-sm border rounded-lg text-right
                          focus:outline-none focus:ring-2 focus:ring-[--navy]
                          ${errors[`lines.${index}.quantity`] ? 'border-red-500' : 'border-gray-300'}
                          ${createInvoice.isPending ? 'bg-gray-100' : 'bg-white'}
                        `}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => handleUpdateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        disabled={createInvoice.isPending}
                        min="0"
                        step="0.01"
                        className={`
                          w-full px-3 py-2 text-sm border rounded-lg text-right
                          focus:outline-none focus:ring-2 focus:ring-[--navy]
                          ${errors[`lines.${index}.unitPrice`] ? 'border-red-500' : 'border-gray-300'}
                          ${createInvoice.isPending ? 'bg-gray-100' : 'bg-white'}
                        `}
                      />
                    </div>

                    {/* Amount */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Amount
                      </label>
                      <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-right font-semibold">
                        {formatCurrency(line.amount)}
                      </div>
                    </div>

                    {/* Taxable & Remove */}
                    <div className="col-span-1 flex flex-col justify-between h-full">
                      <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                        <input
                          type="checkbox"
                          checked={line.taxable}
                          onChange={(e) => handleUpdateLine(line.id, { taxable: e.target.checked })}
                          disabled={createInvoice.isPending}
                          className="w-4 h-4 text-[--navy] rounded focus:ring-[--navy]"
                        />
                        Tax
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        disabled={createInvoice.isPending || lines.length <= 1}
                        className={`
                          mt-2 p-2 rounded transition-colors
                          ${
                            lines.length <= 1 || createInvoice.isPending
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50'
                          }
                        `}
                        title="Remove line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Line Button */}
              <button
                type="button"
                onClick={handleAddLine}
                disabled={createInvoice.isPending}
                className={`
                  w-full px-4 py-3 border-2 border-dashed rounded-lg
                  flex items-center justify-center gap-2 transition-all
                  ${
                    createInvoice.isPending
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-[--sage] text-[--sage] hover:border-[--navy] hover:text-[--navy] hover:bg-[--cream]'
                  }
                `}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Line Item</span>
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-[--cream] border-2 border-[--navy] rounded-lg p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Tax (6%):</span>
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="border-t-2 border-[--navy] pt-3 flex items-center justify-between">
                <span className="text-xl font-bold text-[--navy]">Total:</span>
                <span className="text-3xl font-bold text-[--navy]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/staff/finops/invoices"
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={createInvoice.isPending || total <= 0}
              className={`
                px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all
                ${
                  createInvoice.isPending || total <= 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[--navy] text-white hover:bg-opacity-90'
                }
              `}
            >
              {createInvoice.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Create Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
