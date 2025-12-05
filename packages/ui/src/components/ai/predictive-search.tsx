'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'trending' | 'recent' | 'suggested';
}

interface PredictiveSearchProps {
  value: string;
  onChange: (value: string) => void;
  results: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function PredictiveSearch({
  value,
  onChange,
  results,
  onSelectResult,
  isLoading = false,
  placeholder = "Search...",
  className,
}: PredictiveSearchProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [showResults, setShowResults] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      onSelectResult(results[selectedIndex]);
      setShowResults(false);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  React.useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'trending':
        return '📈';
      case 'recent':
        return '🕐';
      case 'suggested':
        return '💡';
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700",
            "bg-white dark:bg-neutral-800",
            "text-neutral-900 dark:text-neutral-100",
            "placeholder:text-neutral-400",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all"
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <motion.button
                  key={result.id}
                  type="button"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onSelectResult(result);
                    setShowResults(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors",
                    "flex items-center gap-3",
                    selectedIndex === index
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  )}
                >
                  <span className="text-lg">{getTypeIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  {result.type === 'trending' && (
                    <span className="text-xs font-medium text-primary">
                      Trending
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
