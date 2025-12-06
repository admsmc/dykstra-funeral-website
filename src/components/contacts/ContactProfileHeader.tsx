'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import {
  User,
  Mail,
  Phone,
  Tag as TagIcon,
  X,
  Plus,
  Heart,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContactProfileHeaderProps {
  contact: any;
  onDelete: () => void;
  onStartGriefJourney: () => void;
  onRefresh: () => void;
}

export function ContactProfileHeader({
  contact,
  onDelete,
  onStartGriefJourney,
  onRefresh,
}: ContactProfileHeaderProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Add tag mutation
  const addTagMutation = trpc.contact.addTag.useMutation({
    onSuccess: () => {
      toast.success('Tag added');
      setNewTag('');
      setIsAddingTag(false);
      onRefresh();
    },
    onError: (error) => {
      toast.error(`Failed to add tag: ${error.message}`);
    },
  });

  // Remove tag mutation
  const removeTagMutation = trpc.contact.removeTag.useMutation({
    onSuccess: () => {
      toast.success('Tag removed');
      onRefresh();
    },
    onError: (error) => {
      toast.error(`Failed to remove tag: ${error.message}`);
    },
  });

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    addTagMutation.mutate({
      contactId: contact.id,
      tag: newTag.trim(),
    });
  };

  const handleRemoveTag = (tag: string) => {
    removeTagMutation.mutate({
      contactId: contact.id,
      tag,
    });
  };

  // Contact type badge colors
  const typeColors = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800',
    professional: 'bg-green-100 text-green-800',
    referral: 'bg-amber-100 text-amber-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[--sage] bg-opacity-20 flex items-center justify-center">
            <User className="w-8 h-8 text-[--sage]" />
          </div>

          {/* Name and Type */}
          <div>
            <h1 className="text-3xl font-serif text-[--navy] mb-2">
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                  typeColors[contact.type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {contact.type}
              </span>
              {contact.relationshipType && (
                <span className="text-xs px-3 py-1 rounded-full bg-[--cream] text-[--navy] font-medium capitalize">
                  {contact.relationshipType.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[--charcoal] opacity-70">
              {contact.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{contact.email}</span>
                  {contact.emailOptIn && (
                    <span className="ml-1 text-xs text-green-600">(opted in)</span>
                  )}
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{contact.phone}</span>
                  {contact.smsOptIn && (
                    <span className="ml-1 text-xs text-green-600">(opted in)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!contact.isInGriefJourney && (
            <button
              onClick={onStartGriefJourney}
              className="px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Start Grief Journey
            </button>
          )}
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-[--cream] rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-[--charcoal] opacity-60" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete contact"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 pt-4 border-t border-[--sage] border-opacity-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-[--charcoal] opacity-60" />
            <span className="text-sm font-medium text-[--navy]">Tags</span>
          </div>
          {!isAddingTag && (
            <button
              onClick={() => setIsAddingTag(true)}
              className="text-xs text-[--sage] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Tag
            </button>
          )}
        </div>

        {/* Add Tag Input */}
        {isAddingTag && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex gap-2 mb-3"
          >
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="New tag..."
              className="flex-1 px-3 py-2 text-sm border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
              autoFocus
            />
            <button
              onClick={handleAddTag}
              disabled={addTagMutation.isPending}
              className="px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all text-sm disabled:opacity-50"
            >
              {addTagMutation.isPending ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => {
                setIsAddingTag(false);
                setNewTag('');
              }}
              className="px-3 py-2 text-[--charcoal] hover:bg-[--cream] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Tag List */}
        <div className="flex flex-wrap gap-2">
          {contact.tags && contact.tags.length > 0 ? (
            contact.tags.map((tag: string) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group px-3 py-1 text-xs bg-[--sage] bg-opacity-20 text-[--navy] rounded-full flex items-center gap-1"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={removeTagMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <X className="w-3 h-3 hover:text-red-600" />
                </button>
              </motion.span>
            ))
          ) : (
            <span className="text-xs text-[--charcoal] opacity-60">No tags yet</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
