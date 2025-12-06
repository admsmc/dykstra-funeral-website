import { Effect } from 'effect';
import {
  DriverAssignment,
  type DriverId,
  type AssignmentId,
  type Location,
} from '@dykstra/domain';
import type { DriverAssignmentRepositoryService } from '@dykstra/application';
import {
  DriverAssignmentNotFoundError,
  DriverAssignmentRepositoryError,
} from '@dykstra/application';
import { prisma } from '../../database/prisma-client';

/**
 * Map Prisma record to domain object
 */
function mapToDomain(record: any): DriverAssignment {
  return new DriverAssignment({
    id: record.id as AssignmentId,
    businessKey: record.businessKey,
    version: record.version,
    funeralHomeId: record.funeralHomeId as any,
    driverId: record.driverId as DriverId,
    vehicleId: record.vehicleId,
    eventType: record.eventType.toLowerCase() as any,
    caseId: record.caseId as any,
    pickupLocation: record.pickupLocation as Location,
    dropoffLocation: record.dropoffLocation as Location,
    scheduledTime: record.scheduledTime,
    estimatedDuration: record.estimatedDuration,
    actualDuration: record.actualDuration,
    status: record.status.toLowerCase() as any,
    mileageStart: record.mileageStart,
    mileageEnd: record.mileageEnd,
    mileageAllowance: record.mileageAllowance,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
  });
}

/**
 * DriverAssignmentRepository Implementation
 *
 * Object-based adapter (NOT class-based) implementing DriverAssignmentRepositoryService.
 * Implements persistence for driver assignments using SCD2 temporal pattern.
 * - All creates/updates generate new version records
 * - Current version tracked with isCurrent flag
 * - Complete audit trail maintained via businessKey + version
 */
export const DriverAssignmentRepository: DriverAssignmentRepositoryService = {

  /**
   * Save new driver assignment (creates initial version)
   */
  save: (assignment: DriverAssignment) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.driverAssignment.create({
          data: {
            id: assignment.id,
            businessKey: assignment.businessKey,
            version: 1,
            validFrom: assignment.createdAt,
            isCurrent: true,
            funeralHomeId: assignment.funeralHomeId,
            driverId: assignment.driverId,
            vehicleId: assignment.vehicleId,
            eventType: assignment.eventType.toUpperCase() as any,
            caseId: assignment.caseId,
            pickupLocation: assignment.pickupLocation as any,
            dropoffLocation: assignment.dropoffLocation as any,
            scheduledTime: assignment.scheduledTime,
            estimatedDuration: assignment.estimatedDuration,
            status: 'PENDING',
            createdBy: assignment.createdBy,
            updatedBy: assignment.createdBy,
          },
        });
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to save driver assignment: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find assignment by ID (current version only)
   */
  findById: (id: AssignmentId) =>
    Effect.tryPromise({
      try: async () => {
        const record = await prisma.driverAssignment.findUnique({
          where: { id },
        });

        if (!record || !record.isCurrent) {
          throw new DriverAssignmentNotFoundError(`Assignment not found: ${id}`, id);
        }

        return mapToDomain(record);
      },
      catch: (error) => {
        if (error instanceof DriverAssignmentNotFoundError) return error;
        return new DriverAssignmentRepositoryError(
          `Failed to find assignment ${id}: ${(error as Error).message}`,
          error
        );
      },
    }),

  /**
   * Find all assignments for a driver
   */
  findByDriverId: (driverId: string, _date: Date) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.driverAssignment.findMany({
          where: {
            driverId,
            isCurrent: true,
          },
          orderBy: { scheduledTime: 'asc' },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to find assignments for driver ${driverId}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find all assignments for a vehicle
   */
  findByVehicleId: (vehicleId: string, _date: Date) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.driverAssignment.findMany({
          where: {
            vehicleId,
            isCurrent: true,
          },
          orderBy: { scheduledTime: 'asc' },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to find assignments for vehicle ${vehicleId}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find assignments by status
   */
  findByStatus: (status: string) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.driverAssignment.findMany({
          where: {
            status: status as any,
            isCurrent: true,
          },
          orderBy: { scheduledTime: 'asc' },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to find assignments by status ${status}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find assignments within date range for a funeral home
   */
  findByFuneralHomeAndDateRange: (funeralHomeId: string, startDate: Date, endDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.driverAssignment.findMany({
          where: {
            funeralHomeId,
            scheduledTime: {
              gte: startDate,
              lte: endDate,
            },
            isCurrent: true,
          },
          orderBy: { scheduledTime: 'asc' },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to find assignments for funeral home ${funeralHomeId}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Update assignment (creates new version per SCD2)
   */
  update: (assignment: DriverAssignment) =>
    Effect.tryPromise({
      try: async () => {
        // Check if current version exists
        const current = await prisma.driverAssignment.findFirst({
          where: {
            businessKey: assignment.businessKey,
            isCurrent: true,
          },
        });

        if (!current) {
          throw new DriverAssignmentNotFoundError(
            `Cannot update non-existent assignment: ${assignment.businessKey}`,
            assignment.businessKey
          );
        }

        // Invalidate current version
        await prisma.driverAssignment.update({
          where: { id: current.id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        // Create new version
        await prisma.driverAssignment.create({
          data: {
            id: assignment.id,
            businessKey: assignment.businessKey,
            version: current.version + 1,
            validFrom: new Date(),
            isCurrent: true,
            funeralHomeId: assignment.funeralHomeId,
            driverId: assignment.driverId,
            vehicleId: assignment.vehicleId,
            eventType: assignment.eventType.toUpperCase() as any,
            caseId: assignment.caseId,
            pickupLocation: assignment.pickupLocation as any,
            dropoffLocation: assignment.dropoffLocation as any,
            scheduledTime: assignment.scheduledTime,
            estimatedDuration: assignment.estimatedDuration,
            actualDuration: assignment.actualDuration,
            status: assignment.status as any,
            mileageStart: assignment.mileageStart,
            mileageEnd: assignment.mileageEnd,
            mileageAllowance: assignment.mileageAllowance,
            notes: assignment.notes,
            createdBy: current.createdBy,
            updatedBy: assignment.createdBy,
          },
        });
      },
      catch: (error) => {
        if (error instanceof DriverAssignmentNotFoundError) return error;
        return new DriverAssignmentRepositoryError(
          `Failed to update assignment: ${(error as Error).message}`,
          error
        );
      },
    }),

  /**
   * Delete assignment (marks as deleted via status, doesn't actually delete)
   */
  delete: (id: AssignmentId) =>
    Effect.tryPromise({
      try: async () => {
        const current = await prisma.driverAssignment.findUnique({
          where: { id },
        });

        if (!current || !current.isCurrent) {
          throw new DriverAssignmentNotFoundError(
            `Assignment not found: ${id}`,
            id
          );
        }

        // Soft delete: mark as cancelled
        await prisma.driverAssignment.update({
          where: { id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        // Create cancelled version
        await prisma.driverAssignment.create({
          data: {
            businessKey: current.businessKey,
            version: current.version + 1,
            validFrom: new Date(),
            isCurrent: true,
            funeralHomeId: current.funeralHomeId,
            driverId: current.driverId,
            vehicleId: current.vehicleId,
            eventType: current.eventType,
            caseId: current.caseId,
            pickupLocation: current.pickupLocation as any,
            dropoffLocation: current.dropoffLocation as any,
            scheduledTime: current.scheduledTime,
            estimatedDuration: current.estimatedDuration,
            actualDuration: current.actualDuration,
            status: 'CANCELLED',
            mileageStart: current.mileageStart,
            mileageEnd: current.mileageEnd,
            mileageAllowance: current.mileageAllowance,
            notes: current.notes,
            createdBy: current.createdBy,
            updatedBy: current.updatedBy,
          },
        });
      },
      catch: (error) => {
        if (error instanceof DriverAssignmentNotFoundError) return error;
        return new DriverAssignmentRepositoryError(
          `Failed to delete assignment ${id}: ${(error as Error).message}`,
          error
        );
      },
    }),

  /**
   * Get complete version history for an assignment
   */
  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.driverAssignment.findMany({
          where: { businessKey },
          orderBy: [{ version: 'asc' }],
        });

        if (records.length === 0) {
          throw new DriverAssignmentNotFoundError(
            `No history found for assignment: ${businessKey}`,
            businessKey
          );
        }

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) => {
        if (error instanceof DriverAssignmentNotFoundError) return error;
        return new DriverAssignmentRepositoryError(
          `Failed to find assignment history: ${(error as Error).message}`,
          error
        );
      },
    }),
};
