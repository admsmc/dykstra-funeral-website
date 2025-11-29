'use client';

import { useState } from 'react';

/**
 * Integration Test Page
 * 
 * This page tests the Phase 1-4 Go backend integration endpoints.
 * Navigate to /test-integration to verify the connection.
 */

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function IntegrationTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (endpoint: string, status: TestResult['status'], message: string, duration?: number) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.endpoint === endpoint);
      const newResult = { endpoint, status, message, duration };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      }
      return [...prev, newResult];
    });
  };

  const testEndpoint = async (endpoint: string, method: string, body?: any) => {
    const startTime = Date.now();
    
    try {
      updateResult(endpoint, 'pending', 'Testing...');
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`/api/go-proxy${endpoint}`, options);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        updateResult(
          endpoint, 
          'success', 
          `Success (${response.status}) - ${JSON.stringify(data).slice(0, 50)}...`,
          duration
        );
      } else {
        const error = await response.text();
        updateResult(
          endpoint,
          'error',
          `Failed (${response.status}): ${error.slice(0, 100)}`,
          duration
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(
        endpoint,
        'error',
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        duration
      );
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    // Phase 1: Financial Endpoints
    await testEndpoint('/v1/gl/trial-balance?book=MAIN&period=2025-11&currency=USD', 'GET');
    await testEndpoint('/v1/gl/statements/balance-sheet?book=MAIN&entity_id=ENTITY1&period=2025-11&currency=USD', 'GET');
    await testEndpoint('/v1/gl/statements/cash-flow?book=MAIN&entity_id=ENTITY1&period_from=2025-11&period_to=2025-11&currency=USD', 'GET');
    await testEndpoint('/accounts/balances', 'POST', { accounts: ['test_1', 'test_2'] });
    await testEndpoint('/ap/payment-runs', 'POST', { tenant: 'T1', legal_entity: 'LE1', currency: 'USD' });

    // Phase 2: Timesheet Workflow
    const timesheetId = `TS_TEST_${Date.now()}`;
    await testEndpoint('/ps/timesheets/submit', 'POST', {
      tenant: 'T1',
      timesheet_id: timesheetId,
      worker_id: 'WORKER001',
      period_start: '2025-11-01T00:00:00Z',
      period_end: '2025-11-07T23:59:59Z',
      entries: ['e1', 'e2']
    });
    await testEndpoint('/ps/timesheets?tenant=T1&limit=10', 'GET');

    setTesting(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'pending': return '...';
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Go Backend Integration Test</h1>
        <p className="text-gray-600 mb-8">
          Tests Phase 1-4 endpoints through the BFF proxy
        </p>

        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold mb-2">Prerequisites:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Go backend running at localhost:8080</li>
            <li>Test data seeded in Go backend</li>
            <li>Environment variable GO_BACKEND_URL configured</li>
          </ul>
        </div>

        <button
          onClick={runAllTests}
          disabled={testing}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {testing ? 'Testing...' : 'Run All Tests'}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Results:</h2>
            
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(result.status)}`}>
                        {getStatusIcon(result.status)} {result.status.toUpperCase()}
                      </span>
                      {result.duration && (
                        <span className="text-xs text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-1">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {result.endpoint}
                    </code>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {result.message}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Summary:</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {results.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Tested Endpoints:</h3>
          <div className="text-sm space-y-2">
            <div>
              <strong>Phase 1 - Financial:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                <li>GET /v1/gl/trial-balance</li>
                <li>GET /v1/gl/statements/balance-sheet</li>
                <li>GET /v1/gl/statements/cash-flow</li>
                <li>POST /accounts/balances</li>
                <li>POST /ap/payment-runs</li>
              </ul>
            </div>
            <div>
              <strong>Phase 2 - Timesheet Workflow:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                <li>POST /ps/timesheets/submit</li>
                <li>GET /ps/timesheets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
