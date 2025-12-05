'use client';

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AIAssistantBubbleProps {
  message: string;
  isTyping?: boolean;
  className?: string;
}

export function AIAssistantBubble({
  message,
  isTyping = false,
  className,
}: AIAssistantBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn("relative", className)}
    >
      {/* Pulsing glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl"
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Message bubble */}
      <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 shadow-lg">
        <div className="flex gap-3 items-start">
          {/* AI Avatar */}
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
            ✨
          </div>

          {/* Message content */}
          <div className="flex-1 text-white">
            {isTyping ? (
              <div className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  className="h-2 w-2 rounded-full bg-white"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="h-2 w-2 rounded-full bg-white"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="h-2 w-2 rounded-full bg-white"
                />
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{message}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
