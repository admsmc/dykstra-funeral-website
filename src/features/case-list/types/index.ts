/**
 * Case List Feature - Type Definitions
 */

export interface CaseListItem {
  id: string;
  businessKey: string;
  decedentName: string;
  type: string;
  status: string;
  serviceType: string | null;
  serviceDate: Date | null;
  createdAt: Date;
}

export interface CaseListFilters {
  search: string;
  status: string;
  type: string;
}

export interface CaseListQueryParams {
  limit: number;
  status?: string;
  type?: string;
}

export interface BulkActionsState {
  selectedCount: number;
  selectedIds: string[];
}

export type CaseStatus = "INQUIRY" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type CaseType = "AT_NEED" | "PRE_NEED" | "INQUIRY";
