import { Effect } from 'effect';
import { Vehicle, type VehicleId, type VehicleStatus } from '@dykstra/domain';
import type { VehicleRepositoryService } from '@dykstra/application';
import { VehicleNotFoundError, VehicleRepositoryError } from '@dykstra/application';
import { prisma } from '../../database/prisma-client';

/**
 * Map Prisma record to domain object
 */
function mapToDomain(record: any): Vehicle {
  // Map Prisma schema fields to Domain model fields
  return new Vehicle({
    id: record.id as VehicleId,
    businessKey: record.businessKey,
    version: record.version,
    funeralHomeId: record.funeralHomeId,
    name: record.vehicleType, // Prisma 'vehicleType' → Domain 'name'
    licensePlate: record.licensePlate,
    vin: record.vin,
    year: record.year,
    make: record.make,
    model: record.model,
    capacity: 'standard' as any, // Prisma has Int, Domain has string enum - stub for now
    status: record.status.toLowerCase() as any,
    totalMileage: record.mileageCurrentTotal, // Prisma 'mileageCurrentTotal' → Domain 'totalMileage'
    lastMaintenanceDate: record.lastMaintenanceDate ?? undefined,
    inspectionDueDate: record.nextInspectionDate ?? undefined, // Prisma 'nextInspectionDate' → Domain 'inspectionDueDate'
    notes: record.notes ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
  });
}

/**
 * VehicleRepository Implementation
 *
 * Object-based adapter (NOT class-based) implementing VehicleRepositoryService.
 * Implements persistence for vehicle fleet management using SCD2 temporal pattern.
 * - All creates/updates generate new version records
 * - Current version tracked with isCurrent flag
 * - Complete audit trail maintained via businessKey + version
 * - Tracks maintenance and inspection schedules
 */
export const VehicleRepository: VehicleRepositoryService = {

  /**
   * Save new vehicle (creates initial version)
   */
  save: (vehicle: Vehicle) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.vehicle.create({
          data: {
            id: vehicle.id,
            businessKey: vehicle.businessKey,
            version: 1,
            validFrom: vehicle.createdAt,
            isCurrent: true,
            funeralHomeId: vehicle.funeralHomeId,
            vehicleType: vehicle.name, // Domain 'name' → Prisma 'vehicleType'
            licensePlate: vehicle.licensePlate,
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            color: 'unknown', // Prisma requires color, Domain doesn't have it
            capacity: 6, // Default capacity (Prisma Int, Domain string enum)
            status: vehicle.status.toUpperCase() as any,
            mileageCurrentTotal: vehicle.totalMileage, // Domain 'totalMileage' → Prisma 'mileageCurrentTotal'
            lastMaintenanceDate: vehicle.lastMaintenanceDate ?? null,
            nextMaintenanceDate: new Date(), // Stub: calculate based on lastMaintenanceDate
            lastInspectionDate: null,
            nextInspectionDate: vehicle.inspectionDueDate ?? new Date(), // Domain 'inspectionDueDate' → Prisma 'nextInspectionDate'
            acquisitionDate: vehicle.createdAt, // Use createdAt as acquisition date
            notes: vehicle.notes ?? null,
            createdBy: vehicle.createdBy,
            updatedBy: vehicle.createdBy,
          },
        });
      },
      catch: (error) =>
        new VehicleRepositoryError(
          `Failed to save vehicle: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find vehicle by ID (current version only)
   */
  findById: (id: VehicleId) =>
    Effect.tryPromise({
      try: async () => {
        const record = await prisma.vehicle.findUnique({
          where: { id },
        });

        if (!record || !record.isCurrent) {
          throw new VehicleNotFoundError(`Vehicle not found: ${id}`, id);
        }

        return mapToDomain(record);
      },
      catch: (error) => {
        if (error instanceof VehicleNotFoundError) return error;
        return new VehicleRepositoryError(
          `Failed to find vehicle ${id}: ${(error as Error).message}`,
          error
        );
      },
    }),

  /**
   * Find vehicle by license plate
   */
  findByLicensePlate: (licensePlate: string) =>
    Effect.tryPromise({
      try: async () => {
        const record = await prisma.vehicle.findUnique({
          where: { licensePlate },
        });

        if (!record || !record.isCurrent) return null;
        return mapToDomain(record);
      },
      catch: (error) =>
        new VehicleRepositoryError(
          `Failed to find vehicle by license plate ${licensePlate}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find vehicle by VIN
   */
  findByVin: (vin: string) =>
    Effect.tryPromise({
      try: async () => {
        const record = await prisma.vehicle.findUnique({
          where: { vin },
        });

        if (!record || !record.isCurrent) return null;
        return mapToDomain(record);
      },
      catch: (error) =>
        new VehicleRepositoryError(
          `Failed to find vehicle by VIN ${vin}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find all vehicles for a funeral home
   */
  findByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.vehicle.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
          },
          orderBy: { vehicleType: 'asc' },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new VehicleRepositoryError(
          `Failed to find vehicles for funeral home ${funeralHomeId}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find available vehicles (status='available' AND has current inspection)
   */
  findAvailable: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.vehicle.findMany({
          where: {
            funeralHomeId,
            status: 'AVAILABLE',
            isCurrent: true,
            nextInspectionDate: {
              gte: new Date(),
            },
          },
          orderBy: { vehicleType: 'asc' },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new VehicleRepositoryError(
          `Failed to find available vehicles for funeral home ${funeralHomeId}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find vehicles by status
   */
  findByStatus: (funeralHomeId: string, status: VehicleStatus) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.vehicle.findMany({
          where: {
            funeralHomeId,
            status: status as any,
            isCurrent: true,
          },
          orderBy: { vehicleType: 'asc' },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new VehicleRepositoryError(
          `Failed to find vehicles by status ${status}: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find vehicles with expired inspections
   */
  findWithExpiredInspections: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.vehicle.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            nextInspectionDate: {
              lt: new Date(),
            },
          },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new VehicleRepositoryError(
          `Failed to find vehicles with expired inspections: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Find vehicles due for maintenance
   */
  findDueForMaintenance: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.vehicle.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            nextMaintenanceDate: {
              lte: new Date(),
            },
          },
        });

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) =>
        new VehicleRepositoryError(
          `Failed to find vehicles due for maintenance: ${(error as Error).message}`,
          error
        ),
    }),

  /**
   * Update vehicle (creates new version per SCD2)
   */
  update: (vehicle: Vehicle) =>
    Effect.tryPromise({
      try: async () => {
        // Check if current version exists
        const current = await prisma.vehicle.findFirst({
          where: {
            businessKey: vehicle.businessKey,
            isCurrent: true,
          },
        });

        if (!current) {
          throw new VehicleNotFoundError(
            `Cannot update non-existent vehicle: ${vehicle.businessKey}`,
            vehicle.businessKey
          );
        }

        // Invalidate current version
        await prisma.vehicle.update({
          where: { id: current.id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        // Create new version
        await prisma.vehicle.create({
          data: {
            id: vehicle.id,
            businessKey: vehicle.businessKey,
            version: current.version + 1,
            validFrom: new Date(),
            isCurrent: true,
            funeralHomeId: vehicle.funeralHomeId,
            vehicleType: vehicle.name, // Domain 'name' → Prisma 'vehicleType'
            licensePlate: vehicle.licensePlate,
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            color: current.color, // Preserve existing color from Prisma
            capacity: current.capacity, // Preserve existing capacity from Prisma
            status: vehicle.status.toUpperCase() as any,
            mileageCurrentTotal: vehicle.totalMileage, // Domain 'totalMileage' → Prisma 'mileageCurrentTotal'
            lastMaintenanceDate: vehicle.lastMaintenanceDate ?? current.lastMaintenanceDate,
            nextMaintenanceDate: current.nextMaintenanceDate, // Preserve existing
            lastInspectionDate: current.lastInspectionDate, // Preserve existing
            nextInspectionDate: vehicle.inspectionDueDate ?? current.nextInspectionDate, // Domain 'inspectionDueDate' → Prisma 'nextInspectionDate'
            acquisitionDate: current.acquisitionDate, // Preserve existing
            retirementDate: current.retirementDate ?? null, // Preserve existing
            notes: vehicle.notes ?? current.notes,
            createdBy: current.createdBy,
            updatedBy: vehicle.createdBy,
          },
        });
      },
      catch: (error) => {
        if (error instanceof VehicleNotFoundError) return error;
        return new VehicleRepositoryError(
          `Failed to update vehicle: ${(error as Error).message}`,
          error
        );
      },
    }),

  /**
   * Update vehicle status only (without full update)
   */
  updateStatus: (id: VehicleId, status: VehicleStatus) =>
    Effect.tryPromise({
      try: async () => {
        const current = await prisma.vehicle.findUnique({
          where: { id },
        });

        if (!current || !current.isCurrent) {
          throw new VehicleNotFoundError(`Vehicle not found: ${id}`, id);
        }

        // Create new version with updated status
        await prisma.vehicle.update({
          where: { id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        await prisma.vehicle.create({
          data: {
            ...current,
            id: `${id}_v${current.version + 1}`,
            version: current.version + 1,
            validFrom: new Date(),
            status: status as any,
            updatedBy: current.updatedBy,
          },
        });
      },
      catch: (error) => {
        if (error instanceof VehicleNotFoundError) return error;
        return new VehicleRepositoryError(
          `Failed to update vehicle status: ${(error as Error).message}`,
          error
        );
      },
    }),

  /**
   * Increment vehicle mileage (when assignment completes)
   */
  addMileage: (id: VehicleId, miles: number) =>
    Effect.tryPromise({
      try: async () => {
        const current = await prisma.vehicle.findUnique({
          where: { id },
        });

        if (!current || !current.isCurrent) {
          throw new VehicleNotFoundError(`Vehicle not found: ${id}`, id);
        }

        // Create new version with updated mileage
        await prisma.vehicle.update({
          where: { id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        await prisma.vehicle.create({
          data: {
            ...current,
            id: `${id}_mileage_${Date.now()}`,
            version: current.version + 1,
            validFrom: new Date(),
            mileageCurrentTotal: current.mileageCurrentTotal + miles,
            updatedBy: current.updatedBy,
          },
        });
      },
      catch: (error) => {
        if (error instanceof VehicleNotFoundError) return error;
        return new VehicleRepositoryError(
          `Failed to add mileage to vehicle: ${(error as Error).message}`,
          error
        );
      },
    }),

  /**
   * Get complete version history of a vehicle
   */
  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const records = await prisma.vehicle.findMany({
          where: { businessKey },
          orderBy: [{ version: 'asc' }],
        });

        if (records.length === 0) {
          throw new VehicleNotFoundError(`No history found for vehicle: ${businessKey}`, businessKey);
        }

        return records.map((r) => mapToDomain(r));
      },
      catch: (error) => {
        if (error instanceof VehicleNotFoundError) return error;
        return new VehicleRepositoryError(
          `Failed to find vehicle history: ${(error as Error).message}`,
          error
        );
      },
    }),
};
