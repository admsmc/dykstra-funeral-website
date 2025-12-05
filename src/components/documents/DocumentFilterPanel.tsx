"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

interface DocumentFilterPanelProps {
  onFilterChange: (filters: DocumentFilters) => void;
  className?: string;
}

export interface DocumentFilters {
  categories: string[];
  tags: string[];
  uploadedBy: string[];
  startDate?: Date;
  endDate?: Date;
}

const DOCUMENT_CATEGORIES = [
  "Death Certificate",
  "Contract",
  "Invoice",
  "Photo",
  "Permit",
  "Other",
];

export default function DocumentFilterPanel({
  onFilterChange,
  className = "",
}: DocumentFilterPanelProps) {
  const [filters, setFilters] = useState<DocumentFilters>({
    categories: [],
    tags: [],
    uploadedBy: [],
  });

  const [expandedSections, setExpandedSections] = useState({
    category: true,
    tags: true,
    uploader: true,
    date: false,
  });

  // Fetch available tags and uploaders
  const { data: availableTags } = trpc.documentLibrary.getAllTags.useQuery();
  const { data: availableUploaders } =
    trpc.documentLibrary.getAllUploaders.useQuery();

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const toggleUploader = (uploader: string) => {
    setFilters((prev) => ({
      ...prev,
      uploadedBy: prev.uploadedBy.includes(uploader)
        ? prev.uploadedBy.filter((u) => u !== uploader)
        : [...prev.uploadedBy, uploader],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      tags: [],
      uploadedBy: [],
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    filters.uploadedBy.length > 0 ||
    filters.startDate ||
    filters.endDate;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Death Certificate":
        return "bg-red-100 text-red-700 border-red-200";
      case "Contract":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Invoice":
        return "bg-green-100 text-green-700 border-green-200";
      case "Photo":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Permit":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-[--navy] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Active Filters</p>
          <div className="flex flex-wrap gap-2">
            {filters.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-gray-50"
              >
                {category}
                <button
                  onClick={() => toggleCategory(category)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-gray-50"
              >
                #{tag}
                <button onClick={() => toggleTag(tag)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.uploadedBy.map((uploader) => (
              <span
                key={uploader}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-gray-50"
              >
                {uploader}
                <button
                  onClick={() => toggleUploader(uploader)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection("category")}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <span className="font-medium text-gray-900">Category</span>
          {expandedSections.category ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.category && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2">
                {DOCUMENT_CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4 text-[--navy] border-gray-300 rounded focus:ring-[--navy]"
                    />
                    <span
                      className={`text-sm px-2 py-0.5 rounded border ${getCategoryColor(
                        category
                      )}`}
                    >
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tags Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection("tags")}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <span className="font-medium text-gray-900">Tags</span>
          {expandedSections.tags ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.tags && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
                {availableTags && availableTags.length > 0 ? (
                  availableTags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="w-4 h-4 text-[--navy] border-gray-300 rounded focus:ring-[--navy]"
                      />
                      <span className="text-sm text-gray-700">#{tag}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No tags available</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Uploader Filter */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection("uploader")}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <span className="font-medium text-gray-900">Uploaded By</span>
          {expandedSections.uploader ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.uploader && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
                {availableUploaders && availableUploaders.length > 0 ? (
                  availableUploaders.map((uploader) => (
                    <label
                      key={uploader}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.uploadedBy.includes(uploader)}
                        onChange={() => toggleUploader(uploader)}
                        className="w-4 h-4 text-[--navy] border-gray-300 rounded focus:ring-[--navy]"
                      />
                      <span className="text-sm text-gray-700">{uploader}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No uploaders available
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Range Filter */}
      <div>
        <button
          onClick={() => toggleSection("date")}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <span className="font-medium text-gray-900">Date Range</span>
          {expandedSections.date ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.date && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value ? new Date(e.target.value) : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--navy]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value ? new Date(e.target.value) : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--navy]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
