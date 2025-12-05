'use client';

import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { Clock, User, Mail, Phone, Tag, Heart, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export function RecentlyUpdatedWidget() {
  // Fetch recently updated contacts
  const { data: recentContacts, isLoading } = trpc.contact.getRecentlyUpdated.useQuery({
    limit: 5,
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recentContacts || recentContacts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-serif text-[--navy]">Recently Updated</h2>
            <p className="text-sm text-[--charcoal] opacity-60">Latest contact changes</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-[--charcoal] opacity-20 mx-auto mb-3" />
          <p className="text-sm text-[--charcoal] opacity-60">No recent updates</p>
        </div>
      </div>
    );
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'email':
        return Mail;
      case 'phone':
        return Phone;
      case 'tags':
        return Tag;
      case 'grief':
        return Heart;
      default:
        return Edit2;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'email':
        return 'bg-purple-100 text-purple-600';
      case 'phone':
        return 'bg-blue-100 text-blue-600';
      case 'tags':
        return 'bg-amber-100 text-amber-600';
      case 'grief':
        return 'bg-rose-100 text-rose-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-serif text-[--navy]">Recently Updated</h2>
            <p className="text-sm text-[--charcoal] opacity-60">Latest contact changes</p>
          </div>
        </div>
        <Link
          href="/staff/families?sort=updated"
          className="text-sm text-[--sage] hover:underline font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Recent Updates List */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {recentContacts.map((contact, index) => {
          const ChangeIcon = getChangeIcon(contact.changeType);
          const changeColor = getChangeColor(contact.changeType);

          return (
            <motion.div key={contact.id} variants={item}>
              <Link
                href={`/staff/contacts/${contact.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-[--sage] hover:bg-[--cream] transition-all group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[--sage] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[--sage]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-[--navy] group-hover:text-[--sage] transition-colors">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <span className="text-xs text-[--charcoal] opacity-60 whitespace-nowrap">
                      {formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Change Summary */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md ${changeColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <ChangeIcon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-sm text-[--charcoal] opacity-80 truncate">
                      {contact.changeSummary}
                    </p>
                  </div>

                  {/* Updated By */}
                  {contact.updatedBy && (
                    <p className="text-xs text-[--charcoal] opacity-40 mt-1">
                      Updated by {contact.updatedBy}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-[--charcoal] opacity-60 text-center">
          Showing last {recentContacts.length} updates from the past 7 days
        </p>
      </div>
    </div>
  );
}
