import { Effect } from "effect";
import { ValidationError } from "../errors";
import { InsurancePort, InsuranceError } from '../ports/insurance-port';

interface AssignInsuranceInput {
  caseId: string;
  insuranceCompany: string;
  policyNumber: string;
  policyHolderName: string;
  assignedAmount: number;
  claimNumber?: string;
  notes?: string;
  userId: string;
}

interface AssignInsuranceResult {
  success: boolean;
  insuranceAssignmentId: string;
  status: string;
}

/**
 * Assign insurance for payment
 * Creates an insurance claim record that can be tracked through approval process
 */
export const assignInsurance = ({
  caseId,
  insuranceCompany,
  policyNumber,
  policyHolderName,
  assignedAmount,
  claimNumber,
  notes,
  userId,
}: AssignInsuranceInput): Effect.Effect<
  AssignInsuranceResult,
  ValidationError | InsuranceError,
  InsurancePort
> =>
  Effect.gen(function* (_) {
    // Validate assigned amount
    if (assignedAmount <= 0) {
      return yield* _(
        Effect.fail(
          new ValidationError({ message: "Assigned amount must be greater than 0" })
        )
      );
    }

    if (assignedAmount > 999999.99) {
      return yield* _(
        Effect.fail(
          new ValidationError({ message: "Assigned amount exceeds maximum allowed" })
        )
      );
    }

    // Validate insurance company
    if (!insuranceCompany || insuranceCompany.trim().length === 0) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Insurance company is required" }))
      );
    }

    // Validate policy number
    if (!policyNumber || policyNumber.trim().length === 0) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Policy number is required" }))
      );
    }

    // Validate policy holder name
    if (!policyHolderName || policyHolderName.trim().length === 0) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Policy holder name is required" }))
      );
    }

    // Get insurance port
    const insurancePort = yield* _(InsurancePort);

    // Create insurance assignment
    const result = yield* _(insurancePort.createAssignment({
      caseId,
      insuranceCompany: insuranceCompany.trim(),
      policyNumber: policyNumber.trim(),
      policyHolderName: policyHolderName.trim(),
      assignedAmount,
      claimNumber: claimNumber?.trim(),
      notes: notes?.trim(),
      userId,
    }));

    return {
      success: true,
      insuranceAssignmentId: result.insuranceAssignmentId,
      status: result.status,
    } satisfies AssignInsuranceResult;
  });
