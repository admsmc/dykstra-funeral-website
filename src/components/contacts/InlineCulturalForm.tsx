'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface CulturalPreferences {
  religion?: string;
  culturalPreferences?: string;
  language?: string;
  dietaryRestrictions?: string;
}

interface InlineCulturalFormProps {
  contactId: string;
  initialValues: CulturalPreferences;
  onSave: (values: CulturalPreferences) => Promise<void>;
  className?: string;
}

const RELIGIONS = [
  'None',
  'Christianity',
  'Islam',
  'Judaism',
  'Buddhism',
  'Hinduism',
  'Sikhism',
  'Other',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'Mandarin',
  'Arabic',
  'French',
  'German',
  'Japanese',
  'Other',
];

export function InlineCulturalForm({
  contactId,
  initialValues,
  onSave,
  className = '',
}: InlineCulturalFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<CulturalPreferences>(initialValues);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formValues);
      toast.success('Cultural preferences updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormValues(initialValues);
    setIsEditing(false);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-[--navy]">Cultural Preferences</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-[--cream] rounded-lg transition-colors"
            title="Edit preferences"
          >
            <Edit2 className="w-4 h-4 text-[--sage]" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Religion */}
            <div>
              <label className="block text-sm font-medium text-[--charcoal] mb-1.5">
                Religion
              </label>
              <select
                value={formValues.religion || ''}
                onChange={(e) => setFormValues({ ...formValues, religion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
              >
                <option value="">Select religion</option>
                {RELIGIONS.map((religion) => (
                  <option key={religion} value={religion}>
                    {religion}
                  </option>
                ))}
              </select>
            </div>

            {/* Cultural Preferences */}
            <div>
              <label className="block text-sm font-medium text-[--charcoal] mb-1.5">
                Cultural Preferences
              </label>
              <textarea
                value={formValues.culturalPreferences || ''}
                onChange={(e) =>
                  setFormValues({ ...formValues, culturalPreferences: e.target.value })
                }
                placeholder="Any specific cultural customs or preferences..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage] resize-none"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-[--charcoal] mb-1.5">
                Preferred Language
              </label>
              <select
                value={formValues.language || ''}
                onChange={(e) => setFormValues({ ...formValues, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
              >
                <option value="">Select language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-[--charcoal] mb-1.5">
                Dietary Restrictions
              </label>
              <input
                type="text"
                value={formValues.dietaryRestrictions || ''}
                onChange={(e) =>
                  setFormValues({ ...formValues, dietaryRestrictions: e.target.value })
                }
                placeholder="e.g., Vegetarian, Halal, Kosher"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Religion */}
            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-[--charcoal] opacity-60">Religion</span>
              <span className="text-sm text-[--navy] font-medium">
                {formValues.religion || 'Not specified'}
              </span>
            </div>

            {/* Cultural Preferences */}
            <div className="flex flex-col gap-1 py-2 border-b border-gray-100">
              <span className="text-sm text-[--charcoal] opacity-60">Cultural Preferences</span>
              <span className="text-sm text-[--navy]">
                {formValues.culturalPreferences || 'Not specified'}
              </span>
            </div>

            {/* Language */}
            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-[--charcoal] opacity-60">Preferred Language</span>
              <span className="text-sm text-[--navy] font-medium">
                {formValues.language || 'Not specified'}
              </span>
            </div>

            {/* Dietary Restrictions */}
            <div className="flex items-start justify-between py-2">
              <span className="text-sm text-[--charcoal] opacity-60">Dietary Restrictions</span>
              <span className="text-sm text-[--navy] font-medium">
                {formValues.dietaryRestrictions || 'Not specified'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
