/**
 * Payroll Workspace
 * 
 * Payroll processing powered by Go ERP backend
 * 
 * Phase 2 Features:
 * - Import time entries from CRM
 * - Run payroll
 * - Generate pay stubs
 * - Post payroll to GL
 */

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-gray-600 mt-1">
          Process payroll with time entries from funeral case management
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <h3 className="font-semibold text-amber-900">Coming Soon - Phase 2</h3>
            <p className="text-sm text-amber-800 mt-1">
              Payroll integration will import time entries tracked against funeral cases,
              process payroll via Go ERP, and post expenses to GL automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">✅ Time Tracking (CRM)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Funeral directors log hours against cases in the CRM system
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Track hours per case</li>
            <li>• Approval workflow</li>
            <li>• Export to payroll</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💰 Payroll Run (ERP)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Process payroll in Go ERP backend with imported time entries
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Import approved time entries</li>
            <li>• Calculate pay</li>
            <li>• Generate pay stubs</li>
            <li>• Post to GL</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
