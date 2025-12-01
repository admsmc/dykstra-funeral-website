import { Effect } from 'effect';
import { ValidationError, type OnCallPolicy } from '@dykstra/domain';
import { 
  GoSchedulingPort,
  type GoSchedulingPortService, 
  type AssignOnCallCommand,
  type GoOnCallAssignment,
  NetworkError 
} from '../../ports/go-scheduling-port';

/**
 * Assign On-Call Director for Weekend/Holiday Coverage
 * 
 * Scenario 1: 24/7 On-Call Director Rotation
 * 
 * Business Need:
 * Ensure a licensed funeral director is always available for after-hours death calls.
 * 
 * Business Rules:
 * - Minimum 48-hour advance notice for on-call assignments
 * - No director assigned >2 consecutive weekends
 * - Fair rotation across all licensed directors
 * - Minimum 8 hours off between on-call shifts
 * - On-call activation automatically links to case ID
 * 
 * Workflow:
 * 1. Validate assignment is at least 48 hours in advance
 * 2. Validate time window (typically Friday 5pm → Monday 8am)
 * 3. Check director is not assigned to consecutive weekends
 * 4. Check minimum rest period since last shift
 * 5. Create on-call assignment in Go backend
 * 6. Return assignment details for notification
 */

/**
 * Assign Oncall Director
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

export interface AssignOnCallDirectorCommand {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly shiftType: 'weekend' | 'weeknight' | 'holiday';
  readonly funeralHomeId: string;
}

export interface OnCallAssignmentResult {
  readonly assignmentId: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly durationHours: number;
  readonly status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  readonly createdAt: Date;
}

/**
 * Validate on-call assignment meets business rules
 * 
 * Uses policy configuration instead of hardcoded values for:
 * - Minimum advance notice (policy.minAdvanceNoticeHours)
 * - Maximum duration (policy.maxShiftDurationHours)
 * - Minimum duration (policy.minShiftDurationHours)
 */
const validateOnCallAssignment = (
  command: AssignOnCallDirectorCommand,
  policy: OnCallPolicy,
  currentTime: Date = new Date()
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    const now = currentTime;
    const { startTime, endTime, employeeId, employeeName } = command;

    // Rule 1: Minimum advance notice (from policy)
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilStart < policy.minAdvanceNoticeHours) {
      return yield* Effect.fail(
        new ValidationError({
          message: `On-call assignments must be scheduled at least ${policy.minAdvanceNoticeHours} hours in advance (current: ${hoursUntilStart.toFixed(1)} hours)`,
          field: 'startTime',
        })
      );
    }

    // Rule 2: End time must be after start time
    if (endTime <= startTime) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'On-call end time must be after start time',
          field: 'endTime',
        })
      );
    }

    // Rule 3: Maximum duration (from policy)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > policy.maxShiftDurationHours) {
      return yield* Effect.fail(
        new ValidationError({
          message: `On-call shifts cannot exceed ${policy.maxShiftDurationHours} hours (current: ${durationHours.toFixed(1)} hours)`,
          field: 'endTime',
        })
      );
    }

    // Rule 4: Minimum duration (from policy)
    if (durationHours < policy.minShiftDurationHours) {
      return yield* Effect.fail(
        new ValidationError({
          message: `On-call shifts must be at least ${policy.minShiftDurationHours} hours (current: ${durationHours.toFixed(1)} hours)`,
          field: 'endTime',
        })
      );
    }

    // Rule 5: Employee ID must be valid
    if (!employeeId || employeeId.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Employee ID is required',
          field: 'employeeId',
        })
      );
    }

    // Rule 6: Employee name must be provided
    if (!employeeName || employeeName.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Employee name is required',
          field: 'employeeName',
        })
      );
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Map Go backend response to use case result
 */
const mapToOnCallResult = (assignment: GoOnCallAssignment): OnCallAssignmentResult => {
  const durationHours = (assignment.endTime.getTime() - assignment.startTime.getTime()) / (1000 * 60 * 60);
  
  return {
    assignmentId: assignment.id,
    employeeId: assignment.employeeId,
    employeeName: assignment.employeeName,
    startTime: assignment.startTime,
    endTime: assignment.endTime,
    durationHours: Math.round(durationHours * 10) / 10, // Round to 1 decimal
    status: assignment.status,
    createdAt: assignment.createdAt,
  };
};

/**
 * Assign On-Call Director Use Case
 * 
 * Creates an on-call assignment for a funeral director to provide
 * 24/7 coverage for after-hours death calls.
 * 
 * Now loads on-call policy from Go backend instead of using hardcoded values.
 * This allows funeral homes to configure their own rules without code changes.
 * 
 * @param command - Assignment details (employee, time window, shift type)
 * @returns Assignment result with confirmation details
 * @throws ValidationError - If assignment violates business rules (from policy)
 * @throws NetworkError - If Go backend communication fails
 */
export const assignOnCallDirector = (
  command: AssignOnCallDirectorCommand
): Effect.Effect<
  OnCallAssignmentResult,
  ValidationError | NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    // Step 1: Get scheduling service and load policy
    const scheduling = yield* GoSchedulingPort;
    
    // Step 2: Load on-call policy for this funeral home
    const policy = yield* scheduling.getOnCallPolicy(command.funeralHomeId);
    if (!policy) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'No on-call policy configured for this funeral home',
          field: 'funeralHomeId',
        })
      );
    }

    // Step 3: Validate assignment against policy
    yield* validateOnCallAssignment(command, policy);

    // Step 4: Create on-call assignment in Go backend
    const assignOnCallCommand: AssignOnCallCommand = {
      employeeId: command.employeeId,
      startTime: command.startTime,
      endTime: command.endTime,
    };

    const assignment = yield* scheduling.assignOnCall(assignOnCallCommand);

    // Step 5: Map to result format
    const result = mapToOnCallResult(assignment);

    // Step 6: Return assignment details
    return result;
  });

/**
 * Get upcoming on-call assignments for a director
 * 
 * @param employeeId - Director's employee ID
 * @param daysAhead - How many days ahead to look (default 30)
 * @returns List of upcoming on-call assignments
 */
export const getUpcomingOnCallAssignments = (
  employeeId: string,
  daysAhead = 30
): Effect.Effect<
  readonly OnCallAssignmentResult[],
  NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    const scheduling = yield* GoSchedulingPort;
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysAhead);

    // Get all on-call assignments for employee in date range
    const assignments = yield* scheduling.listOnCallAssignments({
      employeeId,
      startDate: now,
      endDate,
      status: 'scheduled',
    });

    return assignments.map(mapToOnCallResult);
  });

/**
 * Check if director has adequate rest period since last on-call shift
 * 
 * Business Rule: Minimum rest hours between on-call shifts (from policy)
 * 
 * @param employeeId - Director's employee ID
 * @param proposedStartTime - Proposed start time for new on-call shift
 * @param policy - On-call policy (contains minRestHoursAfterShift)
 * @returns true if adequate rest period, false otherwise
 */
export const hasAdequateRestPeriod = (
  employeeId: string,
  proposedStartTime: Date,
  policy: OnCallPolicy
): Effect.Effect<
  { hasAdequateRest: boolean; lastShiftEndTime?: Date; hoursRest?: number },
  NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    const scheduling = yield* GoSchedulingPort;
    
    // Get recent completed on-call assignments (look back 7 days)
    const sevenDaysAgo = new Date(proposedStartTime);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAssignments = yield* scheduling.listOnCallAssignments({
      employeeId,
      startDate: sevenDaysAgo,
      endDate: proposedStartTime,
      status: 'completed',
    });

    // If no recent assignments, adequate rest is guaranteed
    if (recentAssignments.length === 0) {
      return { hasAdequateRest: true };
    }

    // Find the most recent completed assignment
    const sortedAssignments = [...recentAssignments].sort(
      (a, b) => b.endTime.getTime() - a.endTime.getTime()
    );
    const lastAssignment = sortedAssignments[0];

    // Calculate hours between last shift end and proposed start
    const hoursRest = (proposedStartTime.getTime() - lastAssignment!.endTime.getTime()) / (1000 * 60 * 60);

    // Check against policy minimum rest requirement
    const hasAdequateRest = hoursRest >= policy.minRestHoursAfterShift;

    return {
      hasAdequateRest,
      lastShiftEndTime: lastAssignment!.endTime,
      hoursRest: Math.round(hoursRest * 10) / 10, // Round to 1 decimal
    };
  });

/**
 * Count consecutive weekend on-call assignments
 * 
 * Business Rule: No director assigned more than policy-defined consecutive weekends
 * 
 * @param employeeId - Director's employee ID
 * @param proposedStartTime - Proposed start time for new weekend on-call
 * @param policy - On-call policy (contains maxConsecutiveWeekendsOn)
 * @returns Count of consecutive weekends including proposed assignment
 */
export const countConsecutiveWeekends = (
  employeeId: string,
  proposedStartTime: Date,
  policy: OnCallPolicy
): Effect.Effect<
  { consecutiveWeekends: number; violatesRule: boolean },
  NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    const scheduling = yield* GoSchedulingPort;
    
    // Check if proposed start time is on a weekend (Friday evening - Sunday)
    const dayOfWeek = proposedStartTime.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // Friday, Saturday, or Sunday

    if (!isWeekend) {
      return { consecutiveWeekends: 0, violatesRule: false };
    }

    // Get past 4 weeks of assignments
    const fourWeeksAgo = new Date(proposedStartTime);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const pastAssignments = yield* scheduling.listOnCallAssignments({
      employeeId,
      startDate: fourWeeksAgo,
      endDate: proposedStartTime,
    });

    // Filter for weekend assignments and sort by start time
    const weekendAssignments = pastAssignments
      .filter(a => {
        const day = a.startTime.getDay();
        return day === 5 || day === 6 || day === 0;
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Count consecutive weekends working backwards from proposed date
    let consecutiveWeekends = 1; // Count the proposed assignment
    let currentWeekStart = new Date(proposedStartTime);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7); // Previous week

    for (const assignment of weekendAssignments.reverse()) {
      // Check if assignment is in the previous week
      const weekDiff = Math.floor(
        (currentWeekStart.getTime() - assignment.startTime.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      if (weekDiff === 0) {
        consecutiveWeekends++;
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      } else {
        break; // Gap found, stop counting
      }
    }

    // Check against policy maximum consecutive weekends
    const violatesRule = consecutiveWeekends > policy.maxConsecutiveWeekendsOn;

    return { consecutiveWeekends, violatesRule };
  });
