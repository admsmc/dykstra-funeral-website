'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagAutocompleteProps {
  selectedTags: string[];
  availableTags: Tag[];
  onTagsChange: (tags: string[]) => void;
  onCreateTag?: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function TagAutocomplete({
  selectedTags,
  availableTags,
  onTagsChange,
  onCreateTag,
  placeholder = 'Add tags...',
  className = '',
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter available tags based on input and exclude already selected
  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTags.includes(tag.name) &&
      tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if input matches an existing tag exactly
  const exactMatch = availableTags.find(
    (tag) => tag.name.toLowerCase() === inputValue.toLowerCase()
  );

  // Show "Create new tag" option if input doesn't match exactly and onCreateTag is provided
  const showCreateOption =
    inputValue.trim() && !exactMatch && onCreateTag && filteredTags.length === 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const itemCount = filteredTags.length + (showCreateOption ? 1 : 0);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, itemCount - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTags[selectedIndex]) {
          handleAddTag(filteredTags[selectedIndex].name);
        } else if (showCreateOption) {
          handleCreateNewTag();
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTags, selectedIndex, showCreateOption]);

  // Reset selected index when filtered tags change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTags]);

  const handleAddTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
    }
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagName: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagName));
  };

  const handleCreateNewTag = () => {
    if (onCreateTag && inputValue.trim()) {
      onCreateTag(inputValue.trim());
      setInputValue('');
      setIsOpen(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsOpen(value.length > 0);
  };

  // Get tag color by name
  const getTagColor = (tagName: string): string => {
    const tag = availableTags.find((t) => t.name === tagName);
    return tag?.color || '#8b9d83'; // Default to sage
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected Tags + Input */}
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[--sage] focus-within:border-transparent transition-all">
        {/* Selected Tags */}
        <AnimatePresence>
          {selectedTags.map((tagName) => (
            <motion.div
              key={tagName}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-white"
              style={{ backgroundColor: getTagColor(tagName) }}
            >
              <span>{tagName}</span>
              <button
                onClick={() => handleRemoveTag(tagName)}
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => inputValue.length > 0 && setIsOpen(true)}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] px-2 py-1 text-sm focus:outline-none bg-transparent"
        />
      </div>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isOpen && (filteredTags.length > 0 || showCreateOption) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
          >
            {/* Filtered Tags */}
            {filteredTags.map((tag, index) => (
              <button
                key={tag.id}
                onClick={() => handleAddTag(tag.name)}
                className={`w-full px-3 py-2 text-left hover:bg-[--cream] transition-colors flex items-center gap-2 ${
                  index === selectedIndex ? 'bg-[--cream]' : ''
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm text-[--navy]">{tag.name}</span>
              </button>
            ))}

            {/* Create New Tag Option */}
            {showCreateOption && (
              <button
                onClick={handleCreateNewTag}
                className={`w-full px-3 py-2 text-left hover:bg-[--cream] transition-colors flex items-center gap-2 border-t border-gray-200 ${
                  selectedIndex === filteredTags.length ? 'bg-[--cream]' : ''
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-[--sage] flex items-center justify-center flex-shrink-0">
                  <Plus className="w-2 h-2 text-white" />
                </div>
                <span className="text-sm text-[--sage] font-medium">
                  Create &quot;{inputValue}&quot;
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
