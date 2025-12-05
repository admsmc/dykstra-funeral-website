/**
 * Dashboard Stats Component
 * Displays KPI grid with metrics
 */

"use client";

import { FolderOpen, MessageSquare, Calendar, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { KPICard } from './kpi-card';
import type { DashboardStatsViewModel } from '../view-models/dashboard-stats-vm';

export interface DashboardStatsProps {
  stats: DashboardStatsViewModel;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <KPICard
          title="Active Cases"
          value={stats.activeCases}
          icon={<FolderOpen className="w-6 h-6" />}
          href="/staff/cases?status=ACTIVE"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <KPICard
          title="New Inquiries"
          value={stats.inquiries}
          icon={<MessageSquare className="w-6 h-6" />}
          href="/staff/cases?status=INQUIRY"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <KPICard
          title="Upcoming Services"
          value={stats.upcomingServices}
          icon={<Calendar className="w-6 h-6" />}
          href="/staff/cases?upcoming=true"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <KPICard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={<CheckSquare className="w-6 h-6" />}
          href="/staff/tasks"
        />
      </motion.div>
    </motion.div>
  );
}
