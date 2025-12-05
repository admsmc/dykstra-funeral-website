/**
 * Contracts Feature Module
 * Public API exports
 */

// Components
export { ContractStatsGrid } from './components/contract-stats';
export { ContractFilters } from './components/contract-filters';
export { ContractTable } from './components/contract-table';
export { StatCard } from './components/stat-card';

// Hooks
export { useContracts } from './hooks/use-contracts';

// ViewModels
export type { ContractsViewModel } from './view-models/contracts-vm';

// Types
export type {
  Contract,
  ContractStatus,
  ContractStats,
  ContractFilters as ContractFiltersType,
} from './types';
