"use client";

import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { motion } from "framer-motion";
import CommunicationHistoryTable from "@/components/communication/CommunicationHistoryTable";
import type { Communication } from "@/../../packages/api/src/routers/communication.router";

export default function CommunicationHistoryPage() {
  // Mock communications
  const mockCommunications: Communication[] = Array.from(
    { length: 30 },
    (_, i) => {
      const type = i % 3 === 0 ? "sms" : "email";
      const statuses = ["sent", "delivered", "opened", "clicked", "failed"] as const;
      const status = statuses[i % 5];
      const daysAgo = i * 3;
      const sentAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      return {
        id: `comm-${i + 1}`,
        type,
        templateId: type === "email" ? `tpl-${(i % 10) + 1}` : `tpl-${11 + (i % 5)}`,
        recipientId: `contact-${i + 1}`,
        recipientName: `Family ${i + 1}`,
        recipientContact:
          type === "email" ? `family${i + 1}@example.com` : `555-010${i}`,
        caseId: i % 2 === 0 ? `case-${Math.floor(i / 2) + 1}` : undefined,
        subject: type === "email" ? `Test Subject ${i + 1}` : undefined,
        body: `Test communication body ${i + 1}`,
        status,
        sentAt,
        deliveredAt:
          status !== "failed"
            ? new Date(sentAt.getTime() + 1000 * 60 * 5)
            : undefined,
        openedAt:
          status === "opened" || status === "clicked"
            ? new Date(sentAt.getTime() + 1000 * 60 * 60)
            : undefined,
        clickedAt:
          status === "clicked"
            ? new Date(sentAt.getTime() + 1000 * 60 * 65)
            : undefined,
        failureReason: status === "failed" ? "Invalid email address" : undefined,
      };
    }
  );

  const [communications] = useState(mockCommunications);

  const handleExport = () => {
    // Mock CSV export
    const csv = [
      "Type,Recipient,Subject,Status,Sent At",
      ...communications.map(
        (c) =>
          `${c.type},${c.recipientName},${c.subject || c.body.substring(0, 30)},${c.status},${c.sentAt?.toISOString()}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "communication-history.csv";
    a.click();
  };

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
              Communication History
            </h1>
            <p className="text-gray-600 mt-1">
              View all sent emails and SMS messages
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-[--navy] hover:text-[--navy] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        {[
          { label: "Total Sent", value: communications.length, color: "text-blue-600" },
          {
            label: "Delivered",
            value: communications.filter((c) => c.status !== "failed").length,
            color: "text-green-600",
          },
          {
            label: "Opened",
            value: communications.filter((c) => c.openedAt).length,
            color: "text-purple-600",
          },
          {
            label: "Clicked",
            value: communications.filter((c) => c.clickedAt).length,
            color: "text-indigo-600",
          },
          {
            label: "Failed",
            value: communications.filter((c) => c.status === "failed").length,
            color: "text-red-600",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <CommunicationHistoryTable
          communications={communications}
          onFilterChange={(filters) => {
            console.log("Filters:", filters);
            // TODO: Implement actual filtering
          }}
        />
      </motion.div>
    </div>
  );
}
