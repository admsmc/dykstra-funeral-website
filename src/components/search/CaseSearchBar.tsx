'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, User, X, Clock, Command, ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

interface CaseSearchBarProps {
  className?: string;
}

interface SearchFilters {
  status?: 'INQUIRY' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  type?: 'AT_NEED' | 'PRE_NEED' | 'INQUIRY';
  dateFrom?: string;
  dateTo?: string;
}

export function CaseSearchBar({ className = '' }: CaseSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch search results (debounced via React Query)
  const { data: searchResults, isLoading } = trpc.case.listAll.useQuery(
    {
      limit: 5,
      status: filters.status,
      type: filters.type,
    },
    {
      enabled: query.length >= 2 || Object.keys(filters).length > 0,
    }
  );

  // Filter results by query string (client-side fuzzy search)
  const filteredResults = searchResults?.items.filter((case_) =>
    case_.decedentName.toLowerCase().includes(query.toLowerCase()) ||
    case_.businessKey?.toLowerCase().includes(query.toLowerCase()) ||
    case_.id.toLowerCase().includes(query.toLowerCase())
  );

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('case-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowFilters(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Arrow key navigation
  useEffect(() => {
    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!isOpen || !filteredResults) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault();
        handleSelectCase(filteredResults[selectedIndex].id);
      }
    };

    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, [isOpen, filteredResults, selectedIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('case-recent-searches', JSON.stringify(updated));
  };

  const handleSelectCase = (caseId: string) => {
    saveRecentSearch(query);
    setQuery('');
    setIsOpen(false);
    router.push(`/staff/cases/${caseId}`);
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearQuery = () => {
    setQuery('');
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const applyFilters = () => {
    // Update URL with filters
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    
    router.push(`/staff/cases?${params.toString()}`);
    setShowFilters(false);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFilterCount = Object.keys(filters).filter(k => filters[k as keyof SearchFilters]).length;
  const showResults = isOpen && query.length >= 2;
  const showRecentSearches = isOpen && query.length === 0 && recentSearches.length > 0 && !showFilters;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-4 h-4 text-[--charcoal] opacity-40" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search cases..."
          className="w-full pl-10 pr-32 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage] focus:border-transparent transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={clearQuery}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[--charcoal] opacity-40" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded transition-colors ${
              activeFilterCount > 0 ? 'bg-[--sage] text-white' : 'hover:bg-gray-100'
            }`}
            title="Advanced filters"
          >
            <Filter className="w-3.5 h-3.5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="px-2 py-0.5 bg-gray-100 rounded text-xs text-[--charcoal] opacity-60 flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Advanced Filters Dropdown */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4"
          >
            <div className="space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-[--navy] mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['INQUIRY', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilters({ ...filters, status: filters.status === status ? undefined : status })}
                      className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        filters.status === status
                          ? 'bg-[--sage] border-[--sage] text-white'
                          : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-[--navy] mb-2">Case Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['AT_NEED', 'PRE_NEED', 'INQUIRY'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters({ ...filters, type: filters.type === type ? undefined : type })}
                      className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        filters.type === type
                          ? 'bg-[--sage] border-[--sage] text-white'
                          : 'border-gray-300 text-[--navy] hover:border-[--sage]'
                      }`}
                    >
                      {type.replace('_', '-')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-[--navy] mb-2">Service Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--charcoal] opacity-40 pointer-events-none" />
                    <input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      placeholder="From"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--charcoal] opacity-40 pointer-events-none" />
                    <input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all"
                >
                  Clear
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && !showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 text-center text-sm text-[--charcoal] opacity-60">
                Searching...
              </div>
            ) : filteredResults && filteredResults.length > 0 ? (
              <div className="py-2">
                {filteredResults.map((case_, index) => (
                  <button
                    key={case_.id}
                    onClick={() => handleSelectCase(case_.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-[--cream] transition-colors ${
                      index === selectedIndex ? 'bg-[--cream]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[--navy] truncate">
                          {case_.decedentName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[--charcoal] opacity-60">
                            {case_.businessKey || case_.id.slice(0, 8)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            case_.status === 'active' ? 'bg-green-100 text-green-700' :
                            case_.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            case_.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {case_.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-[--charcoal] opacity-60">
                        {case_.serviceDate
                          ? new Date(case_.serviceDate).toLocaleDateString()
                          : 'No date'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-[--charcoal] opacity-60">
                No cases found for &quot;{query}&quot;
              </div>
            )}
          </motion.div>
        )}

        {/* Recent Searches */}
        {showRecentSearches && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-gray-200">
              <p className="text-xs font-medium text-[--charcoal] opacity-60 uppercase tracking-wide">
                Recent Searches
              </p>
            </div>
            <div className="py-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(search)}
                  className="w-full px-4 py-2 text-left hover:bg-[--cream] transition-colors flex items-center gap-2 text-sm text-[--navy]"
                >
                  <Clock className="w-4 h-4 text-[--charcoal] opacity-40" />
                  {search}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
