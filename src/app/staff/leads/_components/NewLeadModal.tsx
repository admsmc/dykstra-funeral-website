'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/trpc/react';
import { X, UserPlus } from 'lucide-react';
import { createLeadSchema, type CreateLeadForm, LEAD_SOURCES, LEAD_TYPES } from '@dykstra/domain/validation';
import { Form, SuccessCelebration } from '@dykstra/ui';
import { FormInput, FormSelect, FormTextarea } from '@dykstra/ui';
import { useToast } from '@/components/toast';
import { ButtonSpinner } from '@/components/loading';

/**
 * New Lead Modal
 * CRM lead capture with validation
 * 
 * Features:
 * - Contact information capture
 * - Lead source tracking
 * - Lead type classification
 * - Success celebration
 * - Automatic lead scoring (backend)
 */

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewLeadModal({
  isOpen,
  onClose,
  onSuccess,
}: NewLeadModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ name: '', source: '' });
  const toast = useToast();

  // Initialize form with react-hook-form + Zod validation
  const form = useForm<CreateLeadForm>({
    // Cast resolver to avoid a known generic mismatch between react-hook-form and Zod defaults.
    resolver: zodResolver(createLeadSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      source: 'website',
      type: 'general_inquiry',
      notes: '',
    },
  });

  // Create lead mutation
  const createLeadMutation = api.lead.create.useMutation();

  // Reset form on close
  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const lead = await createLeadMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source,
        notes: data.notes || null,
      });

      // Show celebration
      setCelebrationData({
        name: `${data.firstName} ${data.lastName}`,
        source: data.source.replace('_', ' '),
      });
      setShowCelebration(true);

      toast.success('Lead created successfully');
      onSuccess?.();

      // Close modal after celebration
      setTimeout(() => {
        handleClose();
        setShowCelebration(false);
      }, 2500);
    } catch (error: any) {
      toast.error(`Failed to create lead: ${error.message}`);
      form.setError('firstName', { message: error.message });
    }
  });

  // Format lead source for display
  const formatSource = (source: string) => {
    return source
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format lead type for display
  const formatType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Lead</h2>
                <p className="text-sm text-gray-600">Capture prospect information</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={createLeadMutation.isPending}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={onSubmit} className="p-6 space-y-6">
              {/* Name Fields (Grid) */}
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  name="firstName"
                  label="First Name"
                  placeholder="John"
                  required
                />
                <FormInput
                  name="lastName"
                  label="Last Name"
                  placeholder="Doe"
                  required
                />
              </div>

              {/* Contact Information */}
              <FormInput
                name="email"
                label="Email"
                type="email"
                placeholder="john.doe@example.com"
              />

              <FormInput
                name="phone"
                label="Phone"
                type="tel"
                placeholder="(555) 123-4567"
              />

              {/* Lead Source & Type */}
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  name="source"
                  label="Lead Source"
                  placeholder="Select source..."
                  options={LEAD_SOURCES.map((source) => ({
                    value: source,
                    label: formatSource(source),
                  }))}
                  required
                />

                <FormSelect
                  name="type"
                  label="Lead Type"
                  placeholder="Select type..."
                  options={LEAD_TYPES.map((type) => ({
                    value: type,
                    label: formatType(type),
                  }))}
                  required
                />
              </div>

              {/* Notes */}
              <FormTextarea
                name="notes"
                label="Notes"
                placeholder="Additional information about this lead..."
                maxLength={2000}
                showCharacterCount
                rows={3}
              />

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={createLeadMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLeadMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {createLeadMutation.isPending && <ButtonSpinner />}
                  {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Success Celebration */}
      <SuccessCelebration
        show={showCelebration}
        message="Lead Created!"
        submessage={`${celebrationData.name} from ${formatSource(celebrationData.source)} added to pipeline`}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}
