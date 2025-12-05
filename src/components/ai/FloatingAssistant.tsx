'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';

/**
 * Floating AI Assistant Widget
 * Linear/Notion-style floating help bubble
 */

interface Suggestion {
  text: string;
  action: () => void;
}

interface FloatingAssistantProps {
  suggestions?: Suggestion[];
}

export function FloatingAssistant({ suggestions = [] }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const defaultSuggestions: Suggestion[] = suggestions.length > 0 ? suggestions : [
    { text: 'Create a new case', action: () => window.location.href = '/staff/cases/new' },
    { text: 'Record a payment', action: () => window.location.href = '/staff/payments/new' },
    { text: 'Schedule a service', action: () => window.location.href = '/staff/scheduling' },
    { text: 'View reports', action: () => window.location.href = '/staff/analytics' },
  ];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg flex items-center justify-center"
      >
        <motion.div
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </motion.div>
        
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-500"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-8 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  ✨
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs opacity-90">How can I help you today?</p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
              {defaultSuggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    suggestion.action();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-700 border border-gray-200"
                >
                  {suggestion.text}
                </motion.button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && message.trim()) {
                      // TODO: Implement AI chat
                      alert(`AI feature coming soon! You asked: ${message}`);
                      setMessage('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (message.trim()) {
                      alert(`AI feature coming soon! You asked: ${message}`);
                      setMessage('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
