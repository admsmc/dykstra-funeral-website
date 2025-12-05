import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "lucide-react";
import type { CaseDetailViewModel } from "../view-models/CaseDetailViewModel";
import type { TabType, TabConfig } from "../types";
import { useFamilyInvitations } from "../hooks/useFamilyInvitations";
import { familyInvitationSchema, FAMILY_ROLES, type FamilyInvitationForm } from "@dykstra/domain/validation";
import { Form, Timeline, TimelineEvent } from "@dykstra/ui";
import { FormInput, FormSelect } from "@dykstra/ui";

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

export function ArrangementsTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Arrangements</p>
      <p className="text-sm mt-1">Service arrangements will be managed here</p>
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

export function DocumentsTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Documents</p>
      <p className="text-sm mt-1">Case documents and certificates</p>
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
