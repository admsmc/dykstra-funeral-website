'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContactInfoCardProps {
  contact: any;
  onRefresh: () => void;
}

export function ContactInfoCard({ contact, onRefresh }: ContactInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: contact.email || '',
    phone: contact.phone || '',
    alternatePhone: contact.alternatePhone || '',
    address: contact.address || '',
    city: contact.city || '',
    state: contact.state || '',
    zipCode: contact.zipCode || '',
  });

  // Update info mutation
  const updateInfoMutation = trpc.contact.updateInfo.useMutation({
    onSuccess: () => {
      toast.success('Contact information updated');
      setIsEditing(false);
      onRefresh();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Opt-in/out mutations
  const updateOptInsMutation = trpc.contact.updateOptIns.useMutation({
    onSuccess: () => {
      toast.success('Preferences updated');
      onRefresh();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Mark do not contact
  const markDoNotContactMutation = trpc.contact.markDoNotContact.useMutation({
    onSuccess: () => {
      toast.success('Contact marked as Do Not Contact');
      onRefresh();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateInfoMutation.mutate({
      contactId: contact.id,
      ...formData,
    });
  };

  const handleCancel = () => {
    setFormData({
      email: contact.email || '',
      phone: contact.phone || '',
      alternatePhone: contact.alternatePhone || '',
      address: contact.address || '',
      city: contact.city || '',
      state: contact.state || '',
      zipCode: contact.zipCode || '',
    });
    setIsEditing(false);
  };

  const toggleEmailOptIn = () => {
    updateOptInsMutation.mutate({
      contactId: contact.id,
      emailOptIn: !contact.emailOptIn,
    });
  };

  const toggleSMSOptIn = () => {
    updateOptInsMutation.mutate({
      contactId: contact.id,
      smsOptIn: !contact.smsOptIn,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif text-[--navy]">Contact Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-[--cream] rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-[--charcoal] opacity-60" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateInfoMutation.isLoading}
              className="p-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={updateInfoMutation.isLoading}
              className="p-2 hover:bg-[--cream] rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-xs text-[--charcoal] opacity-60 flex items-center gap-1 mb-1">
            <Mail className="w-3 h-3" />
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
              placeholder="email@example.com"
            />
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[--navy]">{contact.email || 'Not provided'}</span>
              {contact.email && (
                <button
                  onClick={toggleEmailOptIn}
                  disabled={updateOptInsMutation.isLoading}
                  className="flex items-center gap-1 text-xs text-[--sage] hover:underline disabled:opacity-50"
                >
                  {contact.emailOptIn ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Opted In
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 opacity-50" />
                      Opted Out
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs text-[--charcoal] opacity-60 flex items-center gap-1 mb-1">
            <Phone className="w-3 h-3" />
            Phone
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
              placeholder="(555) 123-4567"
            />
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[--navy]">{contact.phone || 'Not provided'}</span>
              {contact.phone && (
                <button
                  onClick={toggleSMSOptIn}
                  disabled={updateOptInsMutation.isLoading}
                  className="flex items-center gap-1 text-xs text-[--sage] hover:underline disabled:opacity-50"
                >
                  {contact.smsOptIn ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      SMS Opted In
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 opacity-50" />
                      SMS Opted Out
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Alternate Phone */}
        {(isEditing || contact.alternatePhone) && (
          <div>
            <label className="text-xs text-[--charcoal] opacity-60 flex items-center gap-1 mb-1">
              <Phone className="w-3 h-3" />
              Alternate Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
                placeholder="(555) 987-6543"
              />
            ) : (
              <span className="text-sm text-[--navy]">{contact.alternatePhone}</span>
            )}
          </div>
        )}

        {/* Address */}
        <div>
          <label className="text-xs text-[--charcoal] opacity-60 flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3" />
            Address
          </label>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
                placeholder="123 Main St"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
                  placeholder="State"
                  maxLength={2}
                />
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="px-3 py-2 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
                  placeholder="ZIP"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-[--navy]">
              {contact.address ? (
                <>
                  {contact.address}
                  {contact.city && contact.state && (
                    <>
                      <br />
                      {contact.city}, {contact.state} {contact.zipCode}
                    </>
                  )}
                </>
              ) : (
                'Not provided'
              )}
            </div>
          )}
        </div>

        {/* Birth Date */}
        {contact.birthDate && (
          <div>
            <label className="text-xs text-[--charcoal] opacity-60 flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3" />
              Date of Birth
            </label>
            <span className="text-sm text-[--navy]">
              {new Date(contact.birthDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Do Not Contact Action */}
        {!contact.doNotContact && !isEditing && (
          <div className="pt-4 border-t border-[--sage] border-opacity-20">
            <button
              onClick={() => {
                if (confirm('Mark this contact as Do Not Contact? This will prevent any outreach.')) {
                  markDoNotContactMutation.mutate({ contactId: contact.id });
                }
              }}
              disabled={markDoNotContactMutation.isLoading}
              className="w-full px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Mark as Do Not Contact
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
