'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { Tag, X, Plus, Edit2, Trash2, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdated?: () => void;
}

interface TagData {
  id: string;
  name: string;
  color: string;
  usageCount: number;
}

const TAG_COLORS = [
  { name: 'Sage', value: '#8b9d83' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Gold', value: '#b8956a' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
];

export function TagManagerModal({ isOpen, onClose, onTagsUpdated }: TagManagerModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch all tags
  const { data: tags, refetch } = trpc.contact.listTags.useQuery(undefined, {
    enabled: isOpen,
  });

  // Create tag mutation
  const createTagMutation = trpc.contact.createTag.useMutation({
    onSuccess: () => {
      toast.success('Tag created successfully');
      setIsCreating(false);
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0].value);
      refetch();
      onTagsUpdated?.();
    },
    onError: (error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });

  // Update tag mutation
  const updateTagMutation = trpc.contact.updateTag.useMutation({
    onSuccess: () => {
      toast.success('Tag updated successfully');
      setEditingId(null);
      refetch();
      onTagsUpdated?.();
    },
    onError: (error) => {
      toast.error(`Failed to update tag: ${error.message}`);
    },
  });

  // Delete tag mutation
  const deleteTagMutation = trpc.contact.deleteTag.useMutation({
    onSuccess: () => {
      toast.success('Tag deleted successfully');
      setDeleteConfirmId(null);
      refetch();
      onTagsUpdated?.();
    },
    onError: (error) => {
      toast.error(`Failed to delete tag: ${error.message}`);
    },
  });

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }
    createTagMutation.mutate({ name: newTagName.trim(), color: newTagColor });
  };

  const handleUpdateTag = (tagId: string, name: string, color: string) => {
    if (!name.trim()) {
      toast.error('Tag name is required');
      return;
    }
    updateTagMutation.mutate({ tagId, name: name.trim(), color });
  };

  const handleDeleteTag = (tagId: string) => {
    deleteTagMutation.mutate({ tagId });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[--sage] bg-opacity-20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-[--sage]" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-[--navy]">Manage Tags</h2>
                <p className="text-sm text-[--charcoal] opacity-60 mt-0.5">
                  Create and organize contact tags
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[--cream] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Create New Tag */}
          <div className="mb-6">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[--sage] hover:bg-[--cream] transition-all flex items-center justify-center gap-2 text-[--navy]"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New Tag</span>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-2 border-[--sage] rounded-lg p-4 bg-[--cream]"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[--navy] mb-1.5">
                      Tag Name
                    </label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="e.g., VIP, Follow-up needed"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--navy] mb-1.5">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewTagColor(color.value)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            newTagColor === color.value
                              ? 'ring-2 ring-offset-2 ring-[--navy]'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewTagName('');
                        setNewTagColor(TAG_COLORS[0].value);
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTag}
                      disabled={createTagMutation.isLoading || !newTagName.trim()}
                      className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {createTagMutation.isLoading ? 'Creating...' : 'Create Tag'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Existing Tags List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[--charcoal] opacity-60 uppercase tracking-wide mb-3">
              Existing Tags ({tags?.length || 0})
            </h3>
            {tags && tags.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {tags.map((tag, index) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className="border border-gray-200 rounded-lg p-3 hover:border-[--sage] transition-colors"
                  >
                    {editingId === tag.id ? (
                      // Edit Mode
                      <EditTagForm
                        tag={tag}
                        onSave={(name, color) => handleUpdateTag(tag.id, name, color)}
                        onCancel={() => setEditingId(null)}
                        isLoading={updateTagMutation.isLoading}
                      />
                    ) : deleteConfirmId === tag.id ? (
                      // Delete Confirmation
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-900 mb-1">Delete Tag?</p>
                            <p className="text-sm text-red-800">
                              This tag is used by {tag.usageCount} contact(s). It will be
                              removed from all contacts.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            disabled={deleteTagMutation.isLoading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                          >
                            {deleteTagMutation.isLoading ? 'Deleting...' : 'Delete Tag'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium text-[--navy]">{tag.name}</span>
                          <span className="text-xs text-[--charcoal] opacity-60">
                            {tag.usageCount} contact{tag.usageCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingId(tag.id)}
                            className="p-2 hover:bg-[--cream] rounded-lg transition-colors"
                            title="Edit tag"
                          >
                            <Edit2 className="w-4 h-4 text-[--sage]" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(tag.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete tag"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-[--charcoal] opacity-20 mx-auto mb-3" />
                <p className="text-sm text-[--charcoal] opacity-60">
                  No tags yet. Create your first tag to get started.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Edit Tag Form Component
function EditTagForm({
  tag,
  onSave,
  onCancel,
  isLoading,
}: {
  tag: TagData;
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[--navy] mb-1.5">Tag Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[--navy] mb-1.5">Color</label>
        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full transition-all ${
                color === c.value ? 'ring-2 ring-offset-2 ring-[--navy]' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(name, color)}
          disabled={isLoading || !name.trim()}
          className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
