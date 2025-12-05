'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Check, X, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface VeteranInfo {
  isVeteran: boolean;
  militaryBranch?: string;
  vaBenefitsNotes?: string;
}

interface InlineVeteranFormProps {
  contactId: string;
  initialValues: VeteranInfo;
  onSave: (values: VeteranInfo) => Promise<void>;
  className?: string;
}

const MILITARY_BRANCHES = [
  'Army',
  'Navy',
  'Air Force',
  'Marines',
  'Coast Guard',
  'Space Force',
];

export function InlineVeteranForm({
  contactId,
  initialValues,
  onSave,
  className = '',
}: InlineVeteranFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<VeteranInfo>(initialValues);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formValues);
      toast.success('Veteran information updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update veteran information');
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
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[--navy]" />
          <h3 className="font-medium text-[--navy]">Veteran Information</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-[--cream] rounded-lg transition-colors"
            title="Edit veteran information"
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
            {/* Veteran Status */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formValues.isVeteran}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      isVeteran: e.target.checked,
                      militaryBranch: e.target.checked ? formValues.militaryBranch : undefined,
                      vaBenefitsNotes: e.target.checked ? formValues.vaBenefitsNotes : undefined,
                    })
                  }
                  className="w-4 h-4 text-[--sage] border-gray-300 rounded focus:ring-2 focus:ring-[--sage]"
                />
                <span className="text-sm font-medium text-[--charcoal]">Is a Veteran</span>
              </label>
            </div>

            {/* Military Branch (only if veteran) */}
            {formValues.isVeteran && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[--charcoal] mb-1.5">
                    Military Branch
                  </label>
                  <select
                    value={formValues.militaryBranch || ''}
                    onChange={(e) =>
                      setFormValues({ ...formValues, militaryBranch: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                  >
                    <option value="">Select branch</option>
                    {MILITARY_BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VA Benefits Notes */}
                <div>
                  <label className="block text-sm font-medium text-[--charcoal] mb-1.5">
                    VA Benefits Notes
                  </label>
                  <textarea
                    value={formValues.vaBenefitsNotes || ''}
                    onChange={(e) =>
                      setFormValues({ ...formValues, vaBenefitsNotes: e.target.value })
                    }
                    placeholder="Any notes about VA benefits or funeral honors..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage] resize-none"
                  />
                </div>
              </>
            )}

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
            {/* Veteran Status */}
            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-[--charcoal] opacity-60">Veteran Status</span>
              <span
                className={`text-sm font-medium ${
                  formValues.isVeteran ? 'text-[--navy]' : 'text-[--charcoal] opacity-60'
                }`}
              >
                {formValues.isVeteran ? 'Yes' : 'No'}
              </span>
            </div>

            {formValues.isVeteran && (
              <>
                {/* Military Branch */}
                <div className="flex items-start justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-[--charcoal] opacity-60">Military Branch</span>
                  <span className="text-sm text-[--navy] font-medium">
                    {formValues.militaryBranch || 'Not specified'}
                  </span>
                </div>

                {/* VA Benefits Notes */}
                <div className="flex flex-col gap-1 py-2">
                  <span className="text-sm text-[--charcoal] opacity-60">VA Benefits Notes</span>
                  <span className="text-sm text-[--navy]">
                    {formValues.vaBenefitsNotes || 'No notes'}
                  </span>
                </div>
              </>
            )}

            {!formValues.isVeteran && (
              <div className="py-4 text-center">
                <p className="text-sm text-[--charcoal] opacity-60">
                  Not a veteran. Click edit to update if needed.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
