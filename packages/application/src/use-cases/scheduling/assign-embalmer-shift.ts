import { Effect } from 'effect';
import { ValidationError } from '@dykstra/domain';
import { 
  GoSchedulingPort,
  type GoSchedulingPortService, 
  type AssignShiftCommand,
  type GoShiftAssignment,
  type NetworkError 
} from '../../ports/go-scheduling-port';

/**
 * Assign Embalmer Shift
 * 
 * Scenario 3: Embalmer Shift Assignment
 * 
 * Business Need:
 * Schedule licensed embalmers for preparation room work with proper workload balancing.
 * 
 * Business Rules:
 * - Licensed embalmer required
 * - Maximum 3 preparations per shift
 * - 30-minute break between preparations
 * - All preparation work during regular shifts (typically 8am-4pm)
 * - Prep time tracked for labor costing (link to case ID)
 * 
 * Workflow:
 * 1. Case assigned to embalmer based on availability and workload
 * 2. Embalmer shift scheduled (typically 8am-4pm)
 * 3. Preparation time estimated (2-4 hours per case)
 * 4. System validates workload capacity
 * 5. Case linked to embalmer's timesheet for labor costing
 */

/**
 * Assign Embalmer Shift
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

export interface AssignEmbalmerShiftCommand {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly caseId: string;
  readonly decedentName: string;
  readonly shiftDate: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly estimatedPrepHours: number; // 2-4 hours typical
  readonly notes?: string;
}

export interface EmbalmerShiftResult {
  readonly assignmentId: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly caseId: string;
  readonly decedentName: string;
  readonly shiftDate: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly estimatedPrepHours: number;
  readonly preparationsCount: number; // Total preps for this embalmer on this shift
  readonly remainingCapacity: number; // How many more preps can be assigned
  readonly status: string;
  readonly createdAt: Date;
}

export interface EmbalmerWorkload {
  readonly employeeId: string;
  readonly shiftDate: Date;
  readonly preparationsCount: number;
  readonly totalEstimatedHours: number;
  readonly assignments: readonly GoShiftAssignment[];
}

/**
 * Validate embalmer shift assignment meets business rules
 */
const validateEmbalmerShift = (
  command: AssignEmbalmerShiftCommand,
  currentTime: Date = new Date()
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    const { startTime, endTime, estimatedPrepHours, employeeId, employeeName, caseId, decedentName } = command;

    // Rule 1: Employee ID and name required
    if (!employeeId || employeeId.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Employee ID is required',
          field: 'employeeId',
        })
      );
    }

    if (!employeeName || employeeName.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Employee name is required',
          field: 'employeeName',
        })
      );
    }

    // Rule 2: Case ID and decedent name required (for labor costing linkage)
    if (!caseId || caseId.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Case ID is required for preparation tracking',
          field: 'caseId',
        })
      );
    }

    if (!decedentName || decedentName.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Decedent name is required',
          field: 'decedentName',
        })
      );
    }

    // Rule 3: End time must be after start time
    if (endTime <= startTime) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Shift end time must be after start time',
          field: 'endTime',
        })
      );
    }

    // Rule 4: Shift must be in the future
    if (startTime <= currentTime) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Shift must be scheduled in the future',
          field: 'startTime',
        })
      );
    }

    // Rule 5: Shift duration validation (typical 8-hour shift)
    const shiftDurationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (shiftDurationHours > 12) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Shift duration exceeds maximum of 12 hours (current: ${shiftDurationHours.toFixed(1)} hours)`,
          field: 'endTime',
        })
      );
    }

    if (shiftDurationHours < 4) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Shift duration too short (minimum 4 hours, current: ${shiftDurationHours.toFixed(1)} hours)`,
          field: 'endTime',
        })
      );
    }

    // Rule 6: Estimated preparation time validation (2-4 hours typical)
    if (estimatedPrepHours < 1) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Preparation time too short (minimum 1 hour, current: ${estimatedPrepHours} hours)`,
          field: 'estimatedPrepHours',
        })
      );
    }

    if (estimatedPrepHours > 6) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Preparation time exceeds maximum (6 hours, current: ${estimatedPrepHours} hours)`,
          field: 'estimatedPrepHours',
        })
      );
    }

    // Rule 7: Preparation time must fit within shift (with 30-min break buffer per prep)
    const breakTimeHours = 0.5; // 30 minutes
    if (estimatedPrepHours + breakTimeHours > shiftDurationHours) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Preparation time (${estimatedPrepHours}h + 0.5h break) exceeds shift duration (${shiftDurationHours.toFixed(1)}h)`,
          field: 'estimatedPrepHours',
        })
      );
    }

    // Rule 8: Shift should be during regular hours (8am-6pm typical)
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    
    if (startHour < 6 || startHour > 18) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Preparation shifts should be during regular hours (6am-6pm)',
          field: 'startTime',
        })
      );
    }

    if (endHour < 6 || endHour > 20) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Shift end time should be during regular hours (6am-8pm)',
          field: 'endTime',
        })
      );
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Get embalmer's current workload for a specific shift date
 */
export const getEmbalmerWorkload = (
  employeeId: string,
  shiftDate: Date
): Effect.Effect<
  EmbalmerWorkload,
  NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    const scheduling = yield* GoSchedulingPort;

    // Get all shift assignments for this embalmer on this date
    const startOfDay = new Date(shiftDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(shiftDate);
    endOfDay.setHours(23, 59, 59, 999);

    const assignments = yield* scheduling.listShiftAssignments({
      employeeId,
      startDate: startOfDay,
      endDate: endOfDay,
      status: 'scheduled',
    });

    // Filter to only preparation assignments (identified by notes containing "Preparation - Case")
    const preparationAssignments = assignments.filter(
      a => a.notes && a.notes.includes('Preparation - Case')
    );

    // Calculate total estimated hours from notes (format: "... - EstHours: 3")
    let totalEstimatedHours = 0;
    for (const assignment of preparationAssignments) {
      const hoursMatch = assignment.notes?.match(/EstHours: ([\d.]+)/);
      if (hoursMatch && hoursMatch[1]) {
        totalEstimatedHours += parseFloat(hoursMatch[1]);
      }
    }

    return {
      employeeId,
      shiftDate,
      preparationsCount: preparationAssignments.length,
      totalEstimatedHours,
      assignments: preparationAssignments,
    };
  });

/**
 * Check if embalmer has capacity for another preparation
 */
const checkPreparationCapacity = (
  workload: EmbalmerWorkload,
  newPrepHours: number,
  shiftDurationHours: number
): { hasCapacity: boolean; reason?: string } => {
  // Rule 1: Maximum 3 preparations per shift
  if (workload.preparationsCount >= 3) {
    return {
      hasCapacity: false,
      reason: `Embalmer already has maximum 3 preparations assigned (current: ${workload.preparationsCount})`,
    };
  }

  // Rule 2: Check total time fits in shift (including 30-min breaks between preps)
  // With N preparations, you need (N-1) breaks between them
  const totalPreps = workload.preparationsCount + 1; // Including new prep
  const breakTimeHours = Math.max(0, totalPreps - 1) * 0.5; // 30 minutes between each pair
  const totalHoursNeeded = workload.totalEstimatedHours + newPrepHours + breakTimeHours;
  
  if (totalHoursNeeded > shiftDurationHours) {
    return {
      hasCapacity: false,
      reason: `Insufficient time in shift (need ${totalHoursNeeded.toFixed(1)}h, have ${shiftDurationHours.toFixed(1)}h)`,
    };
  }

  return { hasCapacity: true };
};

/**
 * Assign Embalmer Shift Use Case
 * 
 * Assigns a preparation to an embalmer with workload validation and case linkage.
 * 
 * @param command - Embalmer shift assignment details
 * @returns Shift assignment result with workload information
 * @throws ValidationError - If assignment violates business rules
 * @throws NetworkError - If Go backend communication fails
 */
export const assignEmbalmerShift = (
  command: AssignEmbalmerShiftCommand
): Effect.Effect<
  EmbalmerShiftResult,
  ValidationError | NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    // Step 1: Validate business rules
    yield* validateEmbalmerShift(command);

    // Step 2: Get scheduling service
    const scheduling = yield* GoSchedulingPort;

    // Step 3: Check embalmer's current workload
    const workload = yield* getEmbalmerWorkload(command.employeeId, command.shiftDate);

    // Step 4: Check if embalmer has capacity
    const shiftDurationHours = (command.endTime.getTime() - command.startTime.getTime()) / (1000 * 60 * 60);
    const capacityCheck = checkPreparationCapacity(workload, command.estimatedPrepHours, shiftDurationHours);

    if (!capacityCheck.hasCapacity) {
      return yield* Effect.fail(
        new ValidationError({
          message: capacityCheck.reason!,
          field: 'employeeId',
        })
      );
    }

    // Step 5: Create shift assignment with case linkage
    // Note: Using generic template ID for preparation shifts
    const preparationTemplateId = 'preparation-shift-template';

    const assignShiftCommand: AssignShiftCommand = {
      templateId: preparationTemplateId,
      employeeId: command.employeeId,
      date: command.shiftDate,
      notes: `Preparation - Case ${command.caseId} - Decedent: ${command.decedentName} - EstHours: ${command.estimatedPrepHours}${command.notes ? ` - ${command.notes}` : ''}`,
    };

    const assignment = yield* scheduling.assignShift(assignShiftCommand);

    // Step 6: Calculate updated workload metrics
    const newPreparationsCount = workload.preparationsCount + 1;
    const remainingCapacity = 3 - newPreparationsCount; // Max 3 preps per shift

    // Step 7: Return result with workload information
    return {
      assignmentId: assignment.id,
      employeeId: assignment.employeeId,
      employeeName: command.employeeName,
      caseId: command.caseId,
      decedentName: command.decedentName,
      shiftDate: command.shiftDate,
      startTime: command.startTime,
      endTime: command.endTime,
      estimatedPrepHours: command.estimatedPrepHours,
      preparationsCount: newPreparationsCount,
      remainingCapacity,
      status: assignment.status,
      createdAt: assignment.createdAt,
    };
  });

/**
 * Check preparation capacity for multiple embalmers
 * 
 * Helps office manager find the best embalmer for a new preparation.
 * 
 * @param employeeIds - List of embalmer employee IDs
 * @param shiftDate - Date to check capacity
 * @param requiredPrepHours - Hours needed for the preparation
 * @returns List of embalmers with their capacity status
 */
export const checkMultipleEmbalmerCapacity = (
  employeeIds: readonly string[],
  shiftDate: Date,
  requiredPrepHours: number,
  typicalShiftHours = 8
): Effect.Effect<
  readonly {
    readonly employeeId: string;
    readonly workload: EmbalmerWorkload;
    readonly hasCapacity: boolean;
    readonly reason?: string;
  }[],
  NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    // Get workload for all embalmers
    const workloads = yield* Effect.all(
      employeeIds.map(employeeId => getEmbalmerWorkload(employeeId, shiftDate)),
      { concurrency: 'unbounded' }
    );

    // Check capacity for each
    return workloads.map(workload => {
      const capacity = checkPreparationCapacity(workload, requiredPrepHours, typicalShiftHours);
      return {
        employeeId: workload.employeeId,
        workload,
        hasCapacity: capacity.hasCapacity,
        reason: capacity.reason,
      };
    });
  });
