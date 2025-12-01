/**
 * Backfill Management Repository Adapter
 * Implements BackfillManagementPort using Prisma ORM
 * Handles all backfill assignment and coverage persistence operations
 */

import { Effect } from 'effect';
import { prisma } from '../../database/prisma-client';
import type {
  BackfillManagementPortService,
  BackfillAssignmentFilters,
  BackfillAssignmentQueryResult,
  BackfillCandidate,
  BackfillCoverageSummary,
  BackfillEmployeeWorkload,
} from '@dykstra/application';
import type {
  BackfillAssignment,
  BackfillAssignmentId,
} from '@dykstra/domain';
import {
  createBackfillAssignmentId,
} from '@dykstra/domain';

/**
 * Backfill Management Adapter Implementation
 */
export const BackfillManagementAdapter: BackfillManagementPortService = {
  createBackfillAssignment: (assignment, createdBy) =>
    Effect.tryPromise(async () => {
      const created = await prisma.backfillAssignment.create({
        data: {
          id: assignment.id as any,
          businessKey: assignment.id as any,
          funeralHomeId: assignment.funeralHomeId,
          absenceId: assignment.absenceId,
          absenceType: assignment.absenceType,
          absenceStartDate: assignment.absenceStartDate,
          absenceEndDate: assignment.absenceEndDate,
          absenceEmployeeId: assignment.absenceEmployeeId,
          absenceEmployeeName: assignment.absenceEmployeeName,
          absenceEmployeeRole: assignment.absenceEmployeeRole,
          backfillEmployeeId: assignment.backfillEmployeeId,
          backfillEmployeeName: assignment.backfillEmployeeName,
          backfillEmployeeRole: assignment.backfillEmployeeRole,
          status: assignment.status,
          suggestedAt: assignment.suggestedAt,
          confirmedAt: assignment.confirmedAt,
          confirmedBy: assignment.confirmedBy,
          rejectedAt: assignment.rejectedAt,
          rejectionReason: assignment.rejectionReason,
          completedAt: assignment.completedAt,
          premiumType: assignment.premiumType,
          premiumMultiplier: assignment.premiumMultiplier,
          estimatedHours: assignment.estimatedHours,
          actualHours: assignment.actualHours,
          notes: assignment.notes,
          createdBy,
        },
      });

      return {
        id: createBackfillAssignmentId(created.id),
        funeralHomeId: created.funeralHomeId,
        absenceId: created.absenceId,
        absenceType: created.absenceType as any,
        absenceStartDate: created.absenceStartDate,
        absenceEndDate: created.absenceEndDate,
        absenceEmployeeId: created.absenceEmployeeId,
        absenceEmployeeName: created.absenceEmployeeName,
        absenceEmployeeRole: created.absenceEmployeeRole,
        backfillEmployeeId: created.backfillEmployeeId,
        backfillEmployeeName: created.backfillEmployeeName,
        backfillEmployeeRole: created.backfillEmployeeRole,
        status: created.status as any,
        suggestedAt: created.suggestedAt,
        confirmedAt: created.confirmedAt ?? undefined,
        confirmedBy: created.confirmedBy ?? undefined,
        rejectedAt: created.rejectedAt ?? undefined,
        rejectionReason: created.rejectionReason ?? undefined,
        completedAt: created.completedAt ?? undefined,
        premiumType: created.premiumType as any,
        premiumMultiplier: created.premiumMultiplier,
        estimatedHours: created.estimatedHours,
        actualHours: created.actualHours ?? undefined,
        notes: created.notes ?? undefined,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        createdBy: created.createdBy,
      } as BackfillAssignment;
    }),

  getBackfillAssignment: (id) =>
    Effect.tryPromise(async () => {
      const assignment = await prisma.backfillAssignment.findFirst({
        where: {
          id: id as any,
          isCurrent: true,
        },
      });

      if (!assignment) return null;

      return {
        id: createBackfillAssignmentId(assignment.id),
        funeralHomeId: assignment.funeralHomeId,
        absenceId: assignment.absenceId,
        absenceType: assignment.absenceType as any,
        absenceStartDate: assignment.absenceStartDate,
        absenceEndDate: assignment.absenceEndDate,
        absenceEmployeeId: assignment.absenceEmployeeId,
        absenceEmployeeName: assignment.absenceEmployeeName,
        absenceEmployeeRole: assignment.absenceEmployeeRole,
        backfillEmployeeId: assignment.backfillEmployeeId,
        backfillEmployeeName: assignment.backfillEmployeeName,
        backfillEmployeeRole: assignment.backfillEmployeeRole,
        status: assignment.status as any,
        suggestedAt: assignment.suggestedAt,
        confirmedAt: assignment.confirmedAt ?? undefined,
        confirmedBy: assignment.confirmedBy ?? undefined,
        rejectedAt: assignment.rejectedAt ?? undefined,
        rejectionReason: assignment.rejectionReason ?? undefined,
        completedAt: assignment.completedAt ?? undefined,
        premiumType: assignment.premiumType as any,
        premiumMultiplier: assignment.premiumMultiplier,
        estimatedHours: assignment.estimatedHours,
        actualHours: assignment.actualHours ?? undefined,
        notes: assignment.notes ?? undefined,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        createdBy: assignment.createdBy,
      } as BackfillAssignment;
    }),

  getBackfillAssignments: (filters) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          funeralHomeId: filters.funeralHomeId,
          absenceId: filters.absenceId,
          backfillEmployeeId: filters.backfillEmployeeId,
          status: filters.status,
          absenceStartDate: filters.startDate ? { gte: filters.startDate } : undefined,
          absenceEndDate: filters.endDate ? { lte: filters.endDate } : undefined,
          isCurrent: true,
        },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      });

      const total = await prisma.backfillAssignment.count({
        where: {
          funeralHomeId: filters.funeralHomeId,
          absenceId: filters.absenceId,
          backfillEmployeeId: filters.backfillEmployeeId,
          status: filters.status,
          isCurrent: true,
        },
      });

      return {
        items: assignments.map((a) => ({
          id: createBackfillAssignmentId(a.id),
          funeralHomeId: a.funeralHomeId,
          absenceId: a.absenceId,
          absenceType: a.absenceType as any,
          absenceStartDate: a.absenceStartDate,
          absenceEndDate: a.absenceEndDate,
          absenceEmployeeId: a.absenceEmployeeId,
          absenceEmployeeName: a.absenceEmployeeName,
          absenceEmployeeRole: a.absenceEmployeeRole,
          backfillEmployeeId: a.backfillEmployeeId,
          backfillEmployeeName: a.backfillEmployeeName,
          backfillEmployeeRole: a.backfillEmployeeRole,
          status: a.status as any,
          suggestedAt: a.suggestedAt,
          confirmedAt: a.confirmedAt ?? undefined,
          confirmedBy: a.confirmedBy ?? undefined,
          rejectedAt: a.rejectedAt ?? undefined,
          rejectionReason: a.rejectionReason ?? undefined,
          completedAt: a.completedAt ?? undefined,
          premiumType: a.premiumType as any,
          premiumMultiplier: a.premiumMultiplier,
          estimatedHours: a.estimatedHours,
          actualHours: a.actualHours ?? undefined,
          notes: a.notes ?? undefined,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          createdBy: a.createdBy,
        })) as BackfillAssignment[],
        total,
        hasMore: (filters.offset ?? 0) + assignments.length < total,
      };
    }),

  getBackfillAssignmentsByAbsence: (absenceId) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          absenceId,
          isCurrent: true,
        },
      });

      return assignments.map((a) => ({
        id: createBackfillAssignmentId(a.id),
        funeralHomeId: a.funeralHomeId,
        absenceId: a.absenceId,
        absenceType: a.absenceType as any,
        absenceStartDate: a.absenceStartDate,
        absenceEndDate: a.absenceEndDate,
        absenceEmployeeId: a.absenceEmployeeId,
        absenceEmployeeName: a.absenceEmployeeName,
        absenceEmployeeRole: a.absenceEmployeeRole,
        backfillEmployeeId: a.backfillEmployeeId,
        backfillEmployeeName: a.backfillEmployeeName,
        backfillEmployeeRole: a.backfillEmployeeRole,
        status: a.status as any,
        suggestedAt: a.suggestedAt,
        confirmedAt: a.confirmedAt ?? undefined,
        confirmedBy: a.confirmedBy ?? undefined,
        rejectedAt: a.rejectedAt ?? undefined,
        rejectionReason: a.rejectionReason ?? undefined,
        completedAt: a.completedAt ?? undefined,
        premiumType: a.premiumType as any,
        premiumMultiplier: a.premiumMultiplier,
        estimatedHours: a.estimatedHours,
        actualHours: a.actualHours ?? undefined,
        notes: a.notes ?? undefined,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        createdBy: a.createdBy,
      })) as BackfillAssignment[];
    }),

  getPendingBackfillAssignmentsForEmployee: (funeralHomeId, employeeId) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          funeralHomeId,
          backfillEmployeeId: employeeId,
          status: 'pending_confirmation',
          isCurrent: true,
        },
      });

      return assignments.map((a) => ({
        id: createBackfillAssignmentId(a.id),
        funeralHomeId: a.funeralHomeId,
        absenceId: a.absenceId,
        absenceType: a.absenceType as any,
        absenceStartDate: a.absenceStartDate,
        absenceEndDate: a.absenceEndDate,
        absenceEmployeeId: a.absenceEmployeeId,
        absenceEmployeeName: a.absenceEmployeeName,
        absenceEmployeeRole: a.absenceEmployeeRole,
        backfillEmployeeId: a.backfillEmployeeId,
        backfillEmployeeName: a.backfillEmployeeName,
        backfillEmployeeRole: a.backfillEmployeeRole,
        status: a.status as any,
        suggestedAt: a.suggestedAt,
        confirmedAt: a.confirmedAt ?? undefined,
        confirmedBy: a.confirmedBy ?? undefined,
        rejectedAt: a.rejectedAt ?? undefined,
        rejectionReason: a.rejectionReason ?? undefined,
        completedAt: a.completedAt ?? undefined,
        premiumType: a.premiumType as any,
        premiumMultiplier: a.premiumMultiplier,
        estimatedHours: a.estimatedHours,
        actualHours: a.actualHours ?? undefined,
        notes: a.notes ?? undefined,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        createdBy: a.createdBy,
      })) as BackfillAssignment[];
    }),

  getConfirmedBackfillAssignmentsForEmployee: (funeralHomeId, employeeId, startDate, endDate) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          funeralHomeId,
          backfillEmployeeId: employeeId,
          status: 'confirmed',
          absenceStartDate: startDate ? { gte: startDate } : undefined,
          absenceEndDate: endDate ? { lte: endDate } : undefined,
          isCurrent: true,
        },
      });

      return assignments.map((a) => ({
        id: createBackfillAssignmentId(a.id),
        funeralHomeId: a.funeralHomeId,
        absenceId: a.absenceId,
        absenceType: a.absenceType as any,
        absenceStartDate: a.absenceStartDate,
        absenceEndDate: a.absenceEndDate,
        absenceEmployeeId: a.absenceEmployeeId,
        absenceEmployeeName: a.absenceEmployeeName,
        absenceEmployeeRole: a.absenceEmployeeRole,
        backfillEmployeeId: a.backfillEmployeeId,
        backfillEmployeeName: a.backfillEmployeeName,
        backfillEmployeeRole: a.backfillEmployeeRole,
        status: a.status as any,
        suggestedAt: a.suggestedAt,
        confirmedAt: a.confirmedAt ?? undefined,
        confirmedBy: a.confirmedBy ?? undefined,
        rejectedAt: a.rejectedAt ?? undefined,
        rejectionReason: a.rejectionReason ?? undefined,
        completedAt: a.completedAt ?? undefined,
        premiumType: a.premiumType as any,
        premiumMultiplier: a.premiumMultiplier,
        estimatedHours: a.estimatedHours,
        actualHours: a.actualHours ?? undefined,
        notes: a.notes ?? undefined,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        createdBy: a.createdBy,
      })) as BackfillAssignment[];
    }),

  updateBackfillAssignment: (id, assignment) =>
    Effect.tryPromise(async () => {
      const updated = await prisma.backfillAssignment.update({
        where: { id: id as any },
        data: {
          status: assignment.status,
          confirmedAt: assignment.confirmedAt,
          confirmedBy: assignment.confirmedBy,
          rejectedAt: assignment.rejectedAt,
          rejectionReason: assignment.rejectionReason,
          completedAt: assignment.completedAt,
          actualHours: assignment.actualHours,
          notes: assignment.notes,
          updatedAt: new Date(),
        },
      });

      return {
        id: createBackfillAssignmentId(updated.id),
        funeralHomeId: updated.funeralHomeId,
        absenceId: updated.absenceId,
        absenceType: updated.absenceType as any,
        absenceStartDate: updated.absenceStartDate,
        absenceEndDate: updated.absenceEndDate,
        absenceEmployeeId: updated.absenceEmployeeId,
        absenceEmployeeName: updated.absenceEmployeeName,
        absenceEmployeeRole: updated.absenceEmployeeRole,
        backfillEmployeeId: updated.backfillEmployeeId,
        backfillEmployeeName: updated.backfillEmployeeName,
        backfillEmployeeRole: updated.backfillEmployeeRole,
        status: updated.status as any,
        suggestedAt: updated.suggestedAt,
        confirmedAt: updated.confirmedAt ?? undefined,
        confirmedBy: updated.confirmedBy ?? undefined,
        rejectedAt: updated.rejectedAt ?? undefined,
        rejectionReason: updated.rejectionReason ?? undefined,
        completedAt: updated.completedAt ?? undefined,
        premiumType: updated.premiumType as any,
        premiumMultiplier: updated.premiumMultiplier,
        estimatedHours: updated.estimatedHours,
        actualHours: updated.actualHours ?? undefined,
        notes: updated.notes ?? undefined,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        createdBy: updated.createdBy,
      } as BackfillAssignment;
    }),

  getBackfillCandidates: (funeralHomeId, absenceEmployeeRole, absenceStartDate, absenceEndDate) =>
    Effect.tryPromise(async () => {
      // Get all employees with matching role
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          funeralHomeId,
          backfillEmployeeRole: absenceEmployeeRole,
        },
      });

      // Get unique employees
      const candidates = Array.from(
        new Map(
          assignments.map((a) => [
            a.backfillEmployeeId,
            {
              employeeId: a.backfillEmployeeId,
              employeeName: a.backfillEmployeeName,
              role: a.backfillEmployeeRole,
            },
          ])
        ).values()
      );

      // Check for conflicts and calculate preference
      const result = await Promise.all(
        candidates.map(async (c) => {
          const conflicts = await prisma.backfillAssignment.count({
            where: {
              funeralHomeId,
              backfillEmployeeId: c.employeeId,
              absenceStartDate: { lte: absenceEndDate },
              absenceEndDate: { gte: absenceStartDate },
              status: { in: ['confirmed', 'pending_confirmation'] },
              isCurrent: true,
            },
          });

          const recentBackfills = await prisma.backfillAssignment.count({
            where: {
              funeralHomeId,
              backfillEmployeeId: c.employeeId,
              status: 'confirmed',
              isCurrent: true,
            },
          });

          return {
            employeeId: c.employeeId,
            employeeName: c.employeeName,
            role: c.role,
            currentlyAvailable: conflicts === 0,
            skillsMatch: true, // Simplified - assume role match = skills match
            levelMatch: true, // Simplified - assume role match = level match
            recentBackfills,
            preferenceRank: recentBackfills + (conflicts > 0 ? 100 : 0), // Lower is better
          } as BackfillCandidate;
        })
      );

      return result.sort((a, b) => a.preferenceRank - b.preferenceRank);
    }),

  getBackfillCoverageSummary: (absenceId) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          absenceId,
          isCurrent: true,
        },
      });

      if (assignments.length === 0) {
        return {
          absenceId,
          absenceEmployeeName: 'Unknown',
          absenceEmployeeRole: 'Unknown',
          absenceStartDate: new Date(),
          absenceEndDate: new Date(),
          totalBackfillsNeeded: 0,
          confirmedBackfills: 0,
          pendingBackfills: 0,
          rejectedBackfills: 0,
          coverageComplete: false,
          estimatedCost: 0,
          actualCost: undefined,
        } as BackfillCoverageSummary;
      }

      const first = assignments[0];
      const confirmed = assignments.filter((a) => a.status === 'confirmed').length;
      const pending = assignments.filter((a) => a.status === 'pending_confirmation').length;
      const rejected = assignments.filter((a) => a.status === 'rejected').length;
      const estimatedCost = assignments.reduce((sum, a) => sum + a.estimatedHours * 25, 0); // Assume $25/hour
      const actualCost = assignments.reduce((sum, a) => sum + (a.actualHours ?? 0) * 25, 0);

      return {
        absenceId,
        absenceEmployeeName: first.absenceEmployeeName,
        absenceEmployeeRole: first.absenceEmployeeRole,
        absenceStartDate: first.absenceStartDate,
        absenceEndDate: first.absenceEndDate,
        totalBackfillsNeeded: assignments.length,
        confirmedBackfills: confirmed,
        pendingBackfills: pending,
        rejectedBackfills: rejected,
        coverageComplete: confirmed === assignments.length,
        estimatedCost,
        actualCost: actualCost > 0 ? actualCost : undefined,
      } as BackfillCoverageSummary;
    }),

  getBackfillEmployeeWorkload: (funeralHomeId, employeeId) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          funeralHomeId,
          backfillEmployeeId: employeeId,
          isCurrent: true,
        },
      });

      const confirmed = assignments.filter((a) => a.status === 'confirmed');
      const pending = assignments.filter((a) => a.status === 'pending_confirmation');

      const estimatedHours = confirmed.reduce((sum, a) => sum + a.estimatedHours, 0);
      const estimatedCost = estimatedHours * 25; // Assume $25/hour

      // Get available dates (simplified)
      const availableDates = [
        {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ];

      const maxCapacityReached = estimatedHours > 160; // 40 hours/week * 4 weeks

      return {
        employeeId,
        employeeName: assignments[0]?.backfillEmployeeName ?? 'Unknown',
        confirmedBackfills: confirmed.length,
        pendingBackfillRequests: pending.length,
        estimatedHoursThisMonth: estimatedHours,
        estimatedCostThisMonth: estimatedCost,
        maxCapacityReached,
        availableDates,
      } as BackfillEmployeeWorkload;
    }),

  getBackfillEmployeeWorkloads: (funeralHomeId, employeeIds) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          funeralHomeId,
          ...(employeeIds && employeeIds.length > 0
            ? { backfillEmployeeId: { in: employeeIds } }
            : {}),
          isCurrent: true,
        },
      });

      const groupedByEmployee = assignments.reduce(
        (acc, a) => {
          if (!acc[a.backfillEmployeeId]) {
            acc[a.backfillEmployeeId] = [];
          }
          acc[a.backfillEmployeeId].push(a);
          return acc;
        },
        {} as Record<string, typeof assignments>
      );

      return Object.entries(groupedByEmployee).map(([empId, empAssignments]) => {
        const confirmed = empAssignments.filter((a) => a.status === 'confirmed');
        const pending = empAssignments.filter((a) => a.status === 'pending_confirmation');

        const estimatedHours = confirmed.reduce((sum, a) => sum + a.estimatedHours, 0);
        const estimatedCost = estimatedHours * 25;
        const maxCapacityReached = estimatedHours > 160;

        return {
          employeeId: empId,
          employeeName: empAssignments[0]?.backfillEmployeeName ?? 'Unknown',
          confirmedBackfills: confirmed.length,
          pendingBackfillRequests: pending.length,
          estimatedHoursThisMonth: estimatedHours,
          estimatedCostThisMonth: estimatedCost,
          maxCapacityReached,
          availableDates: [],
        } as BackfillEmployeeWorkload;
      });
    }),

  hasConflictingBackfills: (funeralHomeId, employeeId, startDate, endDate) =>
    Effect.tryPromise(async () => {
      const conflicts = await prisma.backfillAssignment.count({
        where: {
          funeralHomeId,
          backfillEmployeeId: employeeId,
          absenceStartDate: { lte: endDate },
          absenceEndDate: { gte: startDate },
          status: { in: ['confirmed', 'pending_confirmation'] },
          isCurrent: true,
        },
      });

      return conflicts > 0;
    }),

  getBackfillsAwaitingConfirmation: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          funeralHomeId,
          status: 'pending_confirmation',
          isCurrent: true,
        },
        orderBy: { suggestedAt: 'asc' },
      });

      return assignments.map((a) => ({
        id: createBackfillAssignmentId(a.id),
        funeralHomeId: a.funeralHomeId,
        absenceId: a.absenceId,
        absenceType: a.absenceType as any,
        absenceStartDate: a.absenceStartDate,
        absenceEndDate: a.absenceEndDate,
        absenceEmployeeId: a.absenceEmployeeId,
        absenceEmployeeName: a.absenceEmployeeName,
        absenceEmployeeRole: a.absenceEmployeeRole,
        backfillEmployeeId: a.backfillEmployeeId,
        backfillEmployeeName: a.backfillEmployeeName,
        backfillEmployeeRole: a.backfillEmployeeRole,
        status: a.status as any,
        suggestedAt: a.suggestedAt,
        confirmedAt: a.confirmedAt ?? undefined,
        confirmedBy: a.confirmedBy ?? undefined,
        rejectedAt: a.rejectedAt ?? undefined,
        rejectionReason: a.rejectionReason ?? undefined,
        completedAt: a.completedAt ?? undefined,
        premiumType: a.premiumType as any,
        premiumMultiplier: a.premiumMultiplier,
        estimatedHours: a.estimatedHours,
        actualHours: a.actualHours ?? undefined,
        notes: a.notes ?? undefined,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        createdBy: a.createdBy,
      })) as BackfillAssignment[];
    }),

  getBackfillPremiumPaySummary: (funeralHomeId, startDate, endDate) =>
    Effect.tryPromise(async () => {
      const assignments = await prisma.backfillAssignment.findMany({
        where: {
          funeralHomeId,
          absenceStartDate: { lte: endDate },
          absenceEndDate: { gte: startDate },
          status: 'completed',
          isCurrent: true,
        },
      });

      const groupedByEmployee = assignments.reduce(
        (acc, a) => {
          if (!acc[a.backfillEmployeeId]) {
            acc[a.backfillEmployeeId] = {
              employeeId: a.backfillEmployeeId,
              employeeName: a.backfillEmployeeName,
              totalPremiumPay: 0,
              assignments: [],
            };
          }

          const hours = a.actualHours ?? a.estimatedHours;
          const baseCost = hours * 25; // $25/hour base
          const premiumCost = baseCost * (a.premiumMultiplier - 1); // Premium is multiplier - 1

          acc[a.backfillEmployeeId].totalPremiumPay += premiumCost;
          acc[a.backfillEmployeeId].assignments.push({
            absenceEmployeeName: a.absenceEmployeeName,
            hours,
            premiumType: a.premiumType,
            cost: premiumCost,
          });

          return acc;
        },
        {} as Record<
          string,
          {
            employeeId: string;
            employeeName: string;
            totalPremiumPay: number;
            assignments: Array<{
              absenceEmployeeName: string;
              hours: number;
              premiumType: string;
              cost: number;
            }>;
          }
        >
      );

      return Object.values(groupedByEmployee);
    }),

  deleteBackfillAssignment: (id) =>
    Effect.tryPromise(async () => {
      await prisma.backfillAssignment.delete({
        where: { id: id as any },
      });
    }),
};
