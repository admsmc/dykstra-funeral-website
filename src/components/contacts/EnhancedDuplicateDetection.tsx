'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Users, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronUp,
  GitMerge,
  Eye,
  X
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface DuplicateGroup {
  score: number;
  contacts: Contact[];
}

interface EnhancedDuplicateDetectionProps {
  groups: DuplicateGroup[];
  onMerge: (sourceId: string, targetId: string) => void;
  onDismiss: (groupIndex: number) => void;
}

export function EnhancedDuplicateDetection({
  groups,
  onMerge,
  onDismiss,
}: EnhancedDuplicateDetectionProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));
  const [selectedForMerge, setSelectedForMerge] = useState<{
    groupIndex: number;
    sourceId: string;
    targetId: string;
  } | null>(null);

  const toggleGroup = (index: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGroups(newExpanded);
  };

  const getConfidenceLevel = (score: number): {
    label: string;
    color: string;
    bgColor: string;
  } => {
    if (score >= 0.9) {
      return { label: 'High', color: 'text-red-700', bgColor: 'bg-red-100' };
    } else if (score >= 0.75) {
      return { label: 'Medium', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    } else {
      return { label: 'Low', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    }
  };

  const handleSelectForMerge = (groupIndex: number, sourceId: string, targetId: string) => {
    setSelectedForMerge({ groupIndex, sourceId, targetId });
    onMerge(sourceId, targetId);
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-amber-50 border border-amber-200 rounded-lg p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-[--navy]">
            {groups.length} Potential Duplicate{groups.length !== 1 ? 's' : ''} Found
          </h3>
        </div>
        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
          Data Quality Alert
        </span>
      </div>

      {/* Duplicate Groups */}
      <div className="space-y-3">
        {groups.map((group, groupIndex) => {
          const isExpanded = expandedGroups.has(groupIndex);
          const confidence = getConfidenceLevel(group.score);

          return (
            <motion.div
              key={groupIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
              className="bg-white rounded-lg border border-amber-200 overflow-hidden"
            >
              {/* Group Header */}
              <div
                onClick={() => toggleGroup(groupIndex)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${confidence.bgColor} ${confidence.color}`}>
                    {confidence.label} Match
                  </div>
                  <span className="text-sm font-medium text-[--navy]">
                    {group.contacts.length} similar contacts
                  </span>
                  <span className="text-xs text-[--charcoal] opacity-60">
                    Score: {(group.score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[--charcoal]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[--charcoal]" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-gray-200"
                >
                  {/* Side-by-Side Comparison */}
                  <div className="p-4">
                    <p className="text-xs text-[--charcoal] opacity-60 mb-3">
                      Review these contacts and merge duplicates to maintain data quality
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.contacts.map((contact, contactIndex) => (
                        <div
                          key={contact.id}
                          className="border border-gray-200 rounded-lg p-3 hover:border-[--sage] transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-[--navy] mb-0.5">
                                {contact.firstName} {contact.lastName}
                              </h4>
                              <span className="text-xs text-[--charcoal] opacity-60">
                                Contact #{contactIndex + 1}
                              </span>
                            </div>
                            <Users className="w-4 h-4 text-[--sage]" />
                          </div>

                          <div className="space-y-1 text-xs">
                            {contact.email && (
                              <div className="flex items-center gap-1 text-[--charcoal] opacity-70">
                                <Mail className="w-3 h-3" />
                                <span>{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1 text-[--charcoal] opacity-70">
                                <Phone className="w-3 h-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {!contact.email && !contact.phone && (
                              <span className="text-[--charcoal] opacity-40">
                                No contact info
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                            <button
                              onClick={() => window.open(`/staff/contacts/${contact.id}`, '_blank')}
                              className="flex-1 px-2 py-1 text-xs bg-gray-100 text-[--navy] rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            {contactIndex === 0 && group.contacts.length > 1 && (
                              <button
                                onClick={() =>
                                  handleSelectForMerge(
                                    groupIndex,
                                    group.contacts[1].id,
                                    contact.id
                                  )
                                }
                                className="flex-1 px-2 py-1 text-xs bg-[--sage] text-white rounded hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1"
                              >
                                <GitMerge className="w-3 h-3" />
                                Keep This
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Merge Instructions */}
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-900">
                        <strong>Merge Tip:</strong> Click "Keep This" on the contact you want
                        to keep. The other contact will be merged into it, and you'll be able
                        to choose which fields to keep.
                      </p>
                    </div>
                  </div>

                  {/* Group Actions */}
                  <div className="border-t border-gray-200 p-3 bg-gray-50 flex items-center justify-between">
                    <button
                      onClick={() => onDismiss(groupIndex)}
                      className="text-xs text-[--charcoal] opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Not duplicates
                    </button>
                    <span className="text-xs text-[--charcoal] opacity-60">
                      Group {groupIndex + 1} of {groups.length}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-amber-300">
        <p className="text-xs text-amber-800">
          💡 <strong>Data Quality:</strong> Merging duplicates helps maintain accurate
          records and prevents confusion. Review each group carefully before merging.
        </p>
      </div>
    </motion.div>
  );
}
