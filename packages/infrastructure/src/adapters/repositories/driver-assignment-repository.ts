import { Effect } from 'effect';
import { PrismaClient } from '@prisma/client';
import {
  DriverAssignment,
  DriverId,
  AssignmentId,
  Location,
} from '@dykstra/domain';
import type { DriverAssignmentRepositoryService } from '@dykstra/application';
import {
  DriverAssignmentNotFoundError,
  DriverAssignmentRepositoryError,
} from '@dykstra/application';

/**
 * DriverAssignmentRepository Implementation
 *
 * Implements persistence for driver assignments using SCD2 temporal pattern.
 * - All creates/updates generate new version records
 * - Current version tracked with isCurrent flag
 * - Complete audit trail maintained via businessKey + version
 */
export class DriverAssignmentRepositoryImpl implements DriverAssignmentRepositoryService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Save new driver assignment (creates initial version)
   */
  save(assignment: DriverAssignment): Effect.Effect<void, RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.prisma.driverAssignment.create({
          data: {
            id: assignment.id,
            businessKey: assignment.businessKey,
            version: 1,
            validFrom: assignment.createdAt,
            isCurrent: true,
            funeralHomeId: assignment.funeralHomeId,
            driverId: assignment.driverId,
            vehicleId: assignment.vehicleId,
            eventType: assignment.eventType,
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
    });
  }

  /**
   * Find assignment by ID (current version only)
   */
  findById(
    id: AssignmentId
  ): Effect.Effect<DriverAssignment, NotFoundError | RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        const record = await this.prisma.driverAssignment.findUnique({
          where: { id },
        });

        if (!record || !record.isCurrent) {
          throw new DriverAssignmentNotFoundError(`Assignment not found: ${id}`, id);
        }

        return this.mapToDomain(record);
      },
      catch: (error) => {
        if (error instanceof DriverAssignmentNotFoundError) return error;
        return new DriverAssignmentRepositoryError(
          `Failed to find assignment ${id}: ${(error as Error).message}`,
          error
        );
      },
    });
  }

  /**
   * Find all assignments for a driver
   */
  findByDriverId(
    driverId: string
  ): Effect.Effect<DriverAssignment[], RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.prisma.driverAssignment.findMany({
          where: {
            driverId,
            isCurrent: true,
          },
          orderBy: { scheduledTime: 'asc' },
        });

        return records.map((r) => this.mapToDomain(r));
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to find assignments for driver ${driverId}: ${(error as Error).message}`,
          error
        ),
    });
  }

  /**
   * Find all assignments for a vehicle
   */
  findByVehicleId(
    vehicleId: string
  ): Effect.Effect<DriverAssignment[], RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.prisma.driverAssignment.findMany({
          where: {
            vehicleId,
            isCurrent: true,
          },
          orderBy: { scheduledTime: 'asc' },
        });

        return records.map((r) => this.mapToDomain(r));
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to find assignments for vehicle ${vehicleId}: ${(error as Error).message}`,
          error
        ),
    });
  }

  /**
   * Find assignments by status
   */
  findByStatus(
    status: string
  ): Effect.Effect<DriverAssignment[], RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.prisma.driverAssignment.findMany({
          where: {
            status: status as any,
            isCurrent: true,
          },
          orderBy: { scheduledTime: 'asc' },
        });

        return records.map((r) => this.mapToDomain(r));
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to find assignments by status ${status}: ${(error as Error).message}`,
          error
        ),
    });
  }

  /**
   * Find assignments within date range for a funeral home
   */
  findByFuneralHomeAndDateRange(
    funeralHomeId: string,
    startDate: Date,
    endDate: Date
  ): Effect.Effect<DriverAssignment[], RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.prisma.driverAssignment.findMany({
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

        return records.map((r) => this.mapToDomain(r));
      },
      catch: (error) =>
        new DriverAssignmentRepositoryError(
          `Failed to find assignments for funeral home ${funeralHomeId}: ${(error as Error).message}`,
          error
        ),
    });
  }

  /**
   * Update assignment (creates new version per SCD2)
   */
  update(
    assignment: DriverAssignment
  ): Effect.Effect<void, NotFoundError | RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        // Check if current version exists
        const current = await this.prisma.driverAssignment.findFirst({
          where: {
            businessKey: assignment.businessKey,
            isCurrent: true,
          },
        });

        if (!current) {
          throw new NotFoundError(
            `Cannot update non-existent assignment: ${assignment.businessKey}`
          );
        }

        // Invalidate current version
        await this.prisma.driverAssignment.update({
          where: { id: current.id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        // Create new version
        await this.prisma.driverAssignment.create({
          data: {
            id: assignment.id,
            businessKey: assignment.businessKey,
            version: current.version + 1,
            validFrom: new Date(),
            isCurrent: true,
            funeralHomeId: assignment.funeralHomeId,
            driverId: assignment.driverId,
            vehicleId: assignment.vehicleId,
            eventType: assignment.eventType,
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
        if (error instanceof NotFoundError) return error;
        return new RepositoryError(
          `Failed to update assignment: ${(error as Error).message}`,
          error
        );
      },
    });
  }

  /**
   * Delete assignment (marks as deleted via status, doesn't actually delete)
   */
  delete(id: AssignmentId): Effect.Effect<void, NotFoundError | RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        const current = await this.prisma.driverAssignment.findUnique({
          where: { id },
        });

        if (!current || !current.isCurrent) {
          throw new NotFoundError(`Assignment not found: ${id}`);
        }

        // Soft delete: mark as cancelled
        await this.prisma.driverAssignment.update({
          where: { id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        // Create cancelled version
        await this.prisma.driverAssignment.create({
          data: {
            ...current,
            id: `${id}_cancelled_${Date.now()}`,
            version: current.version + 1,
            validFrom: new Date(),
            status: 'CANCELLED' as any,
            updatedBy: current.updatedBy,
          },
        });
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new RepositoryError(
          `Failed to delete assignment ${id}: ${(error as Error).message}`,
          error
        );
      },
    });
  }

  /**
   * Get complete version history for an assignment
   */
  findHistory(
    businessKey: string
  ): Effect.Effect<DriverAssignment[], NotFoundError | RepositoryError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.prisma.driverAssignment.findMany({
          where: { businessKey },
          orderBy: [{ version: 'asc' }],
        });

        if (records.length === 0) {
          throw new NotFoundError(`No history found for assignment: ${businessKey}`);
        }

        return records.map((r) => this.mapToDomain(r));
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new RepositoryError(
          `Failed to find assignment history: ${(error as Error).message}`,
          error
        );
      },
    });
  }

  /**
   * Map Prisma record to domain object
   */
  private mapToDomain(record: any): DriverAssignment {
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
}
