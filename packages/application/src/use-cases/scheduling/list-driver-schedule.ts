import { Effect } from 'effect';
import type { DriverAssignmentRepositoryService } from '../../ports/driver-assignment-repository';
import { DriverAssignmentRepository } from '../../ports/driver-assignment-repository';
import { DriverAssignmentNotFoundError, DriverAssignmentRepositoryError } from '../../ports/driver-assignment-repository';
import { DriverId } from '@dykstra/domain';

/**
 * Represents a driver's scheduled assignment in summary form
 */
/**
 * List Driver Schedule
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

export interface ScheduledAssignment {
  assignmentId: string;
  eventType: string;
  scheduledTime: Date;
  estimatedDuration: number; // minutes
  status: string;
  caseId: string;
  pickupLocation: string;
  dropoffLocation: string;
}

/**
 * Represents day-level summary statistics
 */
export interface DaySummary {
  date: Date;
  assignmentCount: number;
  totalMinutes: number;
  totalMileageAllowance: number; // calculated from estimated distances
}

/**
 * Input for list driver schedule use case
 */
export interface ListDriverScheduleCommand {
  driverId: string;
  startDate: Date;
  endDate: Date;
  includeSummary?: boolean;
}

/**
 * Output from list driver schedule use case
 */
export interface ListDriverScheduleResult {
  driverId: string;
  assignments: ScheduledAssignment[];
  totalAssignments: number;
  totalScheduledMinutes: number;
  daySummaries?: DaySummary[];
}

/**
 * List Driver Schedule Use Case
 *
 * Retrieves all assignments for a driver within a date range.
 *
 * Business Rules:
 * - Returns assignments sorted by scheduled time
 * - Includes all statuses (pending, in-progress, completed)
 * - Can optionally include daily summaries
 * - Calculates totals and statistics
 */
export const listDriverSchedule = (
  command: ListDriverScheduleCommand
): Effect.Effect<
  ListDriverScheduleResult,
  DriverAssignmentNotFoundError | DriverAssignmentRepositoryError,
  DriverAssignmentRepositoryService
> =>
  Effect.gen(function* () {
    const repository = yield* DriverAssignmentRepository;

    // Fetch all assignments in date range
    const assignments = yield* repository.findByFuneralHomeAndDateRange(
      '', // driverId lookup within date range
      command.startDate,
      command.endDate
    );

    // Filter to this driver's assignments
    const driverId = command.driverId as any as DriverId;
    const driverAssignments = assignments.filter(
      (a) => a.driverId === driverId
    );

    // Sort by scheduled time
    driverAssignments.sort((a, b) =>
      a.scheduledTime.getTime() - b.scheduledTime.getTime()
    );

    // Convert to summary format
    const scheduledAssignments: ScheduledAssignment[] = driverAssignments.map(
      (a) => ({
        assignmentId: a.id as any,
        eventType: a.eventType,
        scheduledTime: a.scheduledTime,
        estimatedDuration: a.estimatedDuration,
        status: a.status,
        caseId: a.caseId as any,
        pickupLocation: `${a.pickupLocation.address}, ${a.pickupLocation.city}`,
        dropoffLocation: `${a.dropoffLocation.address}, ${a.dropoffLocation.city}`,
      })
    );

    // Calculate totals
    const totalAssignments = scheduledAssignments.length;
    const totalScheduledMinutes = scheduledAssignments.reduce(
      (sum, a) => sum + a.estimatedDuration,
      0
    );

    // Build daily summaries if requested
    let daySummaries: DaySummary[] | undefined;
    if (command.includeSummary) {
      const dailyMap = new Map<string, DaySummary>();

      for (const assignment of scheduledAssignments) {
        const dateKey = assignment.scheduledTime.toISOString().split('T')[0]!;
        let daySummary = dailyMap.get(dateKey);

        if (!daySummary) {
          daySummary = {
            date: new Date(assignment.scheduledTime),
            assignmentCount: 0,
            totalMinutes: 0,
            totalMileageAllowance: 0,
          };
          dailyMap.set(dateKey, daySummary);
        }

        daySummary.assignmentCount++;
        daySummary.totalMinutes += assignment.estimatedDuration;
        // Estimate mileage allowance (rough estimate: 30 miles per assignment * $0.67)
        daySummary.totalMileageAllowance += 30 * 0.67;
      }

      daySummaries = Array.from(dailyMap.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
    }

    return {
      driverId: command.driverId,
      assignments: scheduledAssignments,
      totalAssignments,
      totalScheduledMinutes,
      daySummaries,
    };
  });
