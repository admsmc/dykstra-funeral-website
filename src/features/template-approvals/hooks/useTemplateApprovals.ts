/**
 * Template Approvals Feature - Custom Hooks
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  ApprovalTemplateViewModel,
  HistoryVersionViewModel,
} from "../view-models/ApprovalTemplateViewModel";
import type { ApprovalAction, MemorialTemplate } from "../types";

export function usePendingTemplates() {
  const query = trpc.memorialTemplates.listPendingTemplates.useQuery({});

  const templates =
    query.data?.map((t) => new ApprovalTemplateViewModel(t)) ?? [];

  return {
    templates,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTemplateHistory(
  businessKey: string | null,
  enabled: boolean
) {
  const query = trpc.memorialTemplates.getTemplateHistory.useQuery(
    { businessKey: businessKey || "" },
    { enabled: enabled && !!businessKey }
  );

  const versions =
    query.data?.map((v) => new HistoryVersionViewModel(v)) ?? [];

  return {
    versions,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useUpdateTemplateStatus(onSuccess: () => void) {
  const mutation = trpc.memorialTemplates.updateTemplateStatus.useMutation({
    onSuccess,
  });

  const updateStatus = async (action: ApprovalAction) => {
    await mutation.mutateAsync(action);
  };

  return {
    updateStatus,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useTemplateSelection() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<MemorialTemplate | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const selectTemplate = (template: MemorialTemplate | null) => {
    setSelectedTemplate(template);
    setShowHistory(false);
  };

  const toggleHistory = () => {
    setShowHistory((prev) => !prev);
  };

  return {
    selectedTemplate,
    showHistory,
    selectTemplate,
    toggleHistory,
  };
}
