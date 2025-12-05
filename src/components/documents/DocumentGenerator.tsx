/**
 * Document Generator Component
 * Template selection, data preview, and bulk generation
 */

"use client";

import { useState } from "react";
import { FileText, Check, Loader2, Eye, X } from "lucide-react";

interface CaseData {
  decedentName: string;
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;
  serviceType: string | null;
  serviceDate: Date | null;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: "service" | "memorial" | "administrative";
  variables: string[];
}

interface DocumentGeneratorProps {
  caseId: string;
  caseData: CaseData;
  onGenerate: (templateIds: string[], format: "PDF" | "DOCX") => void;
  isGenerating: boolean;
}

// Available document templates
const TEMPLATES: Template[] = [
  {
    id: "tpl_service_program",
    name: "Service Program",
    description: "Order of service with readings, music, and speakers",
    category: "service",
    variables: ["decedentName", "dateOfBirth", "dateOfDeath", "serviceDate", "serviceLocation"],
  },
  {
    id: "tpl_prayer_card",
    name: "Prayer Card",
    description: "Memorial prayer card with photo and prayer",
    category: "memorial",
    variables: ["decedentName", "dateOfBirth", "dateOfDeath"],
  },
  {
    id: "tpl_obituary",
    name: "Obituary",
    description: "Full obituary notice for newspaper and website",
    category: "memorial",
    variables: ["decedentName", "dateOfBirth", "dateOfDeath", "biography", "survivors"],
  },
  {
    id: "tpl_thank_you",
    name: "Thank You Card",
    description: "Thank you cards for family to send after service",
    category: "administrative",
    variables: ["decedentName", "familyName"],
  },
  {
    id: "tpl_memorial_folder",
    name: "Memorial Folder",
    description: "Keepsake folder with photos and memories",
    category: "memorial",
    variables: ["decedentName", "dateOfBirth", "dateOfDeath", "photos"],
  },
  {
    id: "tpl_register_book",
    name: "Register Book Pages",
    description: "Guest register book pages for service",
    category: "service",
    variables: ["decedentName", "serviceDate"],
  },
];

export function DocumentGenerator({
  caseId,
  caseData,
  onGenerate,
  isGenerating,
}: DocumentGeneratorProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [format, setFormat] = useState<"PDF" | "DOCX">("PDF");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const toggleTemplate = (templateId: string) => {
    if (selectedTemplates.includes(templateId)) {
      setSelectedTemplates(selectedTemplates.filter((id) => id !== templateId));
    } else {
      setSelectedTemplates([...selectedTemplates, templateId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTemplates.length === TEMPLATES.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(TEMPLATES.map((t) => t.id));
    }
  };

  const handleGenerate = () => {
    if (selectedTemplates.length === 0) return;
    onGenerate(selectedTemplates, format);
  };

  const getCategoryColor = (category: Template["category"]) => {
    switch (category) {
      case "service":
        return "bg-blue-100 text-blue-700";
      case "memorial":
        return "bg-purple-100 text-purple-700";
      case "administrative":
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Select Templates</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose one or more templates to generate
            </p>
          </div>
          <button
            onClick={handleSelectAll}
            className="text-sm font-medium text-[--navy] hover:underline"
          >
            {selectedTemplates.length === TEMPLATES.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {TEMPLATES.map((template) => {
            const isSelected = selectedTemplates.includes(template.id);
            return (
              <div
                key={template.id}
                onClick={() => toggleTemplate(template.id)}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? "border-[--navy] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                {/* Selection indicator */}
                <div
                  className={`absolute top-3 right-3 w-5 h-5 rounded flex items-center justify-center transition ${
                    isSelected
                      ? "bg-[--navy] text-white"
                      : "border-2 border-gray-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>

                {/* Category badge */}
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                    template.category
                  )} mb-2`}
                >
                  {template.category}
                </span>

                {/* Template info */}
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                {/* Preview button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                  }}
                  className="text-sm text-[--navy] hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Preview data mapping
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Format Selection & Generate Button */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Output Format:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat("PDF")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  format === "PDF"
                    ? "bg-[--navy] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                PDF
              </button>
              <button
                onClick={() => setFormat("DOCX")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  format === "DOCX"
                    ? "bg-[--navy] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                DOCX
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={selectedTemplates.length === 0 || isGenerating}
            className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isGenerating ? "Generating..." : `Generate ${selectedTemplates.length} Document(s)`}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Data Mapping Preview</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{previewTemplate.name}</h4>
                <p className="text-sm text-gray-600">{previewTemplate.description}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">
                  Template Variables → Case Data
                </h5>
                <div className="space-y-2">
                  {previewTemplate.variables.map((variable) => (
                    <div
                      key={variable}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm font-mono text-gray-700">{`{{${variable}}}`}</span>
                      <span className="text-sm text-gray-900">
                        {getVariableValue(variable, caseData)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get variable value from case data
function getVariableValue(variable: string, caseData: CaseData): string {
  switch (variable) {
    case "decedentName":
      return caseData.decedentName;
    case "dateOfBirth":
      return caseData.dateOfBirth
        ? new Date(caseData.dateOfBirth).toLocaleDateString()
        : "Not set";
    case "dateOfDeath":
      return caseData.dateOfDeath
        ? new Date(caseData.dateOfDeath).toLocaleDateString()
        : "Not set";
    case "serviceDate":
      return caseData.serviceDate
        ? new Date(caseData.serviceDate).toLocaleDateString()
        : "Not scheduled";
    case "serviceType":
      return caseData.serviceType || "Not set";
    case "serviceLocation":
      return "Dykstra Funeral Home"; // Mock
    case "biography":
      return "Full biography will be inserted here...";
    case "survivors":
      return "Family members will be listed here...";
    case "familyName":
      return "Family Name"; // Mock
    case "photos":
      return "3 photos selected"; // Mock
    default:
      return `{{${variable}}}`;
  }
}
