/**
 * Training Management Repository Adapter
 * Implements TrainingManagementPort using Prisma ORM
 * Handles all training record and policy persistence operations
 */

import { Effect } from 'effect';
import { prisma } from '../../database/prisma-client';
import type {
  TrainingManagementPortService,
  EmployeeCertification,
  EmployeeTrainingSummary,
  ExpiringCertification,
} from '@dykstra/application';
import type {
  TrainingRecord,
  TrainingPolicy,
} from '@dykstra/domain';
import {
  createTrainingRecordId,
  createTrainingPolicyId,
} from '@dykstra/domain';

/**
 * Training Management Adapter Implementation
 */
export const TrainingManagementAdapter: TrainingManagementPortService = {
  createTrainingPolicy: (funeralHomeId, _policyData, createdBy) =>
    Effect.tryPromise(async () => {
      const policy = await prisma.trainingPolicy.create({
        data: {
          businessKey: `${funeralHomeId}-training-policy`,
          funeralHomeId,
          roleRequirements: JSON.stringify({}),
          enableTrainingBackfill: true,
          backfillPremiumMultiplier: 1.25,
          defaultRenewalNoticeDays: 60,
          approvalRequiredAboveCost: 1000,
          notes: undefined,
          createdBy,
        },
      });

      return {
        id: createTrainingPolicyId(policy.id),
        funeralHomeId: policy.funeralHomeId,
        settings: {
          roleRequirements: new Map(),
          enableTrainingBackfill: policy.enableTrainingBackfill,
          backfillPremiumMultiplier: policy.backfillPremiumMultiplier,
          defaultRenewalNoticeDay: policy.defaultRenewalNoticeDays,
          approvalRequiredAboveCost: policy.approvalRequiredAboveCost,
        },
        notes: policy.notes ?? undefined,
        effectiveDate: policy.createdAt,
        isCurrent: policy.isCurrent,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        createdBy: policy.createdBy,
      } as TrainingPolicy;
    }),

  getTrainingPolicyForFuneralHome: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const policy = await prisma.trainingPolicy.findFirst({
        where: {
          funeralHomeId,
          isCurrent: true,
        },
      });

      if (!policy) return null;

      return {
        id: createTrainingPolicyId(policy.id),
        funeralHomeId: policy.funeralHomeId,
        settings: {
          roleRequirements: new Map(),
          enableTrainingBackfill: policy.enableTrainingBackfill,
          backfillPremiumMultiplier: policy.backfillPremiumMultiplier,
          defaultRenewalNoticeDay: policy.defaultRenewalNoticeDays,
          approvalRequiredAboveCost: policy.approvalRequiredAboveCost,
        },
        notes: policy.notes ?? undefined,
        effectiveDate: policy.validFrom,
        isCurrent: policy.isCurrent,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        createdBy: policy.createdBy,
      } as TrainingPolicy;
    }),

  updateTrainingPolicy: (policyId, _policyData, _updatedBy) =>
    Effect.tryPromise(async () => {
      const updated = await prisma.trainingPolicy.update({
        where: { id: policyId as any },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        id: createTrainingPolicyId(updated.id),
        funeralHomeId: updated.funeralHomeId,
        settings: {
          roleRequirements: new Map(),
          enableTrainingBackfill: updated.enableTrainingBackfill,
          backfillPremiumMultiplier: updated.backfillPremiumMultiplier,
          defaultRenewalNoticeDay: updated.defaultRenewalNoticeDays,
          approvalRequiredAboveCost: updated.approvalRequiredAboveCost,
        },
        notes: updated.notes ?? undefined,
        effectiveDate: updated.validFrom,
        isCurrent: updated.isCurrent,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        createdBy: updated.createdBy,
      } as TrainingPolicy;
    }),

  getTrainingPolicyHistory: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const policies = await prisma.trainingPolicy.findMany({
        where: { funeralHomeId },
        orderBy: { validFrom: 'desc' },
      });

      return policies.map((p) => ({
        id: createTrainingPolicyId(p.id),
        funeralHomeId: p.funeralHomeId,
        settings: {
          roleRequirements: new Map(),
          enableTrainingBackfill: p.enableTrainingBackfill,
          backfillPremiumMultiplier: p.backfillPremiumMultiplier,
          defaultRenewalNoticeDay: p.defaultRenewalNoticeDays,
          approvalRequiredAboveCost: p.approvalRequiredAboveCost,
        },
        notes: p.notes ?? undefined,
        effectiveDate: p.validFrom,
        isCurrent: p.isCurrent,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        createdBy: p.createdBy,
      })) as TrainingPolicy[];
    }),

  createTrainingRecord: (record, createdBy) =>
    Effect.tryPromise(async () => {
      const created = await prisma.trainingRecord.create({
        data: {
          id: record.id as any,
          funeralHomeId: record.funeralHomeId,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          trainingType: record.trainingType,
          trainingName: record.trainingName,
          requiredForRole: record.requiredForRole,
          status: record.status,
          scheduledDate: record.scheduledDate,
          startDate: record.startDate,
          endDate: record.endDate,
          completedAt: record.completedAt,
          hours: record.hours,
          cost: record.cost,
          instructor: record.instructor,
          location: record.location,
          certificationNumber: record.certificationNumber,
          expiresAt: record.expiresAt,
          renewalReminderSentAt: record.renewalReminderSentAt,
          notes: record.notes,
          createdBy,
        },
      });

      return {
        id: createTrainingRecordId(created.id),
        funeralHomeId: created.funeralHomeId,
        employeeId: created.employeeId,
        employeeName: created.employeeName,
        trainingType: created.trainingType,
        trainingName: created.trainingName,
        requiredForRole: created.requiredForRole,
        status: created.status as any,
        scheduledDate: created.scheduledDate ?? undefined,
        startDate: created.startDate ?? undefined,
        endDate: created.endDate ?? undefined,
        completedAt: created.completedAt ?? undefined,
        hours: created.hours,
        cost: created.cost,
        instructor: created.instructor ?? undefined,
        location: created.location ?? undefined,
        certificationNumber: created.certificationNumber ?? undefined,
        expiresAt: created.expiresAt ?? undefined,
        renewalReminderSentAt: created.renewalReminderSentAt ?? undefined,
        notes: created.notes ?? undefined,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        createdBy: created.createdBy,
      } as TrainingRecord;
    }),

  getTrainingRecord: (id) =>
    Effect.tryPromise(async () => {
      const record = await prisma.trainingRecord.findUnique({
        where: { id: id as any },
      });

      if (!record) return null;

      return {
        id: createTrainingRecordId(record.id),
        funeralHomeId: record.funeralHomeId,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        trainingType: record.trainingType,
        trainingName: record.trainingName,
        requiredForRole: record.requiredForRole,
        status: record.status as any,
        scheduledDate: record.scheduledDate ?? undefined,
        startDate: record.startDate ?? undefined,
        endDate: record.endDate ?? undefined,
        completedAt: record.completedAt ?? undefined,
        hours: record.hours,
        cost: record.cost,
        instructor: record.instructor ?? undefined,
        location: record.location ?? undefined,
        certificationNumber: record.certificationNumber ?? undefined,
        expiresAt: record.expiresAt ?? undefined,
        renewalReminderSentAt: record.renewalReminderSentAt ?? undefined,
        notes: record.notes ?? undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        createdBy: record.createdBy,
      } as TrainingRecord;
    }),

  getTrainingRecords: (filters) =>
    Effect.tryPromise(async () => {
      const records = await prisma.trainingRecord.findMany({
        where: {
          funeralHomeId: filters.funeralHomeId,
          employeeId: filters.employeeId,
          status: filters.status,
          trainingType: filters.trainingType,
          completedAt: {
            gte: filters.completedAfter,
            lte: filters.completedBefore,
          },
        },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      });

      const total = await prisma.trainingRecord.count({
        where: {
          funeralHomeId: filters.funeralHomeId,
          employeeId: filters.employeeId,
          status: filters.status,
          trainingType: filters.trainingType,
        },
      });

      return {
        items: records.map((r) => ({
          id: createTrainingRecordId(r.id),
          funeralHomeId: r.funeralHomeId,
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          trainingType: r.trainingType,
          trainingName: r.trainingName,
          requiredForRole: r.requiredForRole,
          status: r.status as any,
          scheduledDate: r.scheduledDate ?? undefined,
          startDate: r.startDate ?? undefined,
          endDate: r.endDate ?? undefined,
          completedAt: r.completedAt ?? undefined,
          hours: r.hours,
          cost: r.cost,
          instructor: r.instructor ?? undefined,
          location: r.location ?? undefined,
          certificationNumber: r.certificationNumber ?? undefined,
          expiresAt: r.expiresAt ?? undefined,
          renewalReminderSentAt: r.renewalReminderSentAt ?? undefined,
          notes: r.notes ?? undefined,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          createdBy: r.createdBy,
        })) as TrainingRecord[],
        total,
        hasMore: (filters.offset ?? 0) + records.length < total,
      };
    }),

  getTrainingRecordsByEmployee: (funeralHomeId, employeeId) =>
    Effect.tryPromise(async () => {
      const records = await prisma.trainingRecord.findMany({
        where: {
          funeralHomeId,
          employeeId,
        },
      });

      return records.map((r) => ({
        id: createTrainingRecordId(r.id),
        funeralHomeId: r.funeralHomeId,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        trainingType: r.trainingType,
        trainingName: r.trainingName,
        requiredForRole: r.requiredForRole,
        status: r.status as any,
        scheduledDate: r.scheduledDate ?? undefined,
        startDate: r.startDate ?? undefined,
        endDate: r.endDate ?? undefined,
        completedAt: r.completedAt ?? undefined,
        hours: r.hours,
        cost: r.cost,
        instructor: r.instructor ?? undefined,
        location: r.location ?? undefined,
        certificationNumber: r.certificationNumber ?? undefined,
        expiresAt: r.expiresAt ?? undefined,
        renewalReminderSentAt: r.renewalReminderSentAt ?? undefined,
        notes: r.notes ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        createdBy: r.createdBy,
      })) as TrainingRecord[];
    }),

  updateTrainingRecord: (id, record) =>
    Effect.tryPromise(async () => {
      const updated = await prisma.trainingRecord.update({
        where: { id: id as any },
        data: {
          status: record.status,
          startDate: record.startDate,
          endDate: record.endDate,
          completedAt: record.completedAt,
          hours: record.hours,
          cost: record.cost,
          instructor: record.instructor,
          location: record.location,
          certificationNumber: record.certificationNumber,
          expiresAt: record.expiresAt,
          renewalReminderSentAt: record.renewalReminderSentAt,
          notes: record.notes,
          updatedAt: new Date(),
        },
      });

      return {
        id: createTrainingRecordId(updated.id),
        funeralHomeId: updated.funeralHomeId,
        employeeId: updated.employeeId,
        employeeName: updated.employeeName,
        trainingType: updated.trainingType,
        trainingName: updated.trainingName,
        requiredForRole: updated.requiredForRole,
        status: updated.status as any,
        scheduledDate: updated.scheduledDate ?? undefined,
        startDate: updated.startDate ?? undefined,
        endDate: updated.endDate ?? undefined,
        completedAt: updated.completedAt ?? undefined,
        hours: updated.hours,
        cost: updated.cost,
        instructor: updated.instructor ?? undefined,
        location: updated.location ?? undefined,
        certificationNumber: updated.certificationNumber ?? undefined,
        expiresAt: updated.expiresAt ?? undefined,
        renewalReminderSentAt: updated.renewalReminderSentAt ?? undefined,
        notes: updated.notes ?? undefined,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        createdBy: updated.createdBy,
      } as TrainingRecord;
    }),

  getEmployeeCertifications: (funeralHomeId, employeeId) =>
    Effect.tryPromise(async () => {
      const certs = await prisma.certificationStatus.findMany({
        where: {
          funeralHomeId,
          employeeId,
        },
      });

      return certs.map((c) => {
        const daysUntilExpiry = c.expiresAt
          ? Math.ceil(
              (c.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
          : undefined;

        return {
          employeeId: c.employeeId,
          employeeName: '', // Will be populated from training records
          certificationId: c.certificationId,
          certificationName: c.certificationName,
          status: c.status as any,
          certificationNumber: undefined,
          expiresAt: c.expiresAt ?? undefined,
          daysUntilExpiry,
          renewalDue: c.renewalDueAt ? c.renewalDueAt <= new Date() : false,
        } as EmployeeCertification;
      });
    }),

  getExpiringCertifications: (funeralHomeId, withinDays) =>
    Effect.tryPromise(async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + withinDays);

      const certs = await prisma.certificationStatus.findMany({
        where: {
          funeralHomeId,
          expiresAt: {
            lte: expiryDate,
            gte: new Date(),
          },
        },
      });

      return certs.map((c) => {
        const daysUntilExpiry = c.expiresAt
          ? Math.ceil(
              (c.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        return {
          recordId: createTrainingRecordId(c.trainingRecordId ?? c.certificationId),
          employeeId: c.employeeId,
          employeeName: '', // Will be populated from training records
          certificationName: c.certificationName,
          expiresAt: c.expiresAt!,
          daysUntilExpiry,
          daysOverdue: daysUntilExpiry < 0 ? Math.abs(daysUntilExpiry) : undefined,
          requiresImmedateRenewal: daysUntilExpiry <= 7,
        } as ExpiringCertification;
      });
    }),

  getExpiredCertifications: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const certs = await prisma.certificationStatus.findMany({
        where: {
          funeralHomeId,
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return certs.map((c) => {
        const daysOverdue = Math.ceil(
          (new Date().getTime() - c.expiresAt!.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          recordId: createTrainingRecordId(c.trainingRecordId ?? c.certificationId),
          employeeId: c.employeeId,
          employeeName: '', // Will be populated from training records
          certificationName: c.certificationName,
          expiresAt: c.expiresAt!,
          daysUntilExpiry: -daysOverdue,
          daysOverdue,
          requiresImmedateRenewal: true,
        } as ExpiringCertification;
      });
    }),

  getEmployeeTrainingSummary: (funeralHomeId, employeeId) =>
    Effect.tryPromise(async () => {
      const records = await prisma.trainingRecord.findMany({
        where: {
          funeralHomeId,
          employeeId,
        },
      });

      const certs = await prisma.certificationStatus.findMany({
        where: {
          funeralHomeId,
          employeeId,
        },
      });

      const completed = records.filter((r) => r.completedAt);
      const totalHours = completed.reduce((sum, r) => sum + r.hours, 0);
      const totalCost = completed.reduce((sum, r) => sum + r.cost, 0);

      const nextRequired = certs
        .filter((c) => c.renewalDueAt && c.renewalDueAt > new Date())
        .sort((a, b) => (a.renewalDueAt?.getTime() ?? 0) - (b.renewalDueAt?.getTime() ?? 0))[0];

      return {
        employeeId,
        employeeName: records[0]?.employeeName ?? 'Unknown',
        role: '', // Will be populated from employee data
        totalHoursUsedThisYear: totalHours,
        totalBudgetUsedThisYear: totalCost,
        certifications: certs.map((c) => ({
          employeeId: c.employeeId,
          employeeName: records[0]?.employeeName ?? 'Unknown',
          certificationId: c.certificationId,
          certificationName: c.certificationName,
          status: c.status as any,
          certificationNumber: undefined,
          expiresAt: c.expiresAt ?? undefined,
          daysUntilExpiry: c.expiresAt
            ? Math.ceil((c.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : undefined,
          renewalDue: c.renewalDueAt ? c.renewalDueAt <= new Date() : false,
        })),
        nextRequiredTraining: nextRequired
          ? {
              certificationId: nextRequired.certificationId,
              certificationName: nextRequired.certificationName,
              daysUntilDue: Math.ceil(
                (nextRequired.renewalDueAt!.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              ),
            }
          : undefined,
      } as EmployeeTrainingSummary;
    }),

  getEmployeeTrainingSummaries: (funeralHomeId, employeeIds) =>
    Effect.tryPromise(async () => {
      const records = await prisma.trainingRecord.findMany({
        where: {
          funeralHomeId,
          ...(employeeIds && employeeIds.length > 0 ? { employeeId: { in: employeeIds } } : {}),
        },
      });

      const groupedByEmployee = records.reduce(
        (acc, r) => {
          if (!acc[r.employeeId]) {
            acc[r.employeeId] = [];
          }
          acc[r.employeeId]!.push(r);
          return acc;
        },
        {} as Record<string, typeof records>
      );

      return Object.entries(groupedByEmployee).map(([empId, empRecords]) => {
        const records = empRecords ?? [];
        const completed = records.filter((r) => r.completedAt);
        const totalHours = completed.reduce((sum, r) => sum + r.hours, 0);
        const totalCost = completed.reduce((sum, r) => sum + r.cost, 0);

        return {
          employeeId: empId,
          employeeName: records[0]?.employeeName ?? 'Unknown',
          role: '', // Will be populated from employee data
          totalHoursUsedThisYear: totalHours,
          totalBudgetUsedThisYear: totalCost,
          certifications: [],
          nextRequiredTraining: undefined,
        } as EmployeeTrainingSummary;
      });
    }),

  getMissingRequiredTraining: (funeralHomeId) =>
    Effect.tryPromise(async () => {
      const certs = await prisma.certificationStatus.findMany({
        where: {
          funeralHomeId,
          status: 'missing',
        },
      });

      const employees = new Set(certs.map((c) => c.employeeId));

      const records = await prisma.trainingRecord.findMany({
        where: {
          funeralHomeId,
          employeeId: { in: Array.from(employees) },
        },
      });

      const groupedByEmployee = records.reduce(
        (acc, r) => {
          if (!acc[r.employeeId]) {
            acc[r.employeeId] = [];
          }
          acc[r.employeeId]!.push(r);
          return acc;
        },
        {} as Record<string, typeof records>
      );

      return Object.entries(groupedByEmployee).map(([empId, empRecords]) => ({
        employeeId: empId,
        employeeName: (empRecords ?? [])[0]?.employeeName ?? 'Unknown',
        role: '',
        totalHoursUsedThisYear: 0,
        totalBudgetUsedThisYear: 0,
        certifications: [],
        nextRequiredTraining: undefined,
      })) as EmployeeTrainingSummary[];
    }),

  getMultiDayTrainingsScheduled: (funeralHomeId, startDate, endDate) =>
    Effect.tryPromise(async () => {
      const records = await prisma.trainingRecord.findMany({
        where: {
          funeralHomeId,
          status: 'scheduled',
          startDate: {
            lte: endDate,
            gte: startDate,
          },
        },
      });

      // Filter for multi-day trainings (more than 1 day duration)
      return records
        .filter((r) => {
          if (!r.startDate || !r.endDate) return false;
          const days = Math.ceil(
            (r.endDate.getTime() - r.startDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return days > 1;
        })
        .map((r) => ({
          id: createTrainingRecordId(r.id),
          funeralHomeId: r.funeralHomeId,
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          trainingType: r.trainingType,
          trainingName: r.trainingName,
          requiredForRole: r.requiredForRole,
          status: r.status as any,
          scheduledDate: r.scheduledDate ?? undefined,
          startDate: r.startDate ?? undefined,
          endDate: r.endDate ?? undefined,
          completedAt: r.completedAt ?? undefined,
          hours: r.hours,
          cost: r.cost,
          instructor: r.instructor ?? undefined,
          location: r.location ?? undefined,
          certificationNumber: r.certificationNumber ?? undefined,
          expiresAt: r.expiresAt ?? undefined,
          renewalReminderSentAt: r.renewalReminderSentAt ?? undefined,
          notes: r.notes ?? undefined,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          createdBy: r.createdBy,
        })) as TrainingRecord[];
    }),

  deleteTrainingRecord: (id) =>
    Effect.tryPromise(async () => {
      await prisma.trainingRecord.delete({
        where: { id: id as any },
      });
    }),
};
