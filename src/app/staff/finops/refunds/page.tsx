'use client';

import { useState } from 'react';
import { DollarSign, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';

/**
 * Refund Processing Page
 * 
 * Process refunds with:
 * - Multi-payment selection
 * - Refund reason
 * - Refund method (check/original)
 * - Case linking
 */

export default function RefundsPage() {
  const [caseId, setCaseId] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState<'adjustment' | 'cancellation' | 'overpayment' | 'error' | 'other'>('adjustment');
  const [customReason, setCustomReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'original' | 'check'>('original');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mock cases
  const mockCases = [
    { id: 'CASE-001', caseNumber: 'CASE-001', customerName: 'Smith Family', payments: [
      { id: 'PAY-001', amount: 5000, date: '2024-12-01', method: 'Credit Card' },
      { id: 'PAY-002', amount: 3000, date: '2024-12-05', method: 'Check' },
    ]},
    { id: 'CASE-002', caseNumber: 'CASE-002', customerName: 'Johnson Family', payments: [
      { id: 'PAY-003', amount: 8000, date: '2024-11-20', method: 'ACH' },
    ]},
  ];

  const selectedCase = mockCases.find(c => c.id === caseId);
  const maxRefund = selectedPayments.reduce((sum, payId) => {
    const payment = selectedCase?.payments.find(p => p.id === payId);
    return sum + (payment?.amount || 0);
  }, 0);

  // Mock refund mutation (would use actual API)
  const processRefund = {
    mutate: async (data: any) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage(`Refund of ${formatCurrency(parseFloat(refundAmount))} processed successfully`);
      setTimeout(() => {
        // Reset form
        setCaseId('');
        setSelectedPayments([]);
        setRefundAmount('');
        setRefundReason('adjustment');
        setNotes('');
        setSuccessMessage(null);
      }, 3000);
    },
    isPending: false,
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!caseId) newErrors.caseId = 'Case selection required';
    if (selectedPayments.length === 0) newErrors.payments = 'Select at least one payment';
    if (!refundAmount || parseFloat(refundAmount) <= 0) newErrors.amount = 'Enter valid amount';
    if (parseFloat(refundAmount) > maxRefund) newErrors.amount = `Amount cannot exceed ${formatCurrency(maxRefund)}`;
    if (refundReason === 'other' && !customReason.trim()) newErrors.reason = 'Specify reason';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    processRefund.mutate({
      caseId,
      paymentIds: selectedPayments,
      amount: parseFloat(refundAmount),
      reason: refundReason === 'other' ? customReason : refundReason,
      method: refundMethod,
      notes,
    });
  };

  const togglePayment = (paymentId: string) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId) ? prev.filter(id => id !== paymentId) : [...prev, paymentId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-8 h-8 text-[--navy]" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-[--navy]">Process Refund</h1>
              <p className="text-gray-600">Refund payments to families</p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success!</p>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Selection */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-serif font-semibold text-[--navy] mb-4">Case Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case <span className="text-red-500">*</span>
              </label>
              <select
                value={caseId}
                onChange={(e) => {
                  setCaseId(e.target.value);
                  setSelectedPayments([]);
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] ${
                  errors.caseId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a case...</option>
                {mockCases.map(c => (
                  <option key={c.id} value={c.id}>{c.caseNumber} - {c.customerName}</option>
                ))}
              </select>
              {errors.caseId && <p className="mt-1 text-sm text-red-500">{errors.caseId}</p>}
            </div>
          </div>

          {/* Payments Selection */}
          {selectedCase && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-serif font-semibold text-[--navy] mb-4">Select Payments</h2>
              <div className="space-y-2">
                {selectedCase.payments.map(payment => (
                  <label key={payment.id} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => togglePayment(payment.id)}
                      className="w-5 h-5 text-[--navy] rounded"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold">{payment.method}</div>
                      <div className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</div>
                    </div>
                    <div className="font-bold text-[--navy]">{formatCurrency(payment.amount)}</div>
                  </label>
                ))}
              </div>
              {errors.payments && <p className="mt-2 text-sm text-red-500">{errors.payments}</p>}
            </div>
          )}

          {/* Refund Details */}
          {selectedPayments.length > 0 && (
            <div className="bg-white border rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-serif font-semibold text-[--navy]">Refund Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={maxRefund}
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600">Max: {formatCurrency(maxRefund)}</p>
                {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'adjustment', label: 'Service Adjustment' },
                    { value: 'cancellation', label: 'Cancellation' },
                    { value: 'overpayment', label: 'Overpayment' },
                    { value: 'error', label: 'Error Correction' },
                    { value: 'other', label: 'Other' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="reason"
                        value={value}
                        checked={refundReason === value}
                        onChange={(e) => setRefundReason(e.target.value as any)}
                        className="w-4 h-4 text-[--navy]"
                      />
                      <span className="ml-3">{label}</span>
                    </label>
                  ))}
                </div>
                {refundReason === 'other' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Specify reason..."
                    className={`mt-2 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] ${
                      errors.reason ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}
                {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="original"
                      checked={refundMethod === 'original'}
                      onChange={(e) => setRefundMethod(e.target.value as any)}
                      className="w-4 h-4 text-[--navy]"
                    />
                    <span className="ml-3">Original Payment Method</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="check"
                      checked={refundMethod === 'check'}
                      onChange={(e) => setRefundMethod(e.target.value as any)}
                      className="w-4 h-4 text-[--navy]"
                    />
                    <span className="ml-3">Check</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] resize-none"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          {selectedPayments.length > 0 && (
            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => window.history.back()} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={processRefund.isPending}
                className="px-8 py-3 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 flex items-center gap-2"
              >
                {processRefund.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                Process Refund
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
