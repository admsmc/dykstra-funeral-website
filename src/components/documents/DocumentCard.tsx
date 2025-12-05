"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Share2,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";

interface DocumentCardProps {
  document: {
    id: string;
    name: string;
    category: string;
    tags: string[];
    uploadedBy: string;
    uploadedAt: Date;
    size: number;
    fileType: string;
    url: string;
  };
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  onEdit?: (id: string) => void;
  className?: string;
}

export default function DocumentCard({
  document,
  onDelete,
  onShare,
  onEdit,
  className = "",
}: DocumentCardProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);

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
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return new Date(date).toLocaleDateString();
  };

  const isImage = document.fileType.startsWith("image/");

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(document.url, "_blank");
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) onShare(document.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(document.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(document.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/staff/documents/${document.id}`)}
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer group ${className}`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {isImage ? (
          <img
            src={document.url}
            alt={document.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Overlay actions on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleDownload}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
            title="Download"
          >
            <Download className="w-5 h-5 text-gray-700" />
          </button>
          {onShare && (
            <button
              onClick={handleShare}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
              title="Share"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
            {document.name}
          </h3>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {/* Actions dropdown */}
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-36">
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  {onShare && (
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="mb-3">
          <span
            className={`inline-block text-xs px-2 py-1 rounded border ${getCategoryColor(
              document.category
            )}`}
          >
            {document.category}
          </span>
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {document.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
              >
                #{tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                +{document.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>{document.uploadedBy}</span>
            <span>{formatFileSize(document.size)}</span>
          </div>
          <div>{formatDate(document.uploadedAt)}</div>
        </div>
      </div>
    </motion.div>
  );
}
