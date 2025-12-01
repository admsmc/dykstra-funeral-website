import { Effect, Context } from 'effect';
import { DriverAssignment, AssignmentId } from '@dykstra/domain';

/**
 * Repository error - general persistence failure
 */
export class DriverAssignmentRepositoryError extends Error {
  readonly _tag = 'DriverAssignmentRepositoryError' as const;
  constructor(
    override readonly message: string,
    override readonly cause?: unknown
  ) {
    super(message);
  }
}

/**
 * Not found error - entity doesn't exist
 */
export class DriverAssignmentNotFoundError extends Error {
  readonly _tag = 'DriverAssignmentNotFoundError' as const;
  constructor(
    override readonly message: string,
    public readonly entityId?: string
  ) {
    super(message);
  }
}

/**
 * Conflict error - constraint violation (e.g., duplicate)
 */
export class DriverAssignmentConflictError extends Error {
  readonly _tag = 'DriverAssignmentConflictError' as const;
  constructor(
    override readonly message: string,
    public readonly reason?: string
  ) {
    super(message);
  }
}

// Note: Not exporting generic RepositoryError/NotFoundError/ConflictError names
// to avoid conflicts with pre-planning-appointment-repository.
// Use the fully-qualified names or import from this module specifically if needed.

/**
 * DriverAssignmentRepository Service Interface
 *
 * Provides persistence operations for driver assignments.
 * Uses temporal tracking (SCD2) for complete audit history.
 *
 * All methods return Effect for proper error handling and dependency injection.
 */
export interface DriverAssignmentRepositoryService {
  /**
   * Save new assignment (creates new record)
   */
  save(
    assignment: DriverAssignment
  ): Effect.Effect<void, DriverAssignmentRepositoryError, never>;

  /**
   * Find assignment by ID (current version only)
   */
  findById(
    id: AssignmentId
  ): Effect.Effect<DriverAssignment, DriverAssignmentNotFoundError | DriverAssignmentRepositoryError, never>;

  /**
   * Find all assignments for a driver on a specific date
   */
  findByDriverId(
    driverId: string,
    date: Date
  ): Effect.Effect<DriverAssignment[], DriverAssignmentRepositoryError, never>;

  /**
   * Find all assignments for a vehicle on a specific date
   */
  findByVehicleId(
    vehicleId: string,
    date: Date
  ): Effect.Effect<DriverAssignment[], DriverAssignmentRepositoryError, never>;

  /**
   * Find all assignments with specific status
   */
  findByStatus(
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  ): Effect.Effect<DriverAssignment[], DriverAssignmentRepositoryError, never>;

  /**
   * Find assignments by funeral home and date range
   */
  findByFuneralHomeAndDateRange(
    funeralHomeId: string,
    startDate: Date,
    endDate: Date
  ): Effect.Effect<DriverAssignment[], DriverAssignmentRepositoryError, never>;

  /**
   * Update existing assignment (creates new version in SCD2 pattern)
   */
  update(
    assignment: DriverAssignment
  ): Effect.Effect<void, DriverAssignmentNotFoundError | DriverAssignmentRepositoryError, never>;

  /**
   * Delete assignment (marks as deleted via SCD2 validTo)
   */
  delete(
    id: AssignmentId
  ): Effect.Effect<void, DriverAssignmentNotFoundError | DriverAssignmentRepositoryError, never>;

  /**
   * Get complete version history of an assignment
   */
  findHistory(
    businessKey: string
  ): Effect.Effect<DriverAssignment[], DriverAssignmentNotFoundError | DriverAssignmentRepositoryError, never>;
}

/**
 * Context tag for dependency injection
 */
export const DriverAssignmentRepository =
  Context.GenericTag<DriverAssignmentRepositoryService>(
    '@dykstra/DriverAssignmentRepository'
  );