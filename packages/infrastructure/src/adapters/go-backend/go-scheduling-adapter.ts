import { Effect } from 'effect';
import type {
  GoSchedulingPortService,
  GoShiftTemplate,
  GoShiftAssignment,
  GoShiftSwap,
  GoOnCallAssignment,
  GoOnCallActivation,
  GoStaffSchedule,
  GoShiftCoverageStatus,
  GoRotatingSchedule,
  GoShiftCoverageRule,
  CreateShiftTemplateCommand,
  AssignShiftCommand,
  CompleteShiftCommand,
  RequestShiftSwapCommand,
  ReviewShiftSwapCommand,
  AssignOnCallCommand,
  ActivateOnCallCommand,
  CreateRotatingScheduleCommand,
  NetworkError,
  NotFoundError,
  ShiftType,
} from '@dykstra/application';
import type { OnCallPolicy, OnCallPolicyId } from '@dykstra/domain';
import { goClient } from './client';

/**
 * Maps snake_case Go response to camelCase TypeScript
 */
function mapToGoShiftTemplate(data: any): GoShiftTemplate {
  return {
    id: data.id || data.template_id,
    name: data.name,
    shiftType: data.shift_type,
    startTime: data.start_time,
    endTime: data.end_time,
    durationMinutes: data.duration_minutes || data.duration_mins,
    daysOfWeek: data.days_of_week || [],
    differential: data.differential
      ? {
          type: data.differential.type || data.differential.shift_type,
          percentBonus: data.differential.percent_bonus,
          flatBonus: data.differential.flat_bonus,
        }
      : undefined,
    recurrencePattern: data.recurrence_pattern,
  };
}

function mapToGoShiftAssignment(data: any): GoShiftAssignment {
  return {
    id: data.id || data.assignment_id,
    shiftId: data.shift_id,
    templateId: data.template_id,
    employeeId: data.employee_id || data.worker_id,
    employeeName: data.employee_name || data.worker_name,
    date: new Date(data.date),
    startTime: new Date(data.start_time),
    endTime: new Date(data.end_time),
    shiftType: data.shift_type,
    status: data.status,
    location: data.location,
    notes: data.notes,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapToGoShiftSwap(data: any): GoShiftSwap {
  return {
    id: data.id || data.swap_id,
    fromEmployeeId: data.from_employee_id || data.from_worker_id,
    fromEmployeeName: data.from_employee_name || data.from_worker_name,
    toEmployeeId: data.to_employee_id || data.to_worker_id,
    toEmployeeName: data.to_employee_name || data.to_worker_name,
    shiftId: data.shift_id,
    shiftDate: new Date(data.shift_date),
    reason: data.reason,
    status: data.status,
    requestedAt: new Date(data.requested_at),
    reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
    reviewedBy: data.reviewed_by,
    rejectionReason: data.rejection_reason,
  };
}

function mapToGoOnCallActivation(data: any): GoOnCallActivation {
  return {
    id: data.id || data.activation_id,
    onCallId: data.on_call_id || data.oncall_id,
    activationTime: new Date(data.activation_time),
    durationMinutes: data.duration_minutes || data.duration_mins,
    reason: data.reason,
    caseId: data.case_id,
  };
}

function mapToGoOnCallAssignment(data: any): GoOnCallAssignment {
  return {
    id: data.id || data.oncall_id,
    employeeId: data.employee_id || data.worker_id,
    employeeName: data.employee_name || data.worker_name,
    startTime: new Date(data.start_time),
    endTime: new Date(data.end_time),
    status: data.status,
    activations: (data.activations || []).map(mapToGoOnCallActivation),
    createdAt: new Date(data.created_at),
  };
}

function mapToGoShiftCoverageStatus(data: any): GoShiftCoverageStatus {
  return {
    date: new Date(data.date),
    shiftType: data.shift_type,
    requiredWorkers: data.required_workers || data.min_workers,
    assignedWorkers: data.assigned_workers,
    confirmedWorkers: data.confirmed_workers,
    isFullyStaffed: data.is_fully_staffed || data.fully_staffed,
    assignments: (data.assignments || []).map(mapToGoShiftAssignment),
  };
}

function mapToGoRotatingSchedule(data: any): GoRotatingSchedule {
  return {
    id: data.id || data.schedule_id,
    name: data.name,
    patterns: (data.patterns || data.templates || []).map(mapToGoShiftTemplate),
    weeksPerCycle: data.weeks_per_cycle,
    currentWeek: data.current_week,
    employeeIds: data.employee_ids || data.worker_ids || [],
  };
}

function mapToGoStaffSchedule(data: any): GoStaffSchedule {
  return {
    employeeId: data.employee_id || data.worker_id,
    employeeName: data.employee_name || data.worker_name,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    shifts: (data.shifts || []).map(mapToGoShiftAssignment),
    onCallDuties: (data.on_call_duties || data.oncall_duties || []).map(mapToGoOnCallAssignment),
    totalHours: data.total_hours,
    regularHours: data.regular_hours,
    overtimeHours: data.overtime_hours,
    onCallHours: data.on_call_hours || data.oncall_hours || 0,
  };
}

function mapToGoShiftCoverageRule(data: any): GoShiftCoverageRule {
  return {
    shiftType: data.shift_type,
    minWorkers: data.min_workers,
    maxWorkers: data.max_workers,
    requiredSkills: data.required_skills || [],
  };
}

function mapToGoOnCallPolicy(data: any): OnCallPolicy {
  return {
    id: data.id || data.policy_id,
    businessKey: data.business_key,
    version: data.version,
    validFrom: new Date(data.valid_from),
    validTo: data.valid_to ? new Date(data.valid_to) : null,
    isCurrent: data.is_current,
    funeralHomeId: data.funeral_home_id,
    minAdvanceNoticeHours: data.min_advance_notice_hours,
    maxAdvanceNoticeHours: data.max_advance_notice_hours,
    minRestHoursAfterShift: data.min_rest_hours_after_shift,
    minShiftDurationHours: data.min_shift_duration_hours,
    maxShiftDurationHours: data.max_shift_duration_hours,
    maxConsecutiveWeekendsOn: data.max_consecutive_weekends_on,
    enableFairRotation: data.enable_fair_rotation,
    maxOnCallPerDirectorPerQuarter: data.max_on_call_per_director_per_quarter || 13,
    onCallBasePayAmount: data.on_call_base_pay_amount || 150,
    callbackHourlyRate: data.callback_hourly_rate || 1.5,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by,
    updatedBy: data.updated_by,
  };
}

/**
 * Go Scheduling Adapter
 * 
 * Object-based adapter (NOT class-based) implementing GoSchedulingPortService.
 * Integrates with Go backend scheduling API for staff roster management.
 * 
 * All methods follow Effect-TS patterns for error handling and composition.
 */
export const GoSchedulingAdapter: GoSchedulingPortService = {
  createShiftTemplate: (command: CreateShiftTemplateCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/templates', {
          body: {
            name: command.name,
            shift_type: command.shiftType,
            start_time: command.startTime,
            end_time: command.endTime,
            duration_minutes: command.durationMinutes,
            days_of_week: command.daysOfWeek,
            differential: command.differential
              ? {
                  type: command.differential.type,
                  percent_bonus: command.differential.percentBonus,
                  flat_bonus: command.differential.flatBonus,
                }
              : undefined,
            recurrence_pattern: command.recurrencePattern,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to create shift template');
        }

        return mapToGoShiftTemplate(res.data);
      },
      catch: (error) => new Error(`Network error creating shift template: ${error}`) as NetworkError,
    }),

  getShiftTemplate: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/templates/{id}', {
          params: { path: { id } },
        });

        if (res.error) {
          if (res.response.status === 404) {
            throw new Error(`Shift template ${id} not found`) as NotFoundError;
          }
          throw new Error(res.error.message || 'Failed to get shift template');
        }

        return mapToGoShiftTemplate(res.data);
      },
      catch: (error) =>
        error instanceof Error && error.message.includes('not found')
          ? (error as NotFoundError)
          : (new Error(`Network error getting shift template: ${error}`) as NetworkError),
    }),

  listShiftTemplates: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/templates', {
          params: {
            query: {
              shift_type: filters?.shiftType,
              active: filters?.active,
            },
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to list shift templates');
        }

        return (res.data?.templates || []).map(mapToGoShiftTemplate);
      },
      catch: (error) => new Error(`Network error listing shift templates: ${error}`) as NetworkError,
    }),

  assignShift: (command: AssignShiftCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/shifts/assign', {
          body: {
            template_id: command.templateId,
            employee_id: command.employeeId,
            date: command.date.toISOString(),
            notes: command.notes,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to assign shift');
        }

        return mapToGoShiftAssignment(res.data);
      },
      catch: (error) => new Error(`Network error assigning shift: ${error}`) as NetworkError,
    }),

  getShiftAssignment: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/shifts/{id}', {
          params: { path: { id } },
        });

        if (res.error) {
          if (res.response.status === 404) {
            throw new Error(`Shift assignment ${id} not found`) as NotFoundError;
          }
          throw new Error(res.error.message || 'Failed to get shift assignment');
        }

        return mapToGoShiftAssignment(res.data);
      },
      catch: (error) =>
        error instanceof Error && error.message.includes('not found')
          ? (error as NotFoundError)
          : (new Error(`Network error getting shift assignment: ${error}`) as NetworkError),
    }),

  listShiftAssignments: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/shifts', {
          params: {
            query: {
              employee_id: filters?.employeeId,
              start_date: filters?.startDate?.toISOString(),
              end_date: filters?.endDate?.toISOString(),
              status: filters?.status,
              shift_type: filters?.shiftType,
            },
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to list shift assignments');
        }

        return (res.data?.shifts || []).map(mapToGoShiftAssignment);
      },
      catch: (error) => new Error(`Network error listing shift assignments: ${error}`) as NetworkError,
    }),

  completeShift: (command: CompleteShiftCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/shifts/{id}/complete', {
          params: { path: { id: command.shiftId } },
          body: {
            actual_start_time: command.actualStartTime?.toISOString(),
            actual_end_time: command.actualEndTime?.toISOString(),
            notes: command.notes,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to complete shift');
        }
      },
      catch: (error) => new Error(`Network error completing shift: ${error}`) as NetworkError,
    }),

  cancelShift: (shiftId: string, reason?: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/shifts/{id}/cancel', {
          params: { path: { id: shiftId } },
          body: { reason },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to cancel shift');
        }
      },
      catch: (error) => new Error(`Network error cancelling shift: ${error}`) as NetworkError,
    }),

  requestShiftSwap: (command: RequestShiftSwapCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/shifts/swap/request', {
          body: {
            shift_id: command.shiftId,
            from_employee_id: command.fromEmployeeId,
            to_employee_id: command.toEmployeeId,
            reason: command.reason,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to request shift swap');
        }

        return mapToGoShiftSwap(res.data);
      },
      catch: (error) => new Error(`Network error requesting shift swap: ${error}`) as NetworkError,
    }),

  reviewShiftSwap: (command: ReviewShiftSwapCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/shifts/swap/{id}/review', {
          params: { path: { id: command.swapId } },
          body: {
            approved: command.approved,
            reviewed_by: command.reviewedBy,
            rejection_reason: command.rejectionReason,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to review shift swap');
        }
      },
      catch: (error) => new Error(`Network error reviewing shift swap: ${error}`) as NetworkError,
    }),

  getShiftSwap: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/shifts/swap/{id}', {
          params: { path: { id } },
        });

        if (res.error) {
          if (res.response.status === 404) {
            throw new Error(`Shift swap ${id} not found`) as NotFoundError;
          }
          throw new Error(res.error.message || 'Failed to get shift swap');
        }

        return mapToGoShiftSwap(res.data);
      },
      catch: (error) =>
        error instanceof Error && error.message.includes('not found')
          ? (error as NotFoundError)
          : (new Error(`Network error getting shift swap: ${error}`) as NetworkError),
    }),

  listShiftSwaps: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/shifts/swap', {
          params: {
            query: {
              employee_id: filters?.employeeId,
              status: filters?.status,
              start_date: filters?.startDate?.toISOString(),
              end_date: filters?.endDate?.toISOString(),
            },
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to list shift swaps');
        }

        return (res.data?.swaps || []).map(mapToGoShiftSwap);
      },
      catch: (error) => new Error(`Network error listing shift swaps: ${error}`) as NetworkError,
    }),

  assignOnCall: (command: AssignOnCallCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/oncall/assign', {
          body: {
            employee_id: command.employeeId,
            start_time: command.startTime.toISOString(),
            end_time: command.endTime.toISOString(),
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to assign on-call');
        }

        return mapToGoOnCallAssignment(res.data);
      },
      catch: (error) => new Error(`Network error assigning on-call: ${error}`) as NetworkError,
    }),

  activateOnCall: (command: ActivateOnCallCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/oncall/{id}/activate', {
          params: { path: { id: command.onCallId } },
          body: {
            activation_time: command.activationTime.toISOString(),
            duration_minutes: command.durationMinutes,
            reason: command.reason,
            case_id: command.caseId,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to activate on-call');
        }

        return mapToGoOnCallActivation(res.data);
      },
      catch: (error) => new Error(`Network error activating on-call: ${error}`) as NetworkError,
    }),

  getOnCallAssignment: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/oncall/{id}', {
          params: { path: { id } },
        });

        if (res.error) {
          if (res.response.status === 404) {
            throw new Error(`On-call assignment ${id} not found`) as NotFoundError;
          }
          throw new Error(res.error.message || 'Failed to get on-call assignment');
        }

        return mapToGoOnCallAssignment(res.data);
      },
      catch: (error) =>
        error instanceof Error && error.message.includes('not found')
          ? (error as NotFoundError)
          : (new Error(`Network error getting on-call assignment: ${error}`) as NetworkError),
    }),

  listOnCallAssignments: (filters) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/oncall', {
          params: {
            query: {
              employee_id: filters?.employeeId,
              start_date: filters?.startDate?.toISOString(),
              end_date: filters?.endDate?.toISOString(),
              status: filters?.status,
            },
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to list on-call assignments');
        }

        return (res.data?.assignments || []).map(mapToGoOnCallAssignment);
      },
      catch: (error) => new Error(`Network error listing on-call assignments: ${error}`) as NetworkError,
    }),

  getStaffSchedule: (employeeId: string, startDate: Date, endDate: Date) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/staff/{employeeId}/schedule', {
          params: {
            path: { employeeId },
            query: {
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            },
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to get staff schedule');
        }

        return mapToGoStaffSchedule(res.data);
      },
      catch: (error) => new Error(`Network error getting staff schedule: ${error}`) as NetworkError,
    }),

  getShiftCoverage: (date: Date, shiftType?: ShiftType) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/coverage', {
          params: {
            query: {
              date: date.toISOString(),
              shift_type: shiftType,
            },
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to get shift coverage');
        }

        return (res.data?.coverage || []).map(mapToGoShiftCoverageStatus);
      },
      catch: (error) => new Error(`Network error getting shift coverage: ${error}`) as NetworkError,
    }),

  createRotatingSchedule: (command: CreateRotatingScheduleCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/rotating', {
          body: {
            name: command.name,
            template_ids: command.templateIds,
            weeks_per_cycle: command.weeksPerCycle,
            employee_ids: command.employeeIds,
            start_date: command.startDate.toISOString(),
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to create rotating schedule');
        }

        return mapToGoRotatingSchedule(res.data);
      },
      catch: (error) => new Error(`Network error creating rotating schedule: ${error}`) as NetworkError,
    }),

  getRotatingSchedule: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/rotating/{id}', {
          params: { path: { id } },
        });

        if (res.error) {
          if (res.response.status === 404) {
            throw new Error(`Rotating schedule ${id} not found`) as NotFoundError;
          }
          throw new Error(res.error.message || 'Failed to get rotating schedule');
        }

        return mapToGoRotatingSchedule(res.data);
      },
      catch: (error) =>
        error instanceof Error && error.message.includes('not found')
          ? (error as NotFoundError)
          : (new Error(`Network error getting rotating schedule: ${error}`) as NetworkError),
    }),

  setShiftCoverageRule: (rule: GoShiftCoverageRule) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PUT('/v1/scheduling/coverage/rules', {
          body: {
            shift_type: rule.shiftType,
            min_workers: rule.minWorkers,
            max_workers: rule.maxWorkers,
            required_skills: rule.requiredSkills,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to set shift coverage rule');
        }
      },
      catch: (error) => new Error(`Network error setting shift coverage rule: ${error}`) as NetworkError,
    }),

  getShiftCoverageRules: (shiftType?: ShiftType) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/coverage/rules', {
          params: {
            query: { shift_type: shiftType },
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to get shift coverage rules');
        }

        return (res.data?.rules || []).map(mapToGoShiftCoverageRule);
      },
      catch: (error) => new Error(`Network error getting shift coverage rules: ${error}`) as NetworkError,
    }),

  getOnCallPolicy: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/oncall/policy/{funeralHomeId}', {
          params: { path: { funeralHomeId } },
        });

        if (res.error) {
          if (res.response.status === 404) {
            return null;
          }
          throw new Error(res.error.message || 'Failed to get on-call policy');
        }

        return mapToGoOnCallPolicy(res.data);
      },
      catch: (error) => new Error(`Network error getting on-call policy: ${error}`) as NetworkError,
    }),

  createOnCallPolicy: (funeralHomeId: string, policyData: Partial<OnCallPolicy>, createdBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/oncall/policy', {
          body: {
            funeral_home_id: funeralHomeId,
            min_advance_notice_hours: policyData.minAdvanceNoticeHours,
            max_advance_notice_hours: policyData.maxAdvanceNoticeHours,
            min_rest_hours_after_shift: policyData.minRestHoursAfterShift,
            min_shift_duration_hours: policyData.minShiftDurationHours,
            max_shift_duration_hours: policyData.maxShiftDurationHours,
            max_consecutive_weekends_on: policyData.maxConsecutiveWeekendsOn,
            enable_fair_rotation: policyData.enableFairRotation,
            created_by: createdBy,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to create on-call policy');
        }

        return mapToGoOnCallPolicy(res.data);
      },
      catch: (error) => new Error(`Network error creating on-call policy: ${error}`) as NetworkError,
    }),

  updateOnCallPolicy: (policyId: OnCallPolicyId, policyData: Partial<OnCallPolicy>, updatedBy: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PUT('/v1/scheduling/oncall/policy/{id}', {
          params: { path: { id: policyId } },
          body: {
            min_advance_notice_hours: policyData.minAdvanceNoticeHours,
            max_advance_notice_hours: policyData.maxAdvanceNoticeHours,
            min_rest_hours_after_shift: policyData.minRestHoursAfterShift,
            min_shift_duration_hours: policyData.minShiftDurationHours,
            max_shift_duration_hours: policyData.maxShiftDurationHours,
            max_consecutive_weekends_on: policyData.maxConsecutiveWeekendsOn,
            enable_fair_rotation: policyData.enableFairRotation,
            updated_by: updatedBy,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to update on-call policy');
        }

        return mapToGoOnCallPolicy(res.data);
      },
      catch: (error) => new Error(`Network error updating on-call policy: ${error}`) as NetworkError,
    }),

  getOnCallPolicyHistory: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/oncall/policy/{funeralHomeId}/history', {
          params: { path: { funeralHomeId } },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to get on-call policy history');
        }

        return (res.data?.policies || []).map(mapToGoOnCallPolicy);
      },
      catch: (error) => new Error(`Network error getting on-call policy history: ${error}`) as NetworkError,
    }),
};
