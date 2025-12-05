"use client";

import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface CommunicationAnalyticsProps {
  stats: {
    totalSent: number;
    delivered: number;
    deliveryRate: number;
    opened: number;
    openRate: number;
    clicked: number;
    clickRate: number;
    byType: {
      email: number;
      sms: number;
    };
    byStatus: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      failed: number;
    };
  };
  timeframe?: string;
}

export default function CommunicationAnalytics({
  stats,
  timeframe = "Last 30 days",
}: CommunicationAnalyticsProps) {
  const kpis = [
    {
      label: "Total Sent",
      value: stats.totalSent,
      icon: CheckCircle,
      color: "text-blue-600",
      bg: "bg-blue-50",
      change: "+12%",
      trend: "up" as const,
    },
    {
      label: "Delivery Rate",
      value: `${stats.deliveryRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      change: "+2.4%",
      trend: "up" as const,
    },
    {
      label: "Open Rate",
      value: `${stats.openRate.toFixed(1)}%`,
      icon: Eye,
      color: "text-purple-600",
      bg: "bg-purple-50",
      change: "-1.2%",
      trend: "down" as const,
    },
    {
      label: "Click Rate",
      value: `${stats.clickRate.toFixed(1)}%`,
      icon: MousePointerClick,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      change: "+5.3%",
      trend: "up" as const,
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Communication Analytics
          </h3>
          <p className="text-sm text-gray-500">{timeframe}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <motion.div
              key={kpi.label}
              variants={itemVariants}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs ${
                    kpi.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <TrendIcon className="w-3 h-3" />
                  {kpi.change}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Type */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            By Message Type
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Email</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.byType.email}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(stats.byType.email / stats.totalSent) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">SMS</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.byType.sms}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(stats.byType.sms / stats.totalSent) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* By Status */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            By Status
          </h4>
          <div className="space-y-3">
            {[
              { label: "Sent", count: stats.byStatus.sent, color: "bg-blue-600" },
              {
                label: "Delivered",
                count: stats.byStatus.delivered,
                color: "bg-green-600",
              },
              {
                label: "Opened",
                count: stats.byStatus.opened,
                color: "bg-purple-600",
              },
              {
                label: "Clicked",
                count: stats.byStatus.clicked,
                color: "bg-indigo-600",
              },
              { label: "Failed", count: stats.byStatus.failed, color: "bg-red-600" },
            ].map((status) => (
              <div
                key={status.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                  <span className="text-sm text-gray-700">{status.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {status.count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Funnel Visualization */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="bg-white border border-gray-200 rounded-lg p-6"
      >
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Communication Funnel
        </h4>
        <div className="space-y-2">
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">Sent</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.totalSent} (100%)
              </span>
            </div>
            <div className="w-full bg-blue-600 h-8 rounded flex items-center px-3">
              <span className="text-white text-sm font-medium">
                {stats.totalSent} messages sent
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">Delivered</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.delivered} ({stats.deliveryRate.toFixed(1)}%)
              </span>
            </div>
            <div
              className="bg-green-600 h-8 rounded flex items-center px-3"
              style={{ width: `${stats.deliveryRate}%` }}
            >
              <span className="text-white text-sm font-medium">
                {stats.delivered} delivered
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">Opened</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.opened} ({stats.openRate.toFixed(1)}%)
              </span>
            </div>
            <div
              className="bg-purple-600 h-8 rounded flex items-center px-3"
              style={{ width: `${stats.openRate}%` }}
            >
              <span className="text-white text-sm font-medium">
                {stats.opened} opened
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">Clicked</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.clicked} ({stats.clickRate.toFixed(1)}%)
              </span>
            </div>
            <div
              className="bg-indigo-600 h-8 rounded flex items-center px-3"
              style={{ width: `${stats.clickRate}%` }}
            >
              <span className="text-white text-sm font-medium">
                {stats.clicked} clicked
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
