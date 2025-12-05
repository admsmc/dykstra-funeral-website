'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { Search, User, Phone, Mail, X, Clock, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ContactSearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ContactSearchBar({
  className = '',
  placeholder = 'Search contacts...',
  autoFocus = false,
}: ContactSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch search results (debounced via trpc)
  const { data: searchResults, isLoading } = trpc.contact.search.useQuery(
    { query, limit: 5 },
    {
      enabled: query.length >= 2,
      keepPreviousData: true,
    }
  );

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('contact-recent-searches');
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

      // ESC to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Arrow key navigation
  useEffect(() => {
    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!isOpen || !searchResults) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
        e.preventDefault();
        handleSelectContact(searchResults[selectedIndex].id);
      }
    };

    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, [isOpen, searchResults, selectedIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(
      0,
      5
    );
    setRecentSearches(updated);
    localStorage.setItem('contact-recent-searches', JSON.stringify(updated));
  };

  const handleSelectContact = (contactId: string) => {
    saveRecentSearch(query);
    setQuery('');
    setIsOpen(false);
    router.push(`/staff/contacts/${contactId}`);
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

  const showResults = isOpen && query.length >= 2;
  const showRecentSearches = isOpen && query.length === 0 && recentSearches.length > 0;

  return (
    <div className={`relative ${className}`}>
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
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage] focus:border-transparent transition-all"
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
          <div className="px-2 py-0.5 bg-gray-100 rounded text-xs text-[--charcoal] opacity-60 flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (
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
            ) : searchResults && searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((contact, index) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-[--cream] transition-colors flex items-start gap-3 ${
                      index === selectedIndex ? 'bg-[--cream]' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[--sage] bg-opacity-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-5 h-5 text-[--sage]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[--navy] mb-0.5">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {contact.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[--charcoal] opacity-60">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-[--charcoal] opacity-60">
                            <Phone className="w-3 h-3" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-[--sage] bg-opacity-10 text-[--sage] text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="text-xs text-[--charcoal] opacity-40">
                              +{contact.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-[--charcoal] opacity-60">
                No contacts found for &quot;{query}&quot;
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
