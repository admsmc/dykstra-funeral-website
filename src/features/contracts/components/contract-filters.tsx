/**
 * Contract Filters Component
 * Search and date range filtering
 */

import { Search, Calendar } from 'lucide-react';
import { PageSection } from '@/components/layouts/PageSection';

export interface ContractFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

export function ContractFilters({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}: ContractFiltersProps) {
  return (
    <PageSection title="Search & Filter" withCard={true}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by case number, decedent, or staff..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, start: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, end: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent text-sm"
          />
        </div>
      </div>
    </PageSection>
  );
}
