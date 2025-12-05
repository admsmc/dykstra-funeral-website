'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  onSuccess: () => void;
}

export function DeleteContactModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  onSuccess,
}: DeleteContactModalProps) {
  const [reason, setReason] = useState('');

  const deleteMutation = trpc.contact.delete.useMutation({
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ contactId });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-[--navy]">Delete Contact?</h2>
                <p className="text-sm text-[--charcoal] opacity-60 mt-0.5">
                  This action cannot be undone
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

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-900">
              You are about to delete <strong>{contactName}</strong>.
            </p>
            <ul className="mt-2 text-xs text-red-800 space-y-1 list-disc list-inside">
              <li>All contact information will be permanently removed</li>
              <li>Linked cases and relationships will be affected</li>
              <li>This action cannot be reversed</li>
            </ul>
          </div>

          {/* Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[--navy] mb-2">
              Reason for deletion (optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
            >
              <option value="">Select a reason...</option>
              <option value="duplicate">Duplicate contact</option>
              <option value="invalid">Invalid or test data</option>
              <option value="requested">Contact requested removal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleteMutation.isLoading}
              className="flex-1 px-4 py-2 border-2 border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete Contact'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
