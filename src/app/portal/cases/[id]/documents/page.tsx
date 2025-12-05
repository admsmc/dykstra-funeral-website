"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/toast";
import { ErrorBoundary, PageErrorFallback } from "@/components/error";
import { Upload, Download, FileText, AlertCircle, Loader2 } from "lucide-react";

type DocumentType =
  | "Contract"
  | "Death Certificate"
  | "Photo"
  | "Invoice"
  | "Permit"
  | "Other";

interface Document {
  id: string;
  name: string;
  category: DocumentType;
  tags: string[];
  uploadedBy: string;
  uploadedAt: Date;
  size: number;
  url: string;
  caseId?: string;
  isPublic: boolean;
  fileType: string;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  "Contract": "Contracts & Agreements",
  "Death Certificate": "Death Certificates",
  "Photo": "Photos",
  "Invoice": "Invoices",
  "Permit": "Permits",
  "Other": "Other Documents",
};

const DOCUMENT_TYPE_ORDER: DocumentType[] = [
  "Contract",
  "Death Certificate",
  "Photo",
  "Invoice",
  "Permit",
  "Other",
];

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/tiff",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
}

function getFileIcon(mimeType: string): React.ReactNode {
  if (mimeType === "application/pdf") {
    return (
      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-semibold text-xs">
        PDF
      </div>
    );
  }
  if (mimeType.startsWith("image/")) {
    return (
      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs">
        IMG
      </div>
    );
  }
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return (
      <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-semibold text-xs">
        DOC
      </div>
    );
  }
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return (
      <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-semibold text-xs">
        XLS
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
      <FileText className="w-5 h-5" />
    </div>
  );
}

function DocumentsPageContent() {
  const params = useParams();
  const caseId = params.id as string;
  const toast = useToast();

  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocumentName, setUploadDocumentName] = useState("");
  const [uploadDocumentType, setUploadDocumentType] = useState<DocumentType>("Other");
  const [isUploading, setIsUploading] = useState(false);

  // tRPC queries and mutations
  const {
    data: documentsData,
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments,
  } = trpc.documentLibrary.list.useQuery({ caseId });

  const { data: currentCase } = trpc.case.getDetails.useQuery({ caseId });
  const { data: currentUser } = trpc.user.getProfile.useQuery();

  const documents = (documentsData?.documents ?? []) as Document[];
  const isFuneralDirector = currentUser?.role === "funeral_director";

  // Group documents by category
  const documentsByType = documents.reduce((acc, doc) => {
    const docType = doc.category as DocumentType;
    if (!acc[docType]) {
      acc[docType] = [];
    }
    acc[docType].push(doc);
    return acc;
  }, {} as Record<DocumentType, Document[]>);

  // Filter by selected type
  const filteredTypes = selectedType
    ? DOCUMENT_TYPE_ORDER.filter((type) => type === selectedType)
    : DOCUMENT_TYPE_ORDER;

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      // Find document and open its URL
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        window.open(doc.url, "_blank");
        toast.success(`Downloading ${filename}`);
      } else {
        toast.error("Document not found");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handlePrint = async (documentId: string) => {
    try {
      // Find document and open for printing
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        const printWindow = window.open(doc.url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        toast.success("Opening document for printing");
      } else {
        toast.error("Document not found");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to open document for printing");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error(
        "Invalid file type. Please upload PDF, Word, Excel, or image files."
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setUploadFile(file);
    setUploadDocumentName(file.name);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!uploadDocumentName.trim()) {
      toast.error("Please provide a document name");
      return;
    }

    setIsUploading(true);

    try {
      // Upload file via multipart form
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("caseId", caseId);
      formData.append("type", uploadDocumentType);
      formData.append("name", uploadDocumentName);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      toast.success("Document uploaded successfully");
      
      // Reset form
      setUploadFile(null);
      setUploadDocumentName("");
      setUploadDocumentType("Other");
      setIsUploadModalOpen(false);
      
      // Refresh documents list
      refetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[--navy]">
                Documents
              </h1>
              {currentCase && (
                <p className="mt-1 text-gray-600">
                  {currentCase.case.decedentName} • Case #{currentCase.case.id}
                </p>
              )}
            </div>

            {isFuneralDirector && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Filter Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === null
                ? "bg-[--navy] text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All Documents ({documents.length})
          </button>
          {DOCUMENT_TYPE_ORDER.map((type) => {
            const count = documentsByType[type]?.length ?? 0;
            if (count === 0) return null;
            
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === type
                    ? "bg-[--navy] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {DOCUMENT_TYPE_LABELS[type]} ({count})
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoadingDocuments && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[--navy]" />
          </div>
        )}

        {/* Empty State */}
        {!isLoadingDocuments && documents.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-600 mb-6">
              Documents related to this case will appear here.
            </p>
            {isFuneralDirector && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload First Document
              </button>
            )}
          </div>
        )}

        {/* Document Groups */}
        {!isLoadingDocuments && documents.length > 0 && (
          <div className="space-y-8">
            {filteredTypes.map((type) => {
              const typeDocuments = documentsByType[type];
              if (!typeDocuments || typeDocuments.length === 0) return null;

              return (
                <div key={type} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {DOCUMENT_TYPE_LABELS[type]}
                    </h2>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {typeDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* File Icon */}
                          {getFileIcon(doc.fileType)}

                          {/* Document Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {doc.name}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span>{formatFileSize(doc.size)}</span>
                              <span>•</span>
                              <span>{getFileExtension(doc.name)}</span>
                              <span>•</span>
                              <span>
                                Uploaded by {doc.uploadedBy}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleDownload(doc.id, doc.name)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                            <button
                              onClick={() => handlePrint(doc.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              Print
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Document
              </h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept={ACCEPTED_FILE_TYPES.join(",")}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[--navy] file:text-white hover:file:bg-[--navy]/90 file:cursor-pointer"
                />
                <p className="mt-2 text-xs text-gray-500">
                  PDF, Word, Excel, or image files. Max size: {formatFileSize(MAX_FILE_SIZE)}
                </p>
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={uploadDocumentName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setUploadDocumentName(e.target.value)}
                  placeholder="e.g., Death Certificate - Official Copy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={uploadDocumentType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setUploadDocumentType(e.target.value as DocumentType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                >
                  {DOCUMENT_TYPE_ORDER.map((type) => (
                    <option key={type} value={type}>
                      {DOCUMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  All documents are stored securely and encrypted. Only authorized case
                  participants can access these files.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setUploadDocumentName("");
                  setUploadDocumentType("Other");
                }}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || !uploadFile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <ErrorBoundary fallback={(error, reset) => <PageErrorFallback error={error} reset={reset} />}>
      <DocumentsPageContent />
    </ErrorBoundary>
  );
}
