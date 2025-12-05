"use client";

import { useState } from "react";
import { MemorialTemplateEditor, type TemplateData } from "./components/MemorialTemplateEditor";
import type { MemorialTemplate } from "@dykstra/domain";
import {
  EditorHeader,
  DevicePreviewControls,
  PreviewModal,
  LoadingOverlay,
  EditorStyles,
  useTemplateSave,
  useTemplatePreview,
  usePreviewControls,
} from "@/features/template-editor";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import "grapesjs/dist/css/grapes.min.css";

/**
 * Template Editor Page
 * Refactored with hooks and component extraction - 85% reduction (545 → 80 lines)
 * Uses DashboardLayout for consistent page structure
 */
export default function TemplateEditorPage() {
  const [selectedTemplate] = useState<MemorialTemplate | undefined>();

  // Custom hooks
  const { saveTemplate, isSaving, saveStatus } = useTemplateSave();
  const {
    previewPdfUrl,
    isGeneratingPreview,
    generatePreview,
    closePreview,
  } = useTemplatePreview();
  const {
    previewMode,
    setPreviewMode,
    selectedDevice,
    setSelectedDevice,
  } = usePreviewControls();

  return (
    <DashboardLayout
      title="Template Editor"
      subtitle="Design and customize memorial templates"
    >
      <EditorHeader isSaving={isSaving} saveStatus={saveStatus} />

      <MemorialTemplateEditor
        initialTemplate={selectedTemplate}
        onSave={saveTemplate}
        onPreview={generatePreview}
        autoPreview={true}
        autoPreviewDelay={3000}
      />

      <DevicePreviewControls
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        selectedDevice={selectedDevice}
        onDeviceChange={setSelectedDevice}
      />

      {previewPdfUrl && (
        <PreviewModal
          previewPdfUrl={previewPdfUrl}
          previewMode={previewMode}
          selectedDevice={selectedDevice}
          onClose={closePreview}
        />
      )}

      <LoadingOverlay isGenerating={isGeneratingPreview} />

      <EditorStyles />
    </DashboardLayout>
  );
}
