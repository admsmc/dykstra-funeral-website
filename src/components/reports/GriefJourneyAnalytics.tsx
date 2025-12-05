'use client';

import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import {
  Heart,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
} from 'lucide-react';

export function GriefJourneyAnalytics() {
  const { data: analytics, isLoading } = trpc.contact.getGriefJourneyAnalytics.useQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const stages = [
    { name: 'Shock & Denial', color: '#ef4444', count: analytics.stageDistribution.shockDenial },
    { name: 'Pain & Guilt', color: '#f97316', count: analytics.stageDistribution.painGuilt },
    {
      name: 'Anger & Bargaining',
      color: '#f59e0b',
      count: analytics.stageDistribution.angerBargaining,
    },
    {
      name: 'Depression',
      color: '#8b5cf6',
      count: analytics.stageDistribution.depression,
    },
    {
      name: 'Reconstruction',
      color: '#3b82f6',
      count: analytics.stageDistribution.reconstruction,
    },
    {
      name: 'Acceptance',
      color: '#10b981',
      count: analytics.stageDistribution.acceptance,
    },
  ];

  const totalInJourney = stages.reduce((sum, stage) => sum + stage.count, 0);
  const maxCount = Math.max(...stages.map((s) => s.count));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-[--navy]">Grief Journey Analytics</h2>
            <p className="text-sm text-[--charcoal] opacity-60">
              Comprehensive grief support tracking and insights
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 border border-gray-200 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-rose-600" />
            <span className="text-xs text-[--charcoal] opacity-60 uppercase">Active</span>
          </div>
          <p className="text-2xl font-bold text-[--navy]">{totalInJourney}</p>
          <p className="text-xs text-[--charcoal] opacity-60 mt-1">
            {analytics.totalFamilies > 0
              ? `${((totalInJourney / analytics.totalFamilies) * 100).toFixed(1)}% of families`
              : '0% of families'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 border border-gray-200 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-[--charcoal] opacity-60 uppercase">Anniversaries</span>
          </div>
          <p className="text-2xl font-bold text-[--navy]">{analytics.upcomingAnniversaries}</p>
          <p className="text-xs text-[--charcoal] opacity-60 mt-1">Next 30 days</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 border border-gray-200 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-[--charcoal] opacity-60 uppercase">Avg Duration</span>
          </div>
          <p className="text-2xl font-bold text-[--navy]">{analytics.averageDuration}</p>
          <p className="text-xs text-[--charcoal] opacity-60 mt-1">Days in journey</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 border border-green-200 rounded-lg bg-green-50"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 uppercase">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{analytics.completedJourneys}</p>
          <p className="text-xs text-green-700 mt-1">Reached acceptance</p>
        </motion.div>
      </div>

      {/* Stage Distribution */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[--sage]" />
          <h3 className="font-medium text-[--navy]">Stage Distribution</h3>
        </div>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm text-[--navy]">{stage.name}</span>
                </div>
                <span className="text-sm font-medium text-[--navy]">
                  {stage.count} ({totalInJourney > 0 ? ((stage.count / totalInJourney) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: maxCount > 0 ? `${(stage.count / maxCount) * 100}%` : '0%',
                  }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-[--sage]" />
          <h3 className="font-medium text-[--navy]">Engagement Metrics</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 border border-gray-200 rounded-lg text-center">
            <p className="text-xl font-bold text-[--navy]">{analytics.checkInsThisMonth}</p>
            <p className="text-xs text-[--charcoal] opacity-60 mt-1">Check-ins this month</p>
          </div>
          <div className="p-3 border border-gray-200 rounded-lg text-center">
            <p className="text-xl font-bold text-[--navy]">
              {analytics.averageCheckInsPerFamily.toFixed(1)}
            </p>
            <p className="text-xs text-[--charcoal] opacity-60 mt-1">Avg check-ins per family</p>
          </div>
          <div className="p-3 border border-red-200 rounded-lg bg-red-50 text-center">
            <p className="text-xl font-bold text-red-700">{analytics.needsFollowUp}</p>
            <p className="text-xs text-red-700 mt-1">Needs follow-up</p>
          </div>
        </div>
      </div>

      {/* Recent Milestones */}
      {analytics.recentMilestones && analytics.recentMilestones.length > 0 && (
        <div>
          <h3 className="font-medium text-[--navy] mb-3">Recent Milestones</h3>
          <div className="space-y-2">
            {analytics.recentMilestones.slice(0, 5).map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[--sage] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[--navy]">{milestone.familyName}</p>
                  <p className="text-xs text-[--charcoal] opacity-60">{milestone.milestone}</p>
                </div>
                <span className="text-xs text-[--charcoal] opacity-60">{milestone.date}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="pt-4 border-t border-gray-200 flex gap-2">
        <button className="flex-1 px-4 py-2 border-2 border-[--sage] text-[--sage] rounded-lg hover:bg-[--cream] transition-all text-sm font-medium">
          Export Report (PDF)
        </button>
        <button className="flex-1 px-4 py-2 border-2 border-[--sage] text-[--sage] rounded-lg hover:bg-[--cream] transition-all text-sm font-medium">
          Email to Team
        </button>
      </div>
    </div>
  );
}
