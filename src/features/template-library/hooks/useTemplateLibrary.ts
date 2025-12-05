/**
 * Template Library Feature - Custom Hooks
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { TemplateLibraryViewModel, HistoryVersionViewModel } from "../view-models/TemplateLibraryViewModel";
import type { TemplateCategory, RollbackParams } from "../types";

export function useTemplateQueries() {
  const serviceProgramsQuery = trpc.memorialTemplates.listTemplates.useQuery({
    category: "service_program",
  });

  const prayerCardsQuery = trpc.memorialTemplates.listTemplates.useQuery({
    category: "prayer_card",
  });

  const memorialFoldersQuery = trpc.memorialTemplates.listTemplates.useQuery({
    category: "memorial_folder",
  });

  const bookmarksQuery = trpc.memorialTemplates.listTemplates.useQuery({
    category: "bookmark",
  });

  const allTemplates = [
    ...(serviceProgramsQuery.data || []),
    ...(prayerCardsQuery.data || []),
    ...(memorialFoldersQuery.data || []),
    ...(bookmarksQuery.data || []),
  ];

  const templates = allTemplates.map((t) => new TemplateLibraryViewModel(t));

  const isLoading =
    serviceProgramsQuery.isLoading ||
    prayerCardsQuery.isLoading ||
    memorialFoldersQuery.isLoading ||
    bookmarksQuery.isLoading;

  const refetchAll = () => {
    serviceProgramsQuery.refetch();
    prayerCardsQuery.refetch();
    memorialFoldersQuery.refetch();
    bookmarksQuery.refetch();
  };

  return {
    templates,
    isLoading,
    refetchAll,
  };
}

export function useTemplateFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("all");

  const filterTemplates = (templates: TemplateLibraryViewModel[]) => {
    return templates.filter((template) => {
      const matchesSearch = template.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filterTemplates,
  };
}

export function useTemplateHistory(businessKey: string | null, enabled: boolean) {
  const query = trpc.memorialTemplates.getTemplateHistory.useQuery(
    { businessKey: businessKey || "" },
    { enabled: enabled && !!businessKey }
  );

  const versions = query.data?.map((v) => new HistoryVersionViewModel(v)) ?? [];

  return {
    versions,
    isLoading: query.isLoading,
  };
}

export function useTemplateRollback(onSuccess: () => void) {
  const mutation = trpc.memorialTemplates.saveTemplate.useMutation({
    onSuccess,
  });

  const rollback = async (params: RollbackParams) => {
    await mutation.mutateAsync(params);
  };

  return {
    rollback,
    isPending: mutation.isPending,
  };
}
