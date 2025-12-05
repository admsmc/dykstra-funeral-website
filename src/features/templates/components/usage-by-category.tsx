import type { CategoryUsageViewModel } from '../view-models/template-analytics-view-model';

interface UsageByCategoryProps {
  categories: CategoryUsageViewModel[];
}

export function UsageByCategory({ categories }: UsageByCategoryProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage by Category</h2>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.category} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{cat.category}</span>
              <span className="font-semibold text-gray-900">{cat.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${cat.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
