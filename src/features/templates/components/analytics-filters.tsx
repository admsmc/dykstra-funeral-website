import type { DateRange, Category } from '../types';

interface AnalyticsFiltersProps {
  dateRange: DateRange;
  category: Category;
  onDateRangeChange: (range: DateRange) => void;
  onCategoryChange: (category: Category) => void;
}

export function AnalyticsFilters({
  dateRange,
  category,
  onDateRangeChange,
  onCategoryChange,
}: AnalyticsFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time Range
        </label>
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value as DateRange)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as Category)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="service_program">Service Programs</option>
          <option value="prayer_card">Prayer Cards</option>
          <option value="thank_you_card">Thank You Cards</option>
          <option value="memorial_bookmark">Memorial Bookmarks</option>
        </select>
      </div>
    </div>
  );
}
