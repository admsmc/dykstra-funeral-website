'use client';

import { motion } from 'framer-motion';
import { History, Calendar } from 'lucide-react';

interface ContactHistoryTimelineProps {
  history: any[];
}

export function ContactHistoryTimeline({ history }: ContactHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-[--sage]" />
          <h2 className="text-lg font-serif text-[--navy]">Change History</h2>
        </div>
        <div className="text-center py-12">
          <History className="w-12 h-12 text-[--charcoal] opacity-20 mx-auto mb-3" />
          <p className="text-[--charcoal] opacity-60 text-sm">No history available</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-[--sage]" />
        <h2 className="text-lg font-serif text-[--navy]">Change History (SCD Type 2)</h2>
      </div>

      <div className="space-y-4">
        {history.map((record, idx) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="border-l-2 border-[--sage] pl-4 py-2"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[--navy]">
                Version {record.version}
              </span>
              <div className="flex items-center gap-1 text-xs text-[--charcoal] opacity-60">
                <Calendar className="w-3 h-3" />
                {new Date(record.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm text-[--charcoal]">
              <p>{record.firstName} {record.lastName}</p>
              {record.email && <p className="text-xs opacity-70">{record.email}</p>}
              {record.phone && <p className="text-xs opacity-70">{record.phone}</p>}
              {record.tags && record.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {record.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-[--sage] bg-opacity-20 text-[--navy] rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
