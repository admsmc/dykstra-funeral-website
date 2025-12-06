/**
 * Template Editor Feature - Type Definitions
 */

import type { MemorialTemplate } from "@dykstra/domain";

export type { MemorialTemplate };

export interface TemplateData {
  htmlStructure: string;
  cssStyles: string;
}

export interface SaveTemplateParams {
  businessKey: string;
  name: string;
  category: 'service_program' | 'prayer_card' | 'bookmark' | 'memorial_folder';
  htmlTemplate: string;
  cssStyles: string;
  pageSize: 'letter' | 'a4' | 'legal' | '4x6' | '5x7';
  orientation: 'portrait' | 'landscape';
  createdBy: string;
}

export interface PreviewData {
  deceasedName: string;
  birthDate: string;
  deathDate: string;
  orderOfService: Array<{ item: string; officiant: string }>;
  obituary: string;
  pallbearers: string[];
  funeralHomeName: string;
  funeralHomeAddress: string;
  funeralHomePhone: string;
}

export type SaveStatus = "idle" | "success" | "error";
export type PreviewMode = "single" | "multi";
export type DeviceType = "letter" | "a4" | "4x6";
