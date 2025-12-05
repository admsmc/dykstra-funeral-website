export default function DevPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🧪 Development Routes</h1>
        <p className="text-gray-600 mb-8">Quick access to all application routes for testing</p>

        {/* Document Generation System - NEW */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">📄 Document Generation System (NEW - Weeks 13-18)</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Staff Pages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <a href="/staff/template-analytics" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors">
                  <span className="font-medium">📊 Template Analytics</span>
                  <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">NEW</span>
                  <p className="text-sm text-gray-600">/staff/template-analytics</p>
                </a>
                <a href="/staff/template-workflows" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors">
                  <span className="font-medium">✅ Multi-Stage Workflows</span>
                  <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">NEW</span>
                  <p className="text-sm text-gray-600">/staff/template-workflows</p>
                </a>
                <a href="/staff/template-library" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                  <span className="font-medium">📚 Template Library</span>
                  <p className="text-sm text-gray-600">/staff/template-library</p>
                </a>
                <a href="/staff/template-editor" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                  <span className="font-medium">✏️ Template Editor</span>
                  <p className="text-sm text-gray-600">/staff/template-editor</p>
                </a>
                <a href="/staff/template-approvals" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                  <span className="font-medium">👍 Template Approvals</span>
                  <p className="text-sm text-gray-600">/staff/template-approvals</p>
                </a>
                <a href="/staff/test-integration" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                  <span className="font-medium">🧪 Integration Tests</span>
                  <p className="text-sm text-gray-600">/staff/test-integration</p>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Family Pages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <a href="/customize-template" className="block p-3 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors">
                  <span className="font-medium">🎨 Customize Template</span>
                  <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">NEW</span>
                  <p className="text-sm text-gray-600">/customize-template</p>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Staff Dashboard */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-purple-600 mb-4">👔 Staff Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <a href="/staff/dashboard" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">📊 Dashboard</span>
              <p className="text-sm text-gray-600">/staff/dashboard</p>
            </a>
            <a href="/staff/analytics" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">📈 Analytics</span>
              <p className="text-sm text-gray-600">/staff/analytics</p>
            </a>
            <a href="/staff/cases" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">📁 Cases</span>
              <p className="text-sm text-gray-600">/staff/cases</p>
            </a>
            <a href="/staff/contracts" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">📄 Contracts</span>
              <p className="text-sm text-gray-600">/staff/contracts</p>
            </a>
            <a href="/staff/payments" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">💳 Payments</span>
              <p className="text-sm text-gray-600">/staff/payments</p>
            </a>
            <a href="/staff/families" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">👨‍👩‍👧‍👦 Families</span>
              <p className="text-sm text-gray-600">/staff/families</p>
            </a>
            <a href="/staff/tasks" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">✓ Tasks</span>
              <p className="text-sm text-gray-600">/staff/tasks</p>
            </a>
            <a href="/staff/payroll" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">💰 Payroll</span>
              <p className="text-sm text-gray-600">/staff/payroll</p>
            </a>
            <a href="/staff/finops" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">🏦 FinOps</span>
              <p className="text-sm text-gray-600">/staff/finops</p>
            </a>
          </div>
        </section>

        {/* Family Portal */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">👨‍👩‍👧‍👦 Family Portal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <a href="/portal/dashboard" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">🏠 Dashboard</span>
              <p className="text-sm text-gray-600">/portal/dashboard</p>
            </a>
            <a href="/portal/profile" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">👤 Profile</span>
              <p className="text-sm text-gray-600">/portal/profile</p>
            </a>
            <a href="/portal/cases/demo-case-id" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">📁 Case Details</span>
              <p className="text-sm text-gray-600">/portal/cases/[id]</p>
            </a>
            <a href="/portal/memorials/demo-memorial-id" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">🕯️ Memorial</span>
              <p className="text-sm text-gray-600">/portal/memorials/[id]</p>
            </a>
            <a href="/portal/payments/new" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">💳 New Payment</span>
              <p className="text-sm text-gray-600">/portal/payments/new</p>
            </a>
          </div>
        </section>

        {/* Public Pages */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">🌐 Public Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <a href="/" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">🏠 Home</span>
              <p className="text-sm text-gray-600">/</p>
            </a>
            <a href="/about" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">ℹ️ About</span>
              <p className="text-sm text-gray-600">/about</p>
            </a>
            <a href="/services" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">⚰️ Services</span>
              <p className="text-sm text-gray-600">/services</p>
            </a>
            <a href="/contact" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">📞 Contact</span>
              <p className="text-sm text-gray-600">/contact</p>
            </a>
            <a href="/obituaries" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">📰 Obituaries</span>
              <p className="text-sm text-gray-600">/obituaries</p>
            </a>
            <a href="/pre-planning" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
              <span className="font-medium">📋 Pre-Planning</span>
              <p className="text-sm text-gray-600">/pre-planning</p>
            </a>
          </div>
        </section>

        {/* API Testing */}
        <section className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-orange-600 mb-4">🔌 API Testing</h2>
          <div className="space-y-2">
            <div className="p-4 bg-orange-50 rounded border border-orange-200">
              <p className="font-medium mb-2">tRPC Endpoints (NEW - Week 17-18):</p>
              <div className="space-y-1 text-sm font-mono">
                <p>• <span className="text-blue-600">trpc.templateAnalytics.*</span> - Analytics queries</p>
                <p>• <span className="text-blue-600">trpc.templateApproval.*</span> - Multi-stage workflows</p>
                <p>• <span className="text-blue-600">trpc.batchDocuments.*</span> - Batch PDF generation</p>
                <p>• <span className="text-blue-600">trpc.printerIntegration.*</span> - Printer APIs</p>
              </div>
              <p className="text-sm text-gray-600 mt-2">Test these in the browser console</p>
            </div>
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <p className="font-medium mb-1">Health Check:</p>
              <a href="/api/health" className="text-blue-600 hover:underline text-sm">/api/health</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pt-8 border-t">
          <p>Development Page - Not for production use</p>
          <p className="mt-1">Total Routes: 40+ pages | New Routes: 3 UI + 24 API endpoints</p>
        </div>
      </div>
    </div>
  );
}
