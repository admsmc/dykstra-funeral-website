/**
 * PTO Management Repository Port
 * Defines the persistence abstraction for PTO request operations
 * Implementation agnostic - database details handled by infrastructure layer
 */

import { Context, type Effect } from 'effect';
import type {
  PtoRequest,
  PtoRequestId,
  PtoPolicy,
  PtoPolicyId,
} from '@dykstra/domain';

/**
 * Query filters for PTO requests
 */
export interface PtoRequestFilters {
  readonly funeralHomeId: string;
  readonly employeeId?: string;
  readonly status?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Query result for PTO requests with metadata
 */
export interface PtoRequestQueryResult {
  readonly items: PtoRequest[];
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * Employee PTO balance summary
 */
export interface PtoBalance {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly annualAllowance: number;
  readonly daysUsed: number;
  readonly daysRemaining: number;
  readonly pendingRequests: number;
  readonly currentlyOnPto: boolean;
}

/**
 * PTO Summary for multiple employees
 */
export interface PtoSummary {
  readonly funeralHomeId: string;
  readonly employeesOnPto: number;
  readonly employeeOnPtoNames: string[];
  readonly pendingApprovals: number;
  readonly approvalDeadlines: Array<{ employeeName: string; deadline: Date }>;
}

/**
 * PTO Management Repository Port Service
 */
export interface PtoManagementPortService {
  /**
   * Create a new PTO policy for a funeral home
   */
  createPtoPolicy(
    funeralHomeId: string,
    policyData: Partial<PtoPolicy>,
    createdBy: string
  ): Effect.Effect<PtoPolicy, Error>;

  /**
   * Get current PTO policy for a funeral home
   */
  getPtoPolicyForFuneralHome(
    funeralHomeId: string
  ): Effect.Effect<PtoPolicy | null, Error>;

  /**
   * Update PTO policy (creates new version with SCD2)
   */
  updatePtoPolicy(
    policyId: PtoPolicyId,
    policyData: Partial<PtoPolicy>,
    updatedBy: string
  ): Effect.Effect<PtoPolicy, Error>;

  /**
   * Get policy history for audit trail
   */
  getPtoPolicyHistory(
    funeralHomeId: string
  ): Effect.Effect<PtoPolicy[], Error>;

  /**
   * Create a new PTO request
   */
  createPtoRequest(
    request: PtoRequest,
    createdBy: string
  ): Effect.Effect<PtoRequest, Error>;

  /**
   * Get a specific PTO request
   */
  getPtoRequest(id: PtoRequestId): Effect.Effect<PtoRequest | null, Error>;

  /**
   * Get PTO requests matching filters
   */
  getPtoRequests(filters: PtoRequestFilters): Effect.Effect<PtoRequestQueryResult, Error>;

  /**
   * Get all PTO requests for an employee
   */
  getPtoRequestsByEmployee(
    funeralHomeId: string,
    employeeId: string
  ): Effect.Effect<PtoRequest[], Error>;

  /**
   * Get pending PTO approvals for a funeral home
   */
  getPendingPtoApprovals(
    funeralHomeId: string
  ): Effect.Effect<PtoRequest[], Error>;

  /**
   * Update PTO request status
   */
  updatePtoRequest(
    id: PtoRequestId,
    request: PtoRequest
  ): Effect.Effect<PtoRequest, Error>;

  /**
   * Get PTO balance for an employee
   */
  getEmployeePtoBalance(
    funeralHomeId: string,
    employeeId: string
  ): Effect.Effect<PtoBalance, Error>;

  /**
   * Get PTO balances for multiple employees
   */
  getEmployeePtoBalances(
    funeralHomeId: string,
    employeeIds?: string[]
  ): Effect.Effect<PtoBalance[], Error>;

  /**
   * Get PTO summary for funeral home
   */
  getFuneralHomePtoSummary(
    funeralHomeId: string
  ): Effect.Effect<PtoSummary, Error>;

  /**
   * Get concurrent PTO requests for specific dates and roles
   */
  getConcurrentPtoRequests(
    funeralHomeId: string,
    startDate: Date,
    endDate: Date,
    role?: string
  ): Effect.Effect<PtoRequest[], Error>;

  /**
   * Delete a PTO request (only for draft requests)
   */
  deletePtoRequest(id: PtoRequestId): Effect.Effect<void, Error>;
}

/**
 * Context tag for PTO Management port
 */
export const PtoManagementPort = Context.GenericTag<PtoManagementPortService>(
  '@dykstra/PtoManagementPort'
);
