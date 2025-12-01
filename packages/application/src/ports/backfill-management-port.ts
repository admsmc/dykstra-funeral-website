/**
 * Backfill Management Repository Port
 * Defines the persistence abstraction for backfill assignment operations
 * Implementation agnostic - database details handled by infrastructure layer
 */

import { Context, Effect } from 'effect';
import type {
  BackfillAssignment,
  BackfillAssignmentId,
} from '@dykstra/domain';

/**
 * Query filters for backfill assignments
 */
export interface BackfillAssignmentFilters {
  readonly funeralHomeId: string;
  readonly absenceId?: string;
  readonly backfillEmployeeId?: string;
  readonly status?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Query result for backfill assignments with metadata
 */
export interface BackfillAssignmentQueryResult {
  readonly items: BackfillAssignment[];
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * Employee backfill candidacy
 */
export interface BackfillCandidate {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly role: string;
  readonly currentlyAvailable: boolean;
  readonly skillsMatch: boolean;
  readonly levelMatch: boolean;
  readonly recentBackfills: number;
  readonly preferenceRank: number;
}

/**
 * Backfill coverage summary for an absence
 */
export interface BackfillCoverageSummary {
  readonly absenceId: string;
  readonly absenceEmployeeName: string;
  readonly absenceEmployeeRole: string;
  readonly absenceStartDate: Date;
  readonly absenceEndDate: Date;
  readonly totalBackfillsNeeded: number;
  readonly confirmedBackfills: number;
  readonly pendingBackfills: number;
  readonly rejectedBackfills: number;
  readonly coverageComplete: boolean;
  readonly estimatedCost: number;
  readonly actualCost?: number;
}

/**
 * Backfill employee workload
 */
export interface BackfillEmployeeWorkload {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly confirmedBackfills: number;
  readonly pendingBackfillRequests: number;
  readonly estimatedHoursThisMonth: number;
  readonly estimatedCostThisMonth: number;
  readonly maxCapacityReached: boolean;
  readonly availableDates: Array<{ startDate: Date; endDate: Date }>;
}

/**
 * Backfill Management Repository Port Service
 */
export interface BackfillManagementPortService {
  /**
   * Create a new backfill assignment
   */
  createBackfillAssignment(
    assignment: BackfillAssignment,
    createdBy: string
  ): Effect.Effect<BackfillAssignment, Error>;

  /**
   * Get a specific backfill assignment
   */
  getBackfillAssignment(
    id: BackfillAssignmentId
  ): Effect.Effect<BackfillAssignment | null, Error>;

  /**
   * Get backfill assignments matching filters
   */
  getBackfillAssignments(
    filters: BackfillAssignmentFilters
  ): Effect.Effect<BackfillAssignmentQueryResult, Error>;

  /**
   * Get all backfill assignments for a specific absence
   */
  getBackfillAssignmentsByAbsence(
    absenceId: string
  ): Effect.Effect<BackfillAssignment[], Error>;

  /**
   * Get pending backfill assignments for an employee
   */
  getPendingBackfillAssignmentsForEmployee(
    funeralHomeId: string,
    employeeId: string
  ): Effect.Effect<BackfillAssignment[], Error>;

  /**
   * Get confirmed backfill assignments for an employee
   */
  getConfirmedBackfillAssignmentsForEmployee(
    funeralHomeId: string,
    employeeId: string,
    startDate?: Date,
    endDate?: Date
  ): Effect.Effect<BackfillAssignment[], Error>;

  /**
   * Update backfill assignment status
   */
  updateBackfillAssignment(
    id: BackfillAssignmentId,
    assignment: BackfillAssignment
  ): Effect.Effect<BackfillAssignment, Error>;

  /**
   * Get backfill candidates for an absence
   */
  getBackfillCandidates(
    funeralHomeId: string,
    absenceEmployeeRole: string,
    absenceStartDate: Date,
    absenceEndDate: Date
  ): Effect.Effect<BackfillCandidate[], Error>;

  /**
   * Get backfill coverage summary for an absence
   */
  getBackfillCoverageSummary(
    absenceId: string
  ): Effect.Effect<BackfillCoverageSummary, Error>;

  /**
   * Get backfill workload for an employee
   */
  getBackfillEmployeeWorkload(
    funeralHomeId: string,
    employeeId: string
  ): Effect.Effect<BackfillEmployeeWorkload, Error>;

  /**
   * Get workload for multiple backfill employees
   */
  getBackfillEmployeeWorkloads(
    funeralHomeId: string,
    employeeIds?: string[]
  ): Effect.Effect<BackfillEmployeeWorkload[], Error>;

  /**
   * Check if backfill employee has conflicting assignments
   */
  hasConflictingBackfills(
    funeralHomeId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Effect.Effect<boolean, Error>;

  /**
   * Get backfill assignments that need confirmation
   */
  getBackfillsAwaitingConfirmation(
    funeralHomeId: string
  ): Effect.Effect<BackfillAssignment[], Error>;

  /**
   * Get backfill premium pay calculations for date range
   */
  getBackfillPremiumPaySummary(
    funeralHomeId: string,
    startDate: Date,
    endDate: Date
  ): Effect.Effect<
    Array<{
      employeeId: string;
      employeeName: string;
      totalPremiumPay: number;
      assignments: Array<{
        absenceEmployeeName: string;
        hours: number;
        premiumType: string;
        cost: number;
      }>;
    }>,
    Error
  >;

  /**
   * Delete a backfill assignment (only for suggested/rejected/cancelled)
   */
  deleteBackfillAssignment(id: BackfillAssignmentId): Effect.Effect<void, Error>;
}

/**
 * Context tag for Backfill Management port
 */
export const BackfillManagementPort = Context.GenericTag<BackfillManagementPortService>(
  '@dykstra/BackfillManagementPort'
);
