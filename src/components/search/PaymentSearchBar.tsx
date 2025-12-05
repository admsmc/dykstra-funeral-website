"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ChevronDown, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { useRouter, useSearchParams } from "next/navigation";

interface PaymentSearchBarProps {
  onFiltersChange?: (filters: PaymentFilters) => void;
}

interface PaymentFilters {
  searchQuery: string;
  statuses: string[];
  methods: string[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

export default function PaymentSearchBar({ onFiltersChange }: PaymentSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  
  // Advanced filters
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");

  const searchRef = useRef<HTMLDivElement>(null);

  // Load state from URL on mount
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const statuses = searchParams.get("statuses")?.split(",").filter(Boolean) || [];
    const methods = searchParams.get("methods")?.split(",").filter(Boolean) || [];
    const from = searchParams.get("dateFrom") || "";
    const to = searchParams.get("dateTo") || "";
    const min = searchParams.get("amountMin") || "";
    const max = searchParams.get("amountMax") || "";

    setSearchQuery(q);
    setSelectedStatuses(statuses);
    setSelectedMethods(methods);
    setDateFrom(from);
    setDateTo(to);
    setAmountMin(min);
    setAmountMax(max);
  }, [searchParams]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentPaymentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Global keyboard shortcut: Cmd+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "p") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Fetch payments with filters
  const { data: paymentsData, isLoading } = trpc.payment.list.useQuery(
    {
      funeralHomeId: undefined,
      status: selectedStatuses.length > 0 ? (selectedStatuses[0] as any) : undefined,
      method: selectedMethods.length > 0 ? (selectedMethods[0] as any) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: 50,
      offset: 0,
    },
    {
      enabled: isOpen || searchQuery.length > 0,
      keepPreviousData: true,
    }
  );

  // Filter payments by search query (client-side fuzzy match)
  const filteredPayments = (paymentsData?.payments || []).filter((payment) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    const caseId = payment.caseId?.toLowerCase() || "";
    const amount = payment.amount.amount.toString();
    const method = payment.method?.toLowerCase() || "";
    const businessKey = payment.businessKey?.toLowerCase() || "";

    return (
      caseId.includes(query) ||
      amount.includes(query) ||
      method.includes(query) ||
      businessKey.includes(query)
    );
  });

  // Get top 5 results
  const searchResults = filteredPayments.slice(0, 5);

  // Save search to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: Date.now(),
    };

    const updated = [
      newSearch,
      ...recentSearches.filter((s) => s.query !== newSearch.query),
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem("recentPaymentSearches", JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = () => {
    saveRecentSearch(searchQuery);
    applyFilters();
    setIsOpen(false);
  };

  // Apply all filters and update URL
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedStatuses.length > 0) params.set("statuses", selectedStatuses.join(","));
    if (selectedMethods.length > 0) params.set("methods", selectedMethods.join(","));
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (amountMin) params.set("amountMin", amountMin);
    if (amountMax) params.set("amountMax", amountMax);

    router.push(`?${params.toString()}`);

    // Notify parent component
    if (onFiltersChange) {
      onFiltersChange({
        searchQuery,
        statuses: selectedStatuses,
        methods: selectedMethods,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        amountMin: amountMin ? parseFloat(amountMin) : undefined,
        amountMax: amountMax ? parseFloat(amountMax) : undefined,
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedMethods([]);
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    router.push(window.location.pathname);
    if (onFiltersChange) {
      onFiltersChange({
        searchQuery: "",
        statuses: [],
        methods: [],
      });
    }
  };

  // Count active filters
  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedStatuses.length +
    selectedMethods.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (amountMin ? 1 : 0) +
    (amountMax ? 1 : 0);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedPaymentIndex((prev) =>
        Math.min(prev + 1, searchResults.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedPaymentIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && searchResults[selectedPaymentIndex]) {
      e.preventDefault();
      router.push(`/staff/payments/${searchResults[selectedPaymentIndex].businessKey}`);
      setIsOpen(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Status colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      succeeded: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      refunded: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-[--navy] transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400 group-hover:text-[--navy] transition" />
            <span className="text-gray-500 group-hover:text-gray-700">
              {searchQuery || "Search payments..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-[--navy] text-white text-xs font-semibold rounded-full">
                {activeFilterCount}
              </span>
            )}
            <kbd className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded border border-gray-300">
              ⌘⇧P
            </kbd>
          </div>
        </button>
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 max-h-[600px] overflow-y-auto">
          {/* Search Input (focused) */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by case ID, amount, method..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-[--navy] transition"
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
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="p-4 border-b border-gray-200 space-y-4 bg-gray-50">
              {/* Status Multi-Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {["succeeded", "pending", "processing", "failed", "refunded"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatuses((prev) =>
                            prev.includes(status)
                              ? prev.filter((s) => s !== status)
                              : [...prev, status]
                          );
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
                          selectedStatuses.includes(status)
                            ? "bg-[--navy] text-white border-[--navy]"
                            : "bg-white text-gray-700 border-gray-300 hover:border-[--navy]"
                        }`}
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Method Multi-Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "credit_card",
                    "debit_card",
                    "ach",
                    "check",
                    "cash",
                    "insurance_assignment",
                  ].map((method) => (
                    <button
                      key={method}
                      onClick={() => {
                        setSelectedMethods((prev) =>
                          prev.includes(method)
                            ? prev.filter((m) => m !== method)
                            : [...prev, method]
                        );
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
                        selectedMethods.includes(method)
                          ? "bg-[--navy] text-white border-[--navy]"
                          : "bg-white text-gray-700 border-gray-300 hover:border-[--navy]"
                      }`}
                    >
                      {method.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Amount
                  </label>
                  <input
                    type="number"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    placeholder="$0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Amount
                  </label>
                  <input
                    type="number"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    placeholder="$10,000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-2 bg-[--navy] text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="p-2">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((payment, index) => (
                    <button
                      key={payment.id}
                      onClick={() => {
                        router.push(`/staff/payments/${payment.businessKey}`);
                        setIsOpen(false);
                      }}
                      className={`w-full p-3 text-left rounded-lg transition ${
                        index === selectedPaymentIndex
                          ? "bg-[--cream]"
                          : "hover:bg-gray-50"
                      }`}
                      style={{
                        animationDelay: `${index * 0.05}s`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount.amount)}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Case: {payment.caseId}</span>
                        <span>•</span>
                        <span>{payment.method.replace("_", " ")}</span>
                        <span>•</span>
                        <span>
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm font-medium mb-1">No payments found</p>
                  <p className="text-xs">Try different keywords or filters</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2 px-2">
                Recent Searches
              </p>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((recent) => (
                  <button
                    key={recent.timestamp}
                    onClick={() => {
                      setSearchQuery(recent.query);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  >
                    {recent.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
