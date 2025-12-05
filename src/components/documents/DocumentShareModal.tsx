"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Link as LinkIcon, Mail, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

interface DocumentShareModalProps {
  documentId: string;
  documentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentShareModal({
  documentId,
  documentName,
  isOpen,
  onClose,
}: DocumentShareModalProps) {
  const [expiresIn, setExpiresIn] = useState(7); // days
  const [copied, setCopied] = useState(false);

  // Generate shareable link mutation
  const { data: shareableLink, mutate: generateLink } =
    trpc.documentLibrary.getShareableLink.useMutation();

  // Generate link on mount if not already generated
  useState(() => {
    if (isOpen && !shareableLink) {
      generateLink({ id: documentId, expiresIn });
    }
  });

  const handleGenerateLink = () => {
    generateLink({ id: documentId, expiresIn });
  };

  const handleCopyLink = async () => {
    if (!shareableLink) return;

    const fullUrl = `${window.location.origin}${shareableLink.url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareViaEmail = () => {
    if (!shareableLink) return;

    const fullUrl = `${window.location.origin}${shareableLink.url}`;
    const subject = encodeURIComponent(`Document: ${documentName}`);
    const body = encodeURIComponent(
      `I'm sharing a document with you:\n\n${documentName}\n\n${fullUrl}\n\nThis link will expire on ${new Date(
        shareableLink.expiresAt
      ).toLocaleDateString()}.`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg shadow-xl z-50 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Share Document
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Document Name */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Document</p>
                <p className="font-medium text-gray-900">{documentName}</p>
              </div>

              {/* Expiration Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Expiration
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--navy]"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                  <button
                    onClick={handleGenerateLink}
                    className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition text-sm"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Shareable Link */}
              {shareableLink && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shareable Link
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 truncate">
                      {window.location.origin}
                      {shareableLink.url}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                        copied
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expiration Info */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Expires on{" "}
                      {new Date(shareableLink.expiresAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Share Options */}
              {shareableLink && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Via
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleShareViaEmail}
                      className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copy Link
                    </button>
                  </div>
                </div>
              )}

              {/* Access Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Anyone with this link can view this document
                  until the expiration date. The link cannot be revoked once shared.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
