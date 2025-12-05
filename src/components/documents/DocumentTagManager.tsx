"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

interface DocumentTagManagerProps {
  documentId: string;
  initialTags: string[];
  onTagsUpdate?: (tags: string[]) => void;
  className?: string;
}

const SUGGESTED_TAGS_BY_CATEGORY: Record<string, string[]> = {
  "Death Certificate": ["urgent", "verified", "pending-verification", "original", "copy"],
  Contract: ["signed", "pending", "archived", "active", "expired", "template"],
  Invoice: ["paid", "unpaid", "overdue", "partial", "refunded", "2024"],
  Photo: ["memorial", "service", "family-approved", "portrait", "ceremony"],
  Permit: ["approved", "pending", "county", "state", "facility", "annual"],
  Other: ["important", "needs-review", "archived", "draft", "final"],
};

export default function DocumentTagManager({
  documentId,
  initialTags,
  onTagsUpdate,
  className = "",
}: DocumentTagManagerProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all available tags for autocomplete
  const { data: availableTags } = trpc.documentLibrary.getAllTags.useQuery();

  // Update mutation
  const updateMutation = trpc.documentLibrary.update.useMutation({
    onSuccess: (data) => {
      setTags(data.tags);
      if (onTagsUpdate) onTagsUpdate(data.tags);
    },
  });

  // Filter suggestions based on input
  const filteredSuggestions = availableTags?.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(tag) &&
      inputValue.length > 0
  );

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag || tags.includes(trimmedTag)) {
      setInputValue("");
      return;
    }

    const updatedTags = [...tags, trimmedTag];
    updateMutation.mutate({
      id: documentId,
      tags: updatedTags,
    });

    setInputValue("");
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    updateMutation.mutate({
      id: documentId,
      tags: updatedTags,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setInputValue("");
    }
  };

  const getTagColor = (tag: string) => {
    // Generate consistent color based on tag
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-purple-100 text-purple-700",
      "bg-amber-100 text-amber-700",
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
    ];
    const index = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className={`${className}`}>
      {/* Existing Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${getTagColor(
                tag
              )}`}
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-600 transition"
                disabled={updateMutation.isPending}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Tag Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Add tag..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--navy] pr-8"
              disabled={updateMutation.isPending}
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleAddTag(inputValue)}
            disabled={!inputValue.trim() || updateMutation.isPending}
            className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions && filteredSuggestions.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSuggestions(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto"
              >
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                    Suggestions
                  </p>
                  {filteredSuggestions.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition flex items-center gap-2"
                    >
                      <Tag className="w-3 h-3 text-gray-400" />
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Status */}
      {updateMutation.isPending && (
        <p className="text-xs text-gray-500 mt-2">Updating tags...</p>
      )}
      {updateMutation.isError && (
        <p className="text-xs text-red-600 mt-2">Failed to update tags</p>
      )}
    </div>
  );
}
