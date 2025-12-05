"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Download, Mail, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";

// Code splitting: lazy load DocumentGenerator (reduces initial bundle)
const DocumentGenerator = dynamic(
  () => import("@/components/documents/DocumentGenerator").then((mod) => ({ default: mod.DocumentGenerator })),
  {
    loading: () => (
      <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-4">Loading document generator...</p>
      </div>
    ),
    ssr: false, // Document generator has client-side dependencies
  }
);

/**
 * Case Documents Page
 * Manage document generation for a funeral case
 */

interface GeneratedDocument {
  id: string;
  templateId: string;
  templateName: string;
  format: string;
  url: string;
  generatedAt: Date;
  generatedBy: string;
}

export default function CaseDocumentsPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);

  // Fetch case details for document data mapping
  const { data: caseDetails, isLoading: caseLoading } = trpc.case.getDetails.useQuery({
    caseId,
  });

  // Generate documents mutation
  const generateMutation = trpc.case.generateDocuments.useMutation({
    onSuccess: (result) => {
      toast.success(`Generated ${result.documents.length} document(s)`);
      // Add to generated docs list
      const newDocs: GeneratedDocument[] = result.documents.map((doc) => ({
        id: doc.id,
        templateId: doc.templateId,
        templateName: getTemplateName(doc.templateId),
        format: doc.format,
        url: doc.url,
        generatedAt: doc.generatedAt,
        generatedBy: doc.generatedBy,
      }));
      setGeneratedDocs([...newDocs, ...generatedDocs]);
    },
    onError: (error) => {
      toast.error(`Failed to generate documents: ${error.message}`);
    },
  });

  const handleGenerate = (templateIds: string[], format: "PDF" | "DOCX") => {
    generateMutation.mutate({
      caseId,
      templateIds,
      format,
    });
  };

  const handleDownload = (document: GeneratedDocument) => {
    // In production, this would trigger actual download
    toast.success(`Downloading ${document.templateName}`);
    window.open(document.url, "_blank");
  };

  const handleEmail = (document: GeneratedDocument) => {
    // In production, this would open email modal
    toast.success(`Email sent with ${document.templateName}`);
  };

  if (caseLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-4">Loading case details...</p>
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Case not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/staff/cases/${caseId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Generation</h1>
            <p className="text-sm text-gray-600 mt-1">
              {caseDetails.case.decedentName} - Generate service documents
            </p>
          </div>
        </div>
      </div>

      {/* Document Generator Component */}
      <DocumentGenerator
        caseId={caseId}
        caseData={{
          decedentName: caseDetails.case.decedentName,
          dateOfBirth: caseDetails.case.decedentDateOfBirth,
          dateOfDeath: caseDetails.case.decedentDateOfDeath,
          serviceType: caseDetails.case.serviceType,
          serviceDate: caseDetails.case.serviceDate,
        }}
        onGenerate={handleGenerate}
        isGenerating={generateMutation.isPending}
      />

      {/* Generated Documents List */}
      {generatedDocs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Generated Documents</h2>
            <p className="text-sm text-gray-600 mt-1">
              {generatedDocs.length} document(s) generated
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {generatedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.templateName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.generatedAt).toLocaleString()} • {doc.format}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEmail(doc)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Email to family"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get template display names
function getTemplateName(templateId: string): string {
  const names: Record<string, string> = {
    tpl_service_program: "Service Program",
    tpl_prayer_card: "Prayer Card",
    tpl_obituary: "Obituary",
    tpl_thank_you: "Thank You Card",
    tpl_memorial_folder: "Memorial Folder",
    tpl_register_book: "Register Book Pages",
  };
  return names[templateId] || templateId;
}
