import { Effect, Context } from 'effect';

/**
 * Insurance error
 */
export class InsuranceError extends Error {
  readonly _tag = 'InsuranceError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * Insurance assignment result
 */
export interface InsuranceAssignmentResult {
  readonly insuranceAssignmentId: string;
  readonly status: string;
}

/**
 * Insurance Port
 * Abstraction for insurance assignment operations
 */
export interface InsurancePort {
  /**
   * Create an insurance assignment
   */
  readonly createAssignment: (params: {
    caseId: string;
    insuranceCompany: string;
    policyNumber: string;
    policyHolderName: string;
    assignedAmount: number;
    claimNumber?: string;
    notes?: string;
    userId: string;
  }) => Effect.Effect<InsuranceAssignmentResult, InsuranceError>;

  /**
   * Update insurance assignment status
   */
  readonly updateStatus: (params: {
    assignmentId: string;
    status: string;
    notes?: string;
  }) => Effect.Effect<void, InsuranceError>;

  /**
   * Get insurance assignment details
   */
  readonly getAssignment: (
    assignmentId: string
  ) => Effect.Effect<{
    id: string;
    caseId: string;
    insuranceCompany: string;
    policyNumber: string;
    assignedAmount: number;
    status: string;
  }, InsuranceError>;
}

/**
 * Insurance Port service tag for dependency injection
 */
export const InsurancePort = Context.GenericTag<InsurancePort>('@dykstra/InsurancePort');
