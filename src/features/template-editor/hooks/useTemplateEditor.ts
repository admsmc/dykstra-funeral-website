/**
 * Template Editor Feature - Custom Hooks
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/toast";
import type {
  TemplateData,
  SaveTemplateParams,
  SaveStatus,
  PreviewMode,
  DeviceType,
  PreviewData,
} from "../types";

const SAMPLE_PREVIEW_DATA: PreviewData = {
  deceasedName: "John Doe",
  birthDate: "January 1, 1950",
  deathDate: "December 1, 2024",
  orderOfService: [
    { item: "Opening Prayer", officiant: "Pastor Smith" },
    { item: "Hymn", officiant: "Congregation" },
    { item: "Eulogy", officiant: "Family" },
    { item: "Closing Prayer", officiant: "Pastor Smith" },
  ],
  obituary: "Sample obituary text for preview purposes.",
  pallbearers: ["John Smith", "Mike Johnson", "David Brown", "Robert Davis"],
  funeralHomeName: "Dykstra Funeral Home",
  funeralHomeAddress: "123 Main Street, Anytown, MI 12345",
  funeralHomePhone: "(555) 123-4567",
};

export function useTemplateSave() {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTemplateMutation = trpc.memorialTemplates.saveTemplate.useMutation();

  const saveTemplate = async (templateData: TemplateData) => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const timestamp = Date.now();
      const params: SaveTemplateParams = {
        businessKey: `custom-template-${timestamp}`,
        name: `Custom Template ${new Date().toLocaleDateString()}`,
        category: "service_program",
        htmlTemplate: templateData.htmlStructure,
        cssStyles: templateData.cssStyles,
        pageSize: "letter",
        orientation: "portrait",
        createdBy: "staff-user", // TODO: Get from auth context
      };

      const result = await saveTemplateMutation.mutateAsync(params);
      setSaveStatus("success");
      toast.success('Template saved successfully');
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save template:", error);
      setSaveStatus("error");
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveTemplate,
    isSaving,
    saveStatus,
  };
}

export function useTemplatePreview() {
  const toast = useToast();
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const saveTemplateMutation = trpc.memorialTemplates.saveTemplate.useMutation();
  const generateServiceProgramMutation =
    trpc.memorialTemplates.generateServiceProgram.useMutation();

  const generatePreview = async (html: string, css: string) => {
    try {
      setIsGeneratingPreview(true);

      // First save the template to get a business key
      const timestamp = Date.now();
      const businessKey = `preview-template-${timestamp}`;

      await saveTemplateMutation.mutateAsync({
        businessKey,
        name: `Preview Template ${new Date().toLocaleDateString()}`,
        category: "service_program",
        htmlTemplate: html,
        cssStyles: css,
        pageSize: "letter",
        orientation: "portrait",
        createdBy: "staff-user",
      });

      // Generate PDF with sample data
      const result = await generateServiceProgramMutation.mutateAsync({
        templateBusinessKey: businessKey,
        data: SAMPLE_PREVIEW_DATA,
      });

      // Convert base64 to blob and create object URL
      const pdfBlob = new Blob(
        [Uint8Array.from(atob(result.pdfBuffer), (c) => c.charCodeAt(0))],
        { type: "application/pdf" }
      );
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPreviewPdfUrl(pdfUrl);
      toast.success('PDF preview generated');
    } catch (error) {
      console.error("Failed to preview template:", error);
      toast.error("Failed to generate PDF preview");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  return {
    previewPdfUrl,
    isGeneratingPreview,
    generatePreview,
    closePreview,
  };
}

export function usePreviewControls() {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("single");
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>("letter");

  return {
    previewMode,
    setPreviewMode,
    selectedDevice,
    setSelectedDevice,
  };
}
