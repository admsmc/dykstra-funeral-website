/**
 * Stat Card Component
 * Clickable status filter card
 */

export interface StatCardProps {
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red';
  active: boolean;
  onClick: () => void;
}

export function StatCard({ label, value, color, active, onClick }: StatCardProps) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition text-left ${
        active ? 'border-[--navy] bg-blue-50' : colorClasses[color]
      }`}
    >
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </button>
  );
}
