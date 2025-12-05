interface WorkflowSummaryCardsProps {
  activeCount: number;
  pendingCount: number;
}

export function WorkflowSummaryCards({ activeCount, pendingCount }: WorkflowSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Active Workflows</h3>
        <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Your Pending Reviews</h3>
        <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
      </div>
    </div>
  );
}
