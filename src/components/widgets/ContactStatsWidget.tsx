'use client';

import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  MessageSquare,
  TrendingUp,
  Heart,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

type ContactStatsData = {
  totalContacts: number;
  newThisMonth: number;
  newContactsTrend: number;
  emailOptIns: number;
  emailOptInRate: number;
  smsOptIns: number;
  smsOptInRate: number;
  activeGriefJourneys: number;
  needsFollowUp: number;
  topTags?: Array<{ name: string; color: string; count: number }>;
  engagementSummary?: {
    highEngagement: number;
    mediumEngagement: number;
    lowEngagement: number;
  };
};

const MOCK_STATS: ContactStatsData = {
  totalContacts: 0,
  newThisMonth: 0,
  newContactsTrend: 0,
  emailOptIns: 0,
  emailOptInRate: 0,
  smsOptIns: 0,
  smsOptInRate: 0,
  activeGriefJourneys: 0,
  needsFollowUp: 0,
  topTags: [],
  engagementSummary: {
    highEngagement: 0,
    mediumEngagement: 0,
    lowEngagement: 0,
  },
};

export function ContactStatsWidget() {
  const stats = MOCK_STATS;

  const statCards = [
    {
      label: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      link: '/staff/families',
    },
    {
      label: 'New This Month',
      value: stats.newThisMonth,
      icon: UserPlus,
      color: 'bg-green-100 text-green-600',
      trend: stats.newContactsTrend,
    },
    {
      label: 'Email Opt-Ins',
      value: stats.emailOptIns,
      icon: Mail,
      color: 'bg-purple-100 text-purple-600',
      percentage: stats.emailOptInRate,
    },
    {
      label: 'SMS Opt-Ins',
      value: stats.smsOptIns,
      icon: MessageSquare,
      color: 'bg-amber-100 text-amber-600',
      percentage: stats.smsOptInRate,
    },
    {
      label: 'Active Grief Journeys',
      value: stats.activeGriefJourneys,
      icon: Heart,
      color: 'bg-rose-100 text-rose-600',
      link: '/staff/families?filter=grief-journey',
    },
    {
      label: 'Needs Follow-Up',
      value: stats.needsFollowUp,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
      urgent: stats.needsFollowUp > 0,
      link: '/staff/families?filter=needs-follow-up',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[--sage] bg-opacity-20 flex items-center justify-center">
            <Users className="w-5 h-5 text-[--sage]" />
          </div>
          <div>
            <h2 className="text-lg font-serif text-[--navy]">Contact Metrics</h2>
            <p className="text-sm text-[--charcoal] opacity-60">
              Real-time contact database insights
            </p>
          </div>
        </div>
        <Link
          href="/staff/families"
          className="text-sm text-[--sage] hover:underline font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {statCards.map((stat, index) => {
          const StatIcon = stat.icon;
          const content = (
            <motion.div
              key={stat.label}
              variants={item}
              className={`p-4 rounded-lg border-2 transition-all ${
                stat.link
                  ? 'hover:border-[--sage] hover:shadow-md cursor-pointer'
                  : 'border-gray-200'
              } ${stat.urgent ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <StatIcon className="w-5 h-5" />
                </div>
                {stat.trend !== undefined && (
                  <div
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      stat.trend >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <TrendingUp
                      className={`w-3 h-3 ${stat.trend < 0 ? 'rotate-180' : ''}`}
                    />
                    <span>
                      {stat.trend >= 0 ? '+' : ''}
                      {stat.trend}%
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-[--navy]">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-[--charcoal] opacity-60">{stat.label}</p>
                {stat.percentage !== undefined && (
                  <p className="text-xs text-[--sage] font-medium">
                    {stat.percentage.toFixed(1)}% of total
                  </p>
                )}
              </div>
            </motion.div>
          );

          return stat.link ? (
            <Link key={stat.label} href={stat.link}>
              {content}
            </Link>
          ) : (
            content
          );
        })}
      </motion.div>

      {/* Quick Insights */}
      {stats.topTags && stats.topTags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-[--charcoal] opacity-60 uppercase tracking-wide mb-3">
            Most Used Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.slice(0, 5).map((tag) => (
              <div
                key={tag.name}
                className="px-3 py-1.5 rounded-full text-sm text-white flex items-center gap-2"
                style={{ backgroundColor: tag.color }}
              >
                <span>{tag.name}</span>
                <span className="text-xs opacity-75">({tag.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Summary */}
      {stats.engagementSummary && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-[--charcoal] opacity-60 uppercase tracking-wide mb-3">
            Engagement Summary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-[--navy]">
                {stats.engagementSummary.highEngagement}
              </p>
              <p className="text-xs text-[--charcoal] opacity-60 mt-1">High Engagement</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[--navy]">
                {stats.engagementSummary.mediumEngagement}
              </p>
              <p className="text-xs text-[--charcoal] opacity-60 mt-1">Medium Engagement</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[--navy]">
                {stats.engagementSummary.lowEngagement}
              </p>
              <p className="text-xs text-[--charcoal] opacity-60 mt-1">Low Engagement</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
