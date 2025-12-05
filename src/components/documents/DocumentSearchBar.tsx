"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FileText, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

interface DocumentSearchBarProps {
  onSearch?: (query: string) => void;
  className?: string;
}

const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = "documentRecentSearches";

export default function DocumentSearchBar({
  onSearch,
  className = "",
}: DocumentSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch search results
  const { data: results, isLoading } = trpc.documentLibrary.search.useQuery(
    { query, limit: 5 },
    { enabled: query.length > 0 }
  );

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Keyboard shortcut: Cmd+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "d") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // ESC to close results
      if (e.key === "Escape" && isFocused) {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to recent searches
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

    // Trigger search
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/staff/documents?search=${encodeURIComponent(searchQuery)}`);
    }

    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Death Certificate":
        return "bg-red-100 text-red-700";
      case "Contract":
        return "bg-blue-100 text-blue-700";
      case "Invoice":
        return "bg-green-100 text-green-700";
      case "Photo":
        return "bg-purple-100 text-purple-700";
      case "Permit":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const showDropdown = isFocused && (query.length > 0 || recentSearches.length > 0);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder="Search documents... (⌘⇧D)"
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent transition"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsFocused(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto"
            >
              {/* Search Results */}
              {query.length > 0 && (
                <div>
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Searching...
                    </div>
                  ) : results && results.length > 0 ? (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                        Results
                      </div>
                      {results.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => router.push(`/staff/documents/${doc.id}`)}
                          className="w-full px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(
                                    doc.category
                                  )}`}
                                >
                                  {doc.category}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(doc.size)}
                                </span>
                                {doc.tags.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    • {doc.tags.slice(0, 2).join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No documents found
                    </div>
                  )}
                </div>
              )}

              {/* Recent Searches */}
              {query.length === 0 && recentSearches.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span>Recent Searches</span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs font-normal text-[--navy] hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full px-4 py-2 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{search}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
