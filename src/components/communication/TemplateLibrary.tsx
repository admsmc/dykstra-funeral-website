"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Edit,
  Trash2,
  Copy,
  Eye,
  Plus,
} from "lucide-react";
import type { Template, TemplateType } from "@/../../packages/api/src/routers/communication.router";

interface TemplateLibraryProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: Template) => void;
  onPreview: (template: Template) => void;
  onCreate: () => void;
}

export default function TemplateLibrary({
  templates,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onCreate,
}: TemplateLibraryProps) {
  const [typeFilter, setTypeFilter] = useState<TemplateType | "all">("all");
  const [sortBy, setSortBy] = useState<"usage" | "recent">("usage");

  const filteredTemplates = templates
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === "usage") {
        return b.usageCount - a.usageCount;
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                typeFilter === "all"
                  ? "bg-[--navy] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({templates.length})
            </button>
            <button
              onClick={() => setTypeFilter("email")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                typeFilter === "email"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Mail className="w-4 h-4 inline mr-1" />
              Email ({templates.filter((t) => t.type === "email").length})
            </button>
            <button
              onClick={() => setTypeFilter("sms")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                typeFilter === "sms"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              SMS ({templates.filter((t) => t.type === "sms").length})
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "usage" | "recent")}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="usage">Most Used</option>
            <option value="recent">Recently Updated</option>
          </select>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Template Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {template.type === "email" ? (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-green-50 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Used {template.usageCount}x
                  </p>
                </div>
              </div>

              {/* Type Badge */}
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  template.type === "email"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {template.type.toUpperCase()}
              </span>
            </div>

            {/* Content Preview */}
            <div className="mb-3">
              {template.subject && (
                <p className="text-sm font-medium text-gray-700 mb-1 line-clamp-1">
                  {template.subject}
                </p>
              )}
              <p className="text-xs text-gray-500 line-clamp-2">
                {template.body}
              </p>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b border-gray-200">
              <span>{template.variables.length} variables</span>
              <span>Updated {formatDate(template.updatedAt)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onPreview(template)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
              <button
                onClick={() => onEdit(template)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => onDuplicate(template)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Duplicate"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(template.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-500 mb-4">
            {typeFilter === "all"
              ? "Get started by creating your first template"
              : `No ${typeFilter} templates found`}
          </p>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      )}
    </div>
  );
}
