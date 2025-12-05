"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, FileText, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import CommunicationAnalytics from "@/components/communication/CommunicationAnalytics";
import ComposeMessageModal from "@/components/communication/ComposeMessageModal";

export default function CommunicationPage() {
  const [showCompose, setShowCompose] = useState(false);

  // Mock stats
  const stats = {
    totalSent: 30,
    delivered: 27,
    deliveryRate: 90,
    opened: 18,
    openRate: 66.7,
    clicked: 8,
    clickRate: 44.4,
    byType: {
      email: 20,
      sms: 10,
    },
    byStatus: {
      sent: 6,
      delivered: 21,
      opened: 12,
      clicked: 6,
      failed: 3,
    },
  };

  const quickActions = [
    {
      icon: Send,
      label: "Compose Message",
      description: "Send email or SMS",
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      onClick: () => setShowCompose(true),
    },
    {
      icon: FileText,
      label: "Templates",
      description: "Manage templates",
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      onClick: () => (window.location.href = "/staff/communication/templates"),
    },
    {
      icon: BarChart3,
      label: "History",
      description: "View sent messages",
      color: "bg-green-50 text-green-600 hover:bg-green-100",
      onClick: () => (window.location.href = "/staff/communication/history"),
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-600 mt-1">
            Send emails and SMS to families
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors"
        >
          <Send className="w-5 h-5" />
          Compose Message
        </button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              variants={itemVariants}
              onClick={action.onClick}
              className={`p-6 rounded-lg border border-gray-200 text-left transition-all ${action.color}`}
            >
              <Icon className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-1">{action.label}</h3>
              <p className="text-sm opacity-75">{action.description}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Recent Activity Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Email Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Emails</h3>
              <p className="text-sm text-gray-500">Last 30 days</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Sent</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.byType.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Open Rate</span>
              <span className="text-lg font-semibold text-purple-600">
                {stats.openRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Click Rate</span>
              <span className="text-lg font-semibold text-indigo-600">
                {stats.clickRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* SMS Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">SMS</h3>
              <p className="text-sm text-gray-500">Last 30 days</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Sent</span>
              <span className="text-lg font-semibold text-gray-900">
                {stats.byType.sms}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Delivery Rate</span>
              <span className="text-lg font-semibold text-green-600">
                {stats.deliveryRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="text-lg font-semibold text-red-600">
                {stats.byStatus.failed}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Analytics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <CommunicationAnalytics stats={stats} />
      </motion.div>

      {/* Recent Templates */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-gray-200 rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Most Used Templates
          </h3>
          <button
            onClick={() =>
              (window.location.href = "/staff/communication/templates")
            }
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {[
            { name: "Service Reminder SMS", type: "sms", uses: 203 },
            { name: "Appointment Reminder SMS", type: "sms", uses: 156 },
            { name: "Appointment Reminder Email", type: "email", uses: 120 },
          ].map((template, i) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {template.type === "email" ? (
                  <Mail className="w-4 h-4 text-blue-600" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-green-600" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {template.name}
                </span>
              </div>
              <span className="text-sm text-gray-500">{template.uses} uses</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeMessageModal
          onClose={() => setShowCompose(false)}
          onSend={(data) => {
            console.log("Sending:", data);
            setShowCompose(false);
            // TODO: Implement actual send
          }}
        />
      )}
    </div>
  );
}
