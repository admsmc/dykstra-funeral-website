"use client";

import { trpc } from "@/lib/trpc-client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Image, 
  Clock,
  MessageSquare,
  CheckSquare,
  Edit,
  Archive,
  Users,
  Mail,
  RefreshCw,
  XCircle,
  Plus,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

/**
 * Staff Case Detail Page
 * Comprehensive view of case with tabs for all information
 * Includes staff-only features: internal notes, audit log, assignments
 */

type TabType = "overview" | "families" | "arrangements" | "contract" | "payments" | "memorial" | "documents" | "timeline" | "notes";

export default function StaffCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const { data: caseData, isLoading, error } = trpc.case.getDetails.useQuery({ caseId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading case</p>
          <p className="text-sm mt-1">{error?.message || "Case not found"}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: User },
    { id: "families" as TabType, label: "Families", icon: Users },
    { id: "arrangements" as TabType, label: "Arrangements", icon: Calendar },
    { id: "contract" as TabType, label: "Contract", icon: FileText },
    { id: "payments" as TabType, label: "Payments", icon: DollarSign },
    { id: "memorial" as TabType, label: "Memorial", icon: Image },
    { id: "documents" as TabType, label: "Documents", icon: FileText },
    { id: "timeline" as TabType, label: "Timeline", icon: Clock },
    { id: "notes" as TabType, label: "Internal Notes", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <h1 className="text-2xl font-bold text-gray-900">{caseData.case.decedentName}</h1>
            <p className="text-gray-600 mt-1">
              Case #{caseData.case.id.slice(0, 8)} · {caseData.case.type.replace("_", " ")}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              caseData.case.status === "INQUIRY" 
                ? "bg-yellow-100 text-yellow-800"
                : caseData.case.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : caseData.case.status === "COMPLETED"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}>
              {caseData.case.status}
            </span>
            
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              <Edit className="w-4 h-4" />
              Edit Case
            </button>
            
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              <Archive className="w-4 h-4" />
              Archive
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Service Date</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {caseData.case.serviceDate 
              ? new Date(caseData.case.serviceDate).toLocaleDateString()
              : "Not scheduled"}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Service Type</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {caseData.case.serviceType?.replace("_", " ") || "Not selected"}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Created</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {new Date(caseData.case.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {new Date(caseData.case.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && <OverviewTab caseData={caseData} />}
          {activeTab === "families" && <FamiliesTab caseId={caseId} caseData={caseData} />}
          {activeTab === "arrangements" && <ArrangementsTab caseId={caseId} />}
          {activeTab === "contract" && <ContractTab caseId={caseId} />}
          {activeTab === "payments" && <PaymentsTab caseId={caseId} />}
          {activeTab === "memorial" && <MemorialTab caseId={caseId} />}
          {activeTab === "documents" && <DocumentsTab caseId={caseId} />}
          {activeTab === "timeline" && <TimelineTab caseId={caseId} />}
          {activeTab === "notes" && <InternalNotesTab caseId={caseId} />}
        </div>
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ caseData }: { caseData: any }) {
  return (
    <div className="space-y-6">
      {/* Decedent Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Decedent Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <p className="text-gray-900 mt-1">{caseData.case.decedentName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date of Birth</label>
            <p className="text-gray-900 mt-1">
              {caseData.case.decedentDateOfBirth 
                ? new Date(caseData.case.decedentDateOfBirth).toLocaleDateString()
                : "Not provided"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date of Death</label>
            <p className="text-gray-900 mt-1">
              {caseData.case.decedentDateOfDeath 
                ? new Date(caseData.case.decedentDateOfDeath).toLocaleDateString()
                : "Not provided"}
            </p>
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

function ArrangementsTab({ caseId }: { caseId: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Arrangements</p>
      <p className="text-sm mt-1">Service arrangements will be managed here</p>
    </div>
  );
}

function ContractTab({ caseId }: { caseId: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Contract</p>
      <p className="text-sm mt-1">Contract details will appear here</p>
    </div>
  );
}

function PaymentsTab({ caseId }: { caseId: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Payments</p>
      <p className="text-sm mt-1">Payment history and processing</p>
    </div>
  );
}

function MemorialTab({ caseId }: { caseId: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Memorial</p>
      <p className="text-sm mt-1">Photos and memorial page management</p>
    </div>
  );
}

function DocumentsTab({ caseId }: { caseId: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Documents</p>
      <p className="text-sm mt-1">Case documents and certificates</p>
    </div>
  );
}

function TimelineTab({ caseId }: { caseId: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="font-medium">Timeline</p>
      <p className="text-sm mt-1">Complete case activity history</p>
    </div>
  );
}

function InternalNotesTab({ caseId }: { caseId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

  const { data: notes, isLoading, refetch } = trpc.note.listByCaseId.useQuery({ caseId });
  const createMutation = trpc.note.create.useMutation({
    onSuccess: () => {
      toast.success("Note added successfully");
      setIsAdding(false);
      setNoteContent("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add note");
    },
  });

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => {
      toast.success("Note updated successfully");
      setEditingNote(null);
      setNoteContent("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update note");
    },
  });

  const deleteMutation = trpc.note.delete.useMutation({
    onSuccess: () => {
      toast.success("Note deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete note");
    },
  });

  const handleSubmit = () => {
    if (!noteContent.trim()) return;

    if (editingNote) {
      updateMutation.mutate({
        businessKey: editingNote,
        content: noteContent.trim(),
      });
    } else {
      createMutation.mutate({
        caseId,
        content: noteContent.trim(),
      });
    }
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
      deleteMutation.mutate({ businessKey });
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
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setNoteContent(e.target.value)}
            placeholder="Write your note here... (staff only)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={!noteContent.trim() || createMutation.isLoading || updateMutation.isLoading}
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
                    disabled={deleteMutation.isLoading}
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

function FamiliesTab({ caseId, caseData }: { caseId: string; caseData: any }) {
  const [isInviting, setIsInviting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'>('all');
  const [invitations, setInvitations] = useState<any[]>([]);

  const { data: invitationsData, isLoading, refetch } = trpc.invitation.list.useQuery({
    caseId,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const resendMutation = trpc.invitation.resend.useMutation({
    onSuccess: () => {
      toast.success('Invitation resent successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to resend invitation');
    },
  });

  const revokeMutation = trpc.invitation.revoke.useMutation({
    onSuccess: () => {
      toast.success('Invitation revoked');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to revoke invitation');
    },
  });

  const handleResend = (businessKey: string) => {
    if (confirm('Resend invitation with a new magic link?')) {
      resendMutation.mutate({ businessKey });
    }
  };

  const handleRevoke = (businessKey: string) => {
    if (confirm('Are you sure you want to revoke this invitation? The user will no longer be able to use this link.')) {
      revokeMutation.mutate({ businessKey });
    }
  };

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
          onSuccess={() => {
            setIsInviting(false);
            refetch();
          }}
          onCancel={() => setIsInviting(false)}
        />
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {(['all', 'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
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
      ) : invitationsData && invitationsData.length > 0 ? (
        <div className="space-y-3">
          {invitationsData.map((invitation) => (
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
                      disabled={resendMutation.isLoading}
                      className="inline-flex items-center gap-1 text-sm text-[--navy] hover:underline disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Resend
                    </button>
                  )}
                  {invitation.status !== 'REVOKED' && invitation.status !== 'ACCEPTED' && (
                    <button
                      onClick={() => handleRevoke(invitation.businessKey)}
                      disabled={revokeMutation.isLoading}
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

function InvitationForm({ caseId, caseData, onSuccess, onCancel }: {
  caseId: string;
  caseData: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    relationship: '',
    role: 'FAMILY_MEMBER' as 'PRIMARY_CONTACT' | 'FAMILY_MEMBER',
  });

  const createMutation = trpc.invitation.create.useMutation({
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      caseId,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
      <h4 className="font-medium text-gray-900">Send Family Invitation</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship to Decedent
          </label>
          <input
            type="text"
            value={formData.relationship}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, relationship: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            placeholder="Son, Daughter, Spouse, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, role: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          >
            <option value="FAMILY_MEMBER">Family Member</option>
            <option value="PRIMARY_CONTACT">Primary Contact</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> An email will be sent to <strong>{formData.email || '(email)'}</strong> with a secure magic link valid for 7 days.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={createMutation.isLoading || !formData.email || !formData.name}
          className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isLoading ? 'Sending...' : 'Send Invitation'}
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
  );
}
