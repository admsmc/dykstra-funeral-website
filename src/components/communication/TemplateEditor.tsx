"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Type, Mail, MessageSquare, Eye, Code, Save, X } from "lucide-react";
import type { Template, TemplateType } from "@/../../packages/api/src/routers/communication.router";

interface TemplateEditorProps {
  template?: Template;
  onSave: (template: Partial<Template>) => void;
  onCancel: () => void;
}

const AVAILABLE_VARIABLES = [
  { key: "firstName", label: "First Name", category: "Contact" },
  { key: "lastName", label: "Last Name", category: "Contact" },
  { key: "fullName", label: "Full Name", category: "Contact" },
  { key: "email", label: "Email", category: "Contact" },
  { key: "phone", label: "Phone", category: "Contact" },
  { key: "decedentName", label: "Decedent Name", category: "Case" },
  { key: "serviceName", label: "Service Name", category: "Case" },
  { key: "serviceDate", label: "Service Date", category: "Case" },
  { key: "serviceLocation", label: "Service Location", category: "Case" },
  { key: "caseNumber", label: "Case Number", category: "Case" },
  { key: "funeralHomeName", label: "Funeral Home Name", category: "General" },
  { key: "funeralHomePhone", label: "Funeral Home Phone", category: "General" },
  { key: "funeralHomeAddress", label: "Funeral Home Address", category: "General" },
  { key: "currentDate", label: "Current Date", category: "General" },
];

export default function TemplateEditor({
  template,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || "");
  const [type, setType] = useState<TemplateType>(template?.type || "email");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Extract variables from body text
  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [...text.matchAll(regex)];
    return [...new Set(matches.map((m) => m[1]))];
  };

  const variables = extractVariables(body);

  // Insert variable at cursor
  const insertVariable = (variable: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody =
      body.substring(0, start) + `{{${variable}}}` + body.substring(end);

    setBody(newBody);
    setShowVariables(false);

    // Move cursor after inserted variable
    setTimeout(() => {
      const newPosition = start + variable.length + 4; // {{variable}}
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  // Preview with sample data
  const previewData = {
    firstName: "John",
    lastName: "Smith",
    fullName: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    decedentName: "Mary Smith",
    serviceName: "Memorial Service",
    serviceDate: "December 15, 2024",
    serviceLocation: "Chapel of Peace",
    caseNumber: "CASE-2024-123",
    funeralHomeName: "Dykstra Funeral Home",
    funeralHomePhone: "(555) 555-5555",
    funeralHomeAddress: "123 Main St, Anytown, MI 12345",
    currentDate: new Date().toLocaleDateString(),
  };

  const renderPreview = (text: string) => {
    let preview = text;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
    return preview;
  };

  const handleSave = () => {
    onSave({
      id: template?.id,
      name,
      type,
      subject: type === "email" ? subject : undefined,
      body,
      variables,
    });
  };

  const isValid = name.trim() && body.trim() && (type === "sms" || subject.trim());

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {type === "email" ? (
              <Mail className="w-6 h-6 text-blue-600" />
            ) : (
              <MessageSquare className="w-6 h-6 text-green-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {template ? "Edit Template" : "Create Template"}
              </h2>
              <p className="text-sm text-gray-500">
                {type === "email" ? "Email Template" : "SMS Template"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TemplateType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>

          {/* Subject (Email only) */}
          {type === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Welcome to {{funeralHomeName}}"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Message Body
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVariables(!showVariables)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Code className="w-4 h-4" />
                  Insert Variable
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? "Hide" : "Show"} Preview
                </button>
              </div>
            </div>

            {/* Variable Picker */}
            <AnimatePresence>
              {showVariables && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">
                      Click to insert a variable:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_VARIABLES.map((v) => (
                        <button
                          key={v.key}
                          onClick={() => insertVariable(v.key)}
                          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          {`{{${v.key}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea & Preview */}
            <div className="grid grid-cols-1 gap-3">
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onSelect={(e) =>
                  setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)
                }
                placeholder={
                  type === "email"
                    ? "Dear {{firstName}},\n\nWe are honored to serve your family..."
                    : "{{firstName}}, reminder: Appt at {{funeralHomeName}}..."
                }
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              />

              {showPreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <p className="text-xs font-medium text-blue-700 mb-2">
                    Preview (with sample data):
                  </p>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {renderPreview(body)}
                  </div>
                </motion.div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {type === "sms" ? `${body.length}/160 characters` : `${variables.length} variables detected`}
            </p>
          </div>

          {/* Variables Summary */}
          {variables.length > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Variables in this template:
              </p>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <span
                    key={v}
                    className="text-xs px-2 py-1 bg-white border border-gray-300 rounded text-gray-700"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {template ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
