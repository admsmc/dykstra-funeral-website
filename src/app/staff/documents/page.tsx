"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, Grid3x3, List, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import DocumentSearchBar from "@/components/documents/DocumentSearchBar";
import DocumentFilterPanel, {
  type DocumentFilters,
} from "@/components/documents/DocumentFilterPanel";
import DocumentCard from "@/components/documents/DocumentCard";
import DocumentShareModal from "@/components/documents/DocumentShareModal";

type ViewMode = "grid" | "list";
type SortBy = "date" | "name" | "size";
type SortOrder = "asc" | "desc";

export default function DocumentsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState<DocumentFilters>({
    categories: [],
    tags: [],
    uploadedBy: [],
  });
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>("");

  // Fetch documents with filters
  const { data, isLoading, refetch } = trpc.documentLibrary.list.useQuery({
    page,
    limit: 20,
    category: filters.categories.length > 0 ? (filters.categories as any) : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    uploadedBy: filters.uploadedBy.length > 0 ? filters.uploadedBy[0] : undefined,
    startDate: filters.startDate,
    endDate: filters.endDate,
    sortBy,
    sortOrder,
  });

  // Delete mutation
  const deleteMutation = trpc.documentLibrary.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleFilterChange = useCallback((newFilters: DocumentFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  }, []);

  const handleSearch = useCallback((query: string) => {
    // Search redirects to results with query param
    // For now, we'll just use the search bar's built-in navigation
  }, []);

  const handleShare = (documentId: string, documentName: string) => {
    setSelectedDocumentId(documentId);
    setSelectedDocumentName(documentName);
    setShareModalOpen(true);
  };

  const handleDelete = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate({ id: documentId });
    }
  };

  const handleEdit = (documentId: string) => {
    router.push(`/staff/documents/${documentId}`);
  };

  const hasFilters =
    filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    filters.uploadedBy.length > 0 ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[--navy] mb-2">
                Documents
              </h1>
              <p className="text-gray-600">
                Manage and organize all your documents in one place
              </p>
            </div>
            <button
              onClick={() => router.push("/staff/documents/upload")}
              className="flex items-center gap-2 px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
            >
              <Upload className="w-5 h-5" />
              Upload
            </button>
          </div>

          {/* Search Bar */}
          <DocumentSearchBar onSearch={handleSearch} className="mb-4" />

          {/* View Controls & Sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--navy]"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              {/* Results count */}
              {data && (
                <p className="text-sm text-gray-600">
                  {data.total} {data.total === 1 ? "document" : "documents"}
                </p>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition ${
                  viewMode === "grid"
                    ? "bg-[--navy] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition ${
                  viewMode === "list"
                    ? "bg-[--navy] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <DocumentFilterPanel
              onFilterChange={handleFilterChange}
              className="sticky top-4"
            />
          </div>

          {/* Documents Grid/List */}
          <div className="lg:col-span-3">
            {isLoading ? (
              // Loading State
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[--navy] mx-auto mb-4" />
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              </div>
            ) : data && data.documents.length > 0 ? (
              <>
                {/* Documents Grid */}
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "space-y-4"
                  }
                >
                  {data.documents.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <DocumentCard
                        document={doc}
                        onDelete={handleDelete}
                        onShare={() => handleShare(doc.id, doc.name)}
                        onEdit={handleEdit}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                        (pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-2 rounded-lg transition ${
                              page === pageNum
                                ? "bg-[--navy] text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.totalPages}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Empty State
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-20"
              >
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {hasFilters ? "No documents found" : "No documents yet"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {hasFilters
                    ? "Try adjusting your filters to see more results"
                    : "Upload your first document to get started"}
                </p>
                {hasFilters ? (
                  <button
                    onClick={() =>
                      setFilters({
                        categories: [],
                        tags: [],
                        uploadedBy: [],
                      })
                    }
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/staff/documents/upload")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Document
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <DocumentShareModal
        documentId={selectedDocumentId}
        documentName={selectedDocumentName}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
}
