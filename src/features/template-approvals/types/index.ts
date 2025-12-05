/**
 * Template Approvals Feature - Type Definitions
 */

import type { MemorialTemplate } from "@dykstra/domain";

export type { MemorialTemplate };

export interface ApprovalAction {
  businessKey: string;
  newStatus: "active" | "deprecated";
  notes: string;
  reviewedBy: string;
}

export interface TemplateHistoryItem {
  id: string;
  version: number;
  status: string;
  validFrom: Date;
  validTo: Date | null;
  changeReason?: string;
}
