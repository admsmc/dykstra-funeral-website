/**
 * Template Library Feature - Type Definitions
 */

import type { MemorialTemplate } from "@dykstra/domain";

export type { MemorialTemplate };

export type TemplateCategory = "all" | "service_program" | "prayer_card" | "memorial_folder" | "bookmark";

export interface TemplateFilters {
  searchQuery: string;
  selectedCategory: TemplateCategory;
}

export interface RollbackParams {
  businessKey: string;
  name: string;
  category: string;
  status: string;
  funeralHomeId: string | null;
  htmlTemplate: string;
  cssStyles: string;
  pageSize: string;
  orientation: string;
  margins: any;
  printQuality: string | number;
  existingTemplateId: string;
  versionNote: string;
  createdBy: string;
}
