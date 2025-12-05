/**
 * Case List Filters Component
 */

import { Search } from "lucide-react";
import type { CaseListFilters } from "../types";

interface CaseListFiltersProps {
  filters: CaseListFilters;
  onFilterChange: (filters: CaseListFilters) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export function CaseListFilters({
  filters,
  onFilterChange,
  searchInputRef,
}: CaseListFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search cases... (Press / to focus)"
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) =>
            onFilterChange({ ...filters, status: e.target.value })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="INQUIRY">Inquiry</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) =>
            onFilterChange({ ...filters, type: e.target.value })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="AT_NEED">At-Need</option>
          <option value="PRE_NEED">Pre-Need</option>
          <option value="INQUIRY">Inquiry</option>
        </select>
      </div>
    </div>
  );
}
