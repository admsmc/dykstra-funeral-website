'use client';

import { useState } from 'react';
import { X, Clock, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimeEntryData) => void;
  selectedDate?: string;
  isSubmitting?: boolean;
}

export interface TimeEntryData {
  date: string;
  hours: number;
  projectCode?: string;
  caseId?: string;
  notes?: string;
}

export function CreateTimeEntryModal({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
  isSubmitting = false,
}: CreateTimeEntryModalProps) {
  const [formData, setFormData] = useState<TimeEntryData>({
    date: selectedDate || new Date().toISOString().split('T')[0],
    hours: 8,
    projectCode: '',
    caseId: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (formData.hours <= 0) {
      newErrors.hours = 'Hours must be greater than 0';
    }

    if (formData.hours > 24) {
      newErrors.hours = 'Hours cannot exceed 24 in a day';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        date: selectedDate || new Date().toISOString().split('T')[0],
        hours: 8,
        projectCode: '',
        caseId: '',
        notes: '',
      });
      setErrors({});
      onClose();
    }
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Add Time Entry</h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Date Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      errors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>

                {/* Hours Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4" />
                    Hours *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        errors.hours ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                      required
                    />
                    <div className="absolute right-4 top-3 text-gray-400 text-sm">
                      hours
                    </div>
                  </div>
                  {errors.hours && (
                    <p className="mt-1 text-sm text-red-600">{errors.hours}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter hours in 0.5 increments (e.g., 7.5 for 7 hours 30 minutes)
                  </p>
                </div>

                {/* Project Code Input */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Project Code
                    <span className="text-gray-400 ml-1">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                    placeholder="e.g., ADMIN, CASE-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Case ID Input */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Case ID
                    <span className="text-gray-400 ml-1">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.caseId}
                    onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                    placeholder="e.g., C-2024-123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Link this time entry to a specific case for tracking
                  </p>
                </div>

                {/* Notes Textarea */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    Notes
                    <span className="text-gray-400 ml-1">(optional)</span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Describe what you worked on..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    disabled={isSubmitting}
                  />
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      Add Entry
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
