/**
 * Contracts Feature Types
 */

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PENDING_SIGNATURES'
  | 'FULLY_SIGNED'
  | 'CANCELLED';

export type Contract = {
  id: string;
  caseId: string;
  caseNumber: string;
  decedentName: string;
  serviceType: string;
  status: ContractStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  familySignedAt: Date | null;
  staffSignedAt: Date | null;
  createdBy: {
    name: string;
  };
};

export type ContractStats = {
  total: number;
  draft: number;
  pendingReview: number;
  pendingSignatures: number;
  fullySigned: number;
  cancelled: number;
};

export type ContractFilters = {
  statusFilter: string;
  searchQuery: string;
  dateRange: {
    start: string;
    end: string;
  };
};
