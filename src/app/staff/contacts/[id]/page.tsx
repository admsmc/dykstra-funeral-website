'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ContactProfileHeader } from '@/components/contacts/ContactProfileHeader';
import { ContactInfoCard } from '@/components/contacts/ContactInfoCard';
import { GriefJourneyCard } from '@/components/contacts/GriefJourneyCard';
import { CulturalPreferencesCard } from '@/components/contacts/CulturalPreferencesCard';
import { VeteranInfoCard } from '@/components/contacts/VeteranInfoCard';
import { InteractionTimeline } from '@/components/contacts/InteractionTimeline';
import { ContactHistoryTimeline } from '@/components/contacts/ContactHistoryTimeline';
import { DeleteContactModal } from '@/components/modals/DeleteContactModal';
import { StartGriefJourneyModal } from '@/components/modals/StartGriefJourneyModal';

/**
 * Contact Detail Page - Individual Contact Profile
 * 
 * Complete implementation of Contact/Family CRM Router  
 * Session 1.1 - Core Profile & Grief Journey
 * 
 * Features:
 * - Full contact profile with 40+ fields
 * - Inline editing for all editable fields
 * - Grief journey tracking with 6 stages
 * - Cultural preferences and veteran info
 * - Interaction timeline
 * - Temporal history (SCD Type 2)
 * - Tag management with add/remove
 * - Delete contact action with confirmation
 * 
 * Architecture:
 * - Client component with tRPC queries
 * - Delegates to specialized card components
 * - No business logic in page
 * - 100% UX/UI Guardrails compliant
 */
export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params?.id as string;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGriefJourneyModal, setShowGriefJourneyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'history'>('overview');

  // Fetch contact details
  const { data: contact, isLoading, refetch } = trpc.contact.getById.useQuery(
    { contactId },
    { enabled: !!contactId }
  );

  // Fetch contact history (SCD2)
  const { data: history } = trpc.contact.getHistory.useQuery(
    { businessKey: contact?.businessKey || '' },
    { enabled: !!contact?.businessKey }
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Skeleton loader */}
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-[--charcoal] opacity-20 mx-auto mb-3" />
          <p className="text-[--charcoal] opacity-60">Contact not found</p>
          <button
            onClick={() => router.push('/staff/families')}
            className="mt-4 text-sm text-[--sage] hover:underline"
          >
            ← Back to families
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/staff/families')}
        className="flex items-center gap-2 text-sm text-[--charcoal] opacity-60 hover:opacity-100 transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to families
      </button>

      {/* Do Not Contact Warning Banner */}
      {contact.doNotContact && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Do Not Contact</p>
            <p className="text-sm text-red-700">This contact has requested not to be contacted.</p>
          </div>
        </motion.div>
      )}

      {/* Merged Contact Warning */}
      {contact.mergedIntoContactId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">Merged Contact</p>
            <p className="text-sm text-amber-700">
              This contact has been merged into another contact.
            </p>
          </div>
        </motion.div>
      )}

      {/* Profile Header */}
      <ContactProfileHeader
        contact={contact}
        onDelete={() => setShowDeleteModal(true)}
        onStartGriefJourney={() => setShowGriefJourneyModal(true)}
        onRefresh={refetch}
      />

      {/* Tabs */}
      <div className="border-b border-[--sage] border-opacity-20">
        <nav className="flex gap-6">
          {(['overview', 'interactions', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-[--sage] text-[--navy] font-medium'
                  : 'border-transparent text-[--charcoal] opacity-60 hover:opacity-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Contact Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContactInfoCard contact={contact} onRefresh={refetch} />
            {contact.isInGriefJourney && (
              <GriefJourneyCard contact={contact} onRefresh={refetch} />
            )}
          </div>

          {/* Cultural & Veteran Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CulturalPreferencesCard contact={contact} onRefresh={refetch} />
            {(contact.isVeteran || contact.militaryBranch) && (
              <VeteranInfoCard contact={contact} onRefresh={refetch} />
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'interactions' && (
        <motion.div
          key="interactions"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <InteractionTimeline contactId={contactId} onRefresh={refetch} />
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div
          key="history"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ContactHistoryTimeline history={history || []} />
        </motion.div>
      )}

      {/* Modals */}
      <DeleteContactModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        contactId={contactId}
        contactName={`${contact.firstName} ${contact.lastName}`}
        onSuccess={() => {
          router.push('/staff/families');
          toast.success('Contact deleted successfully');
        }}
      />

      <StartGriefJourneyModal
        isOpen={showGriefJourneyModal}
        onClose={() => setShowGriefJourneyModal(false)}
        contactId={contactId}
        contactName={`${contact.firstName} ${contact.lastName}`}
        onSuccess={() => {
          refetch();
          toast.success('Grief journey started');
        }}
      />
    </div>
  );
}
