'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { use } from 'react';
import { TimelineCard, type TimelineItem } from '@/components/Timeline';

/**
 * Case Details Page
 * 
 * Displays:
 * - Decedent information
 * - Service details
 * - Timeline of events
 * - Family members
 * - Documents
 * - Action buttons (contracts, payments)
 */
export default function CaseDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  
  const { data: details, isLoading, error } = trpc.case.getDetails.useQuery({ 
    caseId: id 
  });

  const { data: timelineData, isLoading: timelineLoading } = trpc.case.getTimeline.useQuery({
    caseId: id,
    limit: 20,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[--navy]">Loading case details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading case: {error.message}</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Case not found</p>
      </div>
    );
  }

  const { case: caseData, canModify, isActive, daysUntilService } = details;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            href="/portal/dashboard" 
            className="text-[--sage] hover:text-[--navy] mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-serif text-[--navy] mb-2">
            {caseData.decedentName}
          </h1>
          <div className="flex items-center gap-4 text-sm text-[--charcoal]">
            <span className="capitalize">{caseData.type.replace('_', ' ')}</span>
            <span>•</span>
            <span className="capitalize">{caseData.status}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {canModify && (
            <button className="px-4 py-2 bg-[--sage] text-white rounded hover:bg-[--navy] transition">
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Service Countdown */}
      {daysUntilService !== null && daysUntilService >= 0 && (
        <div className="bg-[--cream] border-l-4 border-[--gold] p-4 rounded">
          <p className="text-[--navy] font-medium">
            Service in {daysUntilService} {daysUntilService === 1 ? 'day' : 'days'}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Decedent Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-serif text-[--navy] mb-4">Decedent Information</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500 mb-1">Full Name</dt>
                <dd className="text-[--charcoal] font-medium">{caseData.decedentName}</dd>
              </div>
              {caseData.decedentDateOfBirth && (
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Date of Birth</dt>
                  <dd className="text-[--charcoal] font-medium">
                    {new Date(caseData.decedentDateOfBirth).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {caseData.decedentDateOfDeath && (
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Date of Passing</dt>
                  <dd className="text-[--charcoal] font-medium">
                    {new Date(caseData.decedentDateOfDeath).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Service Details */}
          {caseData.serviceType && (
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-serif text-[--navy] mb-4">Service Details</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Service Type</dt>
                  <dd className="text-[--charcoal] font-medium capitalize">
                    {caseData.serviceType.replace(/_/g, ' ').toLowerCase()}
                  </dd>
                </div>
                {caseData.serviceDate && (
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">Service Date</dt>
                    <dd className="text-[--charcoal] font-medium">
                      {new Date(caseData.serviceDate).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Timeline */}
          {timelineLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-serif text-[--navy] mb-4">Timeline</h2>
              <div className="text-gray-500 text-center py-8">Loading timeline...</div>
            </div>
          ) : timelineData && timelineData.events.length > 0 ? (
            <TimelineCard
              title="Case Timeline"
              items={timelineData.events.map((event) => ({
                id: event.id,
                timestamp: new Date(event.timestamp),
                title: event.title,
                description: event.description,
                type: event.eventType as TimelineItem['type'],
                actor: event.actor,
              }))}
              variant="comfortable"
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-serif text-[--navy] mb-4">Timeline</h2>
              <div className="text-gray-500 text-center py-8">
                No timeline events yet. Events will appear here as you interact with this case.
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-serif text-[--navy] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                href={`/portal/contracts/${id}`}
                className="block w-full px-4 py-3 bg-[--sage] text-white text-center rounded hover:bg-[--navy] transition"
              >
                View Contract
              </Link>
              <Link 
                href={`/portal/payments/new?caseId=${id}`}
                className="block w-full px-4 py-3 bg-[--cream] text-[--navy] text-center rounded hover:bg-[--sage] hover:text-white transition border border-[--sage]"
              >
                Make Payment
              </Link>
              <Link 
                href={`/portal/memorials/${id}/photos`}
                className="block w-full px-4 py-3 bg-[--cream] text-[--navy] text-center rounded hover:bg-[--sage] hover:text-white transition border border-[--sage]"
              >
                Upload Photos
              </Link>
            </div>
          </section>

          {/* Case Status */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-serif text-[--navy] mb-4">Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current Status</span>
                <span className="inline-block px-3 py-1 text-sm bg-[--sage] text-white rounded-full capitalize">
                  {caseData.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Can Modify</span>
                <span className="text-sm text-[--charcoal] font-medium">
                  {canModify ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active</span>
                <span className="text-sm text-[--charcoal] font-medium">
                  {isActive ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </section>

          {/* Documents */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-serif text-[--navy] mb-4">Documents</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-[--charcoal] hover:bg-[--cream] rounded transition">
                📄 Contract.pdf
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-[--charcoal] hover:bg-[--cream] rounded transition">
                📄 Service Program.pdf
              </button>
              <p className="text-sm text-gray-500 pt-2">
                More documents will appear here as they become available.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
