'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// Note: Icons will be imported from lucide-react when used
// For now, using placeholder divs to avoid dependency issues
interface AIInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => Promise<void>;
  placeholder?: string;
  isLoading?: boolean;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  className?: string;
}

export function AIInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask AI for help...",
  isLoading = false,
  suggestions = [],
  onSelectSuggestion,
  className,
}: AIInputProps) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      await onSubmit(value);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          {/* Sparkle icon indicator */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-primary">
            ✨
          </div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700",
              "bg-white dark:bg-neutral-800",
              "text-neutral-900 dark:text-neutral-100",
              "placeholder:text-neutral-400",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all"
            )}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all",
            "bg-primary text-white",
            "hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
        >
          {isLoading ? '...' : 'Ask'}
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        >
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-sm text-neutral-700 dark:text-neutral-300"
              onClick={() => onSelectSuggestion?.(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
