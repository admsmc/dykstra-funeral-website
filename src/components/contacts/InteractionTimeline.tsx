'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Phone, Mail, Heart, Calendar } from 'lucide-react';

interface InteractionTimelineProps {
  contactId: string;
  onRefresh: () => void;
}

export function InteractionTimeline({ contactId, onRefresh }: InteractionTimelineProps) {
  // TODO: Implement with contact.addNote endpoint
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif text-[--navy]">Interaction History</h2>
        <button className="px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all text-sm">
          Add Interaction
        </button>
      </div>

      {/* Empty state for now */}
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-[--charcoal] opacity-20 mx-auto mb-3" />
        <p className="text-[--charcoal] opacity-60 text-sm">No interactions recorded yet</p>
        <p className="text-[--charcoal] opacity-40 text-xs mt-1">
          Track phone calls, meetings, emails, and grief check-ins
        </p>
      </div>
    </motion.div>
  );
}
