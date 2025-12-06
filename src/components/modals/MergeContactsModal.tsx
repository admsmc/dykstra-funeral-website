'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { GitMerge, X, ArrowRight, AlertTriangle, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

interface MergeContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContactId: string;
  targetContactId: string;
  onSuccess: () => void;
}

export function MergeContactsModal({
  isOpen,
  onClose,
  sourceContactId,
  targetContactId,
  onSuccess,
}: MergeContactsModalProps) {
  const [step, setStep] = useState<'preview' | 'confirm'>('preview');
  const [fieldChoices, setFieldChoices] = useState<Record<string, 'source' | 'target'>>({});

  // Fetch both contacts
  const { data: sourceContact } = trpc.contact.getById.useQuery(
    { contactId: sourceContactId },
    { enabled: !!sourceContactId && isOpen }
  );

  const { data: targetContact } = trpc.contact.getById.useQuery(
    { contactId: targetContactId },
    { enabled: !!targetContactId && isOpen }
  );

  // Merge mutation
  const mergeMutation = trpc.contact.merge.useMutation({
    onSuccess: () => {
      toast.success('Contacts merged successfully');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to merge contacts: ${error.message}`);
    },
  });

  // Initialize field choices (default to target)
  useEffect(() => {
    if (sourceContact && targetContact && Object.keys(fieldChoices).length === 0) {
      const fields = ['email', 'phone', 'address', 'tags'];
      const initialChoices: Record<string, 'source' | 'target'> = {};
      fields.forEach((field) => {
        // Choose the field with more data
        const sourceValue = (sourceContact as any)[field];
        const targetValue = (targetContact as any)[field];
        initialChoices[field] = sourceValue && !targetValue ? 'source' : 'target';
      });
      setFieldChoices(initialChoices);
    }
  }, [sourceContact, targetContact, fieldChoices]);

  const handleMerge = () => {
    if (step === 'preview') {
      setStep('confirm');
    } else {
      mergeMutation.mutate({
        sourceContactId,
        targetContactId,
        mergedBy: 'current-user', // TODO: Get from context
      });
    }
  };

  if (!isOpen || !sourceContact || !targetContact) return null;

  const fieldsToCompare = [
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'alternatePhone', label: 'Alternate Phone' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zipCode', label: 'ZIP Code' },
    { key: 'tags', label: 'Tags' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <GitMerge className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-[--navy]">
                  {step === 'preview' ? 'Review Merge' : 'Confirm Merge'}
                </h2>
                <p className="text-sm text-[--charcoal] opacity-60 mt-0.5">
                  Step {step === 'preview' ? '1' : '2'} of 2
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[--cream] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'preview' ? (
            <>
              {/* Preview Step */}
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-700 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium">
                        Choose which fields to keep
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Select the best value for each field. The source contact will be
                        merged into the target contact.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Headers */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-300">
                    <p className="text-xs text-[--charcoal] opacity-60 mb-1">
                      Source (will be merged)
                    </p>
                    <p className="font-semibold text-[--navy]">
                      {sourceContact.firstName} {sourceContact.lastName}
                    </p>
                  </div>
                  <div className="p-3 bg-[--sage] bg-opacity-10 rounded-lg border-2 border-[--sage]">
                    <p className="text-xs text-[--charcoal] opacity-60 mb-1">
                      Target (will be kept)
                    </p>
                    <p className="font-semibold text-[--navy]">
                      {targetContact.firstName} {targetContact.lastName}
                    </p>
                  </div>
                </div>

                {/* Field Comparison */}
                <div className="space-y-2">
                  {fieldsToCompare.map((field) => {
                    const sourceValue = (sourceContact as any)[field.key];
                    const targetValue = (targetContact as any)[field.key];
                    const hasValue = sourceValue || targetValue;

                    if (!hasValue) return null;

                    const isDifferent = sourceValue !== targetValue;
                    const chosen = fieldChoices[field.key] || 'target';

                    return (
                      <div
                        key={field.key}
                        className={`border rounded-lg overflow-hidden ${
                          isDifferent ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="p-2 bg-gray-100 border-b border-gray-200">
                          <p className="text-xs font-medium text-[--navy]">{field.label}</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-200">
                          {/* Source Value */}
                          <button
                            onClick={() =>
                              setFieldChoices({ ...fieldChoices, [field.key]: 'source' })
                            }
                            disabled={!sourceValue}
                            className={`p-3 text-left transition-colors ${
                              chosen === 'source'
                                ? 'bg-[--sage] bg-opacity-20 border-2 border-[--sage]'
                                : 'hover:bg-gray-50'
                            } ${!sourceValue ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[--navy]">
                                {Array.isArray(sourceValue)
                                  ? sourceValue.join(', ') || '(empty)'
                                  : sourceValue || '(empty)'}
                              </span>
                              {chosen === 'source' && sourceValue && (
                                <Check className="w-4 h-4 text-[--sage]" />
                              )}
                            </div>
                          </button>

                          {/* Target Value */}
                          <button
                            onClick={() =>
                              setFieldChoices({ ...fieldChoices, [field.key]: 'target' })
                            }
                            disabled={!targetValue}
                            className={`p-3 text-left transition-colors ${
                              chosen === 'target'
                                ? 'bg-[--sage] bg-opacity-20 border-2 border-[--sage]'
                                : 'hover:bg-gray-50'
                            } ${!targetValue ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[--navy]">
                                {Array.isArray(targetValue)
                                  ? targetValue.join(', ') || '(empty)'
                                  : targetValue || '(empty)'}
                              </span>
                              {chosen === 'target' && targetValue && (
                                <Check className="w-4 h-4 text-[--sage]" />
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Confirm Step */}
              <div className="mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 mb-2">
                        Confirm Merge Operation
                      </p>
                      <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                        <li>The source contact will be marked as merged</li>
                        <li>All selected fields will be copied to the target contact</li>
                        <li>Related records will be reassigned to the target contact</li>
                        <li>This operation can be reversed within 30 days</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Final Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-[--charcoal]">Source Contact</span>
                    <span className="font-medium text-[--navy]">
                      {sourceContact.firstName} {sourceContact.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-[--sage]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[--sage] bg-opacity-10 rounded-lg border-2 border-[--sage]">
                    <span className="text-sm text-[--charcoal]">Target Contact (Final)</span>
                    <span className="font-medium text-[--navy]">
                      {targetContact.firstName} {targetContact.lastName}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    <strong>Data Retention:</strong> The source contact will be retained
                    for 30 days and can be unmerged if needed. After 30 days, the merge
                    becomes permanent.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {step === 'confirm' && (
              <button
                onClick={() => setStep('preview')}
                disabled={mergeMutation.isPending}
                className="flex-1 px-4 py-2 border-2 border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] transition-all disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              onClick={onClose}
              disabled={mergeMutation.isPending}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={mergeMutation.isPending}
              className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <GitMerge className="w-4 h-4" />
              {mergeMutation.isPending
                ? 'Merging...'
                : step === 'preview'
                ? 'Continue'
                : 'Confirm Merge'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
