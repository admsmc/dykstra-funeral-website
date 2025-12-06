import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  FileText,
  Image,
  Clock,
  MessageSquare,
  Edit,
  Archive,
  Users,
  Mail,
  RefreshCw,
  XCircle,
  Plus,
  Trash2,
  Package,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import type { CaseDetailViewModel } from "../view-models/CaseDetailViewModel";
import type { TabType, TabConfig } from "../types";
import { useFamilyInvitations } from "../hooks/useFamilyInvitations";
import { familyInvitationSchema, FAMILY_ROLES, type FamilyInvitationForm } from "@dykstra/domain/validation";
import { Form, Timeline, TimelineEvent } from "@dykstra/ui";
import { FormInput, FormSelect } from "@dykstra/ui";
import { DocumentUploader } from "@/components/upload/DocumentUploader";

// ============================================================================
// Header Components
// ============================================================================

export function CaseDetailHeader({ 
  viewModel,
  onEdit,
  onArchive,
  onStatusClick,
}: { 
  viewModel: CaseDetailViewModel;
  onEdit?: () => void;
  onArchive?: () => void;
  onStatusClick?: () => void;
}) {
  return (
    <div>
      <Link
        href="/staff/cases"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cases
      </Link>
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{viewModel.decedentName}</h1>
          <p className="text-gray-600 mt-1">
            Case #{viewModel.caseNumberShort} · {viewModel.caseType}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onStatusClick}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all hover:shadow-md cursor-pointer ${viewModel.statusBadgeConfig.bg} ${viewModel.statusBadgeConfig.text}`}
            title="Click to change status"
          >
            {viewModel.status}
          </button>
          
          <button 
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Edit className="w-4 h-4" />
            Edit Case
          </button>
          
          <button 
            onClick={onArchive}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Archive className="w-4 h-4" />
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuickStatsCards({ viewModel }: { viewModel: CaseDetailViewModel }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">Service Date</p>
        <p className="text-lg font-semibold text-gray-900 mt-1">
          {viewModel.formattedServiceDate}
        </p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">Service Type</p>
        <p className="text-lg font-semibold text-gray-900 mt-1">
          {viewModel.formattedServiceType}
        </p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">Created</p>
        <p className="text-lg font-semibold text-gray-900 mt-1">
          {viewModel.formattedCreatedDate}
        </p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">Last Updated</p>
        <p className="text-lg font-semibold text-gray-900 mt-1">
          {viewModel.formattedUpdatedDate}
        </p>
      </div>
    </div>
  );
}

export function TabNavigation({ 
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabConfig[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                isActive
                  ? "border-[--navy] text-[--navy]"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ============================================================================
// Tab Content Components
// ============================================================================

export function OverviewTab({ viewModel }: { viewModel: CaseDetailViewModel }) {
  return (
    <div className="space-y-6">
      {/* Decedent Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Decedent Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <p className="text-gray-900 mt-1">{viewModel.decedentName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date of Birth</label>
            <p className="text-gray-900 mt-1">{viewModel.decedentDateOfBirth}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date of Death</label>
            <p className="text-gray-900 mt-1">{viewModel.decedentDateOfDeath}</p>
          </div>
        </div>
      </div>

      {/* Staff Assignments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Assignments</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Assigned Funeral Director</p>
          <p className="text-gray-900 font-medium mt-1">Not assigned</p>
          <button className="text-sm text-[--navy] hover:underline mt-2">
            Assign Director
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">Contract Total</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">$0.00</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">Paid to Date</p>
            <p className="text-2xl font-bold text-green-900 mt-1">$0.00</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">Outstanding Balance</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">$0.00</p>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>
        <div className="text-center py-8 text-gray-500">
          No tasks assigned to this case
        </div>
      </div>
    </div>
  );
}

export function ArrangementsTab({ caseId }: { caseId?: string }) {
  const router = useRouter();
  
  // Fetch arrangement data if caseId is provided
  const { data: arrangement, isLoading } = trpc.arrangements.get.useQuery(
    { caseId: caseId ?? "" },
    { enabled: !!caseId }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[--navy]" />
      </div>
    );
  }

  // Empty state
  if (!arrangement) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-12 text-center"
      >
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Service Arrangement Yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create a personalized service arrangement for this case, including
          service selection, product customization, and ceremony planning.
        </p>
        <button
          onClick={() => router.push(`/staff/arrangements/${caseId}/select`)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
        >
          Create Arrangement
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-lg p-4 flex items-center justify-between ${
          arrangement.isComplete
            ? "bg-green-50 border border-green-200"
            : "bg-blue-50 border border-blue-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {arrangement.isComplete ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  Arrangement Complete
                </p>
                <p className="text-sm text-green-700">
                  Ready for service execution
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">In Progress</p>
                <p className="text-sm text-blue-700">
                  {arrangement.completionPercentage}% complete
                </p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => router.push(`/staff/arrangements/${caseId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
        >
          <Edit className="w-4 h-4" />
          Edit Arrangement
        </button>
      </motion.div>

      {/* Progress Bar */}
      {!arrangement.isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Completion Progress
            </span>
            <span className="text-sm font-semibold text-[--navy]">
              {arrangement.completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${arrangement.completionPercentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[--navy] h-2 rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Service Type */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[--navy]" />
            <h4 className="font-semibold text-gray-900">Service Type</h4>
          </div>
          <p className="text-sm text-gray-700">
            {arrangement.serviceType
              ? arrangement.serviceType.replace(/_/g, " ")
              : "Not selected yet"}
          </p>
        </motion.div>

        {/* Estimated Cost */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[--navy]" />
            <h4 className="font-semibold text-gray-900">Estimated Cost</h4>
          </div>
          <p className="text-lg font-bold text-[--navy]">
            {formatCurrency(arrangement.totalProductCost)}
          </p>
          <p className="text-xs text-gray-600">
            {arrangement.selectedProductCount} products selected
          </p>
        </motion.div>

        {/* Ceremony Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-[--navy]" />
            <h4 className="font-semibold text-gray-900">Ceremony</h4>
          </div>
          <p className="text-sm text-gray-500 italic">
            Ceremony details can be planned and updated from the Arrangements workflow.
          </p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-4"
      >
        <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              router.push(`/staff/arrangements/${caseId}/customize`)
            }
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Customize Products
          </button>
          <button
            onClick={() =>
              router.push(`/staff/arrangements/${caseId}/ceremony`)
            }
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Plan Ceremony
          </button>
          <button
            onClick={() => router.push(`/staff/arrangements/${caseId}`)}
            className="px-4 py-2 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
          >
            View Full Details
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ContractTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Contract</p>
      <p className="text-sm mt-1">Contract details will appear here</p>
    </div>
  );
}

export function PaymentsTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Payments</p>
      <p className="text-sm mt-1">Payment history and processing</p>
    </div>
  );
}

export function MemorialTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Memorial</p>
      <p className="text-sm mt-1">Photos and memorial page management</p>
    </div>
  );
}

export function DocumentsTab({ caseId }: { caseId: string }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showUploader, setShowUploader] = useState(false);
  
  // Mock documents (replace with real tRPC query)
  const mockDocuments = [
    {
      id: '1',
      name: 'Death Certificate.pdf',
      category: 'Death Certificate',
      size: 245000,
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      uploadedBy: 'John Director',
      url: '/api/documents/1',
    },
    {
      id: '2',
      name: 'Service Contract.pdf',
      category: 'Contract',
      size: 512000,
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      uploadedBy: 'Jane Admin',
      url: '/api/documents/2',
    },
    {
      id: '3',
      name: 'Family Photo.jpg',
      category: 'Photo',
      size: 1024000,
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      uploadedBy: 'John Director',
      url: '/api/documents/3',
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Death Certificate': return 'bg-red-100 text-red-700';
      case 'Contract': return 'bg-blue-100 text-blue-700';
      case 'Invoice': return 'bg-green-100 text-green-700';
      case 'Photo': return 'bg-purple-100 text-purple-700';
      case 'Permit': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (mockDocuments.length === 0 && !showUploader) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 text-[--charcoal] opacity-20" />
        <p className="font-medium text-[--navy] mb-2">No documents yet</p>
        <p className="text-sm text-[--charcoal] opacity-60 mb-4">
          Upload death certificates, contracts, and other case documents
        </p>
        <button
          onClick={() => setShowUploader(true)}
          className="px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all"
        >
          Upload First Document
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[--navy]">Documents</h3>
          <p className="text-sm text-[--charcoal] opacity-60 mt-0.5">
            {mockDocuments.length} document{mockDocuments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all"
          >
            {view === 'grid' ? 'List View' : 'Grid View'}
          </button>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="px-4 py-1.5 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-medium"
          >
            {showUploader ? 'Hide Uploader' : 'Upload Document'}
          </button>
        </div>
      </div>

      {/* Document Uploader */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="border-2 border-[--sage] rounded-lg p-4 bg-[--cream]">
              <DocumentUploader
                caseId={caseId}
                onUploadComplete={() => {
                  setShowUploader(false);
                  // Refresh documents list
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents Grid */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 rounded-lg p-4 hover:border-[--sage] hover:shadow-md transition-all group"
            >
              {/* Document Icon/Preview */}
              <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <FileText className="w-12 h-12 text-[--charcoal] opacity-40" />
              </div>
              
              {/* Document Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-[--navy] text-sm truncate flex-1">
                    {doc.name}
                  </p>
                  <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getCategoryColor(doc.category)}`}>
                    {doc.category}
                  </span>
                </div>
                <p className="text-xs text-[--charcoal] opacity-60">
                  {(doc.size / 1024).toFixed(0)} KB · {doc.uploadedAt.toLocaleDateString()}
                </p>
                <p className="text-xs text-[--charcoal] opacity-60">
                  By {doc.uploadedBy}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                  Download
                </button>
                <button className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                  Share
                </button>
                <button className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Documents List */
        <div className="space-y-2">
          {mockDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 rounded-lg p-4 hover:border-[--sage] transition-all flex items-center gap-4"
            >
              <FileText className="w-10 h-10 text-[--charcoal] opacity-40 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-[--navy] text-sm truncate">
                    {doc.name}
                  </p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(doc.category)}`}>
                    {doc.category}
                  </span>
                </div>
                <p className="text-xs text-[--charcoal] opacity-60">
                  {(doc.size / 1024).toFixed(0)} KB · Uploaded {doc.uploadedAt.toLocaleDateString()} by {doc.uploadedBy}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                  Download
                </button>
                <button className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                  Share
                </button>
                <button className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TimelineTab() {
  // TODO: Fetch real timeline data from API
  // For now, showing mock events demonstrating the Timeline component
  const mockEvents = [
    {
      id: '1',
      eventType: 'created' as const,
      title: 'Case Created',
      description: 'Initial inquiry received from family',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      status: 'success' as const,
    },
    {
      id: '2',
      eventType: 'signed' as const,
      title: 'Contract Signed',
      description: 'Family signed service agreement and selected arrangements',
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: 'success' as const,
    },
    {
      id: '3',
      eventType: 'payment' as const,
      title: 'Payment Received',
      description: 'Initial deposit of $2,500 received via credit card',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'success' as const,
    },
    {
      id: '4',
      eventType: 'updated' as const,
      title: 'Service Scheduled',
      description: 'Funeral service scheduled for Dec 15, 2024 at 10:00 AM',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'info' as const,
    },
    {
      id: '5',
      eventType: 'upload' as const,
      title: 'Documents Uploaded',
      description: 'Death certificate and service program added',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'info' as const,
    },
    {
      id: '6',
      eventType: 'message' as const,
      title: 'Family Contacted',
      description: 'Sent service confirmation email to all family members',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'default' as const,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Case Activity History</h3>
        <p className="text-sm text-gray-600 mt-1">Complete timeline of all case events and interactions</p>
      </div>

      <Timeline variant="comfortable">
        {mockEvents.map((event, index) => (
          <TimelineEvent
            key={event.id}
            eventType={event.eventType}
            title={event.title}
            description={event.description}
            timestamp={event.timestamp}
            status={event.status}
            isLast={index === mockEvents.length - 1}
          />
        ))}
      </Timeline>
    </div>
  );
}

// ============================================================================
// Internal Notes Tab
// ============================================================================

export function InternalNotesTab({
  caseId,
  notes,
  isLoading,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  isCreating,
  isUpdating,
  isDeleting,
}: {
  caseId: string;
  notes: any[] | undefined;
  isLoading: boolean;
  onCreateNote: (data: { caseId: string; content: string }) => void;
  onUpdateNote: (data: { businessKey: string; content: string }) => void;
  onDeleteNote: (data: { businessKey: string }) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

  const handleSubmit = () => {
    if (!noteContent.trim()) return;

    if (editingNote) {
      onUpdateNote({
        businessKey: editingNote,
        content: noteContent.trim(),
      });
    } else {
      onCreateNote({
        caseId,
        content: noteContent.trim(),
      });
    }
    
    setIsAdding(false);
    setEditingNote(null);
    setNoteContent("");
  };

  const handleEdit = (note: any) => {
    setEditingNote(note.businessKey);
    setNoteContent(note.content);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingNote(null);
    setNoteContent("");
  };

  const handleDelete = (businessKey: string) => {
    if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      onDeleteNote({ businessKey });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Staff-Only Notes</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm"
          >
            Add Note
          </button>
        )}
      </div>

      {/* Add/Edit Note Form */}
      {isAdding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your note here... (staff only)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={!noteContent.trim() || isCreating || isUpdating}
              className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingNote ? "Update Note" : "Add Note"}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading notes...</div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.businessKey}
              className="bg-white border border-gray-200 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(note)}
                    className="text-sm text-[--navy] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(note.businessKey)}
                    disabled={isDeleting}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{note.createdBy.name}</span>
                <span>·</span>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
                {note.version > 1 && (
                  <>
                    <span>·</span>
                    <span className="text-blue-600">Edited v{note.version}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="font-medium">No Internal Notes</p>
          <p className="text-sm mt-1">Add confidential notes visible only to staff</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Families Tab
// ============================================================================

export function FamiliesTab({
  caseId,
  caseData,
  invitations,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  onResend,
  onRevoke,
  isResending,
  isRevoking,
}: {
  caseId: string;
  caseData: any;
  invitations: any[] | undefined;
  isLoading: boolean;
  statusFilter: string;
  onStatusFilterChange: (filter: any) => void;
  onResend: (businessKey: string) => void;
  onRevoke: (businessKey: string) => void;
  isResending: boolean;
  isRevoking: boolean;
}) {
  const [isInviting, setIsInviting] = useState(false);

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (status === 'PENDING' && isExpired) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Expired
        </span>
      );
    }

    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      REVOKED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'PENDING' ? 'Pending' : status === 'ACCEPTED' ? 'Accepted' : status === 'EXPIRED' ? 'Expired' : 'Revoked'}
      </span>
    );
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleResend = (businessKey: string) => {
    if (confirm('Resend invitation with a new magic link?')) {
      onResend(businessKey);
    }
  };

  const handleRevoke = (businessKey: string) => {
    if (confirm('Are you sure you want to revoke this invitation? The user will no longer be able to use this link.')) {
      onRevoke(businessKey);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Family Members</h3>
          <p className="text-sm text-gray-600 mt-1">
            Invite family members to access the portal and collaborate on arrangements
          </p>
        </div>
        {!isInviting && (
          <button
            onClick={() => setIsInviting(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm"
          >
            <Mail className="w-4 h-4" />
            Invite Family
          </button>
        )}
      </div>

      {/* Invitation Form */}
      {isInviting && (
        <InvitationForm 
          caseId={caseId} 
          caseData={caseData}
          onSuccess={() => setIsInviting(false)}
          onCancel={() => setIsInviting(false)}
        />
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {(['all', 'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => onStatusFilterChange(filter)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              statusFilter === filter
                ? 'bg-[--navy] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter === 'all' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Invitations List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading invitations...</div>
      ) : invitations && invitations.length > 0 ? (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[--navy] text-white flex items-center justify-center font-medium">
                      {invitation.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{invitation.name}</h4>
                      <p className="text-sm text-gray-600">{invitation.email}</p>
                    </div>
                  </div>
                  {invitation.relationship && (
                    <p className="text-sm text-gray-500 mt-2">
                      Relationship: {invitation.relationship}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  {getStatusBadge(invitation.status, invitation.isExpired)}
                  {(invitation.status === 'PENDING' || invitation.isExpired) && (
                    <button
                      onClick={() => handleResend(invitation.businessKey)}
                      disabled={isResending}
                      className="inline-flex items-center gap-1 text-sm text-[--navy] hover:underline disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Resend
                    </button>
                  )}
                  {invitation.status !== 'REVOKED' && invitation.status !== 'ACCEPTED' && (
                    <button
                      onClick={() => handleRevoke(invitation.businessKey)}
                      disabled={isRevoking}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>Invited {getRelativeTime(invitation.createdAt)}</span>
                <span>·</span>
                <span>By {invitation.sender.name}</span>
                {invitation.acceptedAt && (
                  <>
                    <span>·</span>
                    <span className="text-green-600">Accepted {getRelativeTime(invitation.acceptedAt)}</span>
                  </>
                )}
                {invitation.revokedAt && (
                  <>
                    <span>·</span>
                    <span className="text-red-600">Revoked {getRelativeTime(invitation.revokedAt)}</span>
                  </>
                )}
                {invitation.status === 'PENDING' && !invitation.isExpired && (
                  <>
                    <span>·</span>
                    <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="font-medium">No Invitations</p>
          <p className="text-sm mt-1">
            {statusFilter === 'all' 
              ? 'Click "Invite Family" to send your first invitation'
              : `No ${statusFilter.toLowerCase()} invitations`}
          </p>
        </div>
      )}
    </div>
  );
}

export function InvitationForm({ 
  caseId, 
  caseData, 
  onSuccess, 
  onCancel 
}: {
  caseId: string;
  caseData: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  // Initialize form with react-hook-form + domain validation
  const form = useForm<FamilyInvitationForm>({
    resolver: zodResolver(familyInvitationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      relationship: '',
      role: 'FAMILY_MEMBER',
    },
  });

  const { createInvitation, isCreating } = useFamilyInvitations(caseId);

  // Watch email for preview display
  const email = form.watch("email");

  // Handle form submission (validation automatic via react-hook-form)
  const onSubmit = form.handleSubmit((data) => {
    createInvitation({
      caseId,
      ...data,
    });
    onSuccess();
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h4 className="font-medium text-gray-900">Send Family Invitation</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="name"
            label="Full Name"
            placeholder="John Doe"
            required
          />

          <FormInput
            name="email"
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            required
          />

          <FormInput
            name="phone"
            label="Phone Number"
            type="tel"
            placeholder="(555) 123-4567"
          />

          <FormInput
            name="relationship"
            label="Relationship to Decedent"
            placeholder="Son, Daughter, Spouse, etc."
          />

          <FormSelect
            name="role"
            label="Role"
            options={FAMILY_ROLES.map((role) => ({
              value: role,
              label: role === 'FAMILY_MEMBER' ? 'Family Member' : 'Primary Contact',
            }))}
            required
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> An email will be sent to <strong>{email || '(email)'}</strong> with a secure magic link valid for 7 days.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Sending...' : 'Send Invitation'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </Form>
  );
}
