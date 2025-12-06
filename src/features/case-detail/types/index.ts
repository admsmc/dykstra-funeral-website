/**
 * Case Detail Feature - Type Definitions
 */

export type TabType = "overview" | "families" | "arrangements" | "contract" | "payments" | "memorial" | "documents" | "timeline" | "notes";

export interface CaseDetailData {
  case: {
    id: string;
    businessKey?: string;
    decedentName: string;
    type: string;
    status: string;
    serviceType: string | null;
    serviceDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  // Additional nested data would go here
}

export interface TabConfig {
  id: TabType;
  label: string;
  icon: any; // Lucide icon component
}
