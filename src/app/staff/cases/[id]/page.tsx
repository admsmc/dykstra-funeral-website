"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { User, Calendar, DollarSign, FileText, Image, Clock, MessageSquare, Users } from "lucide-react";
import { CaseStatusChangeModal } from "@/components/modals/CaseStatusChangeModal";
import { ArchiveCaseModal } from "@/components/modals/ArchiveCaseModal";
import { CaseDetailSkeleton } from "@/components/skeletons/CaseSkeletons";
import { useToast } from "@/components/toast";
import {
  useCaseDetail,
  useTabState,
  useInternalNotes,
  useFamilyInvitations,
  CaseDetailHeader,
  QuickStatsCards,
  TabNavigation,
  OverviewTab,
  ArrangementsTab,
  ContractTab,
  PaymentsTab,
  MemorialTab,
  DocumentsTab,
  TimelineTab,
  InternalNotesTab,
  FamiliesTab,
  type TabType,
} from "@/features/case-detail";

/**
 * Staff Case Detail Page - Refactored
 * Clean page component using ViewModel pattern
 */

export default function StaffCaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  // Feature hooks
  const toast = useToast();
  const { viewModel, isLoading, error } = useCaseDetail(caseId);
  const { activeTab, setActiveTab } = useTabState();
  const notesHook = useInternalNotes(caseId, toast);
  const invitationsHook = useFamilyInvitations(caseId, toast);
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  if (isLoading) {
    return <CaseDetailSkeleton />;
  }

  if (error || !viewModel) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading case</p>
          <p className="text-sm mt-1">{error?.message || "Case not found"}</p>
        </div>
      </div>
    );
  }

  // Tab configuration
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

  // We need caseData for FamiliesTab - get from query result
  const caseData = { case: (viewModel as any).data.case };

  return (
    <div className="space-y-6">
      <CaseDetailHeader 
        viewModel={viewModel} 
        onStatusClick={() => setShowStatusModal(true)}
        onArchive={() => setShowArchiveModal(true)}
      />
      <QuickStatsCards viewModel={viewModel} />
      
      <div className="bg-white rounded-lg border border-gray-200">
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="p-6">
          {activeTab === "overview" && <OverviewTab viewModel={viewModel} />}
          {activeTab === "families" && (
            <FamiliesTab
              caseId={caseId}
              caseData={caseData}
              invitations={invitationsHook.invitations}
              isLoading={invitationsHook.isLoading}
              statusFilter={invitationsHook.statusFilter}
              onStatusFilterChange={invitationsHook.setStatusFilter}
              onResend={(businessKey) => invitationsHook.resendInvitation({ businessKey })}
              onRevoke={(businessKey) => invitationsHook.revokeInvitation({ businessKey })}
              isResending={invitationsHook.isResending}
              isRevoking={invitationsHook.isRevoking}
            />
          )}
          {activeTab === "arrangements" && <ArrangementsTab caseId={caseId} />}
          {activeTab === "contract" && <ContractTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "memorial" && <MemorialTab />}
          {activeTab === "documents" && <DocumentsTab caseId={caseId} />}
          {activeTab === "timeline" && <TimelineTab />}
          {activeTab === "notes" && (
            <InternalNotesTab
              caseId={caseId}
              notes={notesHook.notes}
              isLoading={notesHook.isLoading}
              onCreateNote={notesHook.createNote}
              onUpdateNote={notesHook.updateNote}
              onDeleteNote={notesHook.deleteNote}
              isCreating={notesHook.isCreating}
              isUpdating={notesHook.isUpdating}
              isDeleting={notesHook.isDeleting}
            />
          )}
        </div>
      </div>
      
      {/* Status Change Modal */}
      <CaseStatusChangeModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        caseId={caseId}
        currentStatus={viewModel.status}
        decedentName={viewModel.decedentName}
        onSuccess={() => {
          window.location.reload();
        }}
      />
      
      {/* Archive Modal */}
      <ArchiveCaseModal
        open={showArchiveModal}
        onOpenChange={setShowArchiveModal}
        caseId={caseId}
        decedentName={viewModel.decedentName}
        onSuccess={() => {
          window.location.href = '/staff/cases';
        }}
      />
    </div>
  );
}
