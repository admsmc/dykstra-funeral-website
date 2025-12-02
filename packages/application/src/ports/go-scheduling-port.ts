import { type Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';
import type { OnCallPolicy, OnCallPolicyId } from '@dykstra/domain';

// Re-export for convenience
export { NotFoundError, NetworkError };

/**
 * Go Scheduling domain types
 * Staff roster and shift management for funeral home operations
 */

export type ShiftType = 
  | 'regular'    // Standard day shift
  | 'night'      // Night shift (typically 6pm-6am)
  | 'weekend'    // Weekend shift
  | 'oncall'     // On-call availability
  | 'holiday'    // Holiday shift
  | 'overtime';  // Overtime/extra shift

export type RecurrencePattern = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'rotating';  // E.g., 2 weeks on days, 2 weeks on nights

export interface GoShiftDifferential {
  readonly type: ShiftType;
  readonly percentBonus?: number;  // E.g., 15 = 15% premium
  readonly flatBonus?: number;     // Flat bonus in cents
}

export interface GoShiftTemplate {
  readonly id: string;
  readonly name: string;
  readonly shiftType: ShiftType;
  readonly startTime: string;      // HH:MM format
  readonly endTime: string;        // HH:MM format
  readonly durationMinutes: number;
  readonly daysOfWeek: readonly number[];  // 0=Sunday, 1=Monday, etc.
  readonly differential?: GoShiftDifferential;
  readonly recurrencePattern?: RecurrencePattern;
}

export interface GoShiftAssignment {
  readonly id: string;
  readonly shiftId: string;
  readonly templateId: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly date: Date;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly shiftType: ShiftType;
  readonly status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  readonly location?: string;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GoShiftSwap {
  readonly id: string;
  readonly fromEmployeeId: string;
  readonly fromEmployeeName: string;
  readonly toEmployeeId: string;
  readonly toEmployeeName: string;
  readonly shiftId: string;
  readonly shiftDate: Date;
  readonly reason?: string;
  readonly status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  readonly requestedAt: Date;
  readonly reviewedAt?: Date;
  readonly reviewedBy?: string;
  readonly rejectionReason?: string;
}

export interface GoOnCallAssignment {
  readonly id: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  readonly activations: readonly GoOnCallActivation[];
  readonly createdAt: Date;
}

export interface GoOnCallActivation {
  readonly id: string;
  readonly onCallId: string;
  readonly activationTime: Date;
  readonly durationMinutes: number;
  readonly reason: string;
  readonly caseId?: string;
}

export interface GoShiftCoverageRule {
  readonly shiftType: ShiftType;
  readonly minWorkers: number;
  readonly maxWorkers: number;
  readonly requiredSkills?: readonly string[];
}

export interface GoShiftCoverageStatus {
  readonly date: Date;
  readonly shiftType: ShiftType;
  readonly requiredWorkers: number;
  readonly assignedWorkers: number;
  readonly confirmedWorkers: number;
  readonly isFullyStaffed: boolean;
  readonly assignments: readonly GoShiftAssignment[];
}

export interface GoRotatingSchedule {
  readonly id: string;
  readonly name: string;
  readonly patterns: readonly GoShiftTemplate[];
  readonly weeksPerCycle: number;
  readonly currentWeek: number;
  readonly employeeIds: readonly string[];
}

export interface GoStaffSchedule {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly shifts: readonly GoShiftAssignment[];
  readonly onCallDuties: readonly GoOnCallAssignment[];
  readonly totalHours: number;
  readonly regularHours: number;
  readonly overtimeHours: number;
  readonly onCallHours: number;
}

// Commands

export interface CreateShiftTemplateCommand {
  readonly name: string;
  readonly shiftType: ShiftType;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly daysOfWeek: readonly number[];
  readonly differential?: GoShiftDifferential;
  readonly recurrencePattern?: RecurrencePattern;
}

export interface AssignShiftCommand {
  readonly templateId: string;
  readonly employeeId: string;
  readonly date: Date;
  readonly notes?: string;
}

export interface CompleteShiftCommand {
  readonly shiftId: string;
  readonly actualStartTime?: Date;
  readonly actualEndTime?: Date;
  readonly notes?: string;
}

export interface RequestShiftSwapCommand {
  readonly shiftId: string;
  readonly fromEmployeeId: string;
  readonly toEmployeeId: string;
  readonly reason?: string;
}

export interface ReviewShiftSwapCommand {
  readonly swapId: string;
  readonly approved: boolean;
  readonly reviewedBy: string;
  readonly rejectionReason?: string;
}

export interface AssignOnCallCommand {
  readonly employeeId: string;
  readonly startTime: Date;
  readonly endTime: Date;
}

export interface ActivateOnCallCommand {
  readonly onCallId: string;
  readonly activationTime: Date;
  readonly durationMinutes: number;
  readonly reason: string;
  readonly caseId?: string;
}

export interface CreateRotatingScheduleCommand {
  readonly name: string;
  readonly templateIds: readonly string[];
  readonly weeksPerCycle: number;
  readonly employeeIds: readonly string[];
  readonly startDate: Date;
}

/**
 * Go Scheduling Port
 * 
 * Defines interface for staff scheduling and roster management.
 * Supports shift assignments, swaps, on-call rotation, and coverage tracking.
 * 
 * Features:
 * - Shift templates and recurring schedules
 * - Staff shift assignments
 * - Shift swap workflow with approvals
 * - On-call rotation management
 * - Coverage rules and staffing validation
 * - Rotating shift patterns
 * - Schedule visibility and reporting
 * 
 * Backend: Go ERP with TigerBeetle for transactional scheduling
 */
export interface GoSchedulingPortService {
  /**
   * Create a shift template
   * 
   * Backend operation:
   * 1. Validates shift times and duration
   * 2. Creates shift template aggregate
   * 3. Emits ShiftTemplateCreated event
   * 4. Stores in TigerBeetle control account
   */
  readonly createShiftTemplate: (
    command: CreateShiftTemplateCommand
  ) => Effect.Effect<GoShiftTemplate, NetworkError>;
  
  /**
   * Get shift template by ID
   */
  readonly getShiftTemplate: (
    id: string
  ) => Effect.Effect<GoShiftTemplate, NotFoundError | NetworkError>;
  
  /**
   * List all shift templates
   */
  readonly listShiftTemplates: (
    filters?: {
      shiftType?: ShiftType;
      active?: boolean;
    }
  ) => Effect.Effect<readonly GoShiftTemplate[], NetworkError>;
  
  /**
   * Assign shift to employee
   * 
   * Backend operation:
   * 1. Validates employee availability
   * 2. Checks shift template exists
   * 3. Creates shift assignment
   * 4. Emits ShiftAssigned event
   * 5. Records in TigerBeetle assigned account
   */
  readonly assignShift: (
    command: AssignShiftCommand
  ) => Effect.Effect<GoShiftAssignment, NetworkError>;
  
  /**
   * Get shift assignment by ID
   */
  readonly getShiftAssignment: (
    id: string
  ) => Effect.Effect<GoShiftAssignment, NotFoundError | NetworkError>;
  
  /**
   * List shift assignments
   */
  readonly listShiftAssignments: (
    filters?: {
      employeeId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: GoShiftAssignment['status'];
      shiftType?: ShiftType;
    }
  ) => Effect.Effect<readonly GoShiftAssignment[], NetworkError>;
  
  /**
   * Complete shift
   * 
   * Backend operation:
   * 1. Validates shift is in progress
   * 2. Records actual start/end times
   * 3. Emits ShiftCompleted event
   * 4. Transfers from assigned to completed account
   * 5. Calculates hours worked including differentials
   */
  readonly completeShift: (
    command: CompleteShiftCommand
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Cancel shift assignment
   * 
   * Backend operation:
   * 1. Validates shift can be cancelled
   * 2. Updates status to cancelled
   * 3. Emits ShiftCancelled event
   * 4. Returns to control account in TigerBeetle
   */
  readonly cancelShift: (
    shiftId: string,
    reason?: string
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Request shift swap
   * 
   * Backend operation:
   * 1. Validates both employees eligible
   * 2. Creates swap request
   * 3. Emits ShiftSwapRequested event
   * 4. Moves shifts to pending account
   * 5. Notifies manager for approval
   */
  readonly requestShiftSwap: (
    command: RequestShiftSwapCommand
  ) => Effect.Effect<GoShiftSwap, NetworkError>;
  
  /**
   * Review shift swap (approve or reject)
   * 
   * Backend operation:
   * 1. Validates swap is pending
   * 2. If approved: swaps assignments, emits ShiftSwapApproved
   * 3. If rejected: returns original assignments, emits ShiftSwapRejected
   * 4. Updates TigerBeetle accounts accordingly
   */
  readonly reviewShiftSwap: (
    command: ReviewShiftSwapCommand
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Get shift swap by ID
   */
  readonly getShiftSwap: (
    id: string
  ) => Effect.Effect<GoShiftSwap, NotFoundError | NetworkError>;
  
  /**
   * List shift swaps
   */
  readonly listShiftSwaps: (
    filters?: {
      employeeId?: string;
      status?: GoShiftSwap['status'];
      startDate?: Date;
      endDate?: Date;
    }
  ) => Effect.Effect<readonly GoShiftSwap[], NetworkError>;
  
  /**
   * Assign on-call duty
   * 
   * Backend operation:
   * 1. Validates employee eligible for on-call
   * 2. Checks for conflicts
   * 3. Creates on-call assignment
   * 4. Emits OnCallAssigned event
   * 5. Records in TigerBeetle on-call account
   */
  readonly assignOnCall: (
    command: AssignOnCallCommand
  ) => Effect.Effect<GoOnCallAssignment, NetworkError>;
  
  /**
   * Activate on-call (record callback/activation)
   * 
   * Backend operation:
   * 1. Validates on-call assignment exists and active
   * 2. Records activation with duration
   * 3. Emits OnCallActivated event
   * 4. Transfers hours to worked account
   */
  readonly activateOnCall: (
    command: ActivateOnCallCommand
  ) => Effect.Effect<GoOnCallActivation, NetworkError>;
  
  /**
   * Get on-call assignment by ID
   */
  readonly getOnCallAssignment: (
    id: string
  ) => Effect.Effect<GoOnCallAssignment, NotFoundError | NetworkError>;
  
  /**
   * List on-call assignments
   */
  readonly listOnCallAssignments: (
    filters?: {
      employeeId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: GoOnCallAssignment['status'];
    }
  ) => Effect.Effect<readonly GoOnCallAssignment[], NetworkError>;
  
  /**
   * Get staff schedule for employee
   * Returns complete schedule including shifts and on-call duties
   */
  readonly getStaffSchedule: (
    employeeId: string,
    startDate: Date,
    endDate: Date
  ) => Effect.Effect<GoStaffSchedule, NetworkError>;
  
  /**
   * Get shift coverage status
   * Shows whether shifts are adequately staffed
   */
  readonly getShiftCoverage: (
    date: Date,
    shiftType?: ShiftType
  ) => Effect.Effect<readonly GoShiftCoverageStatus[], NetworkError>;
  
  /**
   * Create rotating schedule
   * 
   * Backend operation:
   * 1. Validates templates and employees
   * 2. Creates rotating schedule aggregate
   * 3. Generates shift assignments for cycle
   * 4. Emits RotatingScheduleCreated event
   */
  readonly createRotatingSchedule: (
    command: CreateRotatingScheduleCommand
  ) => Effect.Effect<GoRotatingSchedule, NetworkError>;
  
  /**
   * Get rotating schedule by ID
   */
  readonly getRotatingSchedule: (
    id: string
  ) => Effect.Effect<GoRotatingSchedule, NotFoundError | NetworkError>;
  
  /**
   * Set shift coverage rules
   * Defines minimum/maximum staffing requirements
   */
  readonly setShiftCoverageRule: (
    rule: GoShiftCoverageRule
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * Get shift coverage rules
   */
  readonly getShiftCoverageRules: (
    shiftType?: ShiftType
  ) => Effect.Effect<readonly GoShiftCoverageRule[], NetworkError>;

  /**
   * Get current on-call policy for a funeral home
   * Returns the active policy (isCurrent: true)
   * 
   * Backend operation:
   * 1. Queries on_call_policies table for isCurrent=true record
   * 2. Returns current policy or null if not configured
   * 3. Caches policy for performance
   */
  readonly getOnCallPolicy: (
    funeralHomeId: string
  ) => Effect.Effect<OnCallPolicy | null, NetworkError>;

  /**
   * Create a new on-call policy
   * Initializes a policy for a funeral home with default or custom settings
   * 
   * Backend operation:
   * 1. Validates policy constraints
   * 2. Creates new policy record
   * 3. Marks as current (isCurrent: true)
   * 4. Emits OnCallPolicyCreated event
   */
  readonly createOnCallPolicy: (
    funeralHomeId: string,
    policyData: Partial<OnCallPolicy>,
    createdBy: string
  ) => Effect.Effect<OnCallPolicy, NetworkError>;

  /**
   * Update on-call policy (creates new version with SCD2)
   * Does not modify existing policy, creates new version
   * Old version marked with validTo timestamp
   * 
   * Backend operation:
   * 1. Validates new policy constraints
   * 2. Marks current policy as obsolete (isCurrent: false, validTo: now)
   * 3. Creates new policy version (isCurrent: true, validFrom: now)
   * 4. Emits OnCallPolicyUpdated event
   */
  readonly updateOnCallPolicy: (
    policyId: OnCallPolicyId,
    policyData: Partial<OnCallPolicy>,
    updatedBy: string
  ) => Effect.Effect<OnCallPolicy, NetworkError>;

  /**
   * Get complete policy history for a funeral home
   * Returns all versions of policies (for audit trail)
   * 
   * @param funeralHomeId - Funeral home identifier
   * @returns Array of all policy versions (newest first)
   */
  readonly getOnCallPolicyHistory: (
    funeralHomeId: string
  ) => Effect.Effect<readonly OnCallPolicy[], NetworkError>;
}

/**
 * Go Scheduling Port service tag for dependency injection
 */
export const GoSchedulingPort = Context.GenericTag<GoSchedulingPortService>(
  '@dykstra/GoSchedulingPort'
);
