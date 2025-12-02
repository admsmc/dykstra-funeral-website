/**
 * Training Management Repository Port
 * Defines the persistence abstraction for training and certification operations
 * Implementation agnostic - database details handled by infrastructure layer
 */

import { Context, type Effect } from 'effect';
import type {
  TrainingRecord,
  TrainingRecordId,
  TrainingPolicy,
  TrainingPolicyId,
} from '@dykstra/domain';

/**
 * Query filters for training records
 */
export interface TrainingRecordFilters {
  readonly funeralHomeId: string;
  readonly employeeId?: string;
  readonly status?: string;
  readonly trainingType?: string;
  readonly completedAfter?: Date;
  readonly completedBefore?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Query result for training records with metadata
 */
export interface TrainingRecordQueryResult {
  readonly items: TrainingRecord[];
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * Employee certification status
 */
export interface EmployeeCertification {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly certificationId: string;
  readonly certificationName: string;
  readonly status: 'current' | 'expiring_soon' | 'expired' | 'missing';
  readonly certificationNumber?: string;
  readonly expiresAt?: Date;
  readonly daysUntilExpiry?: number;
  readonly renewalDue: boolean;
}

/**
 * Employee training summary
 */
export interface EmployeeTrainingSummary {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly role: string;
  readonly totalHoursUsedThisYear: number;
  readonly totalBudgetUsedThisYear: number;
  readonly certifications: EmployeeCertification[];
  readonly nextRequiredTraining?: {
    certificationId: string;
    certificationName: string;
    daysUntilDue: number;
  };
}

/**
 * Expiring certification alert
 */
export interface ExpiringCertification {
  readonly recordId: TrainingRecordId;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly certificationName: string;
  readonly expiresAt: Date;
  readonly daysUntilExpiry: number;
  readonly daysOverdue?: number;
  readonly requiresImmedateRenewal: boolean;
}

/**
 * Training Management Repository Port Service
 */
export interface TrainingManagementPortService {
  /**
   * Create a new training policy for a funeral home
   */
  createTrainingPolicy(
    funeralHomeId: string,
    policyData: Partial<TrainingPolicy>,
    createdBy: string
  ): Effect.Effect<TrainingPolicy, Error>;

  /**
   * Get current training policy for a funeral home
   */
  getTrainingPolicyForFuneralHome(
    funeralHomeId: string
  ): Effect.Effect<TrainingPolicy | null, Error>;

  /**
   * Update training policy (creates new version with SCD2)
   */
  updateTrainingPolicy(
    policyId: TrainingPolicyId,
    policyData: Partial<TrainingPolicy>,
    updatedBy: string
  ): Effect.Effect<TrainingPolicy, Error>;

  /**
   * Get policy history for audit trail
   */
  getTrainingPolicyHistory(
    funeralHomeId: string
  ): Effect.Effect<TrainingPolicy[], Error>;

  /**
   * Create a new training record
   */
  createTrainingRecord(
    record: TrainingRecord,
    createdBy: string
  ): Effect.Effect<TrainingRecord, Error>;

  /**
   * Get a specific training record
   */
  getTrainingRecord(id: TrainingRecordId): Effect.Effect<TrainingRecord | null, Error>;

  /**
   * Get training records matching filters
   */
  getTrainingRecords(
    filters: TrainingRecordFilters
  ): Effect.Effect<TrainingRecordQueryResult, Error>;

  /**
   * Get all training records for an employee
   */
  getTrainingRecordsByEmployee(
    funeralHomeId: string,
    employeeId: string
  ): Effect.Effect<TrainingRecord[], Error>;

  /**
   * Update training record (e.g., mark as completed)
   */
  updateTrainingRecord(
    id: TrainingRecordId,
    record: TrainingRecord
  ): Effect.Effect<TrainingRecord, Error>;

  /**
   * Get employee's current certifications
   */
  getEmployeeCertifications(
    funeralHomeId: string,
    employeeId: string
  ): Effect.Effect<EmployeeCertification[], Error>;

  /**
   * Get certifications expiring within days
   */
  getExpiringCertifications(
    funeralHomeId: string,
    withinDays: number
  ): Effect.Effect<ExpiringCertification[], Error>;

  /**
   * Get expired certifications
   */
  getExpiredCertifications(
    funeralHomeId: string
  ): Effect.Effect<ExpiringCertification[], Error>;

  /**
   * Get employee's training summary
   */
  getEmployeeTrainingSummary(
    funeralHomeId: string,
    employeeId: string
  ): Effect.Effect<EmployeeTrainingSummary, Error>;

  /**
   * Get training summaries for multiple employees
   */
  getEmployeeTrainingSummaries(
    funeralHomeId: string,
    employeeIds?: string[]
  ): Effect.Effect<EmployeeTrainingSummary[], Error>;

  /**
   * Get required training not completed for employees
   */
  getMissingRequiredTraining(
    funeralHomeId: string
  ): Effect.Effect<EmployeeTrainingSummary[], Error>;

  /**
   * Get multi-day trainings scheduled for specific dates
   */
  getMultiDayTrainingsScheduled(
    funeralHomeId: string,
    startDate: Date,
    endDate: Date
  ): Effect.Effect<TrainingRecord[], Error>;

  /**
   * Delete a training record (only for cancelled/scheduled records)
   */
  deleteTrainingRecord(id: TrainingRecordId): Effect.Effect<void, Error>;
}

/**
 * Context tag for Training Management port
 */
export const TrainingManagementPort = Context.GenericTag<TrainingManagementPortService>(
  '@dykstra/TrainingManagementPort'
);
