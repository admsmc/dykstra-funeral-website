'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ErrorSuggestion {
  id: string;
  text: string;
  action?: () => void;
}

interface FriendlyErrorProps {
  title: string;
  message: string;
  suggestions?: ErrorSuggestion[];
  onRetry?: () => void;
  onDismiss?: () => void;
  show: boolean;
  className?: string;
}

export function FriendlyError({
  title,
  message,
  suggestions = [],
  onRetry,
  onDismiss,
  show,
  className,
}: FriendlyErrorProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-xl border border-error-200 dark:border-error-800",
            className
          )}
        >
          {/* Error icon */}
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-error-100 dark:bg-error-900 flex items-center justify-center"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-error-600 dark:text-error-400"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </motion.div>

            <div className="flex-1 min-w-0">
              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1"
              >
                {title}
              </motion.h3>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-neutral-600 dark:text-neutral-400 mb-4"
              >
                {message}
              </motion.p>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2 mb-4"
                >
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Try these suggestions:
                  </p>
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <motion.li
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <span className="text-error-500 mt-0.5">•</span>
                        {suggestion.action ? (
                          <button
                            onClick={suggestion.action}
                            className="text-sm text-primary hover:underline text-left"
                          >
                            {suggestion.text}
                          </button>
                        ) : (
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {suggestion.text}
                          </span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3"
              >
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      "bg-primary text-white hover:bg-primary/90",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    )}
                  >
                    Try Again
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300",
                      "hover:bg-neutral-200 dark:hover:bg-neutral-600",
                      "focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                    )}
                  >
                    Dismiss
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
