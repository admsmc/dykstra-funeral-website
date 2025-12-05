'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Calendar } from 'lucide-react';

interface ContactFilters {
  contactType: string[];
  tags: string[];
  emailOptIn: boolean | null;
  smsOptIn: boolean | null;
  griefJourneyStatus: string[];
  createdAfter: string | null;
  createdBefore: string | null;
  updatedAfter: string | null;
  updatedBefore: string | null;
}

interface ContactFilterPanelProps {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
  availableTags: string[];
  className?: string;
}

export function ContactFilterPanel({
  filters,
  onFiltersChange,
  availableTags,
  className = '',
}: ContactFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const contactTypes = [
    { value: 'primary', label: 'Primary Contact' },
    { value: 'secondary', label: 'Secondary Contact' },
    { value: 'professional', label: 'Professional' },
    { value: 'referral', label: 'Referral Source' },
  ];

  const griefJourneyStatuses = [
    { value: 'Shock & Denial', label: 'Shock & Denial' },
    { value: 'Pain & Guilt', label: 'Pain & Guilt' },
    { value: 'Anger & Bargaining', label: 'Anger & Bargaining' },
    { value: 'Depression & Loneliness', label: 'Depression & Loneliness' },
    { value: 'Reconstruction', label: 'Reconstruction' },
    { value: 'Acceptance & Hope', label: 'Acceptance & Hope' },
  ];

  const toggleContactType = (type: string) => {
    const updated = filters.contactType.includes(type)
      ? filters.contactType.filter((t) => t !== type)
      : [...filters.contactType, type];
    onFiltersChange({ ...filters, contactType: updated });
  };

  const toggleTag = (tag: string) => {
    const updated = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: updated });
  };

  const toggleGriefStatus = (status: string) => {
    const updated = filters.griefJourneyStatus.includes(status)
      ? filters.griefJourneyStatus.filter((s) => s !== status)
      : [...filters.griefJourneyStatus, status];
    onFiltersChange({ ...filters, griefJourneyStatus: updated });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      contactType: [],
      tags: [],
      emailOptIn: null,
      smsOptIn: null,
      griefJourneyStatus: [],
      createdAfter: null,
      createdBefore: null,
      updatedAfter: null,
      updatedBefore: null,
    });
  };

  const activeFilterCount =
    filters.contactType.length +
    filters.tags.length +
    filters.griefJourneyStatus.length +
    (filters.emailOptIn !== null ? 1 : 0) +
    (filters.smsOptIn !== null ? 1 : 0) +
    (filters.createdAfter ? 1 : 0) +
    (filters.createdBefore ? 1 : 0) +
    (filters.updatedAfter ? 1 : 0) +
    (filters.updatedBefore ? 1 : 0);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[--sage]" />
          <span className="font-medium text-[--navy]">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-[--sage] text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-sm text-[--sage] hover:underline"
            >
              Clear All
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 text-[--charcoal] opacity-60 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Filter Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Contact Type */}
              <div>
                <label className="block text-sm font-medium text-[--navy] mb-2">
                  Contact Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {contactTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => toggleContactType(type.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        filters.contactType.includes(type.value)
                          ? 'bg-[--sage] border-[--sage] text-white'
                          : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-[--navy] mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.length > 0 ? (
                    availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                          filters.tags.includes(tag)
                            ? 'bg-[--sage] border-[--sage] text-white'
                            : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-[--charcoal] opacity-60">No tags available</p>
                  )}
                </div>
              </div>

              {/* Opt-Ins */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[--navy] mb-2">
                    Email Opt-In
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          emailOptIn: filters.emailOptIn === true ? null : true,
                        })
                      }
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        filters.emailOptIn === true
                          ? 'bg-[--sage] border-[--sage] text-white'
                          : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          emailOptIn: filters.emailOptIn === false ? null : false,
                        })
                      }
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        filters.emailOptIn === false
                          ? 'bg-[--sage] border-[--sage] text-white'
                          : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[--navy] mb-2">
                    SMS Opt-In
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          smsOptIn: filters.smsOptIn === true ? null : true,
                        })
                      }
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        filters.smsOptIn === true
                          ? 'bg-[--sage] border-[--sage] text-white'
                          : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          smsOptIn: filters.smsOptIn === false ? null : false,
                        })
                      }
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        filters.smsOptIn === false
                          ? 'bg-[--sage] border-[--sage] text-white'
                          : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Grief Journey Status */}
              <div>
                <label className="block text-sm font-medium text-[--navy] mb-2">
                  Grief Journey Stage
                </label>
                <div className="flex flex-wrap gap-2">
                  {griefJourneyStatuses.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => toggleGriefStatus(status.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        filters.griefJourneyStatus.includes(status.value)
                          ? 'bg-[--sage] border-[--sage] text-white'
                          : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-4">
                {/* Created Date Range */}
                <div>
                  <label className="block text-sm font-medium text-[--navy] mb-2">
                    Created Date
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--charcoal] opacity-40 pointer-events-none" />
                      <input
                        type="date"
                        value={filters.createdAfter || ''}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            createdAfter: e.target.value || null,
                          })
                        }
                        placeholder="From"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--charcoal] opacity-40 pointer-events-none" />
                      <input
                        type="date"
                        value={filters.createdBefore || ''}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            createdBefore: e.target.value || null,
                          })
                        }
                        placeholder="To"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      />
                    </div>
                  </div>
                </div>

                {/* Updated Date Range */}
                <div>
                  <label className="block text-sm font-medium text-[--navy] mb-2">
                    Updated Date
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--charcoal] opacity-40 pointer-events-none" />
                      <input
                        type="date"
                        value={filters.updatedAfter || ''}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            updatedAfter: e.target.value || null,
                          })
                        }
                        placeholder="From"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--charcoal] opacity-40 pointer-events-none" />
                      <input
                        type="date"
                        value={filters.updatedBefore || ''}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            updatedBefore: e.target.value || null,
                          })
                        }
                        placeholder="To"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
