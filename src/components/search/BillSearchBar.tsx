"use client";

import { useState } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";

interface BillSearchBarProps {
  onFilterChange: (filters: BillFilters) => void;
}

export interface BillFilters {
  searchQuery: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export default function BillSearchBar({ onFilterChange }: BillSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const handleApplyFilters = () => {
    onFilterChange({
      searchQuery,
      dueDateFrom: dueDateFrom || undefined,
      dueDateTo: dueDateTo || undefined,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDueDateFrom("");
    setDueDateTo("");
    setAmountMin("");
    setAmountMax("");
    onFilterChange({
      searchQuery: "",
    });
  };

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (dueDateFrom ? 1 : 0) +
    (dueDateTo ? 1 : 0) +
    (amountMin ? 1 : 0) +
    (amountMax ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Auto-apply search query
            onFilterChange({
              searchQuery: e.target.value,
              dueDateFrom: dueDateFrom || undefined,
              dueDateTo: dueDateTo || undefined,
              amountMin: amountMin ? parseFloat(amountMin) : undefined,
              amountMax: amountMax ? parseFloat(amountMax) : undefined,
            });
          }}
          placeholder="Search by vendor name or bill number..."
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              handleApplyFilters();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-[--navy] transition text-sm font-medium text-gray-700"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span>Advanced Filters</span>
          {activeFilterCount > 1 && (
            <span className="px-2 py-0.5 bg-[--navy] text-white text-xs rounded-full">
              {activeFilterCount - (searchQuery ? 1 : 0)}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            showFilters ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          {/* Due Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Due Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => setDueDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  placeholder="From"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={dueDateTo}
                  onChange={(e) => setDueDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  placeholder="Min ($)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  placeholder="Max ($)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-2 bg-[--navy] text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
