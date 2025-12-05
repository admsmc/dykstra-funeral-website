"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Mail, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Template } from "@/../../packages/api/src/routers/communication.router";

interface TemplateSearchBarProps {
  onSelectTemplate: (template: Template) => void;
  placeholder?: string;
}

export default function TemplateSearchBar({
  onSelectTemplate,
  placeholder = "Search templates... (Cmd+Shift+T)",
}: TemplateSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+Shift+T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "t") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
        setResults([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Mock search function
  const searchTemplates = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Mock results
    const mockResults: Template[] = [
      {
        id: "tpl-1",
        name: "Welcome Email",
        type: "email",
        subject: "Welcome to {{funeralHomeName}}",
        body: "Dear {{firstName}}, We are honored to serve...",
        variables: ["firstName", "funeralHomeName"],
        usageCount: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tpl-2",
        name: "Appointment Reminder SMS",
        type: "sms",
        body: "{{firstName}}, reminder: Appt at {{funeralHomeName}}...",
        variables: ["firstName", "funeralHomeName"],
        usageCount: 156,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ].filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(mockResults);
    setIsLoading(false);
    setSelectedIndex(0);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        void searchTemplates(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelectTemplate(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-[--navy] transition-colors"
      >
        <Search className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">{placeholder}</span>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
                setResults([]);
              }}
            />

            {/* Search Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-50"
            >
              {/* Search Input */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search templates by name, subject, or content..."
                    className="flex-1 text-lg outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    Searching templates...
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((template, index) => (
                      <motion.button
                        key={template.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectTemplate(template)}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                          index === selectedIndex ? "bg-blue-50" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`p-2 rounded-lg ${
                            template.type === "email"
                              ? "bg-blue-100"
                              : "bg-green-100"
                          }`}
                        >
                          {template.type === "email" ? (
                            <Mail className="w-4 h-4 text-blue-600" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-green-600" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {template.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              Used {template.usageCount}x
                            </span>
                          </div>
                          {template.subject && (
                            <p className="text-sm text-gray-600 mt-0.5">
                              {template.subject}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {template.body}
                          </p>
                        </div>

                        {/* Type Badge */}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            template.type === "email"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {template.type.toUpperCase()}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : query ? (
                  <div className="p-8 text-center text-gray-500">
                    No templates found for &quot;{query}&quot;
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Start typing to search templates
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>↑↓ Navigate • Enter Select • Esc Close</span>
                <span>Cmd+Shift+T to open</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
