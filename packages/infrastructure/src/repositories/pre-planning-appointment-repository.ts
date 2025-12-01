import { Effect } from 'effect';
import { PrePlanningAppointment, AppointmentId } from '@dykstra/domain';
import {
  PrePlanningAppointmentRepository,
  RepositoryError,
  AppointmentNotFoundError,
} from '@dykstra/application';
import { prisma } from './prisma-client';

/**
 * Prisma-based implementation of PrePlanningAppointmentRepository
 * 
 * Uses SCD Type 2 temporal pattern:
 * - All versions stored with validFrom/validTo dates
 * - isCurrent flag for fast lookup of current version
 * - businessKey provides immutable identifier
 * - Complete audit trail maintained
 */

export const PrismaPrePlanningAppointmentRepository: PrePlanningAppointmentRepository = {
    /**
     * Find appointment by ID (always returns current version)
     */
    findById: (id: AppointmentId) =>
      Effect.tryPromise(async () => {
        const record = await prisma.prePlanningAppointment.findFirst({
          where: {
            id: id as unknown as string,
            isCurrent: true,
          },
        });

        if (!record) {
          throw new AppointmentNotFoundError(
            `Appointment not found: ${id}`,
            id
          );
        }

        return toDomain(record);
      }).pipe(
        Effect.catch(() =>
          new AppointmentNotFoundError(
            `Appointment not found: ${id}`,
            id
          )
        )
      ),

    /**
     * Find appointment by business key (current version only)
     */
    findByBusinessKey: (businessKey: string) =>
      Effect.tryPromise(async () => {
        const record = await prisma.prePlanningAppointment.findFirst({
          where: {
            businessKey,
            isCurrent: true,
          },
        });

        return record ? toDomain(record) : null;
      }).pipe(
        Effect.catch((error) =>
          new RepositoryError(
            `Failed to find appointment by business key: ${businessKey}`,
            error
          )
        )
      ),

    /**
     * Get full history of an appointment (all versions)
     */
    findHistory: (businessKey: string) =>
      Effect.tryPromise(async () => {
        const records = await prisma.prePlanningAppointment.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        if (records.length === 0) {
          throw new AppointmentNotFoundError(
            `No appointment history found: ${businessKey}`
          );
        }

        return records.map(toDomain);
      }).pipe(
        Effect.catch((error) =>
          error instanceof AppointmentNotFoundError
            ? error
            : new RepositoryError(
                `Failed to find appointment history: ${businessKey}`,
                error
              )
        )
      ),

    /**
     * Find all appointments for a director on a specific date
     */
    findByDirectorAndDate: (directorId: string, date: Date) =>
      Effect.tryPromise(async () => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const records = await prisma.prePlanningAppointment.findMany({
          where: {
            directorId,
            appointmentDate: {
              gte: dayStart,
              lte: dayEnd,
            },
            isCurrent: true,
          },
          orderBy: { startTime: 'asc' },
        });

        return records.map(toDomain);
      }).pipe(
        Effect.catch((error) =>
          new RepositoryError(
            `Failed to find appointments for director ${directorId} on ${date.toDateString()}`,
            error
          )
        )
      ),

    /**
     * Find all appointments for a director in a date range
     */
    findByDirectorInRange: (
      directorId: string,
      startDate: Date,
      endDate: Date
    ) =>
      Effect.tryPromise(async () => {
        const rangeStart = new Date(startDate);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(endDate);
        rangeEnd.setHours(23, 59, 59, 999);

        const records = await prisma.prePlanningAppointment.findMany({
          where: {
            directorId,
            appointmentDate: {
              gte: rangeStart,
              lte: rangeEnd,
            },
            isCurrent: true,
          },
          orderBy: { startTime: 'asc' },
        });

        return records.map(toDomain);
      }).pipe(
        Effect.catch((error) =>
          new RepositoryError(
            `Failed to find appointments for director ${directorId} in range`,
            error
          )
        )
      ),

    /**
     * Find appointments by family email
     */
    findByFamilyEmail: (email: string) =>
      Effect.tryPromise(async () => {
        const records = await prisma.prePlanningAppointment.findMany({
          where: {
            familyEmail: email,
            isCurrent: true,
          },
          orderBy: { startTime: 'desc' },
        });

        return records.map(toDomain);
      }).pipe(
        Effect.catch((error) =>
          new RepositoryError(
            `Failed to find appointments by email: ${email}`,
            error
          )
        )
      ),

    /**
     * Find all upcoming appointments that need reminders
     * (within 1-36 hours and reminder not yet sent)
     */
    findAppointmentsNeedingReminders: () =>
      Effect.tryPromise(async () => {
        const now = new Date();
        const inOneHour = new Date(now.getTime() + 1 * 60 * 60 * 1000);
        const in36Hours = new Date(now.getTime() + 36 * 60 * 60 * 1000);

        const records = await prisma.prePlanningAppointment.findMany({
          where: {
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            startTime: {
              gte: inOneHour,
              lte: in36Hours,
            },
            reminderEmailSent: false,
            isCurrent: true,
          },
          orderBy: { startTime: 'asc' },
        });

        return records.map(toDomain);
      }).pipe(
        Effect.catch((error) =>
          new RepositoryError(
            'Failed to find appointments needing reminders',
            error
          )
        )
      ),

    /**
     * Find appointments by status
     */
    findByStatus: (status: string) =>
      Effect.tryPromise(async () => {
        const records = await prisma.prePlanningAppointment.findMany({
          where: {
            status: status as any,
            isCurrent: true,
          },
          orderBy: { startTime: 'desc' },
        });

        return records.map(toDomain);
      }).pipe(
        Effect.catch((error) =>
          new RepositoryError(
            `Failed to find appointments by status: ${status}`,
            error
          )
        )
      ),

    /**
     * Save new appointment (creates version 1)
     */
    save: (appointment: PrePlanningAppointment) =>
      Effect.tryPromise(async () => {
        await prisma.prePlanningAppointment.create({
          data: {
            id: appointment.id,
            businessKey: appointment.businessKey,
            version: appointment.version,
            validFrom: appointment.createdAt,
            validTo: null,
            isCurrent: true,
            funeralHomeId: appointment.directorId, // Use directorId as funeralHomeId for now
            directorId: appointment.directorId,
            directorName: appointment.directorName,
            familyName: appointment.familyName,
            familyEmail: appointment.familyEmail,
            familyPhone: appointment.familyPhone,
            appointmentDate: appointment.appointmentDate,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            duration: appointment.duration,
            notes: appointment.notes,
            status: appointment.status as any,
            reminderEmailSent: appointment.reminderEmailSent,
            reminderSmsSent: appointment.reminderSmsSent,
            completedAt: appointment.completedAt,
            cancelledAt: appointment.cancelledAt,
            cancelReason: appointment.cancelReason,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
            createdBy: appointment.createdBy,
          },
        });
      }).pipe(
        Effect.catch((error) =>
          new RepositoryError('Failed to save appointment', error)
        )
      ),

    /**
     * Update appointment (creates new version in SCD2 pattern)
     */
    update: (appointment: PrePlanningAppointment) =>
      Effect.tryPromise(async () => {
        // Mark old version as expired
        await prisma.prePlanningAppointment.updateMany({
          where: {
            businessKey: appointment.businessKey,
            isCurrent: true,
          },
          data: {
            validTo: new Date(),
            isCurrent: false,
          },
        });

        // Insert new version
        await prisma.prePlanningAppointment.create({
          data: {
            id: appointment.id,
            businessKey: appointment.businessKey,
            version: appointment.version,
            validFrom: appointment.updatedAt,
            validTo: null,
            isCurrent: true,
            funeralHomeId: appointment.directorId, // Use directorId as funeralHomeId for now
            directorId: appointment.directorId,
            directorName: appointment.directorName,
            familyName: appointment.familyName,
            familyEmail: appointment.familyEmail,
            familyPhone: appointment.familyPhone,
            appointmentDate: appointment.appointmentDate,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            duration: appointment.duration,
            notes: appointment.notes,
            status: appointment.status as any,
            reminderEmailSent: appointment.reminderEmailSent,
            reminderSmsSent: appointment.reminderSmsSent,
            completedAt: appointment.completedAt,
            cancelledAt: appointment.cancelledAt,
            cancelReason: appointment.cancelReason,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
            createdBy: appointment.createdBy,
          },
        });
      }).pipe(
        Effect.catch((error) =>
          new RepositoryError('Failed to update appointment', error)
        )
      ),

    /**
     * Delete appointment (marks as deleted via SCD2 validTo)
     */
    delete: (businessKey: string) =>
      Effect.tryPromise(async () => {
        const current = await prisma.prePlanningAppointment.findFirst({
          where: {
            businessKey,
            isCurrent: true,
          },
        });

        if (!current) {
          throw new AppointmentNotFoundError(
            `Appointment not found for deletion: ${businessKey}`
          );
        }

        await prisma.prePlanningAppointment.updateMany({
          where: {
            businessKey,
            isCurrent: true,
          },
          data: {
            validTo: new Date(),
            isCurrent: false,
          },
        });
      }).pipe(
        Effect.catch((error) =>
          error instanceof AppointmentNotFoundError
            ? error
            : new RepositoryError('Failed to delete appointment', error)
        )
      ),
};

/**
 * Convert Prisma record to domain entity
 */
function toDomain(record: any): PrePlanningAppointment {
  return new PrePlanningAppointment({
    id: record.id as AppointmentId,
    businessKey: record.businessKey,
    version: record.version,
    directorId: record.directorId,
    directorName: record.directorName,
    familyName: record.familyName,
    familyEmail: record.familyEmail,
    familyPhone: record.familyPhone,
    appointmentDate: record.appointmentDate,
    startTime: record.startTime,
    endTime: record.endTime,
    duration: record.duration,
    notes: record.notes,
    status: record.status,
    reminderEmailSent: record.reminderEmailSent,
    reminderSmsSent: record.reminderSmsSent,
    completedAt: record.completedAt,
    cancelledAt: record.cancelledAt,
    cancelReason: record.cancelReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
  });
}
