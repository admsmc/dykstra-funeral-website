'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';
import { Heart, Calendar, TrendingUp, MessageCircle, AlertCircle } from 'lucide-react';

/**
 * Grief Journey Dashboard Widget
 * 
 * Displays:
 * - Contacts needing check-in (badge count)
 * - Upcoming service anniversaries (next 30 days)
 * - Grief stage distribution (visual breakdown)
 * - Quick actions (view contacts, record check-in)
 * 
 * Uses: contact.getContactsNeedingGriefCheckIn
 */
export function GriefJourneyWidget() {
  const router = useRouter();

  // Fetch contacts needing check-in
  const { data: contactsNeedingCheckIn, isLoading } =
    trpc.contact.getContactsNeedingGriefCheckIn.useQuery({});

  // Calculate stats
  const checkInCount = contactsNeedingCheckIn?.length || 0;
  
  // Upcoming anniversaries (next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingAnniversaries =
    contactsNeedingCheckIn?.filter((contact) => {
      if (!contact.serviceAnniversaryDate) return false;
      const anniversaryDate = new Date(contact.serviceAnniversaryDate);
      return anniversaryDate >= now && anniversaryDate <= thirtyDaysFromNow;
    }) || [];

  // Grief stage distribution
  const stageDistribution = contactsNeedingCheckIn?.reduce((acc, contact) => {
    const stage = contact.griefStage || 'unknown';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const GRIEF_STAGES = [
    { value: 'shock', label: 'Shock', color: 'bg-gray-500' },
    { value: 'denial', label: 'Denial', color: 'bg-blue-500' },
    { value: 'anger', label: 'Anger', color: 'bg-red-500' },
    { value: 'bargaining', label: 'Bargaining', color: 'bg-amber-500' },
    { value: 'depression', label: 'Depression', color: 'bg-purple-500' },
    { value: 'acceptance', label: 'Acceptance', color: 'bg-green-500' },
  ];

  const totalContacts = contactsNeedingCheckIn?.length || 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[--sage]" />
          <h3 className="text-lg font-serif text-[--navy]">Grief Journey</h3>
        </div>
        {checkInCount > 0 && (
          <span className="px-3 py-1 text-xs bg-amber-100 text-amber-800 rounded-full font-medium">
            {checkInCount} need check-in
          </span>
        )}
      </div>

      {/* Empty State */}
      {totalContacts === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-[--charcoal] opacity-20 mx-auto mb-3" />
          <p className="text-sm text-[--charcoal] opacity-60">
            No contacts in grief journey yet
          </p>
          <p className="text-xs text-[--charcoal] opacity-40 mt-1">
            Start grief journeys from contact profiles
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Contacts Needing Check-In */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-amber-700 mb-1">
                <MessageCircle className="w-3 h-3" />
                <span>Need Check-In</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{checkInCount}</p>
            </div>

            {/* Upcoming Anniversaries */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-blue-700 mb-1">
                <Calendar className="w-3 h-3" />
                <span>Anniversaries</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {upcomingAnniversaries.length}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">Next 30 days</p>
            </div>
          </div>

          {/* Grief Stage Distribution */}
          <div>
            <div className="flex items-center gap-2 text-xs text-[--charcoal] opacity-60 mb-2">
              <TrendingUp className="w-3 h-3" />
              <span>Grief Stage Distribution</span>
            </div>
            <div className="space-y-2">
              {GRIEF_STAGES.map((stage) => {
                const count = stageDistribution[stage.value] || 0;
                const percentage = totalContacts > 0 ? (count / totalContacts) * 100 : 0;
                
                if (count === 0) return null;

                return (
                  <div key={stage.value} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[--navy] font-medium">{stage.label}</span>
                        <span className="text-[--charcoal] opacity-60">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className={`h-full ${stage.color}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Contacts Needing Check-In */}
          {checkInCount > 0 && (
            <div className="pt-4 border-t border-[--sage] border-opacity-20">
              <p className="text-xs font-medium text-[--navy] mb-2">
                Recent Check-Ins Due
              </p>
              <div className="space-y-2">
                {contactsNeedingCheckIn?.slice(0, 3).map((contact, idx) => (
                  <motion.button
                    key={contact.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => router.push(`/staff/contacts/${contact.id}`)}
                    className="w-full flex items-center justify-between p-2 hover:bg-[--cream] rounded-lg transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[--navy]">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-[--charcoal] opacity-60 capitalize">
                        {contact.griefStage?.replace('_', ' ')} • Last check-in:{' '}
                        {contact.lastGriefCheckIn
                          ? new Date(contact.lastGriefCheckIn).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </motion.button>
                ))}
                {checkInCount > 3 && (
                  <p className="text-xs text-center text-[--charcoal] opacity-60 pt-2">
                    +{checkInCount - 3} more contacts
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-[--sage] border-opacity-20">
            <button
              onClick={() => router.push('/staff/families')}
              className="w-full px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Heart className="w-4 h-4" />
              View All Contacts in Grief Journey
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
