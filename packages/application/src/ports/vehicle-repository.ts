import { Effect, Context } from 'effect';
import { Vehicle, VehicleId, VehicleStatus } from '@dykstra/domain';

/**
 * Repository error - general persistence failure
 */
export class VehicleRepositoryError extends Error {
  readonly _tag = 'VehicleRepositoryError' as const;
  constructor(
    override readonly message: string,
    override readonly cause?: unknown
  ) {
    super(message);
  }
}

/**
 * Not found error - vehicle doesn't exist
 */
export class VehicleNotFoundError extends Error {
  readonly _tag = 'VehicleNotFoundError' as const;
  constructor(
    override readonly message: string,
    public readonly vehicleId?: string
  ) {
    super(message);
  }
}

// Note: Not exporting generic RepositoryError/NotFoundError names
// to avoid conflicts with pre-planning-appointment-repository.
// Use the fully-qualified names or import from this module specifically if needed.

/**
 * VehicleRepository Service Interface
 *
 * Provides persistence operations for vehicle management.
 * Tracks maintenance schedules, inspection status, and operational state.
 * Uses temporal tracking (SCD2) for complete audit history.
 *
 * All methods return Effect for proper error handling and dependency injection.
 */
export interface VehicleRepositoryService {
  /**
   * Save new vehicle (creates new record)
   */
  save(vehicle: Vehicle): Effect.Effect<void, VehicleRepositoryError, never>;

  /**
   * Find vehicle by ID (current version only)
   */
  findById(
    id: VehicleId
  ): Effect.Effect<Vehicle, VehicleNotFoundError | VehicleRepositoryError, never>;

  /**
   * Find vehicle by license plate number
   */
  findByLicensePlate(
    licensePlate: string
  ): Effect.Effect<Vehicle | null, VehicleRepositoryError, never>;

  /**
   * Find vehicle by VIN
   */
  findByVin(
    vin: string
  ): Effect.Effect<Vehicle | null, VehicleRepositoryError, never>;

  /**
   * Find all vehicles for a funeral home
   */
  findByFuneralHome(
    funeralHomeId: string
  ): Effect.Effect<Vehicle[], VehicleRepositoryError, never>;

  /**
   * Find available vehicles for a funeral home
   * (status = 'available' AND has current inspection)
   */
  findAvailable(
    funeralHomeId: string
  ): Effect.Effect<Vehicle[], VehicleRepositoryError, never>;

  /**
   * Find vehicles by status
   */
  findByStatus(
    funeralHomeId: string,
    status: VehicleStatus
  ): Effect.Effect<Vehicle[], VehicleRepositoryError, never>;

  /**
   * Find vehicles with expired inspections
   */
  findWithExpiredInspections(
    funeralHomeId: string
  ): Effect.Effect<Vehicle[], VehicleRepositoryError, never>;

  /**
   * Find vehicles due for maintenance
   */
  findDueForMaintenance(
    funeralHomeId: string
  ): Effect.Effect<Vehicle[], VehicleRepositoryError, never>;

  /**
   * Update existing vehicle (creates new version in SCD2 pattern)
   */
  update(vehicle: Vehicle): Effect.Effect<void, VehicleNotFoundError | VehicleRepositoryError, never>;

  /**
   * Update vehicle status only (without full update)
   */
  updateStatus(
    id: VehicleId,
    status: VehicleStatus
  ): Effect.Effect<void, VehicleNotFoundError | VehicleRepositoryError, never>;

  /**
   * Increment vehicle mileage (when assignment completes)
   */
  addMileage(
    id: VehicleId,
    miles: number
  ): Effect.Effect<void, VehicleNotFoundError | VehicleRepositoryError, never>;

  /**
   * Get complete version history of a vehicle
   */
  findHistory(
    businessKey: string
  ): Effect.Effect<Vehicle[], VehicleNotFoundError | VehicleRepositoryError, never>;
}

/**
 * Context tag for dependency injection
 */
export const VehicleRepository = Context.GenericTag<VehicleRepositoryService>(
  '@dykstra/VehicleRepository'
);