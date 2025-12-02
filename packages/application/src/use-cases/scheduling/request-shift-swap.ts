import { Effect } from 'effect';
import { ValidationError, type NotFoundError } from '@dykstra/domain';
import {
  GoSchedulingPort,
  type GoSchedulingPortService,
  type RequestShiftSwapCommand as GoRequestShiftSwapCommand,
  type ReviewShiftSwapCommand as GoReviewShiftSwapCommand,
  type GoShiftSwap,
  type GoShiftAssignment,
  type NetworkError,
} from '../../ports/go-scheduling-port';

/**
 * Shift Swap with Manager Approval
 * 
 * Scenario 4: Allow staff to trade shifts with manager oversight
 * 
 * Business Need:
 * Provide flexibility for staff while maintaining appropriate oversight and ensuring
 * shift coverage, licensing requirements, and labor regulations are met.
 * 
 * Business Rules:
 * - Swap requests must be submitted 48 hours in advance
 * - Replacement must have same license level or higher
 * - Maximum 2 pending swap requests per person
 * - Manager approval required for all swaps
 * - Swaps cannot create overtime violations
 * - Adequate rest periods must be maintained (8 hours)
 * 
 * Workflow:
 * 1. Staff member requests shift swap (identifies replacement)
 * 2. Replacement staff accepts swap request
 * 3. System validates licensing, overtime, rest periods
 * 4. Swap request routes to manager
 * 5. Manager reviews and approves/rejects
 * 6. If approved: shifts updated, both staff notified
 * 7. If rejected: reason provided, original assignments remain
 */

/**
 * Request Shift Swap
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 IN PROGRESS
 * Policy Entity: ShiftPolicy
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface RequestShiftSwapInput {
  readonly shiftId: string;
  readonly fromEmployeeId: string;
  readonly fromEmployeeName: string;
  readonly fromEmployeeLicenseLevel: string; // 'director', 'staff', 'driver', 'embalmer'
  readonly toEmployeeId: string;
  readonly toEmployeeName: string;
  readonly toEmployeeLicenseLevel: string;
  readonly reason?: string;
  readonly currentTime?: Date; // For testing
}

export interface ReviewShiftSwapInput {
  readonly swapId: string;
  readonly approved: boolean;
  readonly reviewedBy: string;
  readonly reviewerRole: string; // 'manager', 'director', 'admin'
  readonly rejectionReason?: string;
}

export interface ShiftSwapRequestResult {
  readonly swapId: string;
  readonly status: GoShiftSwap['status'];
  readonly fromEmployeeId: string;
  readonly fromEmployeeName: string;
  readonly toEmployeeId: string;
  readonly toEmployeeName: string;
  readonly shiftDate: Date;
  readonly requestedAt: Date;
  readonly requiresApproval: boolean;
}

export interface ShiftSwapReviewResult {
  readonly swapId: string;
  readonly approved: boolean;
  readonly reviewedAt: Date;
  readonly reviewedBy: string;
  readonly fromEmployeeId: string;
  readonly toEmployeeId: string;
  readonly message: string;
}

/**
 * Validate shift swap request meets business rules
 */
const validateShiftSwapRequest = (
  input: RequestShiftSwapInput,
  shift: GoShiftAssignment,
  currentTime: Date
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    const { fromEmployeeId, toEmployeeId, fromEmployeeLicenseLevel, toEmployeeLicenseLevel } = input;

    // Rule 1: Cannot swap with yourself
    if (fromEmployeeId === toEmployeeId) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Cannot swap shift with yourself',
          field: 'toEmployeeId',
        })
      );
    }

    // Rule 2: Must be submitted 48 hours in advance
    const hoursUntilShift = (shift.startTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
    if (hoursUntilShift < 48) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Swap request must be submitted 48 hours in advance (currently ${hoursUntilShift.toFixed(1)} hours)`,
          field: 'shiftId',
        })
      );
    }

    // Rule 3: Replacement must have same license level or higher
    const licenseHierarchy: Record<string, number> = {
      director: 4,
      embalmer: 3,
      staff: 2,
      driver: 1,
    };

    const fromLevel = licenseHierarchy[fromEmployeeLicenseLevel.toLowerCase()] || 0;
    const toLevel = licenseHierarchy[toEmployeeLicenseLevel.toLowerCase()] || 0;

    if (toLevel < fromLevel) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Replacement staff license level (${toEmployeeLicenseLevel}) is lower than required (${fromEmployeeLicenseLevel})`,
          field: 'toEmployeeId',
        })
      );
    }

    // Rule 4: Shift must be scheduled or confirmed (not already completed/cancelled)
    if (!['scheduled', 'confirmed'].includes(shift.status)) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Cannot swap shift with status: ${shift.status}`,
          field: 'shiftId',
        })
      );
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Check if employee has reached maximum pending swaps (2)
 */
const checkPendingSwapLimit = (
  employeeId: string,
  scheduling: GoSchedulingPortService
): Effect.Effect<void, ValidationError | NetworkError> =>
  Effect.gen(function* () {
    // Get pending swaps for this employee
    const swaps = yield* scheduling.listShiftSwaps({
      employeeId,
      status: 'pending',
    });

    if (swaps.length >= 2) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Maximum of 2 pending swap requests reached (current: ${swaps.length})`,
          field: 'fromEmployeeId',
        })
      );
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Validate overtime violations
 * 
 * This is a simplified check. In a real implementation, we would:
 * - Calculate total hours for the week
 * - Check against overtime thresholds (e.g., 40 hours/week)
 * - Consider state labor laws
 */
const validateNoOvertimeViolation = (
  employeeId: string,
  newShift: GoShiftAssignment,
  scheduling: GoSchedulingPortService
): Effect.Effect<void, ValidationError | NetworkError> =>
  Effect.gen(function* () {
    // Get employee's schedule for the week
    const weekStart = new Date(newShift.startTime);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const schedule = yield* scheduling.getStaffSchedule(employeeId, weekStart, weekEnd);

    // Calculate new shift duration
    const newShiftHours = (newShift.endTime.getTime() - newShift.startTime.getTime()) / (1000 * 60 * 60);
    const projectedTotal = schedule.totalHours + newShiftHours;

    // Check against overtime threshold (simplified: 60 hours/week)
    if (projectedTotal > 60) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Swap would create overtime violation (projected: ${projectedTotal.toFixed(1)}h, max: 60h)`,
          field: 'toEmployeeId',
        })
      );
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Validate adequate rest period (8 hours) between shifts
 */
const validateRestPeriod = (
  employeeId: string,
  newShift: GoShiftAssignment,
  scheduling: GoSchedulingPortService
): Effect.Effect<void, ValidationError | NetworkError> =>
  Effect.gen(function* () {
    // Get shifts around the new shift date
    const dayBefore = new Date(newShift.startTime);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(newShift.startTime);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const nearbyShifts = yield* scheduling.listShiftAssignments({
      employeeId,
      startDate: dayBefore,
      endDate: dayAfter,
      status: 'scheduled',
    });

    // Check for rest period violations
    for (const existingShift of nearbyShifts) {
      // Skip the shift being swapped away
      if (existingShift.id === newShift.id) {
        continue;
      }

      // Check if shifts are too close
      const timeBetween = Math.abs(
        existingShift.endTime.getTime() - newShift.startTime.getTime()
      ) / (1000 * 60 * 60);

      if (timeBetween < 8) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Swap would violate 8-hour rest period requirement (gap: ${timeBetween.toFixed(1)}h)`,
            field: 'toEmployeeId',
          })
        );
      }
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Request Shift Swap Use Case
 * 
 * Initiates a shift swap request between two staff members.
 * 
 * @param input - Swap request details
 * @returns Swap request result with status
 * @throws ValidationError - If swap violates business rules
 * @throws NetworkError - If Go backend communication fails
 */
export const requestShiftSwap = (
  input: RequestShiftSwapInput
): Effect.Effect<
  ShiftSwapRequestResult,
  ValidationError | NetworkError | NotFoundError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    const scheduling = yield* GoSchedulingPort;
    const currentTime = input.currentTime || new Date();

    // Step 1: Get the shift being swapped
    const shift = yield* scheduling.getShiftAssignment(input.shiftId);

    // Step 2: Validate the shift belongs to the requesting employee
    if (shift.employeeId !== input.fromEmployeeId) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Shift does not belong to requesting employee',
          field: 'fromEmployeeId',
        })
      );
    }

    // Step 3: Validate basic swap requirements
    yield* validateShiftSwapRequest(input, shift, currentTime);

    // Step 4: Check pending swap limit
    yield* checkPendingSwapLimit(input.fromEmployeeId, scheduling);

    // Step 5: Validate no overtime violations for replacement
    yield* validateNoOvertimeViolation(input.toEmployeeId, shift, scheduling);

    // Step 6: Validate adequate rest period for replacement
    yield* validateRestPeriod(input.toEmployeeId, shift, scheduling);

    // Step 7: Create swap request in Go backend
    const command: GoRequestShiftSwapCommand = {
      shiftId: input.shiftId,
      fromEmployeeId: input.fromEmployeeId,
      toEmployeeId: input.toEmployeeId,
      reason: input.reason,
    };

    const swap = yield* scheduling.requestShiftSwap(command);

    // Step 8: Return result
    return {
      swapId: swap.id,
      status: swap.status,
      fromEmployeeId: swap.fromEmployeeId,
      fromEmployeeName: input.fromEmployeeName,
      toEmployeeId: swap.toEmployeeId,
      toEmployeeName: input.toEmployeeName,
      shiftDate: swap.shiftDate,
      requestedAt: swap.requestedAt,
      requiresApproval: true,
    };
  });

/**
 * Review Shift Swap Use Case
 * 
 * Manager reviews and approves/rejects a shift swap request.
 * 
 * @param input - Review decision
 * @returns Review result with updated status
 * @throws ValidationError - If review violates business rules
 * @throws NetworkError - If Go backend communication fails
 */
export const reviewShiftSwap = (
  input: ReviewShiftSwapInput
): Effect.Effect<
  ShiftSwapReviewResult,
  ValidationError | NetworkError | NotFoundError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    const scheduling = yield* GoSchedulingPort;

    // Step 1: Validate reviewer has appropriate role
    const validRoles = ['manager', 'director', 'admin'];
    if (!validRoles.includes(input.reviewerRole.toLowerCase())) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Reviewer must have manager, director, or admin role (current: ${input.reviewerRole})`,
          field: 'reviewerRole',
        })
      );
    }

    // Step 2: Get the swap request
    const swap = yield* scheduling.getShiftSwap(input.swapId);

    // Step 3: Validate swap is pending
    if (swap.status !== 'pending') {
      return yield* Effect.fail(
        new ValidationError({
          message: `Swap request is not pending (current status: ${swap.status})`,
          field: 'swapId',
        })
      );
    }

    // Step 4: If rejecting, require rejection reason
    if (!input.approved && (!input.rejectionReason || input.rejectionReason.trim() === '')) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Rejection reason is required when rejecting a swap request',
          field: 'rejectionReason',
        })
      );
    }

    // Step 5: Submit review to Go backend
    const command: GoReviewShiftSwapCommand = {
      swapId: input.swapId,
      approved: input.approved,
      reviewedBy: input.reviewedBy,
      rejectionReason: input.rejectionReason,
    };

    yield* scheduling.reviewShiftSwap(command);

    // Step 6: Return result
    const reviewedAt = new Date();
    const message = input.approved
      ? `Shift swap approved: ${swap.fromEmployeeName} → ${swap.toEmployeeName}`
      : `Shift swap rejected: ${input.rejectionReason}`;

    return {
      swapId: input.swapId,
      approved: input.approved,
      reviewedAt,
      reviewedBy: input.reviewedBy,
      fromEmployeeId: swap.fromEmployeeId,
      toEmployeeId: swap.toEmployeeId,
      message,
    };
  });
