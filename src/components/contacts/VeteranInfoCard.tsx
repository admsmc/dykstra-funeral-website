'use client';

import { motion } from 'framer-motion';
import { Flag, Award } from 'lucide-react';

interface VeteranInfoCardProps {
  contact: any;
  onRefresh: () => void;
}

const MILITARY_BRANCHES = {
  army: 'U.S. Army',
  navy: 'U.S. Navy',
  air_force: 'U.S. Air Force',
  marines: 'U.S. Marine Corps',
  coast_guard: 'U.S. Coast Guard',
  space_force: 'U.S. Space Force',
};

export function VeteranInfoCard({ contact, onRefresh }: VeteranInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flag className="w-5 h-5 text-[--sage]" />
        <h2 className="text-lg font-serif text-[--navy]">Military Service</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-[--charcoal] opacity-60 mb-1 block">Veteran Status</label>
          <p className="text-sm font-medium text-[--navy]">
            {contact.isVeteran ? 'Yes' : 'No'}
          </p>
        </div>

        {contact.militaryBranch && (
          <div>
            <label className="text-xs text-[--charcoal] opacity-60 flex items-center gap-1 mb-1">
              <Award className="w-3 h-3" />
              Branch of Service
            </label>
            <p className="text-sm text-[--navy]">
              {MILITARY_BRANCHES[contact.militaryBranch as keyof typeof MILITARY_BRANCHES] ||
                contact.militaryBranch}
            </p>
          </div>
        )}

        {contact.isVeteran && (
          <div className="pt-3 border-t border-[--sage] border-opacity-20">
            <p className="text-xs text-[--charcoal] opacity-60">
              This family member may be eligible for VA benefits and military honors.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
