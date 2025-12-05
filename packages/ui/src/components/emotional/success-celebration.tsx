'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SuccessCelebrationProps {
  message: string;
  submessage?: string;
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export function SuccessCelebration({
  message,
  submessage,
  show,
  onComplete,
  duration = 3000,
  className,
}: SuccessCelebrationProps) {
  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm",
            className
          )}
        >
          {/* Confetti effect (simplified version - can add react-confetti-explosion) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  x: '50%',
                  y: '50%',
                  scale: 0,
                }}
                animate={{
                  opacity: 0,
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  scale: 1,
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: [
                    '#10b981', // green
                    '#3b82f6', // blue
                    '#f59e0b', // amber
                    '#ec4899', // pink
                    '#8b5cf6', // purple
                  ][i % 5],
                }}
              />
            ))}
          </div>

          {/* Success card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"
          >
            {/* Checkmark animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.3,
              }}
              className="mx-auto w-20 h-20 rounded-full bg-success-500 flex items-center justify-center mb-4"
            >
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                />
              </motion.svg>
            </motion.div>

            {/* Message */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2"
            >
              {message}
            </motion.h3>

            {submessage && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-neutral-600 dark:text-neutral-400"
              >
                {submessage}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
