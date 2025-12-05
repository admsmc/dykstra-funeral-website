"use client";

import { useParams } from "next/navigation";
import { User, Calendar, DollarSign, FileText, Image, Clock, MessageSquare, Users } from "lucide-react";
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
  const { viewModel, isLoading, error } = useCaseDetail(caseId);
  const { activeTab, setActiveTab } = useTabState();
  const notesHook = useInternalNotes(caseId);
  const invitationsHook = useFamilyInvitations(caseId);

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
      <CaseDetailHeader viewModel={viewModel} />
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
              onResend={invitationsHook.resendInvitation}
              onRevoke={invitationsHook.revokeInvitation}
              isResending={invitationsHook.isResending}
              isRevoking={invitationsHook.isRevoking}
            />
          )}
          {activeTab === "arrangements" && <ArrangementsTab />}
          {activeTab === "contract" && <ContractTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "memorial" && <MemorialTab />}
          {activeTab === "documents" && <DocumentsTab />}
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
    </div>
  );
}
