/**
 * Contracts ViewModel
 * Transforms contract data and calculates stats
 */

import type { Contract, ContractStats } from '../types';

export class ContractsViewModel {
  constructor(private contracts: Contract[]) {}

  get stats(): ContractStats {
    return {
      total: this.contracts.length,
      draft: this.contracts.filter((c) => c.status === 'DRAFT').length,
      pendingReview: this.contracts.filter((c) => c.status === 'PENDING_REVIEW').length,
      pendingSignatures: this.contracts.filter((c) => c.status === 'PENDING_SIGNATURES').length,
      fullySigned: this.contracts.filter((c) => c.status === 'FULLY_SIGNED').length,
      cancelled: this.contracts.filter((c) => c.status === 'CANCELLED').length,
    };
  }

  filterContracts(filters: {
    searchQuery: string;
    dateRange: { start: string; end: string };
  }): Contract[] {
    let filtered = this.contracts;

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(
        (contract) => new Date(contract.createdAt) >= new Date(filters.dateRange.start)
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(
        (contract) => new Date(contract.createdAt) <= new Date(filters.dateRange.end)
      );
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.caseNumber.toLowerCase().includes(query) ||
          contract.decedentName.toLowerCase().includes(query) ||
          contract.createdBy.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }
}
