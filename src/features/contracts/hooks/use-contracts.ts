/**
 * Contracts Hook
 * Fetches contracts data with filtering
 */

import { trpc } from '@/lib/trpc-client';
import { useMemo } from 'react';
import { ContractsViewModel } from '../view-models/contracts-vm';
import type { Contract as UiContract, ContractStatus } from '../types';

export function useContracts(statusFilter: string) {
  const apiStatus =
    statusFilter !== 'all'
      ? (statusFilter.toLowerCase() as 'draft' | 'pending_review' | 'pending_signatures' | 'fully_signed' | 'cancelled')
      : undefined;

  const query = trpc.contract.listContracts.useQuery({
    status: apiStatus,
    caseId: undefined,
    limit: 100,
  });

  const mappedContracts: UiContract[] = useMemo(() => {
    const raw = query.data?.contracts ?? [];
    return raw.map((contract) => ({
      id: (contract as any).id as string,
      caseId: (contract as any).caseId,
      caseNumber: (contract as any).caseId,
      decedentName: 'Unknown',
      serviceType: '',
      status: ((contract as any).status?.toUpperCase() || 'DRAFT') as ContractStatus,
      totalAmount: (contract as any).totalAmount?.amount ?? 0,
      createdAt: (contract as any).createdAt,
      updatedAt: (contract as any).updatedAt,
      familySignedAt: null,
      staffSignedAt: null,
      createdBy: {
        name: (contract as any).createdBy ?? 'System',
      },
    }));
  }, [query.data]);

  const viewModel = useMemo(
    () => (mappedContracts.length ? new ContractsViewModel(mappedContracts) : null),
    [mappedContracts]
  );

  return {
    viewModel,
    contracts: mappedContracts,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
