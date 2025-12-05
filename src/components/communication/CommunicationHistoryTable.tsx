"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MousePointerClick,
  ChevronDown,
  Filter,
} from "lucide-react";
import type {
  Communication,
  CommunicationStatus,
  TemplateType,
} from "@/../../packages/api/src/routers/communication.router";

interface CommunicationHistoryTableProps {
  communications: Communication[];
  onFilterChange?: (filters: {
    type?: TemplateType;
    status?: CommunicationStatus;
  }) => void;
}

const STATUS_CONFIG: Record<
  CommunicationStatus,
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  pending: { icon: Clock, color: "text-gray-500", label: "Pending" },
  sent: { icon: CheckCircle, color: "text-blue-500", label: "Sent" },
  delivered: { icon: CheckCircle, color: "text-green-500", label: "Delivered" },
  opened: { icon: Eye, color: "text-purple-500", label: "Opened" },
  clicked: { icon: MousePointerClick, color: "text-indigo-500", label: "Clicked" },
  failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
  bounced: { icon: XCircle, color: "text-orange-500", label: "Bounced" },
};

export default function CommunicationHistoryTable({
  communications,
  onFilterChange,
}: CommunicationHistoryTableProps) {
  const [typeFilter, setTypeFilter] = useState<TemplateType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CommunicationStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredComms = communications.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const handleFilterChange = (
    type: TemplateType | "all",
    status: CommunicationStatus | "all"
  ) => {
    setTypeFilter(type);
    setStatusFilter(status);
    onFilterChange?.({
      type: type !== "all" ? type : undefined,
      status: status !== "all" ? status : undefined,
    });
  };

  const formatDate = (date?: Date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) =>
            handleFilterChange(
              e.target.value as TemplateType | "all",
              statusFilter
            )
          }
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="all">All Types</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) =>
            handleFilterChange(
              typeFilter,
              e.target.value as CommunicationStatus | "all"
            )
          }
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="opened">Opened</option>
          <option value="clicked">Clicked</option>
          <option value="failed">Failed</option>
        </select>

        <span className="text-sm text-gray-500">
          {filteredComms.length} of {communications.length} communications
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recipient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Subject / Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sent
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredComms.map((comm, index) => {
                const StatusIcon = STATUS_CONFIG[comm.status].icon;
                const isExpanded = expandedId === comm.id;

                return (
                  <motion.tr
                    key={comm.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {comm.type === "email" ? (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600">Email</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">SMS</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {comm.recipientName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {comm.recipientContact}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {comm.subject ? (
                        <p className="text-sm text-gray-900">{comm.subject}</p>
                      ) : (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {comm.body}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={`w-4 h-4 ${STATUS_CONFIG[comm.status].color}`}
                        />
                        <span className="text-sm text-gray-900">
                          {STATUS_CONFIG[comm.status].label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">
                        {formatDate(comm.sentAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : comm.id)
                        }
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}

              {filteredComms.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-gray-500">No communications found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded Details */}
        {filteredComms.map((comm) => {
          if (expandedId !== comm.id) return null;

          return (
            <motion.div
              key={`${comm.id}-details`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 bg-gray-50 px-4 py-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Timeline
                  </p>
                  <div className="space-y-1.5">
                    {comm.sentAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3" />
                        Sent: {formatDate(comm.sentAt)}
                      </div>
                    )}
                    {comm.deliveredAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3" />
                        Delivered: {formatDate(comm.deliveredAt)}
                      </div>
                    )}
                    {comm.openedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Eye className="w-3 h-3" />
                        Opened: {formatDate(comm.openedAt)}
                      </div>
                    )}
                    {comm.clickedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MousePointerClick className="w-3 h-3" />
                        Clicked: {formatDate(comm.clickedAt)}
                      </div>
                    )}
                    {comm.failureReason && (
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <XCircle className="w-3 h-3" />
                        Failed: {comm.failureReason}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Message Body
                  </p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">
                    {comm.body}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
