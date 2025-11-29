/**
 * FinOps Workspace
 * 
 * General Ledger and Financial Reporting powered by Go ERP backend
 * 
 * Features (Phase 1+):
 * - Trial balance
 * - P&L and balance sheet
 * - Journal entries
 * - Period close
 */

export default function FinOpsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Ledger & Reporting</h1>
        <p className="text-gray-600 mt-1">
          Financial operations powered by Go ERP backend
        </p>
      </div>

      {/* Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <h3 className="font-semibold text-amber-900">Coming Soon - Phase 1</h3>
            <p className="text-sm text-amber-800 mt-1">
              This workspace will connect to the Go ERP backend via the BFF layer.
              Features include trial balance, P&L, balance sheet, and journal entries.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          title="Trial Balance"
          description="Real-time GL account balances with drill-down to transactions"
          icon="📊"
          status="Planned"
        />
        <FeatureCard
          title="P&L & Balance Sheet"
          description="Financial statements with period comparison and consolidated views"
          icon="📈"
          status="Planned"
        />
        <FeatureCard
          title="Journal Entries"
          description="Create, approve, and post GL journals with SoD controls"
          icon="📝"
          status="Planned"
        />
        <FeatureCard
          title="Period Close"
          description="Month-end and year-end close workflows with checklists"
          icon="🔒"
          status="Planned"
        />
        <FeatureCard
          title="Consolidations"
          description="Multi-entity consolidation with elimination entries"
          icon="🏢"
          status="Planned"
        />
        <FeatureCard
          title="FX Revaluation"
          description="Multi-currency revaluation and translation adjustments"
          icon="💱"
          status="Planned"
        />
      </div>

      {/* Architecture Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🏗️ Architecture</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Backend</strong>: Go ERP with TigerBeetle (<1ms P99 latency)</p>
          <p>• <strong>Integration</strong>: BFF layer with openapi-fetch (type-safe)</p>
          <p>• <strong>Data Flow</strong>: Frontend → BFF (tRPC) → Go ERP (HTTP/OpenAPI)</p>
          <p>• <strong>Case Integration</strong>: Funeral case expenses auto-post to GL</p>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  status: string;
}

function FeatureCard({ title, description, icon, status }: FeatureCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
          {status}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
