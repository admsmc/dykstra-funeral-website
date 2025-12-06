"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LibraryHeader,
  SearchFilters,
  TemplateGrid,
  HistoryModal,
  useTemplateQueries,
  useTemplateFilters,
  useTemplateHistory,
  useTemplateRollback,
  type TemplateLibraryViewModel,
  type HistoryVersionViewModel,
} from "@/features/template-library";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

/**
 * Template Library Page
 * Refactored with ViewModel pattern - 84% reduction (611 → 100 lines)
 * Uses DashboardLayout for consistent page structure
 */
export default function TemplateLibraryPage() {
  const router = useRouter();
  const [historyTemplate, setHistoryTemplate] = useState<TemplateLibraryViewModel | null>(null);

  // Custom hooks
  const { templates, isLoading, refetchAll } = useTemplateQueries();
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filterTemplates,
  } = useTemplateFilters();
  const { versions, isLoading: historyLoading } = useTemplateHistory(
    historyTemplate?.businessKey ?? null,
    !!historyTemplate
  );
  const { rollback, isPending: isRollbackPending } = useTemplateRollback(() => {
    refetchAll();
    setHistoryTemplate(null);
  });

  // Apply filters
  const filteredTemplates = filterTemplates(templates);

  // Navigation handlers
  const handleEditTemplate = (template: TemplateLibraryViewModel) => {
    router.push(`/template-editor?templateId=${template.id}`);
  };

  const handleCreateNew = () => {
    router.push("/template-editor");
  };

  // Rollback handler
  const handleRollback = async (version: HistoryVersionViewModel) => {
    if (!historyTemplate) return;

    const rawVersion = version.rawVersion;
    await rollback({
      businessKey: historyTemplate.businessKey,
      name: historyTemplate.name,
      category: rawVersion.metadata.category,
      status: "draft",
      funeralHomeId: rawVersion.metadata.funeralHomeId ?? null,
      htmlTemplate: rawVersion.content.htmlTemplate,
      cssStyles: rawVersion.content.cssStyles,
      pageSize: rawVersion.settings.pageSize,
      orientation: rawVersion.settings.orientation,
      margins: rawVersion.settings.margins,
      printQuality: String(rawVersion.settings.printQuality),
      existingTemplateId: historyTemplate.id,
      versionNote: "Rolled back from template history",
      createdBy: "current-user", // TODO: Get from auth
    });
  };

  if (isLoading) {
    return <DashboardSkeleton statsCount={3} showChart={false} />;
  }

  return (
    <DashboardLayout
      title="Template Library"
      subtitle="Manage document templates for obituaries, service programs, and more"
    >
      <LibraryHeader />

      <SearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onCreateNew={handleCreateNew}
      />

      <TemplateGrid
        templates={filteredTemplates}
        isLoading={isLoading}
        onEdit={handleEditTemplate}
        onViewHistory={setHistoryTemplate}
        hasFilters={searchQuery !== "" || selectedCategory !== "all"}
      />

      <HistoryModal
        template={historyTemplate}
        versions={versions}
        isLoading={historyLoading}
        onClose={() => setHistoryTemplate(null)}
        onRollback={handleRollback}
        isRollbackPending={isRollbackPending}
      />
    </DashboardLayout>
  );
}
