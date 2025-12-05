'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  Tag,
  Trash2,
  Download,
  Mail,
  X,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkContactActionsProps {
  selectedContactIds: string[];
  totalContacts: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkTag: (tagIds: string[]) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkExport: () => Promise<void>;
  onBulkEmail: () => void;
  availableTags: Array<{ id: string; name: string; color: string }>;
}

export function BulkContactActions({
  selectedContactIds,
  totalContacts,
  onSelectAll,
  onDeselectAll,
  onBulkTag,
  onBulkDelete,
  onBulkExport,
  onBulkEmail,
  availableTags,
}: BulkContactActionsProps) {
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedContactIds.length;
  const allSelected = selectedCount === totalContacts && totalContacts > 0;

  const handleBulkTag = async (tagIds: string[]) => {
    setIsProcessing(true);
    try {
      await onBulkTag(tagIds);
      toast.success(`Tags added to ${selectedCount} contact${selectedCount !== 1 ? 's' : ''}`);
      setShowTagSelector(false);
    } catch (error) {
      toast.error('Failed to add tags');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete();
      toast.success(`${selectedCount} contact${selectedCount !== 1 ? 's' : ''} deleted`);
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error('Failed to delete contacts');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    setIsProcessing(true);
    try {
      await onBulkExport();
      toast.success(`${selectedCount} contact${selectedCount !== 1 ? 's' : ''} exported`);
    } catch (error) {
      toast.error('Failed to export contacts');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="sticky top-0 z-40 bg-[--sage] text-white shadow-lg border-b-2 border-[--navy]"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <div>
                <p className="font-medium">
                  {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs opacity-80">
                  {allSelected ? 'All contacts selected' : `${totalContacts - selectedCount} not selected`}
                </p>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              {/* Add Tags */}
              <button
                onClick={() => setShowTagSelector(true)}
                disabled={isProcessing}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Add Tags</span>
              </button>

              {/* Export */}
              <button
                onClick={handleBulkExport}
                disabled={isProcessing}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Email */}
              <button
                onClick={onBulkEmail}
                disabled={isProcessing}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </button>

              {/* Delete */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>

              {/* Close */}
              <button
                onClick={onDeselectAll}
                disabled={isProcessing}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                title="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tag Selector Modal */}
      <AnimatePresence>
        {showTagSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif text-[--navy]">Add Tags to Contacts</h3>
                <button
                  onClick={() => setShowTagSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-[--charcoal] opacity-60 mb-4">
                Select tags to add to {selectedCount} selected contact{selectedCount !== 1 ? 's' : ''}
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {availableTags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[--sage] border-gray-300 rounded focus:ring-2 focus:ring-[--sage]"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm text-[--navy]">{tag.name}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowTagSelector(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkTag([])} // TODO: Get selected tag IDs
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Adding...' : 'Add Tags'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-serif text-[--navy] mb-2">
                    Delete {selectedCount} Contact{selectedCount !== 1 ? 's' : ''}?
                  </h3>
                  <p className="text-sm text-[--charcoal] opacity-80 mb-3">
                    This will permanently delete the selected contacts and all associated data.
                    This action cannot be undone.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-900">
                      <strong>Warning:</strong> Associated grief journeys, interactions, and
                      history will also be deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Deleting...' : 'Delete Contacts'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
