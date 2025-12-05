"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Mail, MessageSquare, Send, Users, FileText } from "lucide-react";
import type { Template, TemplateType } from "@/../../packages/api/src/routers/communication.router";
import TemplateSearchBar from "./TemplateSearchBar";

interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ComposeMessageModalProps {
  onClose: () => void;
  onSend: (data: {
    type: TemplateType;
    recipients: Recipient[];
    subject?: string;
    body: string;
    templateId?: string;
  }) => void;
  preselectedRecipients?: Recipient[];
  preselectedType?: TemplateType;
}

export default function ComposeMessageModal({
  onClose,
  onSend,
  preselectedRecipients = [],
  preselectedType = "email",
}: ComposeMessageModalProps) {
  const [type, setType] = useState<TemplateType>(preselectedType);
  const [recipients, setRecipients] = useState<Recipient[]>(preselectedRecipients);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");

  // Mock recipients for search
  const mockRecipients: Recipient[] = [
    { id: "1", name: "John Smith", email: "john@example.com", phone: "555-0101" },
    { id: "2", name: "Jane Doe", email: "jane@example.com", phone: "555-0102" },
    { id: "3", name: "Robert Johnson", email: "robert@example.com", phone: "555-0103" },
  ];

  const filteredRecipients = recipientSearch
    ? mockRecipients.filter((r) =>
        r.name.toLowerCase().includes(recipientSearch.toLowerCase())
      )
    : mockRecipients.slice(0, 5);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setType(template.type);
    if (template.subject) setSubject(template.subject);
    setBody(template.body);
  };

  const handleAddRecipient = (recipient: Recipient) => {
    if (!recipients.find((r) => r.id === recipient.id)) {
      setRecipients([...recipients, recipient]);
    }
    setRecipientSearch("");
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const handleSend = () => {
    onSend({
      type,
      recipients,
      subject: type === "email" ? subject : undefined,
      body,
      templateId: selectedTemplate?.id,
    });
  };

  const isValid =
    recipients.length > 0 &&
    body.trim() &&
    (type === "sms" || subject.trim());

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
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
                Compose Message
              </h2>
              <p className="text-sm text-gray-500">
                Send {type === "email" ? "email" : "SMS"} to families
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setType("email")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  type === "email"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </button>
              <button
                onClick={() => setType("sms")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  type === "sms"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                SMS
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Use Template (Optional)
            </label>
            <TemplateSearchBar onSelectTemplate={handleTemplateSelect} />
            {selectedTemplate && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    {selectedTemplate.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients
            </label>
            
            {/* Selected Recipients */}
            {recipients.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {recipients.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {r.name}
                    <button
                      onClick={() => handleRemoveRecipient(r.id)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Recipient Search */}
            <div className="relative">
              <input
                type="text"
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Search families..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              {recipientSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredRecipients.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleAddRecipient(r)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {r.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {type === "email" ? r.email : r.phone}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subject (Email only) */}
          {type === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Service Reminder"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* Message Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                type === "email"
                  ? "Dear {{firstName}},\n\nWe are reaching out..."
                  : "{{firstName}}, reminder: ..."
              }
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {type === "sms"
                ? `${body.length}/160 characters`
                : "Use {{variable}} for personalization"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!isValid}
              className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
