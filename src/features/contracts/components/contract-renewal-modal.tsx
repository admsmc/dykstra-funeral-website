/**
 * Contract Renewal Modal Component
 * For pre-need contract renewals with price adjustments
 * Backend: Use Case 6.6 - Contract Renewal Management
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc-client';
import { toast } from 'sonner';

export interface ContractRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: {
    id: string;
    caseNumber: string;
    decedentName: string;
    totalAmount: number;
    expirationDate: string;
  };
  onRenewalComplete?: (renewalData: ContractRenewalData) => void;
}

export interface ContractRenewalData {
  contractId: string;
  newExpirationDate: string;
  priceAdjustment: number;
  adjustmentReason: string;
  renewalNotes: string;
}

export function ContractRenewalModal({ isOpen, onClose, contract, onRenewalComplete }: ContractRenewalModalProps) {
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [formData, setFormData] = useState({
    newExpirationDate: '',
    priceAdjustmentType: 'none' as 'none' | 'inflation' | 'custom',
    customAdjustment: '',
    adjustmentReason: '',
    renewalNotes: '',
  });

  const renewMutation = trpc.contract.renew.useMutation({
    onSuccess: (result) => {
      toast.success(`Contract renewed: ${result.renewedContractId}`);
      setStep('success');
      onRenewalComplete?.({
        contractId: contract.id,
        newExpirationDate: formData.newExpirationDate,
        priceAdjustment,
        adjustmentReason: formData.adjustmentReason,
        renewalNotes: formData.renewalNotes,
      });
    },
    onError: (error) => {
      toast.error(`Failed to renew contract: ${error.message}`);
      setStep('form');
    },
  });

  const inflationRate = 3.2; // Mock inflation rate
  const calculatedNewAmount = 
    formData.priceAdjustmentType === 'inflation'
      ? contract.totalAmount * (1 + inflationRate / 100)
      : formData.priceAdjustmentType === 'custom' && formData.customAdjustment
      ? contract.totalAmount + parseFloat(formData.customAdjustment)
      : contract.totalAmount;

  const priceAdjustment = calculatedNewAmount - contract.totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
  };

  const handleConfirmRenewal = () => {
    const priceAdjustmentPercentage = contract.totalAmount > 0
      ? (priceAdjustment / contract.totalAmount) * 100
      : 0;

    renewMutation.mutate({
      contractId: contract.id,
      newExpirationDate: new Date(formData.newExpirationDate),
      priceAdjustmentPercentage,
      notes: [
        formData.adjustmentReason,
        formData.renewalNotes,
      ].filter(Boolean).join(' | '),
    });
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      newExpirationDate: '',
      priceAdjustmentType: 'none',
      customAdjustment: '',
      adjustmentReason: '',
      renewalNotes: '',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Contract Renewal</h2>
                  <p className="text-sm text-gray-600 mt-1">{contract.caseNumber} - {contract.decedentName}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'form' && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Contract Info */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">Current Contract</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-blue-600">Original Amount</p>
                          <p className="font-medium text-blue-900">${contract.totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Expiration Date</p>
                          <p className="font-medium text-blue-900">{new Date(contract.expirationDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* New Expiration Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        New Expiration Date
                      </label>
                      <input
                        type="date"
                        value={formData.newExpirationDate}
                        onChange={(e) => setFormData({ ...formData, newExpirationDate: e.target.value })}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Price Adjustment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Price Adjustment
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="priceAdjustment"
                            value="none"
                            checked={formData.priceAdjustmentType === 'none'}
                            onChange={(e) => setFormData({ ...formData, priceAdjustmentType: 'none', customAdjustment: '' })}
                            className="text-indigo-600"
                          />
                          <span className="text-sm font-medium text-gray-900">No adjustment - Keep original price</span>
                        </label>

                        <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="priceAdjustment"
                            value="inflation"
                            checked={formData.priceAdjustmentType === 'inflation'}
                            onChange={(e) => setFormData({ ...formData, priceAdjustmentType: 'inflation', customAdjustment: '' })}
                            className="text-indigo-600"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">Apply inflation adjustment ({inflationRate}%)</span>
                            {formData.priceAdjustmentType === 'inflation' && (
                              <p className="text-xs text-gray-600 mt-1">
                                New amount: ${calculatedNewAmount.toLocaleString()} (+${priceAdjustment.toLocaleString()})
                              </p>
                            )}
                          </div>
                        </label>

                        <label className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="priceAdjustment"
                            value="custom"
                            checked={formData.priceAdjustmentType === 'custom'}
                            onChange={(e) => setFormData({ ...formData, priceAdjustmentType: 'custom' })}
                            className="text-indigo-600 mt-1"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 block mb-2">Custom adjustment</span>
                            {formData.priceAdjustmentType === 'custom' && (
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Enter adjustment amount (+ or -)"
                                value={formData.customAdjustment}
                                onChange={(e) => setFormData({ ...formData, customAdjustment: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Adjustment Reason */}
                    {formData.priceAdjustmentType !== 'none' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adjustment Reason
                        </label>
                        <textarea
                          value={formData.adjustmentReason}
                          onChange={(e) => setFormData({ ...formData, adjustmentReason: e.target.value })}
                          required
                          rows={2}
                          placeholder="Explain the reason for the price adjustment..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    )}

                    {/* Renewal Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Renewal Notes (Optional)
                      </label>
                      <textarea
                        value={formData.renewalNotes}
                        onChange={(e) => setFormData({ ...formData, renewalNotes: e.target.value })}
                        rows={3}
                        placeholder="Add any additional notes about this renewal..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        Review Renewal
                      </button>
                    </div>
                  </form>
                )}

                {step === 'review' && (
                  <div className="space-y-6">
                    {/* Review Summary */}
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-semibold text-amber-900">Review Renewal Details</h3>
                          <p className="text-sm text-amber-700 mt-1">
                            Please review the renewal details before confirming. This will create a new contract version.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Renewal Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Original Amount</p>
                          <p className="text-lg font-bold text-gray-900">${contract.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-lg">
                          <p className="text-xs text-indigo-600 mb-1">New Amount</p>
                          <p className="text-lg font-bold text-indigo-900">${calculatedNewAmount.toLocaleString()}</p>
                          {priceAdjustment !== 0 && (
                            <p className={`text-xs mt-1 ${priceAdjustment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {priceAdjustment > 0 ? '+' : ''}${priceAdjustment.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">New Expiration Date</p>
                        <p className="font-medium text-gray-900">{new Date(formData.newExpirationDate).toLocaleDateString()}</p>
                      </div>

                      {formData.adjustmentReason && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Adjustment Reason</p>
                          <p className="text-sm text-gray-900">{formData.adjustmentReason}</p>
                        </div>
                      )}

                      {formData.renewalNotes && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Renewal Notes</p>
                          <p className="text-sm text-gray-900">{formData.renewalNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setStep('form')}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Back to Edit
                      </button>
                      <button
                        onClick={handleConfirmRenewal}
                        disabled={renewMutation.isPending}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {renewMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {renewMutation.isPending ? 'Renewing...' : 'Confirm Renewal'}
                      </button>
                    </div>
                  </div>
                )}

                {step === 'success' && (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Contract Renewed Successfully!</h3>
                    <p className="text-gray-600 mb-6">
                      The contract has been renewed and a new version has been created.
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
