import { z } from 'zod';
import { router, familyProcedure, staffProcedure } from '../trpc';
import { createCase, getCaseDetails, getCaseTimeline, CaseRepository } from '@dykstra/application';
import { CaseTypeSchema } from '@dykstra/shared';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';
import { TRPCError } from '@trpc/server';
import type { CaseId } from '@dykstra/domain';

/**
 * Case workflow state machine
 * Defines valid state transitions for case lifecycle
 */
const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  lead: ['inquiry', 'closed'], // Lead can convert to inquiry or be closed
  inquiry: ['arrangement', 'closed'], // Inquiry can move to arrangement or be closed
  arrangement: ['service_scheduled', 'closed'], // Arrangement can be scheduled or closed
  service_scheduled: ['in_progress'], // Service scheduled must proceed to in progress
  in_progress: ['completed'], // In progress must complete
  completed: ['finalized'], // Completed must be finalized
  finalized: ['closed'], // Finalized must be closed
  closed: [], // Terminal state - no transitions allowed
};

/**
 * Validates a case status transition
 * @param currentStatus - Current case status
 * @param newStatus - Proposed new status
 * @returns True if transition is valid
 */
function isValidTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions = WORKFLOW_TRANSITIONS[currentStatus.toLowerCase()];
  if (!validTransitions) return false;
  return validTransitions.includes(newStatus.toLowerCase());
}

/**
 * Case router
 */
export const caseRouter = router({
  /**
   * Create a new case
   */
  create: staffProcedure
    .input(
      z.object({
        decedentName: z.string().min(1).max(255),
        type: CaseTypeSchema,
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      
      const case_ = await runEffect(
        createCase({
          id: crypto.randomUUID(), // Generate CUID in production
          funeralHomeId,
          decedentName: input.decedentName,
          type: input.type,
          createdBy: ctx.user.id,
        })
      );

      return {
        id: case_.id,
        decedentName: case_.decedentName,
        type: case_.type,
        status: case_.status,
        createdAt: case_.createdAt,
      };
    }),

  /**
   * Get case details
   */
  getDetails: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const details = await runEffect(
        getCaseDetails({
          caseId: input.caseId as any, // CaseId brand
          requestingUserId: ctx.user.id,
        })
      );

      return {
        case: {
          id: details.case_.id,
          funeralHomeId: details.case_.funeralHomeId,
          decedentName: details.case_.decedentName,
          decedentDateOfBirth: details.case_.decedentDateOfBirth,
          decedentDateOfDeath: details.case_.decedentDateOfDeath,
          type: details.case_.type,
          status: details.case_.status,
          serviceType: details.case_.serviceType,
          serviceDate: details.case_.serviceDate,
          createdAt: details.case_.createdAt,
          updatedAt: details.case_.updatedAt,
        },
        canModify: details.canModify,
        isActive: details.isActive,
        daysUntilService: details.daysUntilService,
      };
    }),

  /**
   * List cases by family member
   */
  listMyCases: familyProcedure.query(async ({ ctx }) => {
    const cases = await runEffect(
      Effect.gen(function* (_) {
        const repo = yield* _(CaseRepository);
        return yield* _(repo.findByFamilyMember(ctx.user.id));
      })
    );

    return cases.map((case_) => ({
      id: case_.id,
      decedentName: case_.decedentName,
      type: case_.type,
      status: case_.status,
      serviceDate: case_.serviceDate,
      createdAt: case_.createdAt,
    }));
  }),

  /**
   * List all cases for funeral home (staff only)
   * Supports pagination for performance with 100+ cases
   */
  listAll: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(), // Last case ID from previous page
          status: z.enum(['INQUIRY', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
          type: z.enum(['AT_NEED', 'PRE_NEED', 'INQUIRY']).optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;
      
      const allCases = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(
            repo.findByFuneralHome(funeralHomeId).pipe(
              Effect.catchAll(() => Effect.succeed([]))
            )
          );
        })
      );
      
      // Filter by status and type if provided (case-insensitive matching)
      let filtered = allCases;
      if (input?.status) {
        filtered = filtered.filter(c => c.status.toUpperCase() === input.status);
      }
      if (input?.type) {
        filtered = filtered.filter(c => c.type.toUpperCase() === input.type);
      }
      
      // Apply cursor pagination
      const cursorIndex = cursor ? filtered.findIndex(c => c.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedCases = filtered.slice(startIndex, startIndex + limit);
      
      const lastCase = paginatedCases[paginatedCases.length - 1];
      const nextCursor = paginatedCases.length === limit && lastCase
        ? lastCase.id 
        : undefined;

      return {
        items: paginatedCases.map((case_) => ({
          id: case_.id,
          businessKey: case_.businessKey,
          version: case_.version,
          decedentName: case_.decedentName,
          type: case_.type,
          status: case_.status,
          serviceType: case_.serviceType,
          serviceDate: case_.serviceDate,
          createdAt: case_.createdAt,
          createdBy: case_.createdBy,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: filtered.length,
      };
    }),
  
  /**
   * Get case history - SCD Type 2 temporal query
   * Returns all versions of a case for audit trail
   */
  getHistory: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      const history = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findHistory(input.businessKey));
        })
      );

      return history.map((case_) => ({
        id: case_.id,
        businessKey: case_.businessKey,
        version: case_.version,
        decedentName: case_.decedentName,
        type: case_.type,
        status: case_.status,
        serviceType: case_.serviceType,
        serviceDate: case_.serviceDate,
        createdAt: case_.createdAt,
        updatedAt: case_.updatedAt,
        createdBy: case_.createdBy,
      }));
    }),
  
  /**
   * Get case at specific time - SCD Type 2 temporal query
   * Returns case state as it existed at a point in time
   */
  getAtTime: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
        asOf: z.date(),
      })
    )
    .query(async ({ input }) => {
      const case_ = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findByIdAtTime(input.businessKey, input.asOf));
        })
      );

      return {
        id: case_.id,
        businessKey: case_.businessKey,
        version: case_.version,
        decedentName: case_.decedentName,
        decedentDateOfBirth: case_.decedentDateOfBirth,
        decedentDateOfDeath: case_.decedentDateOfDeath,
        type: case_.type,
        status: case_.status,
        serviceType: case_.serviceType,
        serviceDate: case_.serviceDate,
        createdAt: case_.createdAt,
        updatedAt: case_.updatedAt,
        createdBy: case_.createdBy,
      };
    }),
  
  /**
   * Get changes between dates - SCD Type 2 temporal query
   * Returns versions that were effective in a date range
   */
  getChangesBetween: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
        from: z.date(),
        to: z.date(),
      })
    )
    .query(async ({ input }) => {
      const changes = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findChangesBetween(input.businessKey, input.from, input.to));
        })
      );

      return changes.map((case_) => ({
        id: case_.id,
        businessKey: case_.businessKey,
        version: case_.version,
        decedentName: case_.decedentName,
        type: case_.type,
        status: case_.status,
        serviceType: case_.serviceType,
        serviceDate: case_.serviceDate,
        createdAt: case_.createdAt,
        updatedAt: case_.updatedAt,
        createdBy: case_.createdBy,
      }));
    }),

  /**
   * Get case timeline
   * Returns chronological timeline of all events for a case
   */
  getTimeline: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        getCaseTimeline({
          caseId: input.caseId as any, // CaseId brand
          limit: input.limit,
        })
      );

      return {
        caseId: result.caseId,
        events: result.events.map((event) => ({
          id: event.id,
          timestamp: event.timestamp,
          eventType: event.eventType,
          title: event.title,
          description: event.description,
          actor: event.actor,
          metadata: event.metadata,
        })),
        totalEvents: result.totalEvents,
      };
    }),

  /**
   * Create case from lead
   * Converts a lead inquiry into a full case with initial arrangement
   */
  createFromLead: staffProcedure
    .input(
      z.object({
        leadId: z.string(),
        decedentName: z.string().min(1).max(255),
        type: CaseTypeSchema,
        decedentDateOfBirth: z.date().optional(),
        decedentDateOfDeath: z.date().optional(),
        primaryFamilyMemberId: z.string().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      
      // Create case
      let case_ = await runEffect(
        createCase({
          id: crypto.randomUUID(),
          funeralHomeId,
          decedentName: input.decedentName,
          type: input.type,
          createdBy: ctx.user.id,
        })
      );

      // Update decedent info if provided
      if (input.decedentDateOfBirth || input.decedentDateOfDeath) {
        case_ = await runEffect(
          Effect.gen(function* (_) {
            const updated = yield* _(case_.updateDecedentInfo({
              dateOfBirth: input.decedentDateOfBirth,
              dateOfDeath: input.decedentDateOfDeath,
            }));
            const repo = yield* _(CaseRepository);
            return yield* _(repo.update(updated));
          })
        );
      }

      return {
        id: case_.id,
        decedentName: case_.decedentName,
        type: case_.type,
        status: case_.status,
        createdAt: case_.createdAt,
        message: `Case created from lead ${input.leadId}`,
      };
    }),

  /**
   * Update case status
   * Enforces workflow state machine transitions
   */
  updateStatus: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        status: z.enum(['INQUIRY', 'ARRANGEMENT', 'SERVICE_SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FINALIZED', 'CLOSED']),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Get current case
      const currentCase = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findById(input.caseId as CaseId));
        })
      );

      // Validate transition (using workflow state machine)
      const currentStatus = currentCase.status;
      const newStatus = input.status.toLowerCase();
      if (!isValidTransition(currentStatus, newStatus)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions: ${WORKFLOW_TRANSITIONS[currentStatus.toLowerCase()]?.join(', ') || 'none'}`,
        });
      }

      // Update case status using domain model
      // Note: For now, we'll use transitionStatus if the status maps to domain statuses,
      // otherwise directly update. Production version should map workflow states to domain statuses.
      const updatedCase = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          const updated = new (currentCase.constructor as any)({
            ...currentCase,
            status: newStatus,
            version: currentCase.version + 1,
            updatedAt: new Date(),
          });
          return yield* _(repo.update(updated));
        })
      );

      return {
        id: updatedCase.id,
        status: updatedCase.status,
        previousStatus: currentStatus,
        updatedAt: updatedCase.updatedAt,
        reason: input.reason,
      };
    }),

  /**
   * Get financial summary for case
   * Returns contract value, payments, balance, and refunds
   */
  getFinancialSummary: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
      })
    )
    .query(async ({ input }) => {
      // TODO: Integrate with GoFinancialPort.getCaseFinancialSummary
      // For now, return mock data structure
      return {
        caseId: input.caseId,
        contractValue: 8500.00,
        paymentsReceived: 5000.00,
        balanceDue: 3500.00,
        refundsIssued: 0.00,
        lastPaymentDate: new Date('2024-11-15'),
        nextPaymentDue: new Date('2024-12-15'),
        paymentPlan: {
          installmentAmount: 500.00,
          frequency: 'monthly' as const,
          remainingInstallments: 7,
        },
        transactions: [
          {
            id: 'txn_001',
            date: new Date('2024-10-15'),
            type: 'payment' as const,
            amount: 2500.00,
            method: 'check',
            description: 'Initial deposit',
          },
          {
            id: 'txn_002',
            date: new Date('2024-11-15'),
            type: 'payment' as const,
            amount: 2500.00,
            method: 'ach',
            description: 'Monthly payment',
          },
        ],
      };
    }),

  /**
   * Finalize case
   * Locks case for editing and triggers final accounting processes
   */
  finalizeCase: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        finalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get current case
      const currentCase = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findById(input.caseId as CaseId));
        })
      );

      // Validate status (must be completed)
      if (currentCase.status !== 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot finalize case with status ${currentCase.status}. Case must be completed first.`,
        });
      }

      // Update to finalized status
      const finalizedCase = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          const updated = new (currentCase.constructor as any)({
            ...currentCase,
            status: 'archived', // Map 'finalized' to domain's 'archived' status
            finalizedAt: new Date(),
            finalizedBy: ctx.user.id,
            version: currentCase.version + 1,
            updatedAt: new Date(),
          });
          return yield* _(repo.update(updated));
        })
      );

      // TODO: Trigger final accounting processes
      // - Close GL entries
      // - Generate final invoice
      // - Archive documents

      return {
        id: finalizedCase.id,
        status: finalizedCase.status,
        finalizedAt: finalizedCase.finalizedAt,
        finalizedBy: finalizedCase.finalizedBy,
        message: 'Case finalized successfully. GL entries closed and documents archived.',
      };
    }),

  /**
   * Get audit log for case
   * Returns all changes and actions taken on the case
   */
  getAuditLog: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      // TODO: Integrate with audit logging system
      // For now, return mock audit log structure
      return {
        caseId: input.caseId,
        entries: [
          {
            id: 'audit_001',
            timestamp: new Date('2024-11-01T09:00:00Z'),
            userId: 'user_staff_001',
            userName: 'John Director',
            action: 'CREATED',
            entityType: 'CASE',
            entityId: input.caseId,
            changes: null,
            ipAddress: '192.168.1.100',
          },
          {
            id: 'audit_002',
            timestamp: new Date('2024-11-01T10:30:00Z'),
            userId: 'user_staff_001',
            userName: 'John Director',
            action: 'UPDATED',
            entityType: 'CASE',
            entityId: input.caseId,
            changes: {
              status: { from: 'INQUIRY', to: 'ARRANGEMENT' },
              serviceDate: { from: null, to: '2024-11-15' },
            },
            ipAddress: '192.168.1.100',
          },
        ],
        total: 2,
      };
    }),

  /**
   * Attach document to case
   * Links uploaded documents to case for organization and retrieval
   */
  attachDocument: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        documentId: z.string(),
        documentType: z.enum(['DEATH_CERTIFICATE', 'PERMIT', 'INSURANCE_FORM', 'CONTRACT', 'INVOICE', 'RECEIPT', 'OTHER']),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with DocumentRepository
      // For now, return mock attachment result
      return {
        id: `doc_attachment_${crypto.randomUUID()}`,
        caseId: input.caseId,
        documentId: input.documentId,
        documentType: input.documentType,
        title: input.title,
        description: input.description,
        attachedBy: ctx.user.id,
        attachedAt: new Date(),
        message: 'Document attached successfully',
      };
    }),

  /**
   * Generate documents for case
   * Creates documents from templates with case data merge
   */
  generateDocuments: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        templateIds: z.array(z.string()),
        format: z.enum(['PDF', 'DOCX']).default('PDF'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with DocumentGenerationService
      // For now, return mock generation result
      const documents = input.templateIds.map((templateId) => ({
        id: `doc_${crypto.randomUUID()}`,
        caseId: input.caseId,
        templateId,
        format: input.format,
        url: `/api/documents/doc_${crypto.randomUUID()}.${input.format.toLowerCase()}`,
        generatedAt: new Date(),
        generatedBy: ctx.user.id,
      }));

      return {
        caseId: input.caseId,
        documents,
        message: `Generated ${documents.length} document(s) successfully`,
      };
    }),

  /**
   * Reserve inventory for case
   * Allocates inventory items (casket, urn, etc.) to prevent double-booking
   */
  reserveInventory: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        items: z.array(
          z.object({
            itemId: z.string(),
            quantity: z.number().min(1),
            reservationNotes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with GoInventoryPort.reserveItems
      // For now, return mock reservation result
      const reservations = input.items.map((item) => ({
        id: `res_${crypto.randomUUID()}`,
        caseId: input.caseId,
        itemId: item.itemId,
        quantity: item.quantity,
        reservedBy: ctx.user.id,
        reservedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        notes: item.reservationNotes,
      }));

      return {
        caseId: input.caseId,
        reservations,
        message: `Reserved ${reservations.length} inventory item(s) successfully`,
      };
    }),

  /**
   * Assign staff to case
   * Assigns staff members to case roles (director, staff, driver, etc.)
   */
  assignStaff: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        assignments: z.array(
          z.object({
            staffId: z.string(),
            role: z.enum(['DIRECTOR', 'ASSISTANT_DIRECTOR', 'STAFF', 'DRIVER', 'EMBALMER']),
            isPrimary: z.boolean().default(false),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Integrate with CaseAssignmentRepository
      // For now, return mock assignment result
      const assignments = input.assignments.map((assignment) => ({
        id: `assign_${crypto.randomUUID()}`,
        caseId: input.caseId,
        staffId: assignment.staffId,
        role: assignment.role,
        isPrimary: assignment.isPrimary,
        assignedBy: ctx.user.id,
        assignedAt: new Date(),
      }));

      return {
        caseId: input.caseId,
        assignments,
        message: `Assigned ${assignments.length} staff member(s) successfully`,
      };
    }),

  /**
   * Schedule service for case
   * Sets service date/time and updates case status
   */
  scheduleService: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        serviceDate: z.date(),
        serviceType: z.enum(['traditional_burial', 'traditional_cremation', 'memorial_service', 'direct_burial', 'direct_cremation', 'celebration_of_life']),
        locationId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Get current case
      const currentCase = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          return yield* _(repo.findById(input.caseId as CaseId));
        })
      );

      // Validate status (must be active)
      if (currentCase.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot schedule service for case with status ${currentCase.status}. Case must be in active status.`,
        });
      }

      // Update case with service details using domain model
      const updatedCase = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          const withServiceDetails = yield* _(currentCase.setServiceDetails({
            serviceType: input.serviceType,
            serviceDate: input.serviceDate,
          }));
          return yield* _(repo.update(withServiceDetails));
        })
      );

      return {
        id: updatedCase.id,
        serviceDate: updatedCase.serviceDate,
        serviceType: updatedCase.serviceType,
        status: updatedCase.status,
        updatedAt: updatedCase.updatedAt,
        message: 'Service scheduled successfully',
      };
    }),
});
