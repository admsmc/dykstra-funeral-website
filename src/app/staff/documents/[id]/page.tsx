"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Share2,
  Trash2,
  Edit2,
  Save,
  X,
  FileText,
  Calendar,
  User,
  Folder,
  HardDrive,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import DocumentTagManager from "@/components/documents/DocumentTagManager";
import DocumentShareModal from "@/components/documents/DocumentShareModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Fetch document
  const { data: document, isLoading, refetch } = trpc.documentLibrary.get.useQuery({ id });

  // Update mutation
  const updateMutation = trpc.documentLibrary.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.documentLibrary.delete.useMutation({
    onSuccess: () => {
      router.push("/staff/documents");
    },
  });

  const handleStartEdit = () => {
    if (document) {
      setEditedName(document.name);
      setEditedCategory(document.category);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      id,
      name: editedName,
      category: editedCategory as any,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (document) {
      setEditedName(document.name);
      setEditedCategory(document.category);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDownload = () => {
    if (document) {
      window.open(document.url, "_blank");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Death Certificate":
        return "bg-red-100 text-red-700 border-red-200";
      case "Contract":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Invoice":
        return "bg-green-100 text-green-700 border-green-200";
      case "Photo":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Permit":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[--navy] mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <p className="text-gray-600 mb-6">The document you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/staff/documents")}
            className="px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const isImage = document.fileType.startsWith("image/");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/staff/documents")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[--navy]"
                  />
                  <select
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--navy]"
                  >
                    <option value="Death Certificate">Death Certificate</option>
                    <option value="Contract">Contract</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Photo">Photo</option>
                    <option value="Permit">Permit</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-serif font-bold text-[--navy] mb-2">
                    {document.name}
                  </h1>
                  <span
                    className={`inline-block text-sm px-3 py-1 rounded border ${getCategoryColor(
                      document.category
                    )}`}
                  >
                    {document.category}
                  </span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {isImage ? (
                  <img
                    src={document.url}
                    alt={document.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available</p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
                    >
                      Download to View
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Metadata Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Document Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Document Info</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <HardDrive className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Size</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatFileSize(document.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Uploaded by</p>
                    <p className="text-sm font-medium text-gray-900">
                      {document.uploadedBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Uploaded</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(document.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Folder className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">File type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {document.fileType}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
              <DocumentTagManager
                documentId={document.id}
                initialTags={document.tags}
                onTagsUpdate={() => refetch()}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <DocumentShareModal
        documentId={document.id}
        documentName={document.name}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
}
