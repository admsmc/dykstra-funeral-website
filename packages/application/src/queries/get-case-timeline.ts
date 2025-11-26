import { Effect } from 'effect';
import type { CaseId } from '@dykstra/domain';
import { NotFoundError } from '@dykstra/domain';
import { CaseRepository, PersistenceError } from '../ports/case-repository';

/**
 * Timeline Event
 * Represents a single event in the case timeline
 */
export interface TimelineEvent {
  id: string;
  timestamp: Date;
  eventType: 'created' | 'updated' | 'signed' | 'payment' | 'upload' | 'invite' | 'note';
  title: string;
  description?: string;
  actor?: string; // User who performed the action
  metadata?: Record<string, unknown>; // Additional event data
}

/**
 * Get Case Timeline Query
 * Retrieves chronological timeline of events for a case
 */
export interface GetCaseTimelineQuery {
  readonly caseId: CaseId;
  readonly limit?: number; // Max events to return (default: 50)
}

/**
 * Get Case Timeline Result
 */
export interface GetCaseTimelineResult {
  readonly caseId: CaseId;
  readonly events: TimelineEvent[];
  readonly totalEvents: number;
}

/**
 * Generate timeline events from case data
 * Maps case history to user-friendly timeline events
 */
function generateTimelineEvents(caseData: any): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Case created event
  if (caseData.createdAt) {
    events.push({
      id: `${caseData.id}-created`,
      timestamp: new Date(caseData.createdAt),
      eventType: 'created',
      title: 'Case Created',
      description: `Case opened for ${caseData.decedentName || 'deceased'}`,
      actor: caseData.createdBy,
    });
  }

  // Family members invited (from invitations or notes)
  if (caseData.familyMembers && caseData.familyMembers.length > 0) {
    caseData.familyMembers.forEach((member: any, index: number) => {
      if (member.invitedAt) {
        events.push({
          id: `${caseData.id}-invite-${index}`,
          timestamp: new Date(member.invitedAt),
          eventType: 'invite',
          title: 'Family Member Invited',
          description: `${member.name || member.email} invited to collaborate`,
          actor: member.invitedBy,
        });
      }
    });
  }

  // Arrangements saved (from SCD2 versions)
  if (caseData.arrangements) {
    events.push({
      id: `${caseData.id}-arrangements`,
      timestamp: new Date(caseData.arrangements.updatedAt || caseData.arrangements.createdAt),
      eventType: 'updated',
      title: 'Arrangements Saved',
      description: `${caseData.arrangements.serviceType || 'Service'} arrangements recorded`,
      actor: caseData.arrangements.updatedBy,
    });
  }

  // Contract signed (from contract entity)
  if (caseData.contract?.signedAt) {
    events.push({
      id: `${caseData.id}-contract-signed`,
      timestamp: new Date(caseData.contract.signedAt),
      eventType: 'signed',
      title: 'Contract Signed',
      description: `Contract signed electronically`,
      actor: caseData.contract.signedBy,
      metadata: {
        contractId: caseData.contract.id,
      },
    });
  }

  // Payments received (from payment records)
  if (caseData.payments && caseData.payments.length > 0) {
    caseData.payments
      .filter((p: any) => p.status === 'SUCCEEDED')
      .forEach((payment: any) => {
        events.push({
          id: `${caseData.id}-payment-${payment.id}`,
          timestamp: new Date(payment.paidAt || payment.createdAt),
          eventType: 'payment',
          title: 'Payment Received',
          description: `${formatCurrency(payment.amountMinor, payment.currency)} payment processed`,
          actor: payment.paidBy,
          metadata: {
            paymentId: payment.id,
            amount: payment.amountMinor,
            method: payment.method,
          },
        });
      });
  }

  // Photos uploaded (from photo records)
  if (caseData.photos && caseData.photos.length > 0) {
    caseData.photos.forEach((photo: any) => {
      events.push({
        id: `${caseData.id}-photo-${photo.id}`,
        timestamp: new Date(photo.uploadedAt),
        eventType: 'upload',
        title: 'Photo Uploaded',
        description: photo.caption || 'Photo added to memorial',
        actor: photo.uploadedBy,
        metadata: {
          photoId: photo.id,
        },
      });
    });
  }

  // Documents added (from document records)
  if (caseData.documents && caseData.documents.length > 0) {
    caseData.documents.forEach((doc: any) => {
      events.push({
        id: `${caseData.id}-doc-${doc.id}`,
        timestamp: new Date(doc.uploadedAt || doc.createdAt),
        eventType: 'upload',
        title: 'Document Added',
        description: `${doc.name} uploaded`,
        actor: doc.uploadedBy,
        metadata: {
          documentId: doc.id,
          documentType: doc.type,
        },
      });
    });
  }

  // Case status updates (from SCD2 versions)
  if (caseData.statusHistory && caseData.statusHistory.length > 1) {
    caseData.statusHistory
      .filter((_: any, index: number) => index > 0) // Skip initial status
      .forEach((statusChange: any, index: number) => {
        events.push({
          id: `${caseData.id}-status-${index}`,
          timestamp: new Date(statusChange.validFrom),
          eventType: 'updated',
          title: 'Status Updated',
          description: `Case status changed to ${statusChange.status}`,
          actor: statusChange.updatedBy,
        });
      });
  }

  // Sort events by timestamp (newest first)
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return events;
}

/**
 * Format currency for display
 */
function formatCurrency(amountMinor: number, currency: string): string {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

/**
 * Get Case Timeline Query Handler
 * Returns timeline of events for a case
 */
export const getCaseTimeline = (
  query: GetCaseTimelineQuery
): Effect.Effect<
  GetCaseTimelineResult,
  NotFoundError | PersistenceError,
  CaseRepository
> =>
  Effect.gen(function* (_) {
    const caseRepo = yield* _(CaseRepository);
    const limit = query.limit || 50;

    // Load case with all related data
    // Note: This assumes the case repository includes related data
    // In production, you might need separate queries or use Prisma includes
    const caseEntity = yield* _(caseRepo.findById(query.caseId));

    // In a real implementation, you would:
    // 1. Query the case with all relations (payments, photos, documents, etc.)
    // 2. Or query an event store if using event sourcing
    // 3. Or query a dedicated timeline projection table

    // For now, we'll generate events from the case data
    // This is a placeholder that assumes the case entity has all related data
    const caseData = {
      id: caseEntity.id,
      decedentName: caseEntity.decedentName,
      createdAt: caseEntity.createdAt,
      createdBy: caseEntity.createdBy,
      // These would come from separate queries or includes:
      familyMembers: [], // TODO: Query family member invitations
      arrangements: null, // TODO: Query arrangements
      contract: null, // TODO: Query contract
      payments: [], // TODO: Query payments
      photos: [], // TODO: Query photos
      documents: [], // TODO: Query documents
      statusHistory: [], // TODO: Query SCD2 history
    };

    const allEvents = generateTimelineEvents(caseData);
    const limitedEvents = allEvents.slice(0, limit);

    return {
      caseId: query.caseId,
      events: limitedEvents,
      totalEvents: allEvents.length,
    };
  });
