'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { MessageCircle, X, Calendar, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface GriefCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  currentStage?: string;
  onSuccess: () => void;
}

const GRIEF_STAGES = [
  { value: 'shock', label: 'Shock' },
  { value: 'denial', label: 'Denial' },
  { value: 'anger', label: 'Anger' },
  { value: 'bargaining', label: 'Bargaining' },
  { value: 'depression', label: 'Depression' },
  { value: 'acceptance', label: 'Acceptance' },
];

export function GriefCheckInModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  currentStage,
  onSuccess,
}: GriefCheckInModalProps) {
  const [formData, setFormData] = useState({
    griefStage: currentStage || 'shock',
    notes: '',
    scheduleNextCheckIn: false,
    nextCheckInDate: '',
  });

  // Record check-in mutation
  const recordCheckInMutation = trpc.contact.recordGriefCheckIn.useMutation({
    onSuccess: () => {
      toast.success('Check-in recorded successfully');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to record check-in: ${error.message}`);
    },
  });

  // Update grief stage mutation (if changed)
  const updateStageMutation = trpc.contact.updateGriefStage.useMutation({
    onError: (error) => {
      toast.error(`Failed to update grief stage: ${error.message}`);
    },
  });

  // Add note mutation (if notes provided)
  const addNoteMutation = trpc.contact.addNote.useMutation({
    onError: (error) => {
      toast.error(`Failed to save notes: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Record the check-in
      await recordCheckInMutation.mutateAsync({ contactId });

      // 2. Update grief stage if changed
      if (formData.griefStage !== currentStage) {
        await updateStageMutation.mutateAsync({
          contactId,
          griefStage: formData.griefStage as any,
        });
      }

      // 3. Add notes if provided
      if (formData.notes.trim()) {
        await addNoteMutation.mutateAsync({
          contactId,
          content: formData.notes.trim(),
          noteType: 'grief_journey',
        });
      }

      // Success is handled in recordCheckInMutation.onSuccess
    } catch (error) {
      // Error handling is done in individual mutation onError callbacks
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

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
              <div className="w-10 h-10 rounded-full bg-[--sage] bg-opacity-20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[--sage]" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-[--navy]">Record Grief Check-In</h2>
                <p className="text-sm text-[--charcoal] opacity-60 mt-0.5">
                  For {contactName}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Check-In Date (auto-filled to today) */}
            <div>
              <label className="block text-sm font-medium text-[--navy] mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Check-In Date
              </label>
              <input
                type="date"
                value={today}
                disabled
                className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg bg-gray-50 text-[--charcoal]"
              />
              <p className="text-xs text-[--charcoal] opacity-60 mt-1">
                Today's date will be recorded
              </p>
            </div>

            {/* Current Grief Stage */}
            <div>
              <label className="block text-sm font-medium text-[--navy] mb-2 flex items-center gap-1">
                <Heart className="w-4 h-4" />
                Current Grief Stage
              </label>
              <select
                value={formData.griefStage}
                onChange={(e) => setFormData({ ...formData, griefStage: e.target.value })}
                className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
              >
                {GRIEF_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
              {formData.griefStage !== currentStage && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Stage will be updated from {currentStage} to {formData.griefStage}
                </p>
              )}
            </div>

            {/* Notes about conversation */}
            <div>
              <label className="block text-sm font-medium text-[--navy] mb-2">
                Conversation Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="How is the family coping? Any concerns or needs?"
                rows={4}
                className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage] resize-none"
              />
              <p className="text-xs text-[--charcoal] opacity-60 mt-1">
                Document key points from your conversation
              </p>
            </div>

            {/* Schedule Next Check-In (future feature placeholder) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="scheduleNext"
                  checked={formData.scheduleNextCheckIn}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduleNextCheckIn: e.target.checked })
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="scheduleNext" className="text-sm font-medium text-blue-900 cursor-pointer">
                    Schedule next check-in reminder
                  </label>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Automatic reminders based on grief stage (future feature)
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={recordCheckInMutation.isLoading}
                className="flex-1 px-4 py-2 border-2 border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={recordCheckInMutation.isLoading}
                className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                {recordCheckInMutation.isLoading ? 'Recording...' : 'Record Check-In'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
