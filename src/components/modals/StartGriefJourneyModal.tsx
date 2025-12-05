'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { Heart, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface StartGriefJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  onSuccess: () => void;
}

export function StartGriefJourneyModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  onSuccess,
}: StartGriefJourneyModalProps) {
  const [formData, setFormData] = useState({
    decedentRelationshipId: '',
    serviceAnniversaryDate: '',
  });

  const startJourneyMutation = trpc.contact.startGriefJourney.useMutation({
    onSuccess: () => {
      toast.success('Grief journey started');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to start grief journey: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.decedentRelationshipId || !formData.serviceAnniversaryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    startJourneyMutation.mutate({
      contactId,
      decedentRelationshipId: formData.decedentRelationshipId,
      serviceAnniversaryDate: new Date(formData.serviceAnniversaryDate).toISOString(),
    });
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
              <div className="w-10 h-10 rounded-full bg-[--sage] bg-opacity-20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-[--sage]" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-[--navy]">Start Grief Journey</h2>
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
            {/* Decedent Relationship (simplified) */}
            <div>
              <label className="block text-sm font-medium text-[--navy] mb-2">
                Case / Decedent ID *
              </label>
              <input
                type="text"
                required
                value={formData.decedentRelationshipId}
                onChange={(e) =>
                  setFormData({ ...formData, decedentRelationshipId: e.target.value })
                }
                placeholder="Enter case ID"
                className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
              />
              <p className="text-xs text-[--charcoal] opacity-60 mt-1">
                Link this contact to a specific case
              </p>
            </div>

            {/* Service Anniversary Date */}
            <div>
              <label className="block text-sm font-medium text-[--navy] mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Service Anniversary Date *
              </label>
              <input
                type="date"
                required
                value={formData.serviceAnniversaryDate}
                onChange={(e) =>
                  setFormData({ ...formData, serviceAnniversaryDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
              />
              <p className="text-xs text-[--charcoal] opacity-60 mt-1">
                The date of the service for check-in reminders
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>What happens next:</strong>
              </p>
              <ul className="mt-1 text-xs text-blue-800 space-y-0.5 list-disc list-inside">
                <li>Contact will be set to "Shock" grief stage</li>
                <li>Check-in reminders will be scheduled</li>
                <li>Anniversary notifications will be enabled</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={startJourneyMutation.isLoading}
                className="flex-1 px-4 py-2 border-2 border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={startJourneyMutation.isLoading}
                className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Heart className="w-4 h-4" />
                {startJourneyMutation.isLoading ? 'Starting...' : 'Start Journey'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
