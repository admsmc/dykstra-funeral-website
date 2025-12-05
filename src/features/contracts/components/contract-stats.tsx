/**
 * Contract Stats Component
 * Displays stats cards grid with status filters
 */

import { PageSection } from '@/components/layouts/PageSection';
import { StatCard } from './stat-card';
import type { ContractStats } from '../types';

export interface ContractStatsProps {
  stats: ContractStats;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function ContractStatsGrid({ stats, statusFilter, onStatusFilterChange }: ContractStatsProps) {
  return (
    <PageSection title="Contract Status Overview" withCard={false}>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          color="gray"
          active={statusFilter === 'all'}
          onClick={() => onStatusFilterChange('all')}
        />
        <StatCard
          label="Draft"
          value={stats.draft}
          color="gray"
          active={statusFilter === 'DRAFT'}
          onClick={() => onStatusFilterChange('DRAFT')}
        />
        <StatCard
          label="Review"
          value={stats.pendingReview}
          color="blue"
          active={statusFilter === 'PENDING_REVIEW'}
          onClick={() => onStatusFilterChange('PENDING_REVIEW')}
        />
        <StatCard
          label="Signatures"
          value={stats.pendingSignatures}
          color="yellow"
          active={statusFilter === 'PENDING_SIGNATURES'}
          onClick={() => onStatusFilterChange('PENDING_SIGNATURES')}
        />
        <StatCard
          label="Signed"
          value={stats.fullySigned}
          color="green"
          active={statusFilter === 'FULLY_SIGNED'}
          onClick={() => onStatusFilterChange('FULLY_SIGNED')}
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          color="red"
          active={statusFilter === 'CANCELLED'}
          onClick={() => onStatusFilterChange('CANCELLED')}
        />
      </div>
    </PageSection>
  );
}
