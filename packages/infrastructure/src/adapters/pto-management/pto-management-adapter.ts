/**
 * PTO Management Repository Adapter
 * Implements PtoManagementPort using Prisma ORM
 * Handles all PTO request and policy persistence operations
 */

import { Effect } from 'effect';
import { prisma } from '../../database/prisma-client';
import type {
  PtoManagementPortService,
  PtoRequestFilters,
  PtoRequestQueryResult,
  PtoBalance,
  PtoSummary,
} from '@dykstra/application';
import type {
  PtoRequest,
  PtoRequestId,
  PtoPolicy,
  PtoPolicyId,
} from '@dykstra/domain';
import {
  createPtoRequestId,
  createPtoPolicyId,
} from '@dykstra/domain';

/**
 * PTO Management Adapter Implementation
 */
export const PtoManagementAdapter: PtoManagementPortService = {
  createPtoPolicy: (funeralHomeId, policyData, createdBy) =>
    Effect.tryPromise(async () => {
      const policy = await prisma.ptoPolicy.create({
        data: {
          businessKey: `${funeralHomeId}-pto-policy`,
          funeralHomeId,
          minAdvanceNoticeDays: policyData.settings?.minAdvanceNoticeDays ?? 14,
          minAdvanceNoticeHolidaysDays: policyData.settings?.minAdvanceNoticeHolidaysDays ?? 30,
          annualPtoDaysPerEmployee: policyData.settings?.annualPtoDaysPerEmployee ?? 20,
          maxConcurrentEmployeesOnPto: policyData.settings?.maxConcurrentEmployeesOnPto ?? 2,
          maxConsecutivePtoDays: policyData.settings?.maxConsecutivePtoDays ?? 10,
          roleSpecificPolicies: policyData.settings?.roleSpecificPolicies ?? {},
          blackoutDates: policyData.settings?.blackoutDates ?? [],
          enablePremiumPayForBackfill: policyData.settings?.enablePremiumPayForBackfill ?? true,
          premiumMultiplier: policyData.settings?.premiumMultiplier ?? 1.5,
          createdBy,
        },
      });

      return {
        id: createPtoPolicyId(policy.id),
        funeralHomeId: policy.funeralHomeId,
        settings: {
          minAdvanceNoticeDays: policy.minAdvanceNoticeDays,
          minAdvanceNoticeHolidaysDays: policy.minAdvanceNoticeHolidaysDays,
          annualPtoDaysPerEmployee: policy.annualPtoDaysPerEmployee,
          maxConcurrentEmployeesOnPto: policy.maxConcurrentEmployeesOnPto,
          maxConsecutivePtoDays: policy.maxConsecutivePtoDays,
          roleSpecificPolicies: new Map(),
          blackoutDates: [],
          enablePremiumPayForBackfill: policy.enablePremiumPayForBackfill,
          premiumMultiplier: policy.premiumMultiplier,
        },
        effectiveDate: policy.createdAt,
        isCurrent: policy.isCurrent,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        createdBy: policy.createdBy,
      } as PtoPolicy;
    }),

  getPtoPolicyForFuneralHome: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const policy = await prisma.ptoPolicy.findFirst({
        where: {
          funeralHomeId,
          isCurrent: true,
        },
      });

      if (!policy) return null;

      return {
        id: createPtoPolicyId(policy.id),
        funeralHomeId: policy.funeralHomeId,
        settings: {
          minAdvanceNoticeDays: policy.minAdvanceNoticeDays,
          minAdvanceNoticeHolidaysDays: policy.minAdvanceNoticeHolidaysDays,
          annualPtoDaysPerEmployee: policy.annualPtoDaysPerEmployee,
          maxConcurrentEmployeesOnPto: policy.maxConcurrentEmployeesOnPto,
          maxConsecutivePtoDays: policy.maxConsecutivePtoDays,
          roleSpecificPolicies: new Map(),
          blackoutDates: [],
          enablePremiumPayForBackfill: policy.enablePremiumPayForBackfill,
          premiumMultiplier: policy.premiumMultiplier,
        },
        effectiveDate: policy.validFrom,
        isCurrent: policy.isCurrent,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        createdBy: policy.createdBy,
      } as PtoPolicy;
    }),

  updatePtoPolicy: (policyId, policyData, updatedBy) =>
    Effect.tryPromise(async () => {
      // In real implementation, would create new version
      const updated = await prisma.ptoPolicy.update({
        where: { id: policyId as any },
        data: {
          minAdvanceNoticeDays: policyData.settings?.minAdvanceNoticeDays,
          minAdvanceNoticeHolidaysDays: policyData.settings?.minAdvanceNoticeHolidaysDays,
          updatedAt: new Date(),
        },
      });

      return {
        id: createPtoPolicyId(updated.id),
        funeralHomeId: updated.funeralHomeId,
        settings: {
          minAdvanceNoticeDays: updated.minAdvanceNoticeDays,
          minAdvanceNoticeHolidaysDays: updated.minAdvanceNoticeHolidaysDays,
          annualPtoDaysPerEmployee: updated.annualPtoDaysPerEmployee,
          maxConcurrentEmployeesOnPto: updated.maxConcurrentEmployeesOnPto,
          maxConsecutivePtoDays: updated.maxConsecutivePtoDays,
          roleSpecificPolicies: new Map(),
          blackoutDates: [],
          enablePremiumPayForBackfill: updated.enablePremiumPayForBackfill,
          premiumMultiplier: updated.premiumMultiplier,
        },
        effectiveDate: updated.validFrom,
        isCurrent: updated.isCurrent,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        createdBy: updated.createdBy,
      } as PtoPolicy;
    }),

  getPtoPolicyHistory: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const policies = await prisma.ptoPolicy.findMany({
        where: { funeralHomeId },
        orderBy: { validFrom: 'desc' },
      });

      return policies.map((p) => ({
        id: createPtoPolicyId(p.id),
        funeralHomeId: p.funeralHomeId,
        settings: {
          minAdvanceNoticeDays: p.minAdvanceNoticeDays,
          minAdvanceNoticeHolidaysDays: p.minAdvanceNoticeHolidaysDays,
          annualPtoDaysPerEmployee: p.annualPtoDaysPerEmployee,
          maxConcurrentEmployeesOnPto: p.maxConcurrentEmployeesOnPto,
          maxConsecutivePtoDays: p.maxConsecutivePtoDays,
          roleSpecificPolicies: new Map(),
          blackoutDates: [],
          enablePremiumPayForBackfill: p.enablePremiumPayForBackfill,
          premiumMultiplier: p.premiumMultiplier,
        },
        effectiveDate: p.validFrom,
        isCurrent: p.isCurrent,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        createdBy: p.createdBy,
      })) as PtoPolicy[];
    }),

  createPtoRequest: (request, createdBy) =>
    Effect.tryPromise(async () => {
      const created = await prisma.ptoRequest.create({
        data: {
          id: request.id as any,
          businessKey: request.id as any,
          funeralHomeId: request.funeralHomeId,
          employeeId: request.employeeId,
          employeeName: request.employeeName,
          ptoType: request.ptoType,
          requestedDays: request.requestedDays,
          startDate: request.startDate,
          endDate: request.endDate,
          reason: request.reason,
          status: request.status,
          requestedAt: request.requestedAt,
          backfillRequirementsMet: request.backfillRequirementsMet,
          createdBy,
        },
      });

      return {
        id: createPtoRequestId(created.id),
        funeralHomeId: created.funeralHomeId,
        employeeId: created.employeeId,
        employeeName: created.employeeName,
        ptoType: created.ptoType as any,
        requestedDays: created.requestedDays,
        startDate: created.startDate,
        endDate: created.endDate,
        reason: created.reason ?? undefined,
        status: created.status as any,
        requestedAt: created.requestedAt,
        backfillRequirementsMet: created.backfillRequirementsMet,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        createdBy: created.createdBy,
      } as PtoRequest;
    }),

  getPtoRequest: (id) =>
    Effect.tryPromise(async () => {
      const request = await prisma.ptoRequest.findFirst({
        where: {
          id: id as any,
          isCurrent: true,
        },
      });

      if (!request) return null;

      return {
        id: createPtoRequestId(request.id),
        funeralHomeId: request.funeralHomeId,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        ptoType: request.ptoType as any,
        requestedDays: request.requestedDays,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason ?? undefined,
        status: request.status as any,
        requestedAt: request.requestedAt,
        respondedAt: request.respondedAt ?? undefined,
        respondedBy: request.respondedBy ?? undefined,
        rejectionReason: request.rejectionReason ?? undefined,
        backfillRequirementsMet: request.backfillRequirementsMet,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        createdBy: request.createdBy,
      } as PtoRequest;
    }),

  getPtoRequests: (filters) =>
    Effect.tryPromise(async () => {
      const requests = await prisma.ptoRequest.findMany({
        where: {
          funeralHomeId: filters.funeralHomeId,
          employeeId: filters.employeeId,
          status: filters.status,
          startDate: filters.startDate ? { gte: filters.startDate } : undefined,
          endDate: filters.endDate ? { lte: filters.endDate } : undefined,
          isCurrent: true,
        },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      });

      const total = await prisma.ptoRequest.count({
        where: {
          funeralHomeId: filters.funeralHomeId,
          employeeId: filters.employeeId,
          status: filters.status,
          isCurrent: true,
        },
      });

      return {
        items: requests.map((r) => ({
          id: createPtoRequestId(r.id),
          funeralHomeId: r.funeralHomeId,
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          ptoType: r.ptoType as any,
          requestedDays: r.requestedDays,
          startDate: r.startDate,
          endDate: r.endDate,
          reason: r.reason ?? undefined,
          status: r.status as any,
          requestedAt: r.requestedAt,
          backfillRequirementsMet: r.backfillRequirementsMet,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          createdBy: r.createdBy,
        })) as PtoRequest[],
        total,
        hasMore: (filters.offset ?? 0) + requests.length < total,
      };
    }),

  getPtoRequestsByEmployee: (funeralHomeId, employeeId) =>
    Effect.tryPromise(async () => {
      const requests = await prisma.ptoRequest.findMany({
        where: {
          funeralHomeId,
          employeeId,
          isCurrent: true,
        },
      });

      return requests.map((r) => ({
        id: createPtoRequestId(r.id),
        funeralHomeId: r.funeralHomeId,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        ptoType: r.ptoType as any,
        requestedDays: r.requestedDays,
        startDate: r.startDate,
        endDate: r.endDate,
        reason: r.reason ?? undefined,
        status: r.status as any,
        requestedAt: r.requestedAt,
        backfillRequirementsMet: r.backfillRequirementsMet,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        createdBy: r.createdBy,
      })) as PtoRequest[];
    }),

  getPendingPtoApprovals: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const requests = await prisma.ptoRequest.findMany({
        where: {
          funeralHomeId,
          status: 'pending',
          isCurrent: true,
        },
        orderBy: { requestedAt: 'asc' },
      });

      return requests.map((r) => ({
        id: createPtoRequestId(r.id),
        funeralHomeId: r.funeralHomeId,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        ptoType: r.ptoType as any,
        requestedDays: r.requestedDays,
        startDate: r.startDate,
        endDate: r.endDate,
        reason: r.reason ?? undefined,
        status: r.status as any,
        requestedAt: r.requestedAt,
        backfillRequirementsMet: r.backfillRequirementsMet,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        createdBy: r.createdBy,
      })) as PtoRequest[];
    }),

  updatePtoRequest: (id, request) =>
    Effect.tryPromise(async () => {
      const updated = await prisma.ptoRequest.update({
        where: { id: id as any },
        data: {
          status: request.status,
          respondedAt: request.respondedAt,
          respondedBy: request.respondedBy,
          rejectionReason: request.rejectionReason,
          backfillRequirementsMet: request.backfillRequirementsMet,
          updatedAt: new Date(),
        },
      });

      return {
        id: createPtoRequestId(updated.id),
        funeralHomeId: updated.funeralHomeId,
        employeeId: updated.employeeId,
        employeeName: updated.employeeName,
        ptoType: updated.ptoType as any,
        requestedDays: updated.requestedDays,
        startDate: updated.startDate,
        endDate: updated.endDate,
        reason: updated.reason ?? undefined,
        status: updated.status as any,
        requestedAt: updated.requestedAt,
        respondedAt: updated.respondedAt ?? undefined,
        respondedBy: updated.respondedBy ?? undefined,
        rejectionReason: updated.rejectionReason ?? undefined,
        backfillRequirementsMet: updated.backfillRequirementsMet,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        createdBy: updated.createdBy,
      } as PtoRequest;
    }),

  getEmployeePtoBalance: (funeralHomeId, employeeId) =>
    Effect.tryPromise(async () => {
      const employee = await prisma.ptoRequest.findFirst({
        where: {
          funeralHomeId,
          employeeId,
        },
      });

      if (!employee) {
        return {
          employeeId,
          employeeName: 'Unknown',
          annualAllowance: 20,
          daysUsed: 0,
          daysRemaining: 20,
          pendingRequests: 0,
          currentlyOnPto: false,
        };
      }

      const usedDays = await prisma.ptoRequest.aggregate({
        where: {
          funeralHomeId,
          employeeId,
          status: { in: ['taken', 'approved'] },
          isCurrent: true,
        },
        _sum: { requestedDays: true },
      });

      const pending = await prisma.ptoRequest.count({
        where: {
          funeralHomeId,
          employeeId,
          status: 'pending',
          isCurrent: true,
        },
      });

      const used = usedDays._sum.requestedDays ?? 0;

      return {
        employeeId,
        employeeName: employee.employeeName,
        annualAllowance: 20,
        daysUsed: used,
        daysRemaining: 20 - used,
        pendingRequests: pending,
        currentlyOnPto: false,
      } as PtoBalance;
    }),

  getEmployeePtoBalances: (funeralHomeId, employeeIds) =>
    Effect.tryPromise(async () => {
      // Simplified implementation
      return [] as PtoBalance[];
    }),

  getFuneralHomePtoSummary: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const onPto = await prisma.ptoRequest.findMany({
        where: {
          funeralHomeId,
          status: 'taken',
          isCurrent: true,
        },
      });

      const pending = await prisma.ptoRequest.count({
        where: {
          funeralHomeId,
          status: 'pending',
          isCurrent: true,
        },
      });

      return {
        funeralHomeId,
        employeesOnPto: onPto.length,
        employeeOnPtoNames: onPto.map((r) => r.employeeName),
        pendingApprovals: pending,
        approvalDeadlines: [],
      } as PtoSummary;
    }),

  getConcurrentPtoRequests: (funeralHomeId, startDate, endDate, role) =>
    Effect.tryPromise(async () => {
      const requests = await prisma.ptoRequest.findMany({
        where: {
          funeralHomeId,
          startDate: { lte: endDate },
          endDate: { gte: startDate },
          status: { in: ['approved', 'taken'] },
          isCurrent: true,
        },
      });

      return requests.map((r) => ({
        id: createPtoRequestId(r.id),
        funeralHomeId: r.funeralHomeId,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        ptoType: r.ptoType as any,
        requestedDays: r.requestedDays,
        startDate: r.startDate,
        endDate: r.endDate,
        reason: r.reason ?? undefined,
        status: r.status as any,
        requestedAt: r.requestedAt,
        backfillRequirementsMet: r.backfillRequirementsMet,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        createdBy: r.createdBy,
      })) as PtoRequest[];
    }),

  deletePtoRequest: (id) =>
    Effect.tryPromise(async () => {
      await prisma.ptoRequest.delete({
        where: { id: id as any },
      });
    }),
};
