'use client';

import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { Heart, Calendar, MessageCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface GriefJourneyCardProps {
  contact: any;
  onRefresh: () => void;
}

const GRIEF_STAGES = [
  { value: 'shock', label: 'Shock', color: 'bg-gray-100 text-gray-800' },
  { value: 'denial', label: 'Denial', color: 'bg-blue-100 text-blue-800' },
  { value: 'anger', label: 'Anger', color: 'bg-red-100 text-red-800' },
  { value: 'bargaining', label: 'Bargaining', color: 'bg-amber-100 text-amber-800' },
  { value: 'depression', label: 'Depression', color: 'bg-purple-100 text-purple-800' },
  { value: 'acceptance', label: 'Acceptance', color: 'bg-green-100 text-green-800' },
];

export function GriefJourneyCard({ contact, onRefresh }: GriefJourneyCardProps) {
  // Update grief stage mutation
  const updateGriefStageMutation = trpc.contact.updateGriefStage.useMutation({
    onSuccess: () => {
      toast.success('Grief stage updated');
      onRefresh();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Record check-in mutation
  const recordCheckInMutation = trpc.contact.recordGriefCheckIn.useMutation({
    onSuccess: () => {
      toast.success('Check-in recorded');
      onRefresh();
    },
    onError: (error) => {
      toast.error(`Failed to record check-in: ${error.message}`);
    },
  });

  const handleStageChange = (stage: string) => {
    updateGriefStageMutation.mutate({
      contactId: contact.id,
      griefStage: stage as any,
    });
  };

  const handleRecordCheckIn = () => {
    recordCheckInMutation.mutate({
      contactId: contact.id,
    });
  };

  const currentStage = GRIEF_STAGES.find((s) => s.value === contact.griefStage);
  const daysSinceStart = contact.griefJourneyStartedAt
    ? Math.floor(
        (Date.now() - new Date(contact.griefJourneyStartedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[--sage]" />
          <h2 className="text-lg font-serif text-[--navy]">Grief Journey</h2>
        </div>
        {contact.needsGriefCheckIn && (
          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
            Check-in Due
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Current Stage */}
        <div>
          <label className="text-xs text-[--charcoal] opacity-60 mb-2 block">Current Stage</label>
          <div className="flex flex-wrap gap-2">
            {GRIEF_STAGES.map((stage) => (
              <button
                key={stage.value}
                onClick={() => handleStageChange(stage.value)}
                disabled={updateGriefStageMutation.isLoading}
                className={`px-3 py-1 text-xs rounded-full transition-all disabled:opacity-50 ${
                  contact.griefStage === stage.value
                    ? stage.color + ' font-medium ring-2 ring-[--sage] ring-offset-1'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* Journey Progress */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[--sage] border-opacity-20">
          <div>
            <div className="flex items-center gap-1 text-xs text-[--charcoal] opacity-60 mb-1">
              <Calendar className="w-3 h-3" />
              Journey Started
            </div>
            <p className="text-sm font-medium text-[--navy]">
              {contact.griefJourneyStartedAt
                ? new Date(contact.griefJourneyStartedAt).toLocaleDateString()
                : 'N/A'}
            </p>
            <p className="text-xs text-[--charcoal] opacity-60 mt-0.5">
              {daysSinceStart} days ago
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-xs text-[--charcoal] opacity-60 mb-1">
              <MessageCircle className="w-3 h-3" />
              Last Check-In
            </div>
            <p className="text-sm font-medium text-[--navy]">
              {contact.lastGriefCheckIn
                ? new Date(contact.lastGriefCheckIn).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
        </div>

        {/* Service Anniversary */}
        {contact.serviceAnniversaryDate && (
          <div className="pt-4 border-t border-[--sage] border-opacity-20">
            <div className="flex items-center gap-1 text-xs text-[--charcoal] opacity-60 mb-1">
              <TrendingUp className="w-3 h-3" />
              Service Anniversary
            </div>
            <p className="text-sm font-medium text-[--navy]">
              {new Date(contact.serviceAnniversaryDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Record Check-In Button */}
        <button
          onClick={handleRecordCheckIn}
          disabled={recordCheckInMutation.isLoading}
          className="w-full px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <MessageCircle className="w-4 h-4" />
          {recordCheckInMutation.isLoading ? 'Recording...' : 'Record Check-In'}
        </button>
      </div>
    </motion.div>
  );
}
