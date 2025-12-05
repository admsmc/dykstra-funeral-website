"use client";

import { useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import CommunicationAnalytics from "@/components/communication/CommunicationAnalytics";

export default function CommunicationAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"7" | "30" | "90">("30");

  // Mock stats for different timeframes
  const statsMap = {
    "7": {
      totalSent: 12,
      delivered: 11,
      deliveryRate: 91.7,
      opened: 7,
      openRate: 63.6,
      clicked: 3,
      clickRate: 42.9,
      byType: { email: 8, sms: 4 },
      byStatus: {
        sent: 2,
        delivered: 9,
        opened: 5,
        clicked: 2,
        failed: 1,
      },
    },
    "30": {
      totalSent: 30,
      delivered: 27,
      deliveryRate: 90,
      opened: 18,
      openRate: 66.7,
      clicked: 8,
      clickRate: 44.4,
      byType: { email: 20, sms: 10 },
      byStatus: {
        sent: 6,
        delivered: 21,
        opened: 12,
        clicked: 6,
        failed: 3,
      },
    },
    "90": {
      totalSent: 85,
      delivered: 78,
      deliveryRate: 91.8,
      opened: 52,
      openRate: 66.7,
      clicked: 24,
      clickRate: 46.2,
      byType: { email: 57, sms: 28 },
      byStatus: {
        sent: 15,
        delivered: 63,
        opened: 38,
        clicked: 14,
        failed: 7,
      },
    },
  };

  const stats = statsMap[timeframe];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => (window.location.href = "/staff/communication")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Communication
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Communication Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Track performance and engagement metrics
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as "7" | "30" | "90")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Analytics Component */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <CommunicationAnalytics
          stats={stats}
          timeframe={`Last ${timeframe} days`}
        />
      </motion.div>

      {/* Top Performing Templates */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Performing Templates
        </h3>
        <div className="space-y-4">
          {[
            {
              name: "Service Reminder SMS",
              type: "sms",
              sent: 43,
              delivered: 42,
              deliveryRate: 97.7,
            },
            {
              name: "Appointment Reminder Email",
              type: "email",
              sent: 28,
              opened: 22,
              openRate: 78.6,
            },
            {
              name: "Welcome Email",
              type: "email",
              sent: 15,
              opened: 12,
              openRate: 80.0,
            },
          ].map((template, i) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {template.type === "email" ? "Email" : "SMS"} • {template.sent}{" "}
                    sent
                  </p>
                </div>
                {template.type === "email" ? (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-purple-600">
                      {template.openRate?.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Open Rate</p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {template.deliveryRate?.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Delivery Rate</p>
                  </div>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    template.type === "email" ? "bg-purple-600" : "bg-green-600"
                  }`}
                  style={{
                    width: `${
                      template.type === "email"
                        ? template.openRate
                        : template.deliveryRate
                    }%`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Engagement Trends */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Best Time to Send */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Best Time to Send
          </h3>
          <div className="space-y-3">
            {[
              { time: "9:00 AM - 11:00 AM", openRate: 72.3, color: "bg-purple-600" },
              { time: "2:00 PM - 4:00 PM", openRate: 68.5, color: "bg-purple-500" },
              { time: "6:00 PM - 8:00 PM", openRate: 54.2, color: "bg-purple-400" },
            ].map((slot, i) => (
              <motion.div
                key={slot.time}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{slot.time}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {slot.openRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${slot.color} h-2 rounded-full transition-all`}
                    style={{ width: `${slot.openRate}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Device Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { device: "Mobile", percentage: 62, color: "bg-blue-600" },
              { device: "Desktop", percentage: 31, color: "bg-blue-500" },
              { device: "Tablet", percentage: 7, color: "bg-blue-400" },
            ].map((device, i) => (
              <motion.div
                key={device.device}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{device.device}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {device.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${device.color} h-2 rounded-full transition-all`}
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 Recommendations
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            • Your open rate is above industry average (66.7% vs 60%). Keep up
            the good work!
          </li>
          <li>
            • Consider sending emails between 9-11 AM for best engagement (72.3%
            open rate)
          </li>
          <li>
            • SMS messages have excellent delivery rates. Consider using SMS for
            time-sensitive reminders.
          </li>
          <li>
            • 62% of emails are opened on mobile devices. Ensure your templates
            are mobile-friendly.
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
