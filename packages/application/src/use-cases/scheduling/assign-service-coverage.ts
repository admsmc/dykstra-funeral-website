import { Effect } from 'effect';
import { ValidationError } from '@dykstra/domain';
import { 
  GoSchedulingPort,
  type GoSchedulingPortService, 
  type AssignShiftCommand,
  type GoShiftAssignment,
  type GoStaffSchedule,
  NetworkError 
} from '../../ports/go-scheduling-port';

/**
 * Assign Service Coverage Staffing
 * 
 * Scenario 2: Service Coverage Staffing
 * 
 * Business Need:
 * Ensure adequate staffing for scheduled funeral and memorial services.
 * 
 * Business Rules:
 * - Licensed director required for all services
 * - Minimum staffing levels by service type
 * - No staff assigned to overlapping services
 * - 8-hour minimum rest between shifts
 * - Validate coverage 24 hours before service
 * 
 * Workflow:
 * 1. Service scheduled with date/time in case management
 * 2. System calculates staffing requirements based on service type
 * 3. System checks staff availability
 * 4. Office manager assigns staff to service shifts
 * 5. Staff receive shift notifications
 * 6. System validates coverage 24 hours before service
 * 7. Alerts sent if understaffed
 */

/**
 * Assign Service Coverage
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

export type ServiceType = 
  | 'traditional_funeral'
  | 'memorial_service'
  | 'graveside'
  | 'visitation';

export type StaffRole = 
  | 'director'
  | 'staff'
  | 'driver';

export interface StaffingRequirement {
  readonly role: StaffRole;
  readonly count: number;
  readonly requiresLicense: boolean;
}

export interface StaffAssignment {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly role: StaffRole;
}

export interface AssignServiceCoverageCommand {
  readonly caseId: string;
  readonly serviceType: ServiceType;
  readonly serviceDate: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly staffAssignments: readonly StaffAssignment[];
  readonly location: string;
  readonly notes?: string;
}

export interface ServiceCoverageResult {
  readonly caseId: string;
  readonly serviceType: ServiceType;
  readonly serviceDate: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly assignments: readonly {
    readonly assignmentId: string;
    readonly employeeId: string;
    readonly employeeName: string;
    readonly role: StaffRole;
    readonly status: string;
  }[];
  readonly isAdequatelyStaffed: boolean;
  readonly missingRoles: readonly StaffRole[];
  readonly createdAt: Date;
}

/**
 * Get staffing requirements for service type
 */
const getStaffingRequirements = (serviceType: ServiceType): readonly StaffingRequirement[] => {
  switch (serviceType) {
    case 'traditional_funeral':
      return [
        { role: 'director', count: 1, requiresLicense: true },
        { role: 'staff', count: 2, requiresLicense: false },
        { role: 'driver', count: 1, requiresLicense: false },
      ];
    case 'memorial_service':
      return [
        { role: 'director', count: 1, requiresLicense: true },
        { role: 'staff', count: 1, requiresLicense: false },
      ];
    case 'graveside':
      return [
        { role: 'director', count: 1, requiresLicense: true },
        { role: 'staff', count: 1, requiresLicense: false },
        { role: 'driver', count: 1, requiresLicense: false },
      ];
    case 'visitation':
      return [
        { role: 'staff', count: 1, requiresLicense: false },
      ];
  }
};

/**
 * Validate service coverage meets business rules
 */
const validateServiceCoverage = (
  command: AssignServiceCoverageCommand,
  currentTime: Date = new Date()
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    const { startTime, endTime, staffAssignments, serviceType, caseId } = command;

    // Rule 1: Case ID is required
    if (!caseId || caseId.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Case ID is required',
          field: 'caseId',
        })
      );
    }

    // Rule 2: End time must be after start time
    if (endTime <= startTime) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Service end time must be after start time',
          field: 'endTime',
        })
      );
    }

    // Rule 3: Service duration should be reasonable (max 8 hours)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
      return yield* Effect.fail(
        new ValidationError({
          message: `Service duration exceeds maximum of 8 hours (current: ${durationHours.toFixed(1)} hours)`,
          field: 'endTime',
        })
      );
    }

    // Rule 4: Service must be in the future (can't schedule past services)
    if (startTime <= currentTime) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Service must be scheduled in the future',
          field: 'startTime',
        })
      );
    }

    // Rule 5: Staff assignments must not be empty
    if (staffAssignments.length === 0) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'At least one staff member must be assigned',
          field: 'staffAssignments',
        })
      );
    }

    // Rule 6: Each staff member must have valid employee ID and name
    for (const assignment of staffAssignments) {
      if (!assignment.employeeId || assignment.employeeId.trim() === '') {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Employee ID is required for all staff assignments',
            field: 'staffAssignments',
          })
        );
      }
      if (!assignment.employeeName || assignment.employeeName.trim() === '') {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Employee name is required for all staff assignments',
            field: 'staffAssignments',
          })
        );
      }
    }

    // Rule 7: Check minimum staffing requirements
    const requirements = getStaffingRequirements(serviceType);
    const assignmentsByRole = new Map<StaffRole, number>();
    
    for (const assignment of staffAssignments) {
      const count = assignmentsByRole.get(assignment.role) || 0;
      assignmentsByRole.set(assignment.role, count + 1);
    }

    for (const requirement of requirements) {
      const assigned = assignmentsByRole.get(requirement.role) || 0;
      if (assigned < requirement.count) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Insufficient ${requirement.role} staff: need ${requirement.count}, have ${assigned}`,
            field: 'staffAssignments',
          })
        );
      }
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Check for scheduling conflicts for an employee
 */
const hasSchedulingConflict = (
  proposedStartTime: Date,
  proposedEndTime: Date,
  existingSchedule: GoStaffSchedule
): { hasConflict: boolean; conflictingShift?: string } => {
  // Check shift assignments for overlap
  for (const shift of existingSchedule.shifts) {
    // Skip cancelled or no-show shifts
    if (shift.status === 'cancelled' || shift.status === 'no_show') {
      continue;
    }

    const shiftStart = shift.startTime;
    const shiftEnd = shift.endTime;

    // Check for any time overlap
    const hasOverlap =
      (proposedStartTime >= shiftStart && proposedStartTime < shiftEnd) ||
      (proposedEndTime > shiftStart && proposedEndTime <= shiftEnd) ||
      (proposedStartTime <= shiftStart && proposedEndTime >= shiftEnd);

    if (hasOverlap) {
      return {
        hasConflict: true,
        conflictingShift: `${shift.shiftType} shift on ${shift.date.toLocaleDateString()}`,
      };
    }
  }

  // Check on-call assignments for overlap
  for (const onCall of existingSchedule.onCallDuties) {
    // Skip completed or cancelled on-call
    if (onCall.status === 'completed' || onCall.status === 'cancelled') {
      continue;
    }

    const hasOverlap =
      (proposedStartTime >= onCall.startTime && proposedStartTime < onCall.endTime) ||
      (proposedEndTime > onCall.startTime && proposedEndTime <= onCall.endTime) ||
      (proposedStartTime <= onCall.startTime && proposedEndTime >= onCall.endTime);

    if (hasOverlap) {
      return {
        hasConflict: true,
        conflictingShift: `On-call duty ending ${onCall.endTime.toLocaleDateString()}`,
      };
    }
  }

  return { hasConflict: false };
};

/**
 * Check if employee has adequate rest period
 */
const hasAdequateRestPeriod = (
  proposedStartTime: Date,
  existingSchedule: GoStaffSchedule
): { hasAdequateRest: boolean; lastShiftEndTime?: Date; hoursRest?: number } => {
  // Find most recent completed shift before proposed start time
  const pastShifts = existingSchedule.shifts
    .filter(s => s.endTime < proposedStartTime && s.status === 'completed')
    .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());

  if (pastShifts.length === 0) {
    return { hasAdequateRest: true };
  }

  const lastShift = pastShifts[0]!;
  const hoursRest = (proposedStartTime.getTime() - lastShift.endTime.getTime()) / (1000 * 60 * 60);

  // Minimum 8 hours rest required
  const hasAdequateRest = hoursRest >= 8;

  return {
    hasAdequateRest,
    lastShiftEndTime: lastShift.endTime,
    hoursRest: Math.round(hoursRest * 10) / 10,
  };
};

/**
 * Assign Service Coverage Use Case
 * 
 * Creates shift assignments for all staff members assigned to a funeral or memorial service.
 * 
 * @param command - Service details and staff assignments
 * @returns Service coverage result with assignment IDs and adequacy status
 * @throws ValidationError - If coverage violates business rules
 * @throws NetworkError - If Go backend communication fails
 */
export const assignServiceCoverage = (
  command: AssignServiceCoverageCommand
): Effect.Effect<
  ServiceCoverageResult,
  ValidationError | NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    // Step 1: Validate business rules
    yield* validateServiceCoverage(command);

    // Step 2: Get scheduling service
    const scheduling = yield* GoSchedulingPort;

    // Step 3: Check for scheduling conflicts for each staff member
    yield* Effect.all(
      command.staffAssignments.map(assignment =>
        Effect.gen(function* () {
          // Get employee's existing schedule
          const schedule = yield* scheduling.getStaffSchedule(
            assignment.employeeId,
            command.startTime,
            command.endTime
          );

          // Check for conflicts
          const conflict = hasSchedulingConflict(
            command.startTime,
            command.endTime,
            schedule
          );

          if (conflict.hasConflict) {
            return yield* Effect.fail(
              new ValidationError({
                message: `${assignment.employeeName} has a scheduling conflict: ${conflict.conflictingShift}`,
                field: 'staffAssignments',
              })
            );
          }

          // Check for adequate rest period
          const restCheck = hasAdequateRestPeriod(command.startTime, schedule);
          if (!restCheck.hasAdequateRest) {
            return yield* Effect.fail(
              new ValidationError({
                message: `${assignment.employeeName} needs more rest: only ${restCheck.hoursRest} hours since last shift (minimum 8 hours required)`,
                field: 'staffAssignments',
              })
            );
          }

          return yield* Effect.succeed(undefined);
        })
      ),
      { concurrency: 'unbounded' }
    );

    // Step 4: Create shift template for this service (one-time template)
    // Note: In a real implementation, we'd create a template or use an existing service template
    // For now, we'll use a generic "service" template ID
    const serviceTemplateId = 'service-coverage-template';

    // Step 5: Assign shifts to all staff members
    const assignments = yield* Effect.all(
      command.staffAssignments.map(assignment => {
        const assignShiftCommand: AssignShiftCommand = {
          templateId: serviceTemplateId,
          employeeId: assignment.employeeId,
          date: command.serviceDate,
          notes: `${command.serviceType} - Case ${command.caseId} - Role: ${assignment.role}${command.notes ? ` - ${command.notes}` : ''}`,
        };

        return scheduling.assignShift(assignShiftCommand);
      }),
      { concurrency: 'unbounded' }
    );

    // Step 6: Check if service is adequately staffed
    const requirements = getStaffingRequirements(command.serviceType);
    const assignmentsByRole = new Map<StaffRole, number>();
    
    for (const assignment of command.staffAssignments) {
      const count = assignmentsByRole.get(assignment.role) || 0;
      assignmentsByRole.set(assignment.role, count + 1);
    }

    const missingRoles: StaffRole[] = [];
    for (const requirement of requirements) {
      const assigned = assignmentsByRole.get(requirement.role) || 0;
      if (assigned < requirement.count) {
        missingRoles.push(requirement.role);
      }
    }

    const isAdequatelyStaffed = missingRoles.length === 0;

    // Step 7: Map assignments to result format
    const resultAssignments = assignments.map((assignment, index) => ({
      assignmentId: assignment.id,
      employeeId: assignment.employeeId,
      employeeName: assignment.employeeName,
      role: command.staffAssignments[index]!.role,
      status: assignment.status,
    }));

    // Step 8: Return service coverage result
    return {
      caseId: command.caseId,
      serviceType: command.serviceType,
      serviceDate: command.serviceDate,
      startTime: command.startTime,
      endTime: command.endTime,
      assignments: resultAssignments,
      isAdequatelyStaffed,
      missingRoles,
      createdAt: new Date(),
    };
  });

/**
 * Check service coverage adequacy
 * 
 * Validates whether a service has adequate staffing based on service type.
 * Useful for pre-service validation (24 hours before).
 * 
 * @param caseId - Case ID for the service
 * @param serviceType - Type of service
 * @param serviceDate - Date of service
 * @returns Coverage adequacy status
 */
export const checkServiceCoverageAdequacy = (
  caseId: string,
  serviceType: ServiceType,
  serviceDate: Date
): Effect.Effect<
  {
    readonly isAdequate: boolean;
    readonly requiredStaff: readonly StaffingRequirement[];
    readonly assignedStaff: readonly GoShiftAssignment[];
    readonly missingRoles: readonly StaffRole[];
  },
  ValidationError | NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    const scheduling = yield* GoSchedulingPort;

    // Get all shift assignments for the service date
    const startOfDay = new Date(serviceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(serviceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const assignments = yield* scheduling.listShiftAssignments({
      startDate: startOfDay,
      endDate: endOfDay,
      status: 'scheduled',
    });

    // Filter assignments that reference this case
    const caseAssignments = assignments.filter(
      a => a.notes && a.notes.includes(`Case ${caseId}`)
    );

    // Calculate staffing by role
    const requirements = getStaffingRequirements(serviceType);
    const assignmentsByRole = new Map<StaffRole, number>();

    // Parse role from notes (format: "... - Role: director - ...")
    for (const assignment of caseAssignments) {
      const roleMatch = assignment.notes?.match(/Role: (\w+)/);
      if (roleMatch) {
        const role = roleMatch[1] as StaffRole;
        const count = assignmentsByRole.get(role) || 0;
        assignmentsByRole.set(role, count + 1);
      }
    }

    const missingRoles: StaffRole[] = [];
    for (const requirement of requirements) {
      const assigned = assignmentsByRole.get(requirement.role) || 0;
      if (assigned < requirement.count) {
        missingRoles.push(requirement.role);
      }
    }

    return {
      isAdequate: missingRoles.length === 0,
      requiredStaff: requirements,
      assignedStaff: caseAssignments,
      missingRoles,
    };
  });
