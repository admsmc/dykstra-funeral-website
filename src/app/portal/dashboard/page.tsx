'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';

/**
 * Family Portal Dashboard
 * 
 * Shows:
 * - Active cases
 * - Upcoming services
 * - Quick actions (contracts, payments, photos)
 * 
 * Demonstrates complete tRPC integration with Effect-TS backend
 */
export default function DashboardPage() {
  // Type-safe API call with full IntelliSense
  const { data: cases, isLoading, error } = trpc.case.listMyCases.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[--navy]">Loading your cases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading cases: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-serif text-[--navy] mb-2">Dashboard</h1>
        <p className="text-[--charcoal]">
          Welcome to your family portal. Here you can view arrangements, sign contracts, 
          make payments, and manage memorial content.
        </p>
      </div>

      {/* Active Cases */}
      <section>
        <h2 className="text-2xl font-serif text-[--navy] mb-4">Your Cases</h2>
        {cases && cases.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {cases.map((case_) => (
              <Link 
                key={case_.id} 
                href={`/portal/cases/${case_.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-[--sage]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-serif text-[--navy] mb-2">
                        {case_.decedentName}
                      </h3>
                      <p className="text-sm text-[--charcoal] mb-2">
                        Case Type: <span className="font-medium capitalize">{case_.type.replace('_', ' ')}</span>
                      </p>
                      <p className="text-sm text-[--charcoal]">
                        Status: <span className="font-medium capitalize">{case_.status}</span>
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 text-sm bg-[--sage] text-white rounded-full">
                      {case_.status}
                    </span>
                  </div>
                  {case_.serviceDate && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-[--charcoal]">
                        Service: {new Date(case_.serviceDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-[--charcoal] mb-4">You don't have any active cases.</p>
            <p className="text-sm text-gray-500">
              Cases will appear here once you've been invited by the funeral home.
            </p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-serif text-[--navy] mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-serif text-lg text-[--navy] mb-2">Contracts</h3>
            <p className="text-sm text-[--charcoal] mb-4">
              Review and sign contracts digitally
            </p>
            <button className="text-[--sage] hover:text-[--navy] font-medium text-sm">
              View Contracts →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-serif text-lg text-[--navy] mb-2">Payments</h3>
            <p className="text-sm text-[--charcoal] mb-4">
              Make payments securely online
            </p>
            <button className="text-[--sage] hover:text-[--navy] font-medium text-sm">
              Make Payment →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-3">📸</div>
            <h3 className="font-serif text-lg text-[--navy] mb-2">Photos</h3>
            <p className="text-sm text-[--charcoal] mb-4">
              Upload memorial photos and videos
            </p>
            <button className="text-[--sage] hover:text-[--navy] font-medium text-sm">
              Upload Photos →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
