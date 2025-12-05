/**
 * Contracts Hook
 * Fetches contracts data with filtering
 */

import { trpc } from '@/lib/trpc-client';
import { useMemo } from 'react';
import { ContractsViewModel } from '../view-models/contracts-vm';
import type { ContractStatus } from '../types';

export function useContracts(statusFilter: string) {
  const query = trpc.contract.listContracts.useQuery({
    status: statusFilter !== 'all' ? (statusFilter as ContractStatus) : undefined,
    caseId: undefined,
    limit: 100,
  });

  const viewModel = useMemo(
    () => (query.data?.contracts ? new ContractsViewModel(query.data.contracts) : null),
    [query.data]
  );

  return {
    viewModel,
    contracts: query.data?.contracts ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
