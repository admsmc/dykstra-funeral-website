import { Effect } from 'effect';
import { GoPayrollPort, type GoPayrollPortService, NetworkError } from '../../ports/go-payroll-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Use Case 3.2: Submit Timesheet for Approval
 * 
 * **Workflow**:
 * 1. Employee submits timesheet for a pay period
 * 2. Validate time entries (hours, case assignments)
 * 3. Submit to manager for approval
 * 
 * **Business Rules**:
 * - Hours must be > 0
 * - Pay period must be valid
 * - Each entry must have either a case assignment or overhead classification
 * 
 * **Error Cases**:
 * - ValidationError: Invalid hours or missing data
 * - NetworkError: Go backend communication failure
 */

export interface SubmitTimesheetForApprovalCommand {
  readonly tenant: string;
  readonly timesheetId: string;
  readonly workerId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly entryIds: readonly string[]; // Time entry IDs (must be created separately)
  readonly notes?: string;
}

export const submitTimesheetForApproval = (
  command: SubmitTimesheetForApprovalCommand
) =>
  Effect.gen(function* () {
    const payrollPort = yield* GoPayrollPort;

    // Validate timesheet data
    if (command.entryIds.length === 0) {
      return yield* Effect.fail(
        new ValidationError({ message: 'Timesheet must have at least one time entry' })
      );
    }

    // Submit timesheet to Go backend (event-sourced workflow)
    const result = yield* payrollPort.submitTimesheet({
      tenant: command.tenant,
      timesheetId: command.timesheetId,
      workerId: command.workerId,
      periodStart: command.periodStart,
      periodEnd: command.periodEnd,
      entries: command.entryIds,
      notes: command.notes,
    });

    return {
      stream: result.stream,
      eventId: result.eventId,
      appended: result.appended,
      timesheetId: command.timesheetId,
      workerId: command.workerId,
      entriesCount: command.entryIds.length,
    };
  }).pipe(
    Effect.withSpan('submitTimesheetForApproval', {
      attributes: {
        timesheetId: command.timesheetId,
        workerId: command.workerId,
        periodStart: command.periodStart.toISOString(),
        periodEnd: command.periodEnd.toISOString(),
        entriesCount: command.entryIds.length,
      },
    })
  );

/**
 * Type helper for the Effect return
 */
export type SubmitTimesheetForApprovalEffect = Effect.Effect<
  {
    readonly stream: string;
    readonly eventId: string;
    readonly appended: boolean;
    readonly timesheetId: string;
    readonly workerId: string;
    readonly entriesCount: number;
  },
  ValidationError | NetworkError,
  GoPayrollPortService
>;
