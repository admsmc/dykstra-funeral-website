"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import TemplateLibrary from "@/components/communication/TemplateLibrary";
import TemplateEditor from "@/components/communication/TemplateEditor";
import type { Template } from "@/../../packages/api/src/routers/communication.router";

export default function TemplatesPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>();
  const [showPreview, setShowPreview] = useState<Template | null>(null);

  // Mock templates
  const mockTemplates: Template[] = [
    {
      id: "tpl-1",
      name: "Welcome Email",
      type: "email",
      subject: "Welcome to {{funeralHomeName}}",
      body: "Dear {{firstName}},\n\nWe are honored to serve your family...",
      variables: ["firstName", "funeralHomeName"],
      usageCount: 45,
      lastUsedAt: new Date("2024-12-03"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "tpl-2",
      name: "Appointment Reminder Email",
      type: "email",
      subject: "Appointment Reminder - {{serviceName}}",
      body: "Dear {{firstName}},\n\nThis is a reminder about your appointment...",
      variables: ["firstName", "serviceName"],
      usageCount: 120,
      lastUsedAt: new Date("2024-12-04"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-03-20"),
    },
    {
      id: "tpl-11",
      name: "Appointment Reminder SMS",
      type: "sms",
      body: "{{firstName}}, reminder: Appt at {{funeralHomeName}} on {{serviceDate}}.",
      variables: ["firstName", "funeralHomeName", "serviceDate"],
      usageCount: 156,
      lastUsedAt: new Date("2024-12-04"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "tpl-12",
      name: "Service Reminder SMS",
      type: "sms",
      body: "{{firstName}}, reminder: {{serviceName}} today at {{serviceLocation}}.",
      variables: ["firstName", "serviceName", "serviceLocation"],
      usageCount: 203,
      lastUsedAt: new Date("2024-12-04"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
  ];

  const [templates, setTemplates] = useState(mockTemplates);

  const handleCreate = () => {
    setEditingTemplate(undefined);
    setShowEditor(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSave = (templateData: Partial<Template>) => {
    if (editingTemplate?.id) {
      // Update existing
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, ...templateData, updatedAt: new Date() }
            : t
        )
      );
    } else {
      // Create new
      const newTemplate: Template = {
        id: `tpl-${Date.now()}`,
        name: templateData.name || "",
        type: templateData.type || "email",
        subject: templateData.subject,
        body: templateData.body || "",
        variables: templateData.variables || [],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTemplates([...templates, newTemplate]);
    }
    setShowEditor(false);
    setEditingTemplate(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
  };

  const handleDuplicate = (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      lastUsedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTemplates([...templates, duplicated]);
  };

  const handlePreview = (template: Template) => {
    setShowPreview(template);
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
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">
              Manage email and SMS templates
            </p>
          </div>
        </div>
      </motion.div>

      {/* Template Library */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <TemplateLibrary
          templates={templates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onPreview={handlePreview}
          onCreate={handleCreate}
        />
      </motion.div>

      {/* Editor Modal */}
      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingTemplate(undefined);
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Template Preview
              </h2>
              <p className="text-sm text-gray-500 mt-1">{showPreview.name}</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {showPreview.subject && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Subject:
                  </p>
                  <p className="text-sm text-gray-900">{showPreview.subject}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Body:</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {showPreview.body}
                </p>
              </div>
              {showPreview.variables.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Variables:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {showPreview.variables.map((v) => (
                      <span
                        key={v}
                        className="text-xs px-2 py-1 bg-white border border-gray-300 rounded"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(null)}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
